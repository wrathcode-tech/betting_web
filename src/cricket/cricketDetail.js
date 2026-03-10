import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import './cricketDetail.css'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import {
    connectSportsbookSocket,
    subscribeMatches,
    unsubscribeMatches,
    subscribeOdds,
    unsubscribeOdds,
    addMatchesListener,
    removeMatchesListener,
    addOddsListener,
    removeOddsListener,
} from '../socket/sportsbookSocket'
import { alertSuccessMessage, alertErrorMessage } from '../customComponents/CustomAlertMessage'
import LossCutIndicator from '../customComponents/LossCutIndicator'

function CricketDetail() {
    const location = useLocation()
    const scrollContainerRef = useRef(null)
    const betslipContentRef = useRef(null)
    const marketsSectionRef = useRef(null)
    const [showMarketsSection, setShowMarketsSection] = useState(false)
    const [activeTab, setActiveTab] = useState(location.state?.activeTab ?? 'all')
    const [closedBlocks, setClosedBlocks] = useState(new Set())
    const [isBetslipOpen, setIsBetslipOpen] = useState(false)
    const [selectedBets, setSelectedBets] = useState([])
    const [stake, setStake] = useState(100)
    const [slipOdds, setSlipOdds] = useState(null) // display odds for first bet (optional +/-)
    const [betslipView, setBetslipView] = useState('slip') // 'slip' | 'openbets'
    const [openBetsList, setOpenBetsList] = useState([])
    const [openBetsLoading, setOpenBetsLoading] = useState(false)
    const [betslipExposure, setBetslipExposure] = useState(null)
    const [betslipCurrentLoss, setBetslipCurrentLoss] = useState(null)
    const [betslipLossLimit, setBetslipLossLimit] = useState(null)
    const [cashoutId, setCashoutId] = useState(null)
    const openBetsCount = openBetsList.length

    const [defaultMatch, setDefaultMatch] = useState(null)
    const gameIdFromState = location.state?.gameId
    const eventNameFromState = location.state?.eventName ?? defaultMatch?.eventName
    const sportName = location.state?.sportName || 'cricket'
    const gameId = gameIdFromState ?? defaultMatch?.gameId
    const [oddsData, setOddsData] = useState(null)
    const [oddsLoading, setOddsLoading] = useState(false)

    // Socket (doc): subscribe:matches { sport } when need default match; on('matches') { sport, data, timestamp }. Leave → unsubscribe:matches.
    useEffect(() => {
        if (gameIdFromState) return
        const token = sessionStorage.getItem('token')
        if (!token) return
        connectSportsbookSocket(token)
        const onMatches = (payload) => {
            if (payload?.sport !== sportName || payload.data === undefined) return
            const list = Array.isArray(payload.data) ? payload.data : []
            const first = list.find((m) => m.gameId)
            if (first) setDefaultMatch({ gameId: first.gameId, eventName: first.eventName })
        }
        addMatchesListener(onMatches)
        subscribeMatches(sportName)
        return () => {
            removeMatchesListener(onMatches)
            unsubscribeMatches(sportName)
        }
    }, [gameIdFromState, sportName])

    const normalizeOdds = (d) => ({
        matchOdds: Array.isArray(d?.matchOdds) ? d.matchOdds : [],
        fancyOdds: Array.isArray(d?.fancyOdds) ? d.fancyOdds : [],
        otherMarketOdds: Array.isArray(d?.otherMarketOdds) ? d.otherMarketOdds : [],
        bookMakerOdds: Array.isArray(d?.bookMakerOdds) ? d.bookMakerOdds : [],
        premiumFancy: Array.isArray(d?.premiumFancy) ? d.premiumFancy : [],
        oddEvenOdds: Array.isArray(d?.oddEvenOdds) ? d.oddEvenOdds : [],
    })

    // 1) Pehle odds REST API chalao – initial data
    useEffect(() => {
        if (!gameId) return
        let cancelled = false
        setOddsLoading(true)
        AuthService.sportsbookOdds(sportName, gameId)
            .then((res) => {
                if (cancelled || !res) return
                const raw = res.data ?? res
                const d = raw?.data ?? raw
                if (d && typeof d === 'object') setOddsData(normalizeOdds(d))
            })
            .catch(() => { if (!cancelled) setOddsData(null) })
            .finally(() => { if (!cancelled) setOddsLoading(false) })
        return () => { cancelled = true }
    }, [gameId, sportName])

    // 2) Phir socket – live updates (token ho to)
    useEffect(() => {
        if (!gameId) return
        const token = sessionStorage.getItem('token')
        if (!token) return
        const currentGameId = gameId
        connectSportsbookSocket(token)
        const onOdds = (payload) => {
            if (payload?.gameId !== currentGameId || payload?.data === undefined) return
            setOddsData(normalizeOdds(payload.data))
            setOddsLoading(false)
        }
        addOddsListener(onOdds)
        subscribeOdds(gameId)
        return () => {
            removeOddsListener(onOdds)
            unsubscribeOdds(gameId)
        }
    }, [gameId, sportName])

    const toggleBlock = (blockId) => {
        setClosedBlocks(prev => {
            const newSet = new Set(prev)
            if (newSet.has(blockId)) {
                newSet.delete(blockId)
            } else {
                newSet.add(blockId)
            }
            return newSet
        })
    }

    const handleBetClick = (betName, market, odds, elementId, placePayload = null) => {
        setIsBetslipOpen(true)
        const betId = `${market}-${betName}-${odds}-${elementId || ''}`
        const uniqueId = elementId || `${betId}-${Date.now()}`
        const existingBet = selectedBets.find(bet => bet.elementId === uniqueId)
        if (existingBet) {
            setSelectedBets([])
        } else {
            const oddsNum = parseFloat(odds)
            const newBet = {
                id: betId,
                betName,
                market,
                odds: Number.isNaN(oddsNum) ? 0 : oddsNum,
                oddsDisplay: (oddsNum && !Number.isNaN(oddsNum)) ? String(oddsNum) : (odds || '0'),
                elementId: uniqueId,
                placePayload: placePayload || undefined,
            }
            setSelectedBets([newBet])
        }
    }

    const isBetSelected = (betName, market, odds, elementId) => {
        if (!elementId) {
            // Fallback: check by market and betName
            const marketSelectedBet = selectedBets.find(bet => bet.market === market)
            return marketSelectedBet && marketSelectedBet.betName === betName
        }
        // Check by exact element ID
        return selectedBets.some(bet => bet.elementId === elementId)
    }

    const removeBet = (betId) => {
        setSelectedBets(selectedBets.filter(bet => bet.id !== betId))
    }

    const clearAllBets = () => {
        setSelectedBets([])
    }

    const [placeBetLoading, setPlaceBetLoading] = useState(false)
    const [placeBetError, setPlaceBetError] = useState(null)

    const handlePlaceBet = async () => {
        const toPlace = selectedBets.filter((b) => b.placePayload)
        if (toPlace.length === 0) {
            const msg = 'Only bets from live odds can be placed. Add a selection from Match Odds above.'
            setPlaceBetError(msg)
            alertErrorMessage(msg)
            return
        }
        const stakeNum = Number(stake) || 0
        if (stakeNum < 100) {
            const msg = 'Minimum stake is ₹100'
            setPlaceBetError(msg)
            alertErrorMessage(msg)
            return
        }
        if (stakeNum > 10000) {
            const msg = 'Maximum stake is ₹10000'
            setPlaceBetError(msg)
            alertErrorMessage(msg)
            return
        }
        setPlaceBetError(null)
        setPlaceBetLoading(true)
        try {
            const isLive = Boolean(location.state?.inPlay ?? defaultMatch?.inPlay)
            let lastRes = null
            for (let i = 0; i < toPlace.length; i++) {
                const bet = toPlace[i]
                const p = bet.placePayload
                let oddsNum = bet.odds >= 1.01 ? bet.odds : (p?.odds ?? 0)
                if (i === 0 && slipOdds != null && slipOdds >= 1.01) oddsNum = slipOdds
                const body = {
                    sport: p.sport ?? sportName,
                    gameId: p.gameId,
                    eventName: p.eventName ?? eventNameFromState,
                    marketType: p.marketType,
                    marketId: p.marketId,
                    selectionId: p.selectionId,
                    selectionName: p.selectionName,
                    betType: p.betType,
                    odds: Number(oddsNum),
                    stake: stakeNum,
                    isLive,
                    requestId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-${bet.elementId}-${Date.now()}`,
                }
                const res = await AuthService.sportsbookPlaceBet(body)
                lastRes = res
                const backendMsg = res?.data?.message ?? res?.message
                if (res && res.success === false) throw new Error(backendMsg)
            }
            setSelectedBets([])
            setStake(100)
            const successMsg = lastRes?.data?.message ?? lastRes?.message
            if (successMsg) alertSuccessMessage(successMsg)
        } catch (err) {
            const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.response?.data?.msg ?? err?.message
            if (msg) setPlaceBetError(msg)
            if (msg) alertErrorMessage(msg)
        } finally {
            setPlaceBetLoading(false)
        }
    }

    const calculatePotentialWin = () => {
        if (selectedBets.length === 0) return 0
        const oddsVal = slipOdds != null ? slipOdds : (selectedBets[0].oddsDisplay ?? selectedBets[0].odds)
        return ((Number(stake) || 0) * oddsVal).toFixed(2)
    }

    /** Profit/loss only (sirf profit dikhana, total return nahi). Back: stake*(odds-1), Lay: stake. */
    const calculateProfitLoss = () => {
        if (selectedBets.length === 0) return '0.00'
        const s = Number(stake) || 0
        const oddsVal = Number(slipOdds != null ? slipOdds : (selectedBets[0].oddsDisplay ?? selectedBets[0].odds)) || 0
        const betType = (selectedBets[0].placePayload?.betType ?? selectedBets[0].betType ?? 'back').toLowerCase()
        const profit = betType === 'lay' ? s : (s * (oddsVal - 1))
        return profit.toFixed(2)
    }

    const lossLimitAmount = betslipLossLimit != null && Number(betslipLossLimit) >= 0 ? Number(betslipLossLimit) : null
    const currentLossAmount = Number(betslipCurrentLoss) || 0
    const lossLimitReached = lossLimitAmount != null && lossLimitAmount > 0 && currentLossAmount >= lossLimitAmount

    const handleCashoutBetslip = async (betId) => {
        if (!betId) return
        setCashoutId(betId)
        try {
            const res = await AuthService.sportsbookCashout(betId)
            const ok = res?.success === true || (res && res.success !== false && !res?.message)
            if (ok) {
                const list = await AuthService.sportsbookOpenBets({ page: 1, limit: 20 }).then((r) => (r?.data ?? r)?.bets ?? [])
                setOpenBetsList(list)
                const successMsg = res?.data?.message ?? res?.message
                if (successMsg) alertSuccessMessage(successMsg)
            } else {
                const errMsg = res?.data?.message ?? res?.message
                if (errMsg) alertErrorMessage(errMsg)
            }
        } catch (err) {
            const errMsg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message
            if (errMsg) alertErrorMessage(errMsg)
        } finally {
            setCashoutId(null)
        }
    }

    const handleSetLossLimit = useCallback(async (dailyLossLimit) => {
        const res = await AuthService.sportsbookSetLossLimit(dailyLossLimit)
        const ok = res?.success === true || (res && res.success !== false && !res?.message)
        if (ok) {
            setBetslipLossLimit(dailyLossLimit)
            const msg = res?.data?.message ?? res?.message
            if (msg) alertSuccessMessage(msg)
        } else {
            const errMsg = res?.data?.message ?? res?.message
            if (errMsg) alertErrorMessage(errMsg)
        }
    }, [])

    // Sync slip odds when first bet changes
    useEffect(() => {
        if (selectedBets.length > 0) {
            const first = selectedBets[0]
            const o = first.oddsDisplay != null ? first.oddsDisplay : first.odds
            setSlipOdds(prev => (prev == null ? o : prev))
        } else {
            setSlipOdds(null)
        }
    }, [selectedBets])

    const toOddDatasArray = (oddDatas) => {
        if (!oddDatas) return []
        if (Array.isArray(oddDatas)) return oddDatas
        if (typeof oddDatas === 'object') return Object.values(oddDatas).filter(Boolean)
        return []
    }

    const renderOddsSection = (sectionKey, title, icon, minMax, markets, marketTypeApi) => {
        if (!markets?.length) return null
        const market = markets[0]
        const marketId = market.mid || market.marketId
        const oddList = toOddDatasArray(market.oddDatas)
        if (!oddList.length) return null
        const isOpen = market.status === 'OPEN'
        return (
            <div key={sectionKey} className="odds_section_block">
                <div className="odds_section_header">
                    <span className="odds_section_title"><i className={icon} aria-hidden /> {title}</span>
                    <span className="odds_section_limits">{minMax}</span>
                </div>
                <div className="odds_section_table_wrap">
                    <table className="odds_section_table">
                        <thead>
                            <tr>
                                <th>Market</th>
                                <th colSpan={3}>Back</th>
                                <th colSpan={3}>Lay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {oddList.map((odd, oIdx) => {
                                const name = odd.rname ?? odd.selectionName ?? ''
                                const backCells = [
                                    { odds: odd.b1, size: odd.bs1 },
                                    { odds: odd.b2, size: odd.bs2 },
                                    { odds: odd.b3, size: odd.bs3 },
                                ]
                                const layCells = [
                                    { odds: odd.l1, size: odd.ls1 },
                                    { odds: odd.l2, size: odd.ls2 },
                                    { odds: odd.l3, size: odd.ls3 },
                                ]
                                const stakeNum = Number(stake) || 0
                                return (
                                    <tr key={odd.sid ?? oIdx}>
                                        <td className="odds_section_market_name">{name}</td>
                                        {backCells.map((cell, cIdx) => {
                                            const hasVal = isOpen && !isOddsLocked(cell.odds)
                                            const oddsStr = String(cell.odds ?? '')
                                            const placePayload = hasVal && gameId && eventNameFromState && marketId && (odd.sid != null) ? { sport: sportName, gameId, eventName: eventNameFromState, marketType: marketTypeApi, marketId: String(marketId), selectionId: String(odd.sid), selectionName: name, betType: 'back', odds: parseFloat(oddsStr) || 0 } : null
                                            const elId = `odds-${sectionKey}-${oIdx}-back-${cIdx}`
                                            const cellOdds = parseFloat(oddsStr) || 0
                                            const cellPl = hasVal && cellOdds >= 1 && stakeNum > 0 ? stakeNum * (cellOdds - 1) : null
                                            const cellPlDisplay = cellPl != null ? (cellPl >= 0 ? `+${cellPl.toFixed(2)}` : cellPl.toFixed(2)) : null
                                            const cellPlGreen = cellPl != null && cellPl >= 0
                                            return (
                                                <td key={cIdx} className="odds_section_cell odds_section_cell_back">
                                                    {hasVal ? (
                                                        <button type="button" className={`odds_section_btn odds_section_back ${isBetSelected(name, market.market, oddsStr, elId) ? 'selected' : ''}`} onClick={() => handleBetClick(name, market.market, oddsStr, elId, placePayload)}>
                                                            <span className="odds_val">{cell.odds}</span>
                                                            <span className="odds_size">{formatOddsSize(cell.size)}</span>
                                                            {cellPlDisplay != null && <span className={`odds_section_cell_pl ${cellPlGreen ? 'odds_section_cell_pl_profit' : 'odds_section_cell_pl_loss'}`}>{cellPlDisplay}</span>}
                                                        </button>
                                                    ) : (
                                                        <span className="odds_section_locked"><i className="ri-lock-line" aria-hidden /></span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                        {layCells.map((cell, cIdx) => {
                                            const hasVal = isOpen && !isOddsLocked(cell.odds)
                                            const oddsStr = String(cell.odds ?? '')
                                            const placePayload = hasVal && gameId && eventNameFromState && marketId && (odd.sid != null) ? { sport: sportName, gameId, eventName: eventNameFromState, marketType: marketTypeApi, marketId: String(marketId), selectionId: String(odd.sid), selectionName: name, betType: 'lay', odds: parseFloat(oddsStr) || 0 } : null
                                            const elId = `odds-${sectionKey}-${oIdx}-lay-${cIdx}`
                                            const cellPlProfit = hasVal && stakeNum > 0 ? stakeNum : null
                                            const cellPlDisplay = cellPlProfit != null ? `+${cellPlProfit.toFixed(2)}` : null
                                            return (
                                                <td key={cIdx} className="odds_section_cell odds_section_cell_lay">
                                                    {hasVal ? (
                                                        <button type="button" className={`odds_section_btn odds_section_lay ${isBetSelected(name, market.market, oddsStr, elId) ? 'selected' : ''}`} onClick={() => handleBetClick(name, market.market, oddsStr, elId, placePayload)}>
                                                            <span className="odds_val">{cell.odds}</span>
                                                            <span className="odds_size">{formatOddsSize(cell.size)}</span>
                                                            {cellPlDisplay != null && <span className="odds_section_cell_pl odds_section_cell_pl_profit">{cellPlDisplay}</span>}
                                                        </button>
                                                    ) : (
                                                        <span className="odds_section_locked"><i className="ri-lock-line" aria-hidden /></span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="odds_section_footer">THE ULTIMATE ADVENTURE 🏏 CRICKET BATTLE ⚡ IS LIVE NOW : (CREATE YOUR OWN TEAM & PLAY LIKE A PRO) 🏆</div>
            </div>
        )
    }

    const formatOddsSize = (v) => {
        if (v == null || v === '') return '—'
        const n = Number(v)
        if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
        return String(v)
    }

    // Lock when data nahi hai ya 0.00
    const isOddsLocked = (val) => {
        if (val == null || val === '') return true
        const n = parseFloat(String(val).trim())
        return Number.isNaN(n) || n === 0
    }

    // Neeche: SESSIONS / W/P MARKET / EXTRA MARKET – API se (fancyOdds / otherMarketOdds). Static data nahi.
    const buildNoYesRowsFromMarkets = (markets) => {
        if (!markets?.length) return []
        const rows = []
        markets.forEach((m) => {
            const oddList = toOddDatasArray(m.oddDatas)
            if (oddList.length >= 2) {
                const noSel = oddList[0]
                const yesSel = oddList[1]
                const noOdds = noSel?.l1 ?? noSel?.b1
                const yesOdds = yesSel?.b1 ?? yesSel?.l1
                const noSize = noSel?.ls1 ?? noSel?.bs1
                const yesSize = yesSel?.bs1 ?? yesSel?.ls1
                rows.push({
                    label: m.market || m.name || 'Market',
                    noOdds: noOdds ?? '—',
                    noSize: noSize ?? '—',
                    yesOdds: yesOdds ?? '—',
                    yesSize: yesSize ?? '—',
                    max: '100K',
                    marketId: m.mid || m.marketId,
                    noSid: noSel?.sid,
                    yesSid: yesSel?.sid,
                })
            } else if (oddList.length === 1) {
                const o = oddList[0]
                rows.push({
                    label: o.rname ?? o.selectionName ?? m.market ?? 'Market',
                    noOdds: o.l1 ?? '—',
                    noSize: o.ls1 ?? '—',
                    yesOdds: o.b1 ?? '—',
                    yesSize: o.bs1 ?? '—',
                    max: '100K',
                    marketId: m.mid || m.marketId,
                    noSid: o.sid,
                    yesSid: o.sid,
                })
            }
        })
        return rows
    }

    // premiumFancy: <=2 selections -> No/Yes rows; >2 -> Back-only table (e.g. 25 OVER LAST DIGIT)
    const premiumFancyList = oddsData?.premiumFancy ?? []
    const extraNoYesMarkets = premiumFancyList.filter((m) => {
        const list = toOddDatasArray(m?.oddDatas)
        return list.length <= 2
    })
    const backOnlyMarkets = premiumFancyList.filter((m) => {
        const list = toOddDatasArray(m?.oddDatas)
        return list.length > 2
    })

    const buildBackOnlyBlocksFromMarkets = (markets) => {
        if (!markets?.length) return []
        return markets.map((m) => {
            const oddList = toOddDatasArray(m.oddDatas)
            const rows = oddList.map((o) => ({
                label: o.rname ?? o.selectionName ?? '—',
                backOdds: o.b1 ?? '—',
                backSize: o.bs1 ?? '—',
            }))
            const allLocked = rows.every((r) => isOddsLocked(r.backOdds))
            return {
                key: m.mid || m.marketId || m.market,
                title: m.market || m.name || 'Market',
                minMax: 'MIN:100 MAX:50K',
                rows,
                isLocked: allLocked,
            }
        })
    }

    const sessionsRows = buildNoYesRowsFromMarkets(oddsData?.fancyOdds)
    const wpMarketRows = buildNoYesRowsFromMarkets(oddsData?.otherMarketOdds)
    const extraMarketRows = buildNoYesRowsFromMarkets(extraNoYesMarkets)
    const oddEvenRows = buildNoYesRowsFromMarkets(oddsData?.oddEvenOdds)
    const backOnlyBlocks = buildBackOnlyBlocksFromMarkets(backOnlyMarkets)

    const renderNoYesSection = (sectionKey, title, rows) => {
        const isClosed = closedBlocks.has(sectionKey)
        return (
            <div key={sectionKey} className="market_no_yes_block">
                <div className="market_no_yes_header" onClick={() => toggleBlock(sectionKey)}>
                    <h6>
                        <i className={`market_no_yes_chevron ${isClosed ? 'ri-arrow-right-s-line' : 'ri-arrow-down-s-line'}`} aria-hidden />
                        {title}
                    </h6>
                </div>
                <div className={`market_no_yes_body ${isClosed ? 'hidden' : ''}`}>
                    {rows?.length ? rows.map((row, rIdx) => {
                        const noLocked = isOddsLocked(row.noOdds)
                        const yesLocked = isOddsLocked(row.yesOdds)
                        return (
                            <div key={rIdx} className="market_no_yes_row">
                                <div className="market_no_yes_label">{row.label}</div>
                                <button type="button" className="market_no_yes_book_btn" title="Book">Book</button>
                                <div className="market_no_yes_odds">
                                    <span className="market_no_yes_lbl">No</span>
                                    <button type="button" className={`market_no_yes_btn market_no_btn ${noLocked ? 'locked' : ''}`} disabled>
                                        {noLocked ? (
                                            <span className="market_no_yes_locked"><i className="ri-lock-line" aria-hidden /></span>
                                        ) : (
                                            <>
                                                <span className="odds_val">{row.noOdds}</span>
                                                <span className="odds_size">{formatOddsSize(row.noSize)}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="market_no_yes_odds">
                                    <span className="market_no_yes_lbl">Yes</span>
                                    <button type="button" className={`market_no_yes_btn market_yes_btn ${yesLocked ? 'locked' : ''}`} disabled>
                                        {yesLocked ? (
                                            <span className="market_no_yes_locked"><i className="ri-lock-line" aria-hidden /></span>
                                        ) : (
                                            <>
                                                <span className="odds_val">{row.yesOdds}</span>
                                                <span className="odds_size">{formatOddsSize(row.yesSize)}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="market_no_yes_limits">MIN: 100 MAX: {row.max}</div>
                            </div>
                        )
                    }) : <div className="market_no_yes_row market_empty_msg">No data at the moment.</div>}
                </div>
            </div>
        )
    }

    const renderBackOnlySection = (block) => {
        const { key, title, minMax, rows, isLocked } = block
        const isClosed = closedBlocks.has(`backonly-${key}`)
        return (
            <div key={key} className="market_back_only_block">
                <div className="market_back_only_header" onClick={() => toggleBlock(`backonly-${key}`)}>
                    <h6>
                        {isLocked ? (
                            <span className="market_back_only_locked_icon"><i className="ri-lock-line" aria-hidden /></span>
                        ) : (
                            <i className="ri-rocket-line market_back_only_icon" aria-hidden />
                        )}
                        {title}
                    </h6>
                    <span className="market_back_only_limits">{minMax}</span>
                </div>
                <div className={`market_back_only_body ${isClosed ? 'hidden' : ''}`}>
                    <div className="market_back_only_table_head">
                        <span>Market</span>
                        <span>Back</span>
                    </div>
                    {rows?.length ? rows.map((row, rIdx) => {
                        const backLocked = isOddsLocked(row.backOdds)
                        return (
                            <div key={rIdx} className="market_back_only_row">
                                <span className="market_back_only_label">{row.label}</span>
                                <div className="market_back_only_cell">
                                    {backLocked ? (
                                        <span className="market_no_yes_locked"><i className="ri-lock-line" aria-hidden /></span>
                                    ) : (
                                        <button type="button" className="market_no_yes_btn market_yes_btn" disabled>
                                            <span className="odds_val">{row.backOdds}</span>
                                            <span className="odds_size">{formatOddsSize(row.backSize)}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    }) : <div className="market_back_only_row market_empty_msg">No data.</div>}
                </div>
            </div>
        )
    }

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current
        if (!scrollContainer) return

        const handleWheel = (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault()
                scrollContainer.scrollLeft += e.deltaY
            }
        }

        scrollContainer.addEventListener('wheel', handleWheel, { passive: false })

        return () => {
            scrollContainer.removeEventListener('wheel', handleWheel)
        }
    }, [])

    // Scroll betslip content to top when opened or when data/tab changes (data top se dikhe)
    useEffect(() => {
        if (!betslipContentRef.current) return
        betslipContentRef.current.scrollTop = 0
    }, [isBetslipOpen, betslipView, selectedBets.length])

    const shouldFetchOpenBets = isBetslipOpen || activeTab === 'open-bets'

    // Fetch loss limit and exposure on page load so Open Bets tab has data as soon as it renders
    useEffect(() => {
        let cancelled = false
        Promise.all([
            AuthService.sportsbookGetLossLimit(),
            AuthService.sportsbookExposure(),
        ])
            .then(([limitRes, exposureRes]) => {
                if (cancelled) return
                const limitData = limitRes?.data ?? limitRes
                const exposureData = exposureRes?.data ?? exposureRes
                setBetslipLossLimit(limitData?.dailyLossLimit ?? null)
                setBetslipExposure(exposureData?.totalExposure ?? null)
                setBetslipCurrentLoss(exposureData?.current_loss ?? exposureData?.currentLoss ?? exposureData?.totalExposure ?? null)
            })
            .catch(() => {
                if (cancelled) return
                setBetslipLossLimit(null)
                setBetslipExposure(null)
                setBetslipCurrentLoss(null)
            })
        return () => { cancelled = true }
    }, [])

    // Refetch loss limit and exposure when betslip opens or Open Bets tab is selected (e.g. after placing bet)
    useEffect(() => {
        if (!isBetslipOpen && activeTab !== 'open-bets') return
        let cancelled = false
        Promise.all([
            AuthService.sportsbookGetLossLimit(),
            AuthService.sportsbookExposure(),
        ])
            .then(([limitRes, exposureRes]) => {
                if (cancelled) return
                const limitData = limitRes?.data ?? limitRes
                const exposureData = exposureRes?.data ?? exposureRes
                setBetslipLossLimit(limitData?.dailyLossLimit ?? null)
                setBetslipExposure(exposureData?.totalExposure ?? null)
                setBetslipCurrentLoss(exposureData?.current_loss ?? exposureData?.currentLoss ?? exposureData?.totalExposure ?? null)
            })
            .catch(() => {
                if (cancelled) return
                setBetslipLossLimit(null)
                setBetslipExposure(null)
                setBetslipCurrentLoss(null)
            })
        return () => { cancelled = true }
    }, [isBetslipOpen, activeTab])

    // Fetch open bets as soon as popup opens (or page Open Bets tab), so OPEN BETS tab shows data without waiting for click
    useEffect(() => {
        if (!shouldFetchOpenBets) return
        setOpenBetsLoading(true)
        AuthService.sportsbookOpenBets({ page: 1, limit: 20 })
            .then((res) => {
                const data = res?.data ?? res
                const list = data?.bets ?? []
                setOpenBetsList(list)
            })
            .catch(() => setOpenBetsList([]))
            .finally(() => setOpenBetsLoading(false))
    }, [shouldFetchOpenBets])

    // Defer heavy markets section until in view for faster FCP/LCP
    useEffect(() => {
        const el = marketsSectionRef.current
        if (!el) return
        const io = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) setShowMarketsSection(true) },
            { rootMargin: '200px', threshold: 0 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    return (
        <React.Fragment>
            <div className='dashboard_page removebgsports'>
                <div className='container'>
                    <div className='cricket_detail_section'>
                        {/* <div className='sports_top_tabs'>
                            <ul>
                                <li className='active'><button><img src="images/menu-icon.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon2.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon3.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon4.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon5.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon6.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon7.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon8.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon9.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon10.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon11.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon12.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon13.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon14.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon15.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon16.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon17.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon18.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon19.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon20.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon21.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon22.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon23.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon24.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon25.svg" alt="sports" /></button></li>
                                <li><button><img src="images/menu-icon26.svg" alt="sports" /></button></li>

                            </ul>
                        </div> */}

                        {/* <div className='match_vs_team_list d-flex align-items-center justify-content-between gap-2'>
                            <div className='selected_match_country'>
                                <button><i className="ri-arrow-down-s-line"></i></button>
                            </div>
                            <div className='match_vs_team_list_inner' ref={scrollContainerRef}>
                                <ul>
                                    <li className='active'>
                                        <span>Today,10:30</span>
                                        <p>Royal Challengers Bengaluru</p>
                                        <p>Delhi Capitals</p>
                                    </li>
                                    <li>
                                        <span>1 INN, 15.2 OV</span>
                                        <p>Zimbabwe <span>125/2</span></p>
                                        <p>Oman<span>0/0</span></p>
                                    </li>
                                    <li>
                                        <span>Today,10:30</span>
                                        <p>Royal Challengers Bengaluru</p>
                                        <p>Delhi Capitals</p>
                                    </li>
                                    <li>
                                        <span>1 INN, 15.2 OV</span>
                                        <p>Zimbabwe <span>125/2</span></p>
                                        <p>Oman<span>0/0</span></p>
                                    </li>
                                    <li>
                                        <span>Today,10:30</span>
                                        <p>Royal Challengers Bengaluru</p>
                                        <p>Delhi Capitals</p>
                                    </li>
                                    <li>
                                        <span>1 INN, 15.2 OV</span>
                                        <p>Zimbabwe <span>125/2</span></p>
                                        <p>Oman<span>0/0</span></p>
                                    </li>
                                    <li>
                                        <span>Today,10:30</span>
                                        <p>Royal Challengers Bengaluru</p>
                                        <p>Delhi Capitals</p>
                                    </li>
                                    <li>
                                        <span>1 INN, 15.2 OV</span>
                                        <p>Zimbabwe <span>125/2</span></p>
                                        <p>Oman<span>0/0</span></p>
                                    </li>
                                    <li>
                                        <span>Today,10:30</span>
                                        <p>Royal Challengers Bengaluru</p>
                                        <p>Delhi Capitals</p>
                                    </li>
                                    <li>
                                        <span>1 INN, 15.2 OV</span>
                                        <p>Zimbabwe <span>125/2</span></p>
                                        <p>Oman<span>0/0</span></p>
                                    </li>
                                </ul>
                            </div>
                        </div> */}

                        <div className='match_info_section_wrapper'>

                            <div className='series_name_row'>
                                <p>Vodafone Serives</p>
                            </div>
                            {/* <div className='cricket_info_inner'>
                                <div className='cricket_vector_icon'>
                                    <img src="images/t20_vector.svg" alt="cricket" width="48" height="48" decoding="async" fetchPriority="high" />
                                </div>


                                <div className='cricket_detail_title_row'>
                                    <h2>{eventNameFromState || 'Premier League, Women'}</h2>




                                    {(location.state?.inPlay ?? defaultMatch?.inPlay) && (
                                        <span className='cricket_ball_running_badge'>
                                            <span className='cricket_ball_running_dot' />
                                            Ball Running
                                        </span>
                                    )}
                                </div>



              



                                <div className='cricket_info_content'>
                                  <div className='vs_vector_icon'> 
                                        <img src="images/vs_vector.svg" alt="cricket" width="40" height="24" decoding="async" />
                                    </div> 

                                    <img className='team_bg_img' src="images/team_bg.svg" alt="cricket" width="400" height="200" decoding="async" fetchPriority="high" />

                                    <div className='d-flex align-items-center gap-2 team_dlex'>
                                        {(() => {
                                            const eventName = eventNameFromState || 'Premier League, Women'
                                            const parts = (eventName || '').split(/\s+v\s+/i)
                                            const teamA = parts.length >= 2 ? parts[0].trim() : eventName
                                            const teamB = parts.length >= 2 ? parts[1].trim() : ''
                                            return (
                                                <>
                                                    <div className='team_cricket_bl'>
                                                       
                                                        
                                                    </div>
                                                    <div className='team_cricket_bl rightreverse'>
                                                        <p>{teamB}</p>
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </div> */}


                            <div className='cricket_scorecard cricket_live_scoreboard'>
                                {(() => {
                                    const eventName = eventNameFromState || 'Premier League, Women'
                                    const parts = (eventName || '').split(/\s+v\s+/i)
                                    const teamA = parts.length >= 2 ? parts[0].trim() : eventName
                                    const teamB = parts.length >= 2 ? parts[1].trim() : ''
                                    return (
                                        <>
                                <div className='cricket_live_top_panel'>
                                    <div className='cricket_live_team_left'>
                                        <div className='cricket_live_team_name'>{teamA}</div>
                                        <div className='cricket_live_score_row'>
                                            <span className='cricket_live_score_box'>0/0 (0.0)</span>
                                            <span className='cricket_live_crr'>CRR: 0</span>
                                        </div>
                                        <div className='cricket_live_partnership'>Partnership: 0 (0)</div>
                                        <div className='cricket_live_over_box'>Over 1</div>
                                    </div>
                                    <div className='cricket_live_center'>
                                        <span className='cricket_live_toss'>KRW opt to bowl</span>
                                    </div>
                                    <div className='cricket_live_team_right'>
                                        <div className='cricket_live_team_name'>{teamB}</div>
                                        <div className='cricket_live_score_row'>
                                            <span className='cricket_live_rrr'>RRR: 0</span>
                                            <span className='cricket_live_crr'>CRR: 0</span>
                                            <span className='cricket_live_score_box'>0/0 (0.0)</span>
                                        </div>
                                        <div className='cricket_live_last_wicket'>Last Wicket:</div>
                                    </div>
                                </div>

                                <div className='cricket_live_batsmen_section'>
                                    <table className='cricket_live_table'>
                                        <thead>
                                            <tr>
                                                <th className='cricket_live_th_name'><i className='ri-cricket-line' aria-hidden /> Batsmen</th>
                                                <th className='cricket_live_th_num'>R</th>
                                                <th className='cricket_live_th_num'>B</th>
                                                <th className='cricket_live_th_num'>4s</th>
                                                <th className='cricket_live_th_num'>6s</th>
                                                <th className='cricket_live_th_num'>SR</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className='cricket_live_td_name'>
                                                    <i className='ri-cricket-line cricket_live_bat_icon' aria-hidden />
                                                    Mohammad Akram
                                                    <span className='cricket_live_striker'>/</span>
                                                </td>
                                                <td className='cricket_live_td_num'>0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                            </tr>
                                            <tr>
                                                <td className='cricket_live_td_name'>
                                                    <i className='ri-cricket-line cricket_live_bat_icon' aria-hidden />
                                                    Daniyal Hussain Rajput
                                                </td>
                                                <td className='cricket_live_td_num'>0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className='cricket_live_bowler_section'>
                                    <table className='cricket_live_table'>
                                        <thead>
                                            <tr>
                                                <th className='cricket_live_th_name'><span className='dsfdsf' /><span>Bowler</span></th>
                                                <th className='cricket_live_th_num'>O</th>
                                                <th className='cricket_live_th_num'>R</th>
                                                <th className='cricket_live_th_num'>M</th>
                                                <th className='cricket_live_th_num'>W</th>
                                                <th className='cricket_live_th_num'>Eco</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className='cricket_live_td_name'>
                                                    <span className='cricket_live_ball_icon cricket_live_ball_active' />
                                                    Bowler name
                                                </td>
                                                <td className='cricket_live_td_num'>0.0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                                <td className='cricket_live_td_num'>0</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                        </>
                                    )
                                })()}
                            </div>

                        </div>

                        <div className='cricket_summary_details_wrapper' ref={marketsSectionRef}>
                            {showMarketsSection ? (
                                <>
                                    <div className='top_tabs_cricket top_tabs_markets'>
                                        <ul>
                                            <li className={activeTab === 'all' ? 'active' : ''}>
                                                <button onClick={() => setActiveTab('all')}>ALL</button>
                                            </li>
                                            <li className={activeTab === 'sessions' ? 'active' : ''}>
                                                <button onClick={() => setActiveTab('sessions')}>SESSIONS</button>
                                            </li>
                                            <li className={activeTab === 'wp-market' ? 'active' : ''}>
                                                <button onClick={() => setActiveTab('wp-market')}>W/P MARKET</button>
                                            </li>
                                            <li className={activeTab === 'extra-market' ? 'active' : ''}>
                                                <button onClick={() => setActiveTab('extra-market')}>EXTRA MARKET</button>
                                            </li>
                                            <li className={activeTab === 'odd-even' ? 'active' : ''}>
                                                <button onClick={() => setActiveTab('odd-even')}>ODD/EVEN</button>
                                            </li>
                                            <li className={`open_bets_tab ${activeTab === 'open-bets' ? 'active' : ''}`}>
                                                <button onClick={() => setActiveTab('open-bets')}>OPEN BETS</button>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className='match_summary_content_tabs'>
                                        {activeTab === 'all' && (
                                            <>
                                                {oddsLoading && gameId && (
                                                    <div className='match_block' style={{ padding: '1rem', color: 'var(--text-secondary, #888)' }}>Loading odds...</div>
                                                )}
                                                {oddsData?.matchOdds?.length > 0 && renderOddsSection('match_odds', 'MATCH ODDS', 'ri-rocket-line', 'MIN: 100 MAX: 10K', oddsData.matchOdds, 'match_odds')}
                                                {oddsData?.bookMakerOdds?.length > 0 && renderOddsSection('bookmaker', 'BOOKMAKER', 'ri-tools-line', 'MIN: 100 MAX: 300K', oddsData.bookMakerOdds, 'bookmaker')}
                                                {(oddsData?.fancyOdds?.length > 0 || oddsData?.premiumFancy?.length > 0) && renderOddsSection('mini_bookmaker', 'MINI BOOKMAKER', 'ri-tools-line', 'MIN: 100 MAX: 100K', oddsData.fancyOdds?.length ? oddsData.fancyOdds : oddsData.premiumFancy, 'fancy')}

                                                {/* Neeche: SESSIONS, W/P MARKET, EXTRA MARKET, ODD/EVEN – sab ALL me; screenshots jaisa */}
                                                <div className="markets_below_wrap">
                                                    {renderNoYesSection('below_sessions', 'SESSIONS', sessionsRows)}
                                                    {renderNoYesSection('below_wp', 'W/P MARKET', wpMarketRows)}
                                                    {renderNoYesSection('below_extra', 'EXTRA MARKET', extraMarketRows)}
                                                    {renderNoYesSection('below_odd_even', 'ODD/EVEN', oddEvenRows)}
                                                    {backOnlyBlocks.map((block) => renderBackOnlySection(block))}
                                                </div>

                                                {/* {oddsData?.matchOdds?.map((market, mIdx) => {
                                                    const marketId = market.mid || market.marketId
                                                    const oddList = Array.isArray(market.oddDatas) ? market.oddDatas : (market.oddDatas ? Object.values(market.oddDatas).filter(Boolean) : [])
                                                    return (
                                                        <div key={marketId || mIdx} className='match_block'>
                                                            <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock(`api-mo-${marketId}-${mIdx}`)}>
                                                                <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>{market.market || 'Match Odds'}</h6>
                                                                <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has(`api-mo-${marketId}-${mIdx}`) ? 'rotated' : ''}`}></i></button>
                                                            </div>
                                                            <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 flex-wrap ${closedBlocks.has(`api-mo-${marketId}-${mIdx}`) ? 'hidden' : ''}`}>
                                                                {oddList.map((odd, oIdx) => {
                                                                    const name = odd.rname ?? odd.selectionName ?? ''
                                                                    const backOdds = odd.b1 != null && odd.b1 !== '' ? String(odd.b1) : '0'
                                                                    const layOdds = odd.l1 != null && odd.l1 !== '' ? String(odd.l1) : '0'
                                                                    const backLocked = isOddsLocked(backOdds)
                                                                    const layLocked = isOddsLocked(layOdds)
                                                                    const elIdBack = `api-mo-${marketId}-${mIdx}-${oIdx}-back`
                                                                    const elIdLay = `api-mo-${marketId}-${mIdx}-${oIdx}-lay`
                                                                    const placeBack = !backLocked && gameId && eventNameFromState && marketId && (odd.sid != null) ? { sport: 'cricket', gameId, eventName: eventNameFromState, marketType: 'match_odds', marketId: String(marketId), selectionId: String(odd.sid), selectionName: name, betType: 'back', odds: parseFloat(backOdds) || 0 } : null
                                                                    const placeLay = !layLocked && gameId && eventNameFromState && marketId && (odd.sid != null) ? { sport: 'cricket', gameId, eventName: eventNameFromState, marketType: 'match_odds', marketId: String(marketId), selectionId: String(odd.sid), selectionName: name, betType: 'lay', odds: parseFloat(layOdds) || 0 } : null
                                                                    return (
                                                                        <div key={odd.sid ?? oIdx} className='d-flex align-items-center mt-2 justify-content-between gap-2' style={{ width: '100%' }}>
                                                                            <div className={`team_cricket_bl_name ${backLocked ? 'locked' : ''} ${isBetSelected(name, market.market, backOdds, elIdBack) ? 'selected' : ''}`} onClick={() => !backLocked && handleBetClick(name, market.market, backOdds, elIdBack, placeBack)}>
                                                                                {backLocked ? <><span>{name}</span> <span className="odds_cell_locked"><i className="ri-lock-line" aria-hidden /></span></> : <>{name} <span>{odd.b1 ?? '-'}</span></>}
                                                                            </div>
                                                                            <div className={`team_cricket_bl_name ${layLocked ? 'locked' : ''} ${isBetSelected(name, market.market, layOdds, elIdLay) ? 'selected' : ''}`} onClick={() => !layLocked && handleBetClick(name, market.market, layOdds, elIdLay, placeLay)}>
                                                                                {layLocked ? <>Lay <span className="odds_cell_locked"><i className="ri-lock-line" aria-hidden /></span></> : <>Lay <span>{odd.l1 ?? '-'}</span></>}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-1')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Winner (incl. super over)</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-1') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-1') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('Royal Challengers Bengaluru', 'Winner (incl. super over)', '1.75', 'all-1-left') ? 'selected' : ''}`} onClick={() => handleBetClick('Royal Challengers Bengaluru', 'Winner (incl. super over)', '1.75', 'all-1-left')}>
                                                            Royal Challengers Bengaluru <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('Delhi Capitals', 'Winner (incl. super over)', '1.75', 'all-1-right') ? 'selected' : ''}`} onClick={() => handleBetClick('Delhi Capitals', 'Winner (incl. super over)', '1.75', 'all-1-right')}>
                                                            Delhi Capitals <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-2')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Which team wins the coin toss</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-2') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-2') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('Royal Challengers Bengaluru', 'Which team wins the coin toss', '1.75', 'all-2-left') ? 'selected' : ''}`} onClick={() => handleBetClick('Royal Challengers Bengaluru', 'Which team wins the coin toss', '1.75', 'all-2-left')}>
                                                            Royal Challengers Bengaluru <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('Delhi Capitals', 'Which team wins the coin toss', '1.75', 'all-2-right') ? 'selected' : ''}`} onClick={() => handleBetClick('Delhi Capitals', 'Which team wins the coin toss', '1.75', 'all-2-right')}>
                                                            Delhi Capitals <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-3')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Total runs</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-3') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-3') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('Royal Challengers Bengaluru', 'Total runs', '1.75', 'all-3-row1-left') ? 'selected' : ''}`} onClick={() => handleBetClick('Royal Challengers Bengaluru', 'Total runs', '1.75', 'all-3-row1-left')}>
                                                            Royal Challengers Bengaluru <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('Delhi Capitals', 'Total runs', '1.75', 'all-3-row1-right') ? 'selected' : ''}`} onClick={() => handleBetClick('Delhi Capitals', 'Total runs', '1.75', 'all-3-row1-right')}>
                                                            Delhi Capitals <span>1.75</span>
                                                        </div>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-3') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('Royal Challengers Bengaluru', 'Total runs', '1.75', 'all-3-row2-left') ? 'selected' : ''}`} onClick={() => handleBetClick('Royal Challengers Bengaluru', 'Total runs', '1.75', 'all-3-row2-left')}>
                                                            Royal Challengers Bengaluru <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('Delhi Capitals', 'Total runs', '1.75', 'all-3-row2-right') ? 'selected' : ''}`} onClick={() => handleBetClick('Delhi Capitals', 'Total runs', '1.75', 'all-3-row2-right')}>
                                                            Delhi Capitals <span>1.75</span>
                                                        </div>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-3') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('Royal Challengers Bengaluru', 'Total runs', '1.75', 'all-3-row3-left') ? 'selected' : ''}`} onClick={() => handleBetClick('Royal Challengers Bengaluru', 'Total runs', '1.75', 'all-3-row3-left')}>
                                                            Royal Challengers Bengaluru <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('Delhi Capitals', 'Total runs', '1.75', 'all-3-row3-right') ? 'selected' : ''}`} onClick={() => handleBetClick('Delhi Capitals', 'Total runs', '1.75', 'all-3-row3-right')}>
                                                            Delhi Capitals <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-4')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>First innings overs 0 to 10 - Royal
                                                            Challengers Bengaluru total</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-4') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-4') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row1-over78.5') ? 'selected' : ''}`} onClick={() => handleBetClick('over 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row1-over78.5')}>
                                                            over 78.5<span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 80.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row1-over80.5') ? 'selected' : ''}`} onClick={() => handleBetClick('over 80.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row1-over80.5')}>
                                                            over 80.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-4') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 80.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row2-over80.5') ? 'selected' : ''}`} onClick={() => handleBetClick('over 80.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row2-over80.5')}>
                                                            over 80.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row2-under78.5') ? 'selected' : ''}`} onClick={() => handleBetClick('under 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row2-under78.5')}>
                                                            under 78.5<span>1.75</span>
                                                        </div>
                                                    </div>
                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-4') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row3-under78.5') ? 'selected' : ''}`} onClick={() => handleBetClick('under 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row3-under78.5')}>
                                                            under 78.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row3-under78.5-2') ? 'selected' : ''}`} onClick={() => handleBetClick('under 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'all-4-row3-under78.5-2')}>
                                                            under 78.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-5')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>First innings overs 0 to 12 - Delhi
                                                            Capitals total</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-5') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-5') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row1-over91.5') ? 'selected' : ''}`} onClick={() => handleBetClick('over 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row1-over91.5')}>
                                                            over 91.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row1-under91.5') ? 'selected' : ''}`} onClick={() => handleBetClick('under 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row1-under91.5')}>
                                                            under 91.5 <span>1.75</span>
                                                        </div>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-5') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row2-over91.5') ? 'selected' : ''}`} onClick={() => handleBetClick('over 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row2-over91.5')}>
                                                            over 91.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row2-under91.5') ? 'selected' : ''}`} onClick={() => handleBetClick('under 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row2-under91.5')}>
                                                            under 91.5 <span>1.75</span>
                                                        </div>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-5') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row3-over91.5') ? 'selected' : ''}`} onClick={() => handleBetClick('over 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row3-over91.5')}>
                                                            over 91.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row3-under91.5') ? 'selected' : ''}`} onClick={() => handleBetClick('under 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'all-5-row3-under91.5')}>
                                                            under 91.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-6')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>First innings over 1 - Royal Challengers
                                                            Bengaluru total</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-6') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-6') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 6.5', 'First innings over 1 - Royal Challengers Bengaluru total', '1.75', 'all-6-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 6.5', 'First innings over 1 - Royal Challengers Bengaluru total', '1.75', 'all-6-left')}>
                                                            over 6.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 6.5', 'First innings over 1 - Royal Challengers Bengaluru total', '1.75', 'all-6-right') ? 'selected' : ''}`} onClick={() => handleBetClick('under 6.5', 'First innings over 1 - Royal Challengers Bengaluru total', '1.75', 'all-6-right')}>
                                                            under 6.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-7')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>First innings over 1 - Delhi Capitals total</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-7') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-7') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 6.5', 'First innings over 1 - Delhi Capitals total', '1.75', 'all-7-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 6.5', 'First innings over 1 - Delhi Capitals total', '1.75', 'all-7-left')}>
                                                            over 6.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 6.5', 'First innings over 1 - Delhi Capitals total', '1.75', 'all-7-right') ? 'selected' : ''}`} onClick={() => handleBetClick('under 6.5', 'First innings over 1 - Delhi Capitals total', '1.75', 'all-7-right')}>
                                                            under 6.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-8')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Total fours</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-8') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-8') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 37.5', 'Total fours', '1.75', 'all-8-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 37.5', 'Total fours', '1.75', 'all-8-left')}>
                                                            over 37.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 37.5', 'Total fours', '1.75', 'all-8-right') ? 'selected' : ''}`} onClick={() => handleBetClick('under 37.5', 'Total fours', '1.75', 'all-8-right')}>
                                                            under 37.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-9')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Total extras</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-9') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-9') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 37.5', 'Total extras', '1.75', 'all-9-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 37.5', 'Total extras', '1.75', 'all-9-left')}>
                                                            over 37.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 37.5', 'Total extras', '1.75', 'all-9-right') ? 'selected' : ''}`} onClick={() => handleBetClick('under 37.5', 'Total extras', '1.75', 'all-9-right')}>
                                                            under 37.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-10')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Total dismissals</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-10') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-10') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 37.5', 'Total dismissals', '1.75', 'all-10-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 37.5', 'Total dismissals', '1.75', 'all-10-left')}>
                                                            over 37.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 37.5', 'Total dismissals', '1.75', 'all-10-right') ? 'selected' : ''}`} onClick={() => handleBetClick('under 37.5', 'Total dismissals', '1.75', 'all-10-right')}>
                                                            under 37.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-11')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Royal Challengers Bengaluru runs odd/even</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-11') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-11') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('odd', 'Royal Challengers Bengaluru runs odd/even', '1.75', 'all-11-left') ? 'selected' : ''}`} onClick={() => handleBetClick('odd', 'Royal Challengers Bengaluru runs odd/even', '1.75', 'all-11-left')}>
                                                            odd <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('even', 'Royal Challengers Bengaluru runs odd/even', '1.75', 'all-11-right') ? 'selected' : ''}`} onClick={() => handleBetClick('even', 'Royal Challengers Bengaluru runs odd/even', '1.75', 'all-11-right')}>
                                                            even <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('all-12')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Delhi Capitals runs odd/even</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('all-12') ? 'rotated' : ''}`}></i></button>
                                                    </div>

                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('all-12') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('odd', 'Delhi Capitals runs odd/even', '1.75', 'all-12-left') ? 'selected' : ''}`} onClick={() => handleBetClick('odd', 'Delhi Capitals runs odd/even', '1.75', 'all-12-left')}>
                                                            odd <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('even', 'Delhi Capitals runs odd/even', '1.75', 'all-12-right') ? 'selected' : ''}`} onClick={() => handleBetClick('even', 'Delhi Capitals runs odd/even', '1.75', 'all-12-right')}>
                                                            even <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div> */}
                                            </>
                                        )}

                                        {activeTab === 'sessions' && (
                                            <div className="markets_below_wrap">
                                                {oddsLoading && gameId && (
                                                    <div className="match_block" style={{ padding: '1rem', color: 'var(--text-secondary, #888)' }}>Loading odds...</div>
                                                )}
                                                {renderNoYesSection('below_sessions', 'SESSIONS', sessionsRows)}
                                            </div>
                                        )}

                                        {activeTab === 'wp-market' && (
                                            <div className="markets_below_wrap">
                                                {oddsLoading && gameId && (
                                                    <div className="match_block" style={{ padding: '1rem', color: 'var(--text-secondary, #888)' }}>Loading odds...</div>
                                                )}
                                                {renderNoYesSection('below_wp', 'W/P MARKET', wpMarketRows)}
                                            </div>
                                        )}

                                        {activeTab === 'extra-market' && (
                                            <div className="markets_below_wrap">
                                                {oddsLoading && gameId && (
                                                    <div className="match_block" style={{ padding: '1rem', color: 'var(--text-secondary, #888)' }}>Loading odds...</div>
                                                )}
                                                {renderNoYesSection('below_extra', 'EXTRA MARKET', extraMarketRows)}
                                            </div>
                                        )}

                                        {activeTab === 'odd-even' && (
                                            <div className="markets_below_wrap">
                                                {oddsLoading && gameId && (
                                                    <div className="match_block" style={{ padding: '1rem', color: 'var(--text-secondary, #888)' }}>Loading odds...</div>
                                                )}
                                                {renderNoYesSection('below_odd_even', 'ODD/EVEN', oddEvenRows)}
                                                {backOnlyBlocks.map((block) => renderBackOnlySection(block))}
                                            </div>
                                        )}

                                        {activeTab === 'open-bets' && (
                                            <div className="page_open_bets_wrap">
                                                <LossCutIndicator currentLoss={betslipCurrentLoss ?? betslipExposure ?? 0} lossLimit={betslipLossLimit} compact onSetLimit={handleSetLossLimit} />
                                                {openBetsLoading ? (
                                                    <p className='betslip_empty'>Loading open bets...</p>
                                                ) : openBetsList.length === 0 ? (
                                                    <div className='betslip_empty'><p>No open bets.</p></div>
                                                ) : (
                                                    <div className='betslip_open_bets'>
                                                        {openBetsList.map((b) => {
                                                            const bid = b._id ?? b.id
                                                            const statusRaw = (b.status || 'open').toLowerCase()
                                                            const cashoutVal = b.cashout_value != null ? Number(b.cashout_value) : null
                                                            const suspended = b.cashout_suspended === true || b.cashoutSuspended === true
                                                            const isCashingOut = cashoutId === bid
                                                            return (
                                                                <div key={bid} className='betslip_open_bet_card'>
                                                                    <div className='betslip_open_bet_title'>{b.eventName || '—'}</div>
                                                                    <div className='betslip_open_bet_row'><span>Market</span><span>{b.marketName || b.marketType || '—'}</span></div>
                                                                    <div className='betslip_open_bet_row'><span>Selection</span><span>{b.selectionName || '—'}</span></div>
                                                                    <div className='betslip_open_bet_row'><span>Stake</span><span>₹{Number(b.stake || 0).toLocaleString()}</span></div>
                                                                    <div className='betslip_open_bet_row'><span>Odds</span><span>{b.odds != null ? Number(b.odds) : '—'}</span></div>
                                                                    <div className='betslip_open_bet_row'><span>Potential Win</span><span>₹{Number(b.potentialProfit || 0).toLocaleString()}</span></div>
                                                                    {cashoutVal != null && <div className='betslip_open_bet_row'><span>Cash Out Value</span><span>₹{cashoutVal.toLocaleString()}</span></div>}
                                                                    <div className='betslip_open_bet_actions'>
                                                                        {statusRaw !== 'open' ? (
                                                                            <span className='betslip_open_bet_closed'>BET CLOSED</span>
                                                                        ) : suspended ? (
                                                                            <span className='betslip_cashout_suspended'>CASH OUT NOT AVAILABLE</span>
                                                                        ) : (
                                                                            <button
                                                                                type='button'
                                                                                className='betslip_cashout_btn'
                                                                                onClick={() => handleCashoutBetslip(bid)}
                                                                                disabled={isCashingOut}
                                                                            >
                                                                                {isCashingOut ? 'CASHING OUT...' : (cashoutVal != null && cashoutVal > 0 ? `CASH OUT ₹${cashoutVal.toLocaleString()}` : 'CASH OUT')}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'player-props' && (
                                            <div className='match_block'>
                                                <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('player-props-1')}>
                                                    <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Player Props Content</h6>
                                                    <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('player-props-1') ? 'rotated' : ''}`}></i></button>
                                                </div>
                                                <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('player-props-1') ? 'hidden' : ''}`}>
                                                    <div className={`team_cricket_bl_name ${isBetSelected('Player Props', 'Player Props Content', '1.75', 'player-props-1-left') ? 'selected' : ''}`} onClick={() => handleBetClick('Player Props', 'Player Props Content', '1.75', 'player-props-1-left')}>
                                                        Player Props <span>1.75</span>
                                                    </div>
                                                    <div className={`team_cricket_bl_name ${isBetSelected('Player Props', 'Player Props Content', '1.75', 'player-props-1-right') ? 'selected' : ''}`} onClick={() => handleBetClick('Player Props', 'Player Props Content', '1.75', 'player-props-1-right')}>
                                                        Player Props <span>1.75</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'innings' && (
                                            <>
                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('innings-1')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>First innings overs 0 to 10 - Royal
                                                            Challengers Bengaluru total</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('innings-1') ? 'rotated' : ''}`}></i></button>
                                                    </div>
                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('innings-1') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'innings-1-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'innings-1-left')}>
                                                            over 78.5<span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 80.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'innings-1-right') ? 'selected' : ''}`} onClick={() => handleBetClick('over 80.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'innings-1-right')}>
                                                            over 80.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('innings-2')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>First innings overs 0 to 12 - Delhi
                                                            Capitals total</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('innings-2') ? 'rotated' : ''}`}></i></button>
                                                    </div>
                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('innings-2') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'innings-2-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'innings-2-left')}>
                                                            over 91.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'innings-2-right') ? 'selected' : ''}`} onClick={() => handleBetClick('under 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'innings-2-right')}>
                                                            under 91.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('innings-3')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>First innings over 1 - Royal Challengers
                                                            Bengaluru total</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('innings-3') ? 'rotated' : ''}`}></i></button>
                                                    </div>
                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('innings-3') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 6.5', 'First innings over 1 - Royal Challengers Bengaluru total', '1.75', 'innings-3-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 6.5', 'First innings over 1 - Royal Challengers Bengaluru total', '1.75', 'innings-3-left')}>
                                                            over 6.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 6.5', 'First innings over 1 - Royal Challengers Bengaluru total', '1.75', 'innings-3-right') ? 'selected' : ''}`} onClick={() => handleBetClick('under 6.5', 'First innings over 1 - Royal Challengers Bengaluru total', '1.75', 'innings-3-right')}>
                                                            under 6.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('innings-4')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>First innings over 1 - Delhi Capitals total</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('innings-4') ? 'rotated' : ''}`}></i></button>
                                                    </div>
                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('innings-4') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 6.5', 'First innings over 1 - Delhi Capitals total', '1.75', 'innings-4-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 6.5', 'First innings over 1 - Delhi Capitals total', '1.75', 'innings-4-left')}>
                                                            over 6.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 6.5', 'First innings over 1 - Delhi Capitals total', '1.75', 'innings-4-right') ? 'selected' : ''}`} onClick={() => handleBetClick('under 6.5', 'First innings over 1 - Delhi Capitals total', '1.75', 'innings-4-right')}>
                                                            under 6.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'overs' && (
                                            <>
                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('overs-1')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>First innings overs 0 to 10 - Royal
                                                            Challengers Bengaluru total</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('overs-1') ? 'rotated' : ''}`}></i></button>
                                                    </div>
                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('overs-1') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'overs-1-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 78.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'overs-1-left')}>
                                                            over 78.5<span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 80.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'overs-1-right') ? 'selected' : ''}`} onClick={() => handleBetClick('over 80.5', 'First innings overs 0 to 10 - Royal Challengers Bengaluru total', '1.75', 'overs-1-right')}>
                                                            over 80.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='match_block'>
                                                    <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('overs-2')}>
                                                        <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>First innings overs 0 to 12 - Delhi
                                                            Capitals total</h6>
                                                        <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('overs-2') ? 'rotated' : ''}`}></i></button>
                                                    </div>
                                                    <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('overs-2') ? 'hidden' : ''}`}>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('over 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'overs-2-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'overs-2-left')}>
                                                            over 91.5 <span>1.75</span>
                                                        </div>
                                                        <div className={`team_cricket_bl_name ${isBetSelected('under 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'overs-2-right') ? 'selected' : ''}`} onClick={() => handleBetClick('under 91.5', 'First innings overs 0 to 12 - Delhi Capitals total', '1.75', 'overs-2-right')}>
                                                            under 91.5 <span>1.75</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'deliveries' && (
                                            <div className='match_block'>
                                                <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('deliveries-1')}>
                                                    <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Deliveries Content</h6>
                                                    <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('deliveries-1') ? 'rotated' : ''}`}></i></button>
                                                </div>
                                                <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('deliveries-1') ? 'hidden' : ''}`}>
                                                    <div className={`team_cricket_bl_name ${isBetSelected('Deliveries', 'Deliveries Content', '1.75', 'deliveries-1-left') ? 'selected' : ''}`} onClick={() => handleBetClick('Deliveries', 'Deliveries Content', '1.75', 'deliveries-1-left')}>
                                                        Deliveries <span>1.75</span>
                                                    </div>
                                                    <div className={`team_cricket_bl_name ${isBetSelected('Deliveries', 'Deliveries Content', '1.75', 'deliveries-1-right') ? 'selected' : ''}`} onClick={() => handleBetClick('Deliveries', 'Deliveries Content', '1.75', 'deliveries-1-right')}>
                                                        Deliveries <span>1.75</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'wickets' && (
                                            <div className='match_block'>
                                                <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('wickets-1')}>
                                                    <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Total dismissals</h6>
                                                    <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('wickets-1') ? 'rotated' : ''}`}></i></button>
                                                </div>
                                                <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('wickets-1') ? 'hidden' : ''}`}>
                                                    <div className={`team_cricket_bl_name ${isBetSelected('over 37.5', 'Total dismissals', '1.75', 'wickets-1-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 37.5', 'Total dismissals', '1.75', 'wickets-1-left')}>
                                                        over 37.5 <span>1.75</span>
                                                    </div>
                                                    <div className={`team_cricket_bl_name ${isBetSelected('under 37.5', 'Total dismissals', '1.75', 'wickets-1-right') ? 'selected' : ''}`} onClick={() => handleBetClick('under 37.5', 'Total dismissals', '1.75', 'wickets-1-right')}>
                                                        under 37.5 <span>1.75</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'extras' && (
                                            <div className='match_block'>
                                                <div className='d-flex align-items-center justify-content-between top_hd' onClick={() => toggleBlock('extras-1')}>
                                                    <h6><span><img src="images/pinmarket.svg" alt="cricket" /></span>Total extras</h6>
                                                    <button className='toggleup_btn'><i className={`ri-arrow-up-s-fill ${closedBlocks.has('extras-1') ? 'rotated' : ''}`}></i></button>
                                                </div>
                                                <div className={`d-flex align-items-center mt-2 justify-content-between gap-2 ${closedBlocks.has('extras-1') ? 'hidden' : ''}`}>
                                                    <div className={`team_cricket_bl_name ${isBetSelected('over 37.5', 'Total extras', '1.75', 'extras-1-left') ? 'selected' : ''}`} onClick={() => handleBetClick('over 37.5', 'Total extras', '1.75', 'extras-1-left')}>
                                                        over 37.5 <span>1.75</span>
                                                    </div>
                                                    <div className={`team_cricket_bl_name ${isBetSelected('under 37.5', 'Total extras', '1.75', 'extras-1-right') ? 'selected' : ''}`} onClick={() => handleBetClick('under 37.5', 'Total extras', '1.75', 'extras-1-right')}>
                                                        under 37.5 <span>1.75</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="cricket_markets_placeholder" aria-hidden="true" />
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Betslip Panel */}
            {isBetslipOpen && (
                <>
                    <div className='betslip_overlay' onClick={() => setIsBetslipOpen(false)}></div>
                    <div className='betslip_panel'>
                        <div className='betslip_tabs_row'>
                            <button
                                type='button'
                                className={`betslip_tab ${betslipView === 'slip' ? 'betslip_tab_active' : 'betslip_tab_inactive'}`}
                                onClick={() => setBetslipView('slip')}
                            >
                                BET SLIP
                            </button>
                            <button
                                type='button'
                                className={`betslip_tab ${betslipView === 'openbets' ? 'betslip_tab_active' : 'betslip_tab_inactive'}`}
                                onClick={() => setBetslipView('openbets')}
                            >
                                (OPEN BETS) ({openBetsCount})
                            </button>
                            <button
                                type='button'
                                className='betslip_close_btn'
                                onClick={() => setIsBetslipOpen(false)}
                                aria-label='Close bet slip'
                            >
                                <i className='ri-close-line'></i>
                            </button>
                        </div>

                        <div className='betslip_content' ref={betslipContentRef}>
                            {betslipView === 'openbets' ? (
                                <>
                                    <LossCutIndicator currentLoss={betslipCurrentLoss ?? betslipExposure ?? 0} lossLimit={betslipLossLimit} compact onSetLimit={handleSetLossLimit} />
                                    {openBetsLoading ? (
                                        <p className='betslip_empty'>Loading open bets...</p>
                                    ) : openBetsList.length === 0 ? (
                                        <div className='betslip_empty'><p>No open bets.</p></div>
                                    ) : (
                                        <div className='betslip_open_bets'>
                                            {openBetsList.map((b) => {
                                                const bid = b._id ?? b.id
                                                const statusRaw = (b.status || 'open').toLowerCase()
                                                const cashoutVal = b.cashout_value != null ? Number(b.cashout_value) : null
                                                const suspended = b.cashout_suspended === true || b.cashoutSuspended === true
                                                const isCashingOut = cashoutId === bid
                                                return (
                                                    <div key={bid} className='betslip_open_bet_card'>
                                                        <div className='betslip_open_bet_title'>{b.eventName || '—'}</div>
                                                        <div className='betslip_open_bet_row'><span>Market</span><span>{b.marketName || b.marketType || '—'}</span></div>
                                                        <div className='betslip_open_bet_row'><span>Selection</span><span>{b.selectionName || '—'}</span></div>
                                                        <div className='betslip_open_bet_row'><span>Stake</span><span>₹{Number(b.stake || 0).toLocaleString()}</span></div>
                                                        <div className='betslip_open_bet_row'><span>Odds</span><span>{b.odds != null ? Number(b.odds) : '—'}</span></div>
                                                        <div className='betslip_open_bet_row'><span>Potential Win</span><span>₹{Number(b.potentialProfit || 0).toLocaleString()}</span></div>
                                                        {cashoutVal != null && <div className='betslip_open_bet_row'><span>Cash Out Value</span><span>₹{cashoutVal.toLocaleString()}</span></div>}
                                                        <div className='betslip_open_bet_actions'>
                                                            {statusRaw !== 'open' ? (
                                                                <span className='betslip_open_bet_closed'>BET CLOSED</span>
                                                            ) : suspended ? (
                                                                <span className='betslip_cashout_suspended'>CASH OUT NOT AVAILABLE</span>
                                                            ) : (
                                                                <button
                                                                    type='button'
                                                                    className='betslip_cashout_btn'
                                                                    onClick={() => handleCashoutBetslip(bid)}
                                                                    disabled={isCashingOut}
                                                                >
                                                                    {isCashingOut ? 'CASHING OUT...' : (cashoutVal != null && cashoutVal > 0 ? `CASH OUT ₹${cashoutVal.toLocaleString()}` : 'CASH OUT')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : selectedBets.length > 0 ? (
                                <>
                                    <LossCutIndicator currentLoss={betslipCurrentLoss ?? betslipExposure ?? 0} lossLimit={betslipLossLimit} compact onSetLimit={handleSetLossLimit} />
                                    {lossLimitReached && <p className='betslip_error'>Loss limit reached. Betting is disabled.</p>}
                                    {selectedBets.map((bet) => (
                                        <div key={bet.id} className='betslip_card_light'>
                                            <div className='betslip_card_header'>
                                                <span className='betslip_match_title'>{eventNameFromState || 'Match'}</span>
                                                <button type='button' className='betslip_card_close' onClick={() => removeBet(bet.id)} aria-label='Remove'>×</button>
                                            </div>
                                            <div className='betslip_selection'>
                                                {bet.betName} @ {(Number(slipOdds ?? bet.oddsDisplay ?? bet.odds) || 0).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}

                                    <div className='betslip_odd_section'>
                                        <label className='betslip_label'>Odd Value</label>
                                        <div className='betslip_odd_stepper'>
                                            <button type='button' className='betslip_odd_btn' onClick={() => {
                                                const curr = Number(slipOdds ?? selectedBets[0]?.oddsDisplay ?? selectedBets[0]?.odds) || 0
                                                if (curr > 1.01) setSlipOdds(Number((curr - 0.01).toFixed(2)))
                                            }}>−</button>
                                            <input
                                                type='text'
                                                className='betslip_odd_input'
                                                value={selectedBets.length > 0 ? (Number(slipOdds ?? selectedBets[0]?.oddsDisplay ?? selectedBets[0]?.odds) || 0).toFixed(2) : '0.00'}
                                                readOnly
                                            />
                                            <button type='button' className='betslip_odd_btn' onClick={() => {
                                                const base = Number(slipOdds ?? selectedBets[0]?.oddsDisplay ?? selectedBets[0]?.odds) || 0
                                                const next = base + 0.01
                                                setSlipOdds(Number(next.toFixed(2)))
                                            }}>+</button>
                                        </div>
                                    </div>

                                    <div className='betslip_amount_section'>
                                        <label className='betslip_label'>Amount</label>
                                        <input
                                            type='number'
                                            className='betslip_amount_input'
                                            placeholder='0'
                                            min={100}
                                            max={10000}
                                            value={stake}
                                            onChange={(e) => {
                                                const v = e.target.value
                                                if (v === '' || v === '-') { setStake(''); return }
                                                const n = parseFloat(v)
                                                if (!Number.isNaN(n)) setStake(n)
                                            }}
                                        />
                                    </div>

                                    <div className='betslip_quick_stakes'>
                                        {[100, 200, 500, 1000, 2000, 5000, 10000, 25000].map((amt) => (
                                            <button key={amt} type='button' className='betslip_quick_btn' onClick={() => setStake(prev => Math.min(10000, (Number(prev) || 0) + amt))}>
                                                +{amt >= 1000 ? (amt / 1000).toFixed(0) + ',' + (amt % 1000 ? String(amt).slice(-3) : '000') : amt}
                                            </button>
                                        ))}
                                    </div>

                                    <div className='betslip_actions'>
                                        <button type='button' className='betslip_act_min' onClick={() => setStake(100)}>MIN STAKE</button>
                                        <button type='button' className='betslip_act_max' onClick={() => setStake(10000)}>MAX STAKE</button>
                                        <button type='button' className='betslip_act_edit' onClick={() => betslipContentRef.current?.querySelector('.betslip_amount_input')?.focus()}>EDIT STAKE</button>
                                        <button type='button' className='betslip_act_clear' onClick={() => setStake('')}>CLEAR</button>
                                    </div>

                                    <div className='betslip_summary_new'>
                                        <div className='betslip_summary_line'>
                                            <span>Your profit/loss as per placed bet</span>
                                            <span className='betslip_summary_val betslip_summary_profit'>{calculateProfitLoss()} ₹</span>
                                        </div>
                                        <div className='betslip_summary_line'>
                                            <span>Total Amount (in ₹)</span>
                                            <span className='betslip_summary_val'>{stake === '' ? '0.00' : (Number(stake) || 0).toFixed(2)} ₹</span>
                                        </div>
                                    </div>

                                    <p className='betslip_clear_all'>
                                        <button type='button' className='betslip_clear_all_btn' onClick={clearAllBets}>Clear all bets</button>
                                    </p>
                                    {placeBetError && <p className='betslip_error'>{placeBetError}</p>}
                                    <button className='betslip_place_bet_btn' onClick={handlePlaceBet} disabled={placeBetLoading || lossLimitReached}>
                                        {placeBetLoading ? 'Placing...' : lossLimitReached ? 'Betting disabled' : 'Place Bet'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <LossCutIndicator currentLoss={betslipCurrentLoss ?? betslipExposure ?? 0} lossLimit={betslipLossLimit} compact onSetLimit={handleSetLossLimit} />
                                    <div className='betslip_empty'>
                                        <p>No bets selected</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
            <MobileMenu />
        </React.Fragment>
    )
}

export default CricketDetail

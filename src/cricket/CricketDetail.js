import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import './CricketDetail.css'
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
import { usePlatformConfig } from '../context/PlatformConfigContext'
import { useAuth } from '../context/AuthContext'
import LossCutIndicator from '../customComponents/LossCutIndicator'
import { BackPriceCell, LayPriceCell } from './OddsMarketComponents'

const CASHOUT_COMMISSION = 0.05 // 5% of total bet (stake)

function CricketDetail() {
    const location = useLocation()
    const { config: platformConfig } = usePlatformConfig()
    const { isDemo } = useAuth()
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
    const [cashoutValuesMap, setCashoutValuesMap] = useState({}) // { betId: { value, suspended } } from GET /bet/:betId/cashout-value
    const [openCashoutSection, setOpenCashoutSection] = useState(null)
    const [openLossCutSection, setOpenLossCutSection] = useState(null)
    const openBetsCount = openBetsList.length
    const [isMobileBetslipOpen, setIsMobileBetslipOpen] = useState(false)

    // Ensure betslip popup opens whenever at least one bet is selected (desktop & mobile)
    useEffect(() => {
        if (selectedBets.length > 0) {
            setIsBetslipOpen(true)
        }
    }, [selectedBets.length])

    useEffect(() => {
        if (!openCashoutSection && !openLossCutSection) return
        const close = (e) => {
            if (e.target.closest('.odds_section_cashout_wrap') || e.target.closest('.odds_section_loss_cut_wrap')) return
            setOpenCashoutSection(null)
            setOpenLossCutSection(null)
        }
        document.addEventListener('click', close)
        return () => document.removeEventListener('click', close)
    }, [openCashoutSection, openLossCutSection])

    // Refetch open bets when Cashout popover opens so list is fresh
    useEffect(() => {
        if (!openCashoutSection) return
        setOpenBetsLoading(true)
        AuthService.sportsbookOpenBets({ page: 1, limit: 20 })
            .then((res) => {
                const data = res?.data ?? res
                setOpenBetsList(data?.bets ?? [])
            })
            .catch(() => { })
            .finally(() => setOpenBetsLoading(false))
    }, [openCashoutSection])

    // Fetch cashout-value from GET /bet/:betId/cashout-value for each open bet
    useEffect(() => {
        const openBets = (openBetsList || []).filter((b) => (b.status || 'open').toLowerCase() === 'open')
        if (openBets.length === 0) {
            setCashoutValuesMap({})
            return
        }
        let cancelled = false
        const fetchAll = async () => {
            const next = {}
            await Promise.all(
                openBets.map(async (b) => {
                    const bid = b._id ?? b.id
                    if (!bid) return
                    try {
                        const res = await AuthService.sportsbookCashoutValue(bid)
                        if (cancelled) return
                        const data = res?.data ?? res
                        const val = data?.cashoutValue ?? data?.value ?? data?.cashout_value
                        const suspended = data?.cashoutSuspended ?? data?.suspended ?? false
                        next[bid] = { value: val != null ? Number(val) : null, suspended }
                    } catch {
                        if (!cancelled) next[bid] = { value: null, suspended: true }
                    }
                })
            )
            if (!cancelled) setCashoutValuesMap(next)
        }
        fetchAll()
        return () => { cancelled = true }
    }, [openBetsList])

    const [defaultMatch, setDefaultMatch] = useState(null)
    const gameIdFromState = location.state?.gameId
    const eventNameFromState = location.state?.eventName ?? defaultMatch?.eventName
    const seriesOrTournamentName = location.state?.seriesName ?? location.state?.tournamentName ?? location.state?.series_name ?? defaultMatch?.seriesName ?? defaultMatch?.series_name ?? defaultMatch?.tournamentName ?? defaultMatch?.tournament ?? ''
    const sportFromPath = location.pathname?.includes('/tennis') ? 'tennis' : location.pathname?.includes('/soccer') ? 'soccer' : null
    const sportName = location.state?.sportName || sportFromPath || 'cricket'
    const cricketOnlyTabs = ['sessions', 'wp-market', 'extra-market', 'odd-even']

    // Tennis/soccer: only ALL and OPEN BETS tabs; reset cricket-only tab to 'all'
    useEffect(() => {
        if (sportName !== 'cricket' && cricketOnlyTabs.includes(activeTab)) {
            setActiveTab('all')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when sport changes
    }, [sportName])

    const gameId = gameIdFromState ?? defaultMatch?.gameId
    const eventId = location.state?.eventId ?? defaultMatch?.eventId ?? gameId
    const [oddsData, setOddsData] = useState(null)
    const [oddsLoading, setOddsLoading] = useState(false)
    const [liveScore, setLiveScore] = useState(null)
    // eslint-disable-next-line no-unused-vars -- used in commented-out Live TV iframe
    const [streamUrl, setStreamUrl] = useState(null)

    // Guest (no token): fetch matches via REST and set first match so odds load without login
    useEffect(() => {
        if (gameIdFromState) return
        const token = sessionStorage.getItem('token')
        if (token) return
        let cancelled = false
        AuthService.sportsbookMatches(sportName)
            .then((res) => {
                if (cancelled) return
                const raw = res?.data ?? res
                const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : raw?.matches ?? []
                const first = list.find((m) => m.gameId || m.game_id)
                if (first) setDefaultMatch({
                    gameId: first.gameId ?? first.game_id,
                    eventName: first.eventName ?? first.event_name,
                    eventId: first.eventId ?? first.event_id,
                    seriesName: first.seriesName ?? first.series_name ?? first.tournamentName ?? first.tournament ?? first.competitionName ?? null,
                })
            })
            .catch(() => { })
        return () => { cancelled = true }
    }, [gameIdFromState, sportName])

    // Socket (doc): subscribe:matches { sport } when need default match; on('matches') { sport, data, timestamp }. Leave → unsubscribe:matches.
    useEffect(() => {
        if (gameIdFromState) return
        const token = sessionStorage.getItem('token')
        if (!token) return
        connectSportsbookSocket(token)
        const onMatches = (payload) => {
            if (payload?.sport !== sportName || payload.data === undefined) return
            const list = Array.isArray(payload.data) ? payload.data : []
            const first = list.find((m) => m.gameId || m.game_id)
            if (first) setDefaultMatch({
                gameId: first.gameId ?? first.game_id,
                eventName: first.eventName ?? first.event_name,
                eventId: first.eventId ?? first.event_id,
                seriesName: first.seriesName ?? first.series_name ?? first.tournamentName ?? first.tournament ?? first.competitionName ?? null,
            })
        }
        addMatchesListener(onMatches)
        subscribeMatches(sportName)
        return () => {
            removeMatchesListener(onMatches)
            unsubscribeMatches(sportName)
        }
    }, [gameIdFromState, sportName])

    const normalizeOdds = (d) => {
        const matchOdds = Array.isArray(d?.matchOdds) ? d.matchOdds : (Array.isArray(d?.match_odds) ? d.match_odds : [])
        const firstMarket = matchOdds?.[0]
        const otherMarketOdds = Array.isArray(d?.otherMarketOdds) ? d.otherMarketOdds : (Array.isArray(d?.other_market_odds) ? d.other_market_odds : [])
        const totalGoalsOdds = Array.isArray(d?.totalGoalsOdds) ? d.totalGoalsOdds : (Array.isArray(d?.total_goals_odds) ? d.total_goals_odds : [])
        const overUnderOdds = Array.isArray(d?.overUnderOdds) ? d.overUnderOdds : (Array.isArray(d?.over_under_odds) ? d.over_under_odds : [])
        return {
            matchOdds,
            marketClosed: d?.marketClosed === true,
            tvUrl: d?.tv_url ?? d?.tvUrl ?? firstMarket?.tv_url ?? firstMarket?.tvUrl ?? null,
            isTv: d?.IsTv ?? d?.isTv ?? firstMarket?.IsTv ?? firstMarket?.isTv ?? false,
            fancyOdds: Array.isArray(d?.fancyOdds) ? d.fancyOdds : (Array.isArray(d?.fancy_odds) ? d.fancy_odds : []),
            otherMarketOdds: [...otherMarketOdds, ...totalGoalsOdds, ...overUnderOdds],
            bookMakerOdds: Array.isArray(d?.bookMakerOdds) ? d.bookMakerOdds : (Array.isArray(d?.book_maker_odds) ? d.book_maker_odds : []),
            premiumFancy: Array.isArray(d?.premiumFancy) ? d.premiumFancy : (Array.isArray(d?.premium_fancy) ? d.premium_fancy : []),
            oddEvenOdds: Array.isArray(d?.oddEvenOdds) ? d.oddEvenOdds : (Array.isArray(d?.odd_even_odds) ? d.odd_even_odds : []),
        }
    }

    // 0) On match open: fetch event config for initial tvUrl (REST). Clear stream when match changes.
    const oddsId = sportName === 'tennis' ? (eventId || gameId) : gameId
    useEffect(() => {
        if (!oddsId) return
        setStreamUrl(null)
        let cancelled = false
        AuthService.sportsbookEventConfig(oddsId)
            .then((res) => {
                if (cancelled) return
                const url = res?.tvUrl ?? res?.response?.tvUrl ?? res?.response?.tv_url ?? null
                if (url) setStreamUrl(url)
            })
            .catch(() => { })
        return () => { cancelled = true }
    }, [oddsId])

    // 1) Pehle odds REST API chalao – initial data. Tennis uses eventId in payload. Merge data.tvUrl into streamUrl.
    useEffect(() => {
        if (!oddsId) return
        let cancelled = false
        setOddsLoading(true)
        AuthService.sportsbookOdds(sportName, oddsId)
            .then((res) => {
                if (cancelled || !res) return
                const raw = res.data ?? res
                const d = raw?.data ?? raw
                if (d && typeof d === 'object') {
                    setOddsData(normalizeOdds(d))
                    const tvUrl = d?.tvUrl ?? d?.tv_url ?? null
                    if (tvUrl) setStreamUrl(tvUrl)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setOddsData(null)
                    try { alertErrorMessage('Failed to load odds') } catch (_) { }
                }
            })
            .finally(() => { if (!cancelled) setOddsLoading(false) })
        return () => { cancelled = true }
    }, [oddsId, sportName])

    // 2) Phir socket – live updates (token ho to). Tennis uses eventId in payload. Update odds, liveScore, streamUrl (tvUrl may appear later).
    useEffect(() => {
        if (!oddsId) return
        const token = sessionStorage.getItem('token')
        if (!token) return
        const currentOddsKey = oddsId
        connectSportsbookSocket(token)
        const onOdds = (payload) => {
            const payloadKey = payload?.eventId ?? payload?.gameId
            if (payloadKey !== currentOddsKey || payload?.data === undefined) return
            const data = payload.data
            setOddsData(normalizeOdds(data))
            setOddsLoading(false)
            setLiveScore(data?.liveScore ?? null)
            const tvUrl = data?.tvUrl ?? data?.tv_url ?? null
            if (tvUrl != null) setStreamUrl(tvUrl)
        }
        addOddsListener(onOdds)
        subscribeOdds(oddsId, sportName)
        return () => {
            removeOddsListener(onOdds)
            unsubscribeOdds(oddsId, sportName)
        }
    }, [oddsId, sportName])

    // Guests: fetch live score via REST (no Socket)
    useEffect(() => {
        if (!eventId && !gameId) return
        const token = sessionStorage.getItem('token')
        if (token) return
        let cancelled = false
        AuthService.sportsbookScore(eventId || gameId)
            .then((res) => {
                if (!cancelled && res?.liveScore != null) setLiveScore(res.liveScore)
            })
            .catch(() => { if (!cancelled) setLiveScore(null) })
        const t = setInterval(() => {
            if (cancelled) return
            AuthService.sportsbookScore(eventId || gameId)
                .then((res) => { if (!cancelled && res?.liveScore != null) setLiveScore(res.liveScore) })
                .catch(() => { })
        }, 15000)
        return () => { cancelled = true; clearInterval(t) }
    }, [eventId, gameId])

    // Fetch open bets on page load so (OPEN BETS) count and cashout list show as soon as user lands on page
    useEffect(() => {
        let cancelled = false
        setOpenBetsLoading(true)
        AuthService.sportsbookOpenBets({ page: 1, limit: 20 })
            .then((res) => {
                if (cancelled) return
                const data = res?.data ?? res
                const list = data?.bets ?? (Array.isArray(data) ? data : []) ?? []
                setOpenBetsList(Array.isArray(list) ? list : [])
            })
            .catch(() => {
                if (!cancelled) setOpenBetsList([])
            })
            .finally(() => {
                if (!cancelled) setOpenBetsLoading(false)
            })
        return () => { cancelled = true }
    }, [])

    // Refresh open bets when gameId changes (e.g. navigated to another match)
    useEffect(() => {
        if (!gameId) return
        AuthService.sportsbookOpenBets({ page: 1, limit: 20 })
            .then((res) => {
                const data = res?.data ?? res
                const list = data?.bets ?? (Array.isArray(data) ? data : []) ?? []
                setOpenBetsList(Array.isArray(list) ? list : [])
            })
            .catch(() => { })
    }, [gameId])

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

    const isSameSelectionBet = (existing, name, mkt, payload) => {
        if (existing.placePayload && payload) {
            return existing.placePayload.marketId === payload.marketId &&
                existing.placePayload.selectionId === payload.selectionId &&
                (existing.placePayload.betType || 'back') === (payload.betType || 'back')
        }
        return existing.market === mkt && existing.betName === name
    }

    const handleBetClick = (betName, market, odds, elementId, placePayload = null) => {
        const betId = `${market}-${betName}-${odds}-${elementId || ''}`
        const uniqueId = elementId || betId
        const oddsNum = parseFloat(odds)
        const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 1024

        const existingByElement = selectedBets.find((bet) => bet.elementId === uniqueId)
        const existingSameSelection = selectedBets.find((b) => isSameSelectionBet(b, betName, market, placePayload))

        if (existingByElement || existingSameSelection) {
            const existing = existingByElement || existingSameSelection
            const updatedOdds = Number.isNaN(oddsNum) ? existing.odds : oddsNum
            const updatedOddsDisplay = (oddsNum && !Number.isNaN(oddsNum)) ? String(oddsNum) : (existing.oddsDisplay ?? String(existing.odds))
            const updatedBet = { ...existing, odds: updatedOdds, oddsDisplay: updatedOddsDisplay, elementId: uniqueId }
            setSelectedBets([updatedBet])
            setSlipOdds(Number.isNaN(oddsNum) ? slipOdds : oddsNum)
            if (isMobileViewport) setIsMobileBetslipOpen(true)
            setIsBetslipOpen(true)
            return
        }

        const newBet = {
            id: betId,
            betName,
            market,
            odds: Number.isNaN(oddsNum) ? 0 : oddsNum,
            oddsDisplay: (oddsNum && !Number.isNaN(oddsNum)) ? String(oddsNum) : (odds || '0'),
            elementId: uniqueId,
            placePayload: placePayload || undefined,
        }

        // Ek baar mein sirf ek hi bet: naya selection = purani bet replace
        setSelectedBets([newBet])
        setSlipOdds(Number.isNaN(oddsNum) ? slipOdds : oddsNum)

        if (isMobileViewport) {
            setIsMobileBetslipOpen(true)
        } else {
            setIsMobileBetslipOpen(false)
        }
        setIsBetslipOpen(true)
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
        setSlipOdds(null)
        setIsMobileBetslipOpen(false)
    }

    const [placeBetLoading, setPlaceBetLoading] = useState(false)
    const [placeBetError, setPlaceBetError] = useState(null)
    const [placeBetSuccessMessage, setPlaceBetSuccessMessage] = useState(null)

    useEffect(() => {
        if (!placeBetSuccessMessage) return
        const t = setTimeout(() => setPlaceBetSuccessMessage(null), 4000)
        return () => clearTimeout(t)
    }, [placeBetSuccessMessage])

    useEffect(() => {
        if (selectedBets.length > 0) setPlaceBetSuccessMessage(null)
    }, [selectedBets.length])

    const handlePlaceBet = async () => {
        if (!sessionStorage.getItem('token')) {
            window.dispatchEvent(new CustomEvent('openLoginModal', { detail: 'login' }))
            return
        }
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
            setPlaceBetSuccessMessage(successMsg || 'Bet placed successfully.')
            // Refetch open bets in background (count and list stay updated)
            AuthService.sportsbookOpenBets({ page: 1, limit: 20 })
                .then((res) => {
                    const data = res?.data ?? res
                    const list = data?.bets ?? (Array.isArray(data) ? data : [])
                    setOpenBetsList(list)
                })
                .catch(() => { })
        } catch (err) {
            const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.response?.data?.msg ?? err?.message
            if (msg) setPlaceBetError(msg)
            if (msg) alertErrorMessage(msg)
        } finally {
            setPlaceBetLoading(false)
        }
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

    const cashoutInProgressRef = useRef(false)
    const handleCashoutBetslip = async (betId) => {
        if (!betId) return
        if (isDemo) {
            alertErrorMessage('Demo mode: View only. Login to play.')
            return
        }
        if (cashoutInProgressRef.current) return
        cashoutInProgressRef.current = true
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
            cashoutInProgressRef.current = false
            setCashoutId(null)
        }
    }

    const getBetType = (b) => String(b.betType ?? b.bet_type ?? b.type ?? 'back').toLowerCase()
    const renderOpenBetsContent = () => {
        const list = openBetsList || []
        const backBets = list.filter((b) => getBetType(b) === 'back')
        const layBets = list.filter((b) => getBetType(b) === 'lay')
        const displayBack = backBets.length > 0 ? backBets : (list.length > 0 && layBets.length === 0 ? list : [])
        const displayLay = layBets
        const renderBetCard = (b, isBack) => {
            const bid = b._id ?? b.id
            const statusRaw = (b.status || 'open').toLowerCase()
            const apiEntry = cashoutValuesMap[bid]
            const rawVal = apiEntry?.value ?? b.cashout_value
            const cashoutVal = rawVal != null ? Number(rawVal) : null
            const stakeVal = Number(b.stake) || 0
            const netCashout = cashoutVal != null ? Math.max(0, cashoutVal - stakeVal * CASHOUT_COMMISSION) : null
            const suspended = apiEntry?.suspended === true || b.cashout_suspended === true || b.cashoutSuspended === true
            const isCashingOut = cashoutId === bid
            return (
                <div key={bid} className={`betslip_open_bet_card betslip_open_bet_${isBack ? 'back' : 'lay'}`}>
                    <div className='betslip_open_bet_row_main'>
                        <span className={`betslip_bet_type_badge ${isBack ? 'back' : 'lay'}`}>{isBack ? 'BACK' : 'LAY'}</span>
                        <div className='betslip_open_bet_info'>
                            <span className='betslip_open_bet_selection'>{b.selectionName || '—'}</span>
                            <span className='betslip_open_bet_market'>{b.marketName || b.marketType || '—'}</span>
                        </div>
                        <div className='betslip_open_bet_values'>
                            <span className='betslip_open_bet_odds'>{b.odds != null ? Number(b.odds) : '—'}</span>
                            <span className='betslip_open_bet_stake'>{(Number(b.stake || 0)).toFixed(2)}</span>
                        </div>
                    </div>
                    <div className='betslip_open_bet_row betslip_cashout_value_row'>
                        <span>Cash Out Value</span>
                        <span className='betslip_cashout_balance'>
                            {netCashout != null ? `₹${netCashout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </span>
                    </div>
                    <div className='betslip_open_bet_actions'>
                        {statusRaw !== 'open' ? (
                            <span className='betslip_open_bet_closed'>BET CLOSED</span>
                        ) : suspended ? (
                            <span className='betslip_cashout_suspended'>CASH OUT NOT AVAILABLE</span>
                        ) : (
                            <button type='button' className='betslip_cashout_btn' onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCashoutBetslip(bid); }} disabled={isCashingOut || isDemo}>
                                {isCashingOut ? 'CASHING OUT...' : isDemo ? 'Login to play' : (netCashout != null ? `CASH OUT ₹${netCashout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'CASH OUT')}
                            </button>
                        )}
                    </div>
                </div>
            )
        }
        return (
            <>
                {displayBack.length > 0 && (
                    <div className='betslip_open_bets_section'>
                        <h6 className='betslip_open_bets_section_title'>Back (Bet for)</h6>
                        <div className='betslip_open_bets_cols'>
                            <span>Odds</span>
                            <span>Stake</span>
                        </div>
                        <div className='betslip_open_bets_list'>
                            {displayBack.map((b) => renderBetCard(b, true))}
                        </div>
                    </div>
                )}
                {displayLay.length > 0 && (
                    <div className='betslip_open_bets_section'>
                        <h6 className='betslip_open_bets_section_title'>Lay (Bet against)</h6>
                        <div className='betslip_open_bets_cols'>
                            <span>Odds</span>
                            <span>Stake</span>
                        </div>
                        <div className='betslip_open_bets_list'>
                            {displayLay.map((b) => renderBetCard(b, false))}
                        </div>
                    </div>
                )}
            </>
        )
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

    const getMarketOddList = (market) => {
        if (Array.isArray(market?.runners) && market.runners.length) return market.runners
        return toOddDatasArray(market?.oddDatas)
    }

    // Soccer: MATCH ODDS ke niche fixed order – SS jaisa (FIRST HALF GOALS 0.5/1.5, HALF TIME, OVER/UNDER 0.5–3.5)
    const SOCCER_MARKETS_BELOW = [
        { title: 'FIRST HALF GOALS 0.5', minMax: 'MIN: 100 MAX: 15K', runnerLabels: ['Under 0.5 Goals', 'Over 0.5 Goals'] },
        { title: 'FIRST HALF GOALS 1.5', minMax: 'MIN: 100 MAX: 10K', runnerLabels: ['Under 1.5 Goals', 'Over 1.5 Goals'] },
        { title: 'HALF TIME', minMax: 'MIN: 100 MAX: 25K', runnerLabels: null },
        { title: 'OVER/UNDER 0.5 GOALS', minMax: 'MIN: 100 MAX: 50K', runnerLabels: ['Under 0.5 Goals', 'Over 0.5 Goals'] },
        { title: 'OVER/UNDER 1.5 GOALS', minMax: 'MIN: 100 MAX: 50K', runnerLabels: ['Under 1.5 Goals', 'Over 1.5 Goals'] },
        { title: 'OVER/UNDER 2.5 GOALS', minMax: 'MIN: 100 MAX: 25K', runnerLabels: ['Under 2.5 Goals', 'Over 2.5 Goals'] },
        { title: 'OVER/UNDER 3.5 GOALS', minMax: 'MIN: 100 MAX: 25K', runnerLabels: ['Under 3.5 Goals', 'Over 3.5 Goals'] },
    ]
    const normalizeMarketTitle = (t) => (t || '').toUpperCase().replace(/\s+/g, ' ').trim()
    const findSoccerMarketByTitle = (title, markets) => {
        if (!markets?.length) return null
        const n = normalizeMarketTitle(title)
        return markets.find((m) => {
            const name = normalizeMarketTitle(m.marketName || m.market || '')
            return name === n || name.includes(n) || n.includes(name)
        }) || null
    }

    const renderOddsSection = (sectionKey, title, icon, minMax, markets, marketTypeApi) => {
        if (!markets?.length) return null
        const market = markets[0]
        const marketTitle = market?.marketName || market?.market || market?.name || title
        const marketId = market.mid || market.marketId
        const oddList = getMarketOddList(market)
        if (!oddList.length) return null
        const isOpen = market.status !== 'CLOSED'
        const sectionCashoutTotal = (openBetsList || [])
            .filter((b) => b.gameId === gameId || b.game_id === gameId)
            .reduce((sum, b) => {
                const bid = b._id ?? b.id
                const cvRaw = cashoutValuesMap[bid]?.value ?? b.cashout_value
                const cv = Number(cvRaw) || 0
                const stakeVal = Number(b.stake) || 0
                const net = Math.max(0, cv - stakeVal * CASHOUT_COMMISSION)
                return sum + net
            }, 0)
        const gameBets = (openBetsList || []).filter((b) => (b.gameId === gameId || b.game_id === gameId) && (b.status || 'open').toLowerCase() === 'open')
        const hasOneBet = gameBets.length === 1
        const hasMultipleBets = gameBets.length > 1
        const handleCashoutClick = (e) => {
            e.stopPropagation()
            e.preventDefault()
            setOpenLossCutSection(null)
            if (gameBets.length === 0) return
            if (hasOneBet) {
                const bid = gameBets[0]._id ?? gameBets[0].id
                if (bid) handleCashoutBetslip(bid)
                return
            }
            if (hasMultipleBets) setOpenCashoutSection((prev) => (prev === sectionKey ? null : sectionKey))
        }
        // Mobile betslip should appear only in the block whose marketType matches the selected bet (cricket + soccer + tennis)
        const currentMarketType = selectedBets[0]?.placePayload?.marketType
        const isMatchOddsSection = sectionKey === 'match_odds' || sectionKey.startsWith('match_odds_') || sectionKey.startsWith('soccer_below_') || sectionKey.startsWith('tennis_extra_')
        const isSlipForMatchOdds = isMatchOddsSection && currentMarketType === 'match_odds'
        const isSlipForMiniBookmaker = sectionKey === 'mini_bookmaker' && currentMarketType === 'fancy'
        const showMobileSlipHere = isMobileBetslipOpen && selectedBets.length > 0 && (isSlipForMatchOdds || isSlipForMiniBookmaker)

        return (
            <div key={sectionKey} className="odds_section_block">
                <div className="odds_section_header">
                    <span className="odds_section_title"><i className={icon} aria-hidden /> {marketTitle}</span>
                    <div className="odds_section_header_right d-flex align-items-center gap-2 flex-wrap">

                        <span className="odds_section_limits">{minMax}</span>

                        {gameBets.length > 0 && (() => {
                            const totalStake = gameBets.reduce((s, b) => s + (Number(b.stake) || 0), 0)
                            const types = [...new Set(gameBets.map((b) => ((b.betType || b.bet_type || 'back').toLowerCase())))]
                            const typeLabel = types.length === 1 ? (types[0] === 'lay' ? 'Lay' : 'Back') : 'Back + Lay'
                            return <span className="odds_section_bet_info">₹{totalStake.toLocaleString()} {typeLabel}</span>
                        })()}

                        <div className='d-flex gap-2'>
                            <div className="odds_section_cashout_wrap">
                                <button
                                    type="button"
                                    className="odds_section_cashout_btn"
                                    onClick={handleCashoutClick}
                                    disabled={isDemo}
                                    title={isDemo ? 'Demo mode: View only' : undefined}
                                >
                                    {isDemo ? 'Cashout (Login to play)' : `Cashout : ₹${sectionCashoutTotal.toLocaleString()}`}
                                </button>
                                {openCashoutSection === sectionKey && hasMultipleBets && (
                                    <div className="odds_section_cashout_inline">
                                        {openBetsLoading ? (
                                            <p className="odds_section_popover_loading">Loading...</p>
                                        ) : (
                                            <div className="odds_section_popover_list">
                                                {gameBets.map((b) => {
                                                    const bid = b._id ?? b.id
                                                    const apiEntry = cashoutValuesMap[bid]
                                                    const rawVal = apiEntry?.value ?? b.cashout_value
                                                    const cashoutVal = rawVal != null ? Number(rawVal) : null
                                                    const stakeVal = Number(b.stake) || 0
                                                    const netCashout = cashoutVal != null ? Math.max(0, cashoutVal - stakeVal * CASHOUT_COMMISSION) : null
                                                    const suspended = apiEntry?.suspended === true || b.cashout_suspended === true || b.cashoutSuspended === true
                                                    const isCashingOut = cashoutId === bid
                                                    return (
                                                        <div key={bid} className="odds_section_popover_item">
                                                            <div className="odds_section_popover_item_info">
                                                                <span className="odds_section_popover_item_selection">{b.selectionName || b.marketName || '—'}</span>
                                                                {netCashout != null && <span className="odds_section_popover_item_val">₹{netCashout.toLocaleString()}</span>}
                                                            </div>
                                                            {suspended ? (
                                                                <span className="odds_section_popover_suspended">Not available</span>
                                                            ) : (
                                                                <button type="button" className="odds_section_popover_cashout_btn" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCashoutBetslip(bid); }} disabled={isCashingOut || isDemo}>
                                                                    {isCashingOut ? '...' : isDemo ? 'Login to play' : (netCashout != null && netCashout > 0 ? `Cashout ₹${netCashout.toLocaleString()}` : 'Cashout')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="odds_section_loss_cut_wrap" style={{ position: 'relative' }}>
                                <button type="button" className="odds_section_loss_cut_btn" onClick={(e) => { e.stopPropagation(); setOpenCashoutSection(null); setOpenLossCutSection((prev) => (prev === sectionKey ? null : sectionKey)); }}>
                                    Loss Cut
                                </button>
                                {openLossCutSection === sectionKey && (
                                    <div className="odds_section_popover odds_section_loss_cut_popover">
                                        <LossCutIndicator currentLoss={betslipCurrentLoss ?? betslipExposure ?? 0} lossLimit={betslipLossLimit} compact onSetLimit={handleSetLossLimit} />
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
                <div className="odds_section_table_wrap">
                    <table className="odds_section_table">
                        <thead>
                            <tr>
                                <th>Market</th>
                                <th className="odds_section_indicator_th" aria-label="Spread / Value" />
                                <th colSpan={3}>Back</th>
                                <th colSpan={3}>Lay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {oddList.map((odd, oIdx) => {
                                const name = odd.rname ?? odd.selectionName ?? odd.name ?? ''
                                const selId = odd.selectionId ?? odd.sid
                                const backCellsRaw = [
                                    { odds: odd.b1, size: odd.bs1 },
                                    { odds: odd.b2, size: odd.bs2 },
                                    { odds: odd.b3, size: odd.bs3 },
                                ]
                                const layCellsRaw = [
                                    { odds: odd.l1, size: odd.ls1 },
                                    { odds: odd.l2, size: odd.ls2 },
                                    { odds: odd.l3, size: odd.ls3 },
                                ]
                                const sortByOddsAsc = (a, b) => {
                                    const na = parseFloat(a.odds)
                                    const nb = parseFloat(b.odds)
                                    if (Number.isNaN(na) && Number.isNaN(nb)) return 0
                                    if (Number.isNaN(na)) return 1
                                    if (Number.isNaN(nb)) return -1
                                    return na - nb
                                }
                                const backCells = [...backCellsRaw].sort(sortByOddsAsc)
                                const layCells = [...layCellsRaw].sort(sortByOddsAsc)
                                const isMatchOdds = sectionKey === 'match_odds' && oddList.length >= 2
                                const matchOddsBet = isMatchOdds ? selectedBets.find((b) => b.market === market.market) : null
                                const stakeNum = Number(stake) || 0
                                const oddsVal = matchOddsBet ? (Number(matchOddsBet.oddsDisplay ?? matchOddsBet.odds) || 0) : 0
                                const betType = matchOddsBet?.placePayload?.betType ?? matchOddsBet?.betType ?? 'back'
                                const isBack = String(betType).toLowerCase() === 'back'
                                const selectedTeam = matchOddsBet ? (matchOddsBet.betName ?? matchOddsBet.placePayload?.selectionName ?? '') : ''
                                const isThisRowSelectedTeam = name === selectedTeam
                                const profitAmount = (stakeNum > 0 && oddsVal >= 1) ? (isBack ? stakeNum * (oddsVal - 1) : stakeNum) : null
                                const lossAmount = (stakeNum > 0 && oddsVal >= 1) ? (isBack ? stakeNum : stakeNum * (oddsVal - 1)) : null
                                const showProfitOnThisRow = isMatchOdds && matchOddsBet && (isThisRowSelectedTeam ? isBack : !isBack)
                                const showLossOnThisRow = isMatchOdds && matchOddsBet && (isThisRowSelectedTeam ? !isBack : isBack)

                                const totalCols = 2 + backCells.length + layCells.length
                                const isMiniBookRowSelected =
                                    showMobileSlipHere &&
                                    sectionKey === 'mini_bookmaker' &&
                                    selectedBets[0]?.betName === name &&
                                    selectedBets[0]?.market === market.market

                                return (
                                    <React.Fragment key={odd.sid ?? odd.selectionId ?? oIdx}>
                                        <tr>
                                            <td className="odds_section_market_name">{name}</td>
                                            <td className="odds_section_indicator_cell">
                                                {isMatchOdds && matchOddsBet && stakeNum > 0 && (
                                                    <>
                                                        {showProfitOnThisRow && profitAmount != null && (
                                                            <span className="odds_section_pl_box odds_section_pl_box_positive" title="Jit gaya to itna profit">
                                                                +{profitAmount.toFixed(2)}
                                                            </span>
                                                        )}
                                                        {showLossOnThisRow && lossAmount != null && (
                                                            <span className="odds_section_pl_box odds_section_pl_box_negative" title="Harega to itna loss">
                                                                -{lossAmount.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                            {backCells.map((cell, cIdx) => {
                                                const locked = isOddsLocked(cell.odds)
                                                const oddsStr = String(cell.odds ?? '')
                                                const placePayload = !locked && isOpen && gameId && eventNameFromState && marketId && (selId != null) ? { sport: sportName, gameId, eventName: eventNameFromState, marketType: marketTypeApi, marketId: String(marketId), selectionId: String(selId), selectionName: name, betType: 'back', odds: parseFloat(oddsStr) || 0 } : null
                                                const elId = `odds-${sectionKey}-${oIdx}-back-${cIdx}`
                                                return (
                                                    <BackPriceCell
                                                        key={cIdx}
                                                        odds={cell.odds}
                                                        size={cell.size}
                                                        locked={locked}
                                                        disabled={false}
                                                        selected={isBetSelected(name, market.market, oddsStr, elId)}
                                                        onClick={() => handleBetClick(name, market.market, oddsStr, elId, placePayload)}
                                                        formatSize={formatOddsSize}
                                                    />
                                                )
                                            })}
                                            {layCells.map((cell, cIdx) => {
                                                const locked = isOddsLocked(cell.odds)
                                                const oddsStr = String(cell.odds ?? '')
                                                const placePayloadLay = !locked && isOpen && gameId && eventNameFromState && marketId && (selId != null) ? { sport: sportName, gameId, eventName: eventNameFromState, marketType: marketTypeApi, marketId: String(marketId), selectionId: String(selId), selectionName: name, betType: 'lay', odds: parseFloat(oddsStr) || 0 } : null
                                                const elId = `odds-${sectionKey}-${oIdx}-lay-${cIdx}`
                                                return (
                                                    <LayPriceCell
                                                        key={cIdx}
                                                        odds={cell.odds}
                                                        size={cell.size}
                                                        locked={locked}
                                                        disabled={false}
                                                        selected={isBetSelected(name, market.market, oddsStr, elId)}
                                                        onClick={() => handleBetClick(name, market.market, oddsStr, elId, placePayloadLay)}
                                                        formatSize={formatOddsSize}
                                                    />
                                                )
                                            })}
                                        </tr>

                                        {isMiniBookRowSelected && (
                                            <tr className="cricketbet_mobile_row">
                                                <td colSpan={totalCols}>
                                                    {showMobileSlipHere && (
                                                        <div className="cricketbet_mobile">
                                                            <div className="betslip_panel">
                                                                <div className="betslip_content">
                                                                    <div className='d-flex value_amount gap-2'>
                                                                        <div className="betslip_odd_section">
                                                                            <label className="betslip_label">Odd Value</label>
                                                                            <div className="betslip_odd_stepper">
                                                                                <button
                                                                                    type="button"
                                                                                    className="betslip_odd_btn"
                                                                                    onClick={() => {
                                                                                        const curr = Number(slipOdds ?? selectedBets[0]?.oddsDisplay ?? selectedBets[0]?.odds) || 0
                                                                                        if (curr > 1.01) setSlipOdds(Number((curr - 0.01).toFixed(2)))
                                                                                    }}
                                                                                >−</button>
                                                                                <input
                                                                                    className="betslip_odd_input"
                                                                                    type="text"
                                                                                    value={selectedBets.length > 0 ? (Number(slipOdds ?? selectedBets[0]?.oddsDisplay ?? selectedBets[0]?.odds) || 0).toFixed(2) : '0.00'}
                                                                                    readOnly
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    className="betslip_odd_btn"
                                                                                    onClick={() => {
                                                                                        const base = Number(slipOdds ?? selectedBets[0]?.oddsDisplay ?? selectedBets[0]?.odds) || 0
                                                                                        const next = base + 0.01
                                                                                        setSlipOdds(Number(next.toFixed(2)))
                                                                                    }}
                                                                                >+</button>
                                                                            </div>
                                                                        </div>

                                                                        <div className="betslip_amount_section">
                                                                            <label className="betslip_label">Amount</label>
                                                                            <input
                                                                                className="betslip_amount_input"
                                                                                type="number"
                                                                                placeholder="0"
                                                                                min="100"
                                                                                max="10000"
                                                                                value={stake}
                                                                                onChange={(e) => {
                                                                                    const v = e.target.value
                                                                                    if (v === '' || v === '-') { setStake(''); return }
                                                                                    const n = parseFloat(v)
                                                                                    if (!Number.isNaN(n)) setStake(n)
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="betslip_quick_stakes">
                                                                        {[100, 200, 500, 1000, 2000, 5000, 10000, 25000].map((amt) => (
                                                                            <button
                                                                                key={amt}
                                                                                type="button"
                                                                                className="betslip_quick_btn"
                                                                                onClick={() => setStake(prev => Math.min(10000, (Number(prev) || 0) + amt))}
                                                                            >
                                                                                +{amt >= 1000 ? (amt / 1000).toFixed(0) + ',' + (amt % 1000 ? String(amt).slice(-3) : '000') : amt}
                                                                            </button>
                                                                        ))}
                                                                    </div>

                                                                    <div className="betslip_actions">
                                                                        <button type="button" className="betslip_act_min" onClick={() => setStake(100)}>MIN STAKE</button>
                                                                        <button type="button" className="betslip_act_max" onClick={() => setStake(10000)}>MAX STAKE</button>
                                                                        <button
                                                                            type="button"
                                                                            className="betslip_act_edit"
                                                                            onClick={() => document.querySelector('.cricketbet_mobile .betslip_amount_input')?.focus()}
                                                                        >
                                                                            EDIT STAKE
                                                                        </button>
                                                                        <button type="button" className="betslip_act_clear" onClick={clearAllBets}>CLEAR</button>
                                                                    </div>

                                                                    <div className="betslip_summary_new">
                                                                        <div className="betslip_summary_line">
                                                                            <span>Your profit/loss as per placed bet</span>
                                                                            <span className="betslip_summary_val betslip_summary_profit">
                                                                                {calculateProfitLoss()} ₹
                                                                            </span>
                                                                        </div>

                                                                        <div className="betslip_summary_line">
                                                                            <span>Total Amount (in ₹)</span>
                                                                            <span className="betslip_summary_val">
                                                                                {stake === '' ? '0.00' : (Number(stake) || 0).toFixed(2)} ₹
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {placeBetError && <p className='betslip_error'>{placeBetError}</p>}
                                                                    <button
                                                                        className="betslip_place_bet_btn"
                                                                        onClick={handlePlaceBet}
                                                                        disabled={placeBetLoading || lossLimitReached || isDemo}
                                                                    >
                                                                        {placeBetLoading ? 'Placing...' : lossLimitReached ? 'Betting disabled' : isDemo ? 'Login to play' : 'Place Bet'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>


                {showMobileSlipHere && isMatchOddsSection && (
                    <div className="cricketbet_mobile">
                        <div className="betslip_panel">
                            <div className="betslip_content">
                                <div className='d-flex value_amount gap-2'>
                                    <div className="betslip_odd_section">
                                        <label className="betslip_label">Odd Value</label>
                                        <div className="betslip_odd_stepper">
                                            <button
                                                type="button"
                                                className="betslip_odd_btn"
                                                onClick={() => {
                                                    const curr = Number(slipOdds ?? selectedBets[0]?.oddsDisplay ?? selectedBets[0]?.odds) || 0
                                                    if (curr > 1.01) setSlipOdds(Number((curr - 0.01).toFixed(2)))
                                                }}
                                            >−</button>
                                            <input
                                                className="betslip_odd_input"
                                                type="text"
                                                value={selectedBets.length > 0 ? (Number(slipOdds ?? selectedBets[0]?.oddsDisplay ?? selectedBets[0]?.odds) || 0).toFixed(2) : '0.00'}
                                                readOnly
                                            />
                                            <button
                                                type="button"
                                                className="betslip_odd_btn"
                                                onClick={() => {
                                                    const base = Number(slipOdds ?? selectedBets[0]?.oddsDisplay ?? selectedBets[0]?.odds) || 0
                                                    const next = base + 0.01
                                                    setSlipOdds(Number(next.toFixed(2)))
                                                }}
                                            >+</button>
                                        </div>
                                    </div>

                                    <div className="betslip_amount_section">
                                        <label className="betslip_label">Amount</label>
                                        <input
                                            className="betslip_amount_input"
                                            type="number"
                                            placeholder="0"
                                            min="100"
                                            max="10000"
                                            value={stake}
                                            onChange={(e) => {
                                                const v = e.target.value
                                                if (v === '' || v === '-') { setStake(''); return }
                                                const n = parseFloat(v)
                                                if (!Number.isNaN(n)) setStake(n)
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="betslip_quick_stakes">
                                    {[100, 200, 500, 1000, 2000, 5000, 10000, 25000].map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            className="betslip_quick_btn"
                                            onClick={() => setStake(prev => Math.min(10000, (Number(prev) || 0) + amt))}
                                        >
                                            +{amt >= 1000 ? (amt / 1000).toFixed(0) + ',' + (amt % 1000 ? String(amt).slice(-3) : '000') : amt}
                                        </button>
                                    ))}
                                </div>

                                <div className="betslip_actions">
                                    <button type="button" className="betslip_act_min" onClick={() => setStake(100)}>MIN STAKE</button>
                                    <button type="button" className="betslip_act_max" onClick={() => setStake(10000)}>MAX STAKE</button>
                                    <button
                                        type="button"
                                        className="betslip_act_edit"
                                        onClick={() => document.querySelector('.cricketbet_mobile .betslip_amount_input')?.focus()}
                                    >
                                        EDIT STAKE
                                    </button>
                                    <button type="button" className="betslip_act_clear" onClick={clearAllBets}>CLEAR</button>
                                </div>

                                <div className="betslip_summary_new">
                                    <div className="betslip_summary_line">
                                        <span>Your profit/loss as per placed bet</span>
                                        <span className="betslip_summary_val betslip_summary_profit">
                                            {calculateProfitLoss()} ₹
                                        </span>
                                    </div>

                                    <div className="betslip_summary_line">
                                        <span>Total Amount (in ₹)</span>
                                        <span className="betslip_summary_val">
                                            {stake === '' ? '0.00' : (Number(stake) || 0).toFixed(2)} ₹
                                        </span>
                                    </div>
                                </div>

                                {placeBetError && <p className='betslip_error'>{placeBetError}</p>}
                                <button
                                    className="betslip_place_bet_btn"
                                    onClick={handlePlaceBet}
                                    disabled={placeBetLoading || lossLimitReached || isDemo}
                                >
                                    {placeBetLoading ? 'Placing...' : lossLimitReached ? 'Betting disabled' : isDemo ? 'Login to play' : 'Place Bet'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}


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

    // Lock only when odds truly unavailable: null, undefined, 0, or invalid. Never treat 0 as valid odds.
    const isOddsLocked = (val) => {
        if (val == null || val === '') return true
        const n = parseFloat(String(val).trim())
        return Number.isNaN(n) || n <= 0
    }

    // Neeche: SESSIONS / W/P MARKET / EXTRA MARKET – API se (fancyOdds / otherMarketOdds). Static data nahi.
    const buildNoYesRowsFromMarkets = (markets, marketType = 'fancy') => {
        if (!markets?.length) return []
        const rows = []
        markets.forEach((m) => {
            const oddList = toOddDatasArray(m.oddDatas)
            const marketId = m.mid || m.marketId
            const marketName = m.marketName || m.market || m.name || 'Market'
            if (oddList.length >= 2) {
                const noSel = oddList[0]
                const yesSel = oddList[1]
                const noOdds = noSel?.l1 ?? noSel?.b1
                const yesOdds = yesSel?.b1 ?? yesSel?.l1
                const noSize = noSel?.ls1 ?? noSel?.bs1
                const yesSize = yesSel?.bs1 ?? yesSel?.ls1
                rows.push({
                    label: marketName,
                    noOdds: noOdds ?? '—',
                    noSize: noSize ?? '—',
                    yesOdds: yesOdds ?? '—',
                    yesSize: yesSize ?? '—',
                    max: '100K',
                    marketId,
                    marketName,
                    marketType,
                    noSid: noSel?.sid,
                    yesSid: yesSel?.sid,
                })
            } else if (oddList.length === 1) {
                const o = oddList[0]
                rows.push({
                    label: o.rname ?? o.selectionName ?? marketName,
                    noOdds: o.l1 ?? '—',
                    noSize: o.ls1 ?? '—',
                    yesOdds: o.b1 ?? '—',
                    yesSize: o.bs1 ?? '—',
                    max: '100K',
                    marketId,
                    marketName,
                    marketType,
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
            const marketId = m.mid || m.marketId
            const marketName = m.marketName || m.market || m.name || 'Market'
            const oddList = toOddDatasArray(m.oddDatas)
            const rows = oddList.map((o) => ({
                label: o.rname ?? o.selectionName ?? '—',
                backOdds: o.b1 ?? '—',
                backSize: o.bs1 ?? '—',
                selectionId: o.sid ?? o.selectionId,
            }))
            const allLocked = rows.every((r) => isOddsLocked(r.backOdds))
            return {
                key: marketId || marketName,
                marketId,
                title: marketName,
                marketType: 'fancy',
                minMax: 'MIN:100 MAX:50K',
                rows,
                isLocked: allLocked,
            }
        })
    }

    const sessionsRows = buildNoYesRowsFromMarkets(oddsData?.fancyOdds, 'fancy')
    const wpMarketRows = buildNoYesRowsFromMarkets(oddsData?.otherMarketOdds, 'fancy')
    const extraMarketRows = buildNoYesRowsFromMarkets(extraNoYesMarkets, 'fancy')
    const oddEvenRows = buildNoYesRowsFromMarkets(oddsData?.oddEvenOdds, 'fancy')
    const backOnlyBlocks = buildBackOnlyBlocksFromMarkets(backOnlyMarkets)

    const renderNoYesSection = (sectionKey, _title, rows) => {
        if (!rows?.length) return null
        return (
            <div key={sectionKey} className="market_no_yes_block">
                <div className="market_no_yes_body">
                    {rows.map((row, rIdx) => {
                        const noLocked = isOddsLocked(row.noOdds)
                        const yesLocked = isOddsLocked(row.yesOdds)
                        const yesOddsStr = String(row.yesOdds ?? '')
                        const noOddsStr = String(row.noOdds ?? '')
                        const yesElementId = `${sectionKey}-${row.marketId || rIdx}-yes`
                        const noElementId = `${sectionKey}-${row.marketId || rIdx}-no`
                        const canPlaceYes = !yesLocked && gameId && eventNameFromState && row.marketId && row.yesSid != null
                        const canPlaceNo = !noLocked && gameId && eventNameFromState && row.marketId && row.noSid != null
                        const yesPayload = canPlaceYes ? {
                            sport: sportName,
                            gameId,
                            eventName: eventNameFromState,
                            marketType: row.marketType || 'fancy',
                            marketId: String(row.marketId),
                            selectionId: String(row.yesSid),
                            selectionName: row.label,
                            betType: 'back',
                            odds: parseFloat(yesOddsStr) || 0,
                        } : null
                        const noPayload = canPlaceNo ? {
                            sport: sportName,
                            gameId,
                            eventName: eventNameFromState,
                            marketType: row.marketType || 'fancy',
                            marketId: String(row.marketId),
                            selectionId: String(row.noSid),
                            selectionName: row.label,
                            betType: 'lay',
                            odds: parseFloat(noOddsStr) || 0,
                        } : null
                        return (
                            <div key={rIdx} className="market_no_yes_row">
                                <div className="market_no_yes_label">{row.label}</div>
                              
                                <div className="market_no_yes_limits_container d-flex justify-content-between">
                                    <div className="market_no_yes_limits">MIN: 100 MAX: {row.max}</div>
                                    <div className="market_no_yes_odds_container">
                                    <button type="button" className="market_no_yes_book_btn" title="Book">Book</button>
                                        <div className="market_no_yes_odds">
                                            <span className="market_no_yes_lbl">Yes</span>
                                            <button
                                                type="button"
                                                className={`market_no_yes_btn market_yes_btn ${yesLocked ? 'locked' : ''} ${isBetSelected(row.label, row.marketName, yesOddsStr, yesElementId) ? 'selected' : ''}`}
                                                disabled={yesLocked}
                                                onClick={() => !yesLocked && handleBetClick(row.label, row.marketName, yesOddsStr, yesElementId, yesPayload)}
                                            >
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
                                        <div className="market_no_yes_odds">
                                            <span className="market_no_yes_lbl">No</span>
                                            <button
                                                type="button"
                                                className={`market_no_yes_btn market_no_btn ${noLocked ? 'locked' : ''} ${isBetSelected(row.label, row.marketName, noOddsStr, noElementId) ? 'selected' : ''}`}
                                                disabled={noLocked}
                                                onClick={() => !noLocked && handleBetClick(row.label, row.marketName, noOddsStr, noElementId, noPayload)}
                                            >
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

                                    </div>
                                </div>

                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderBackOnlySection = (block) => {
        const { key, title, minMax, rows, isLocked, marketId, marketType } = block
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
                        const backOddsStr = String(row.backOdds ?? '')
                        const backElementId = `backonly-${key}-${rIdx}-back`
                        const canPlaceBack = !backLocked && gameId && eventNameFromState && marketId && row.selectionId != null
                        const backPayload = canPlaceBack ? {
                            sport: sportName,
                            gameId,
                            eventName: eventNameFromState,
                            marketType: marketType || 'fancy',
                            marketId: String(marketId),
                            selectionId: String(row.selectionId),
                            selectionName: row.label,
                            betType: 'back',
                            odds: parseFloat(backOddsStr) || 0,
                        } : null
                        return (
                            <div key={rIdx} className="market_back_only_row">
                                <span className="market_back_only_label">{row.label}</span>
                                <div className="market_back_only_cell">
                                    {backLocked ? (
                                        <span className="market_no_yes_locked"><i className="ri-lock-line" aria-hidden /></span>
                                    ) : (
                                        <button
                                            type="button"
                                            className={`market_no_yes_btn market_yes_btn ${isBetSelected(row.label, title, backOddsStr, backElementId) ? 'selected' : ''}`}
                                            onClick={() => handleBetClick(row.label, title, backOddsStr, backElementId, backPayload)}
                                        >
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

    useEffect(() => {
        if (platformConfig.sportsBookServiceStatus === false || platformConfig.inPlayServiceStatus === false) {
            alertErrorMessage('Sports / In-Play is temporarily unavailable. Please try again later.')
        }
    }, [platformConfig.sportsBookServiceStatus, platformConfig.inPlayServiceStatus])

    // Refresh open bets when popup opens or Open Bets tab – use same parsing as mount; on error don’t clear list so existing data stays
    useEffect(() => {
        if (!shouldFetchOpenBets) return
        setOpenBetsLoading(true)
        AuthService.sportsbookOpenBets({ page: 1, limit: 20 })
            .then((res) => {
                const data = res?.data ?? res
                const list = data?.bets ?? (Array.isArray(data) ? data : []) ?? []
                setOpenBetsList(Array.isArray(list) ? list : [])
            })
            .catch(() => { /* keep previous openBetsList so "No open bets" doesn’t replace real data */ })
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
                <div className='container-fluid'>
                    {(!platformConfig.sportsBookServiceStatus || !platformConfig.inPlayServiceStatus) && (
                        <div className="platform_service_banner platform_service_banner_disabled" role="alert">
                            Sports / In-Play is temporarily unavailable. Please try again later.
                        </div>
                    )}
                    {(platformConfig.sportsBookServiceStatus && platformConfig.inPlayServiceStatus) && (
                        <>
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

                                    {/* Live streaming – commented out
                            {(sportName === 'soccer' || sportName === 'tennis' || sportName === 'cricket') && (
                                <div className='match_tv_iframe_wrap'>
                                    <div className='match_tv_iframe_header'>Live TV</div>
                                    {streamUrl ? (
                                        <iframe
                                            title='Live TV'
                                            src={streamUrl}
                                            className='match_tv_iframe'
                                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div className='match_tv_no_stream'>
                                            No stream available
                                        </div>
                                    )}
                                </div>
                            )}
                            */}

                                    <div className='series_name_row'>
                                        <p>{seriesOrTournamentName || '—'}</p>
                                    </div>
                                    {/* <div className='cricket_info_inner'>
                                <div className='cricket_vector_icon'>
                                    <img src="images/t20_vector.svg" alt="cricket" width="48" height="48" decoding="async" fetchPriority="high" />
                                </div>


                                <div className='cricket_detail_title_row'>
                                    <h2>{eventNameFromState || 'Premier League, Women'}</h2>




                                    {(() => {
                                        const hasLiveScore = liveScore && !liveScore.error && liveScore.ScoreData?.Score?.[0]
                                        const s = hasLiveScore ? liveScore.ScoreData.Score[0] : null
                                        const rawBalls = s ? [s.CurrentOverBalls1, s.CurrentOverBalls2, s.CurrentOverBalls3, s.CurrentOverBalls4, s.CurrentOverBalls5, s.CurrentOverBalls6].filter(Boolean) : []
                                        const isPlaceholder = rawBalls.length === 1 && /^\d{5,6}$/.test(String(rawBalls[0]).trim())
                                        const hasRealBallData = rawBalls.length > 0 && !isPlaceholder
                                        return (location.state?.inPlay ?? defaultMatch?.inPlay) && hasRealBallData ? (
                                            <span className='cricket_ball_running_badge'>
                                                <span className='cricket_ball_running_dot' />
                                                Ball Running
                                            </span>
                                        ) : null
                                    })()}
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
                                            const hasLiveScore = liveScore && !liveScore.error && liveScore.ScoreData?.Score?.[0]
                                            const s = hasLiveScore ? liveScore.ScoreData.Score[0] : null
                                            const eventName = eventNameFromState || 'Premier League, Women'
                                            const parts = (eventName || '').split(/\s+v\s+/i)
                                            const teamA = s?.Team1Name ?? (parts.length >= 2 ? parts[0].trim() : eventName)
                                            const teamB = s?.Team2Name ?? (parts.length >= 2 ? parts[1].trim() : '')
                                            if (liveScore?.error === true || (liveScore !== null && !hasLiveScore)) {
                                                return (
                                                    <div className='cricket_live_unavailable' style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary, #888)' }}>
                                                        Live score unavailable
                                                    </div>
                                                )
                                            }
                                            if (!hasLiveScore) {
                                                return (
                                                    <>
                                                        <div className='cricket_live_top_panel'>
                                                            <div className='cricket_live_team_left'>
                                                                <div className='cricket_live_team_name'>{teamA}</div>
                                                                <div className='cricket_live_score_row'>
                                                                    <span className='cricket_live_score_box'>—</span>
                                                                    <span className='cricket_live_crr'>CRR: —</span>
                                                                </div>
                                                            </div>
                                                            <div className='cricket_live_center'><span className='cricket_live_toss'>—</span></div>
                                                            <div className='cricket_live_team_right'>
                                                                <div className='cricket_live_team_name'>{teamB}</div>
                                                                <div className='cricket_live_score_row'>
                                                                    <span className='cricket_live_rrr'>RRR: —</span>
                                                                    <span className='cricket_live_score_box'>—</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className='cricket_live_unavailable' style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary, #888)', fontSize: '13px' }}>Live score will appear when available</div>
                                                    </>
                                                )
                                            }
                                            const crr = s.CRR ?? '—'
                                            const rrr = s.RRR ?? '—'
                                            const rawBalls = [s.CurrentOverBalls1, s.CurrentOverBalls2, s.CurrentOverBalls3, s.CurrentOverBalls4, s.CurrentOverBalls5, s.CurrentOverBalls6].filter(Boolean)
                                            const isPlaceholder = rawBalls.length === 1 && /^\d{5,6}$/.test(String(rawBalls[0]).trim())
                                            const overBalls = isPlaceholder ? [] : rawBalls
                                            const overStr = overBalls.length > 0 ? overBalls.join(' ') : '—'
                                            const team1Flag = s.Team1Flag || s.team1Flag
                                            const team2Flag = s.Team2Flag || s.team2Flag
                                            const statusText = [s.ScoreStatus, s.LiveCommentary, s.Message].filter(Boolean).join(' · ') || '—'
                                            return (
                                                <>
                                                    <div className='cricket_live_center'>
                                                        <span className='cricket_live_toss'>{statusText}</span>
                                                    </div>
                                                    <div className='cricket_live_top_panel'>
                                                        <div className='cricket_live_team_left'>
                                                            <div className='cricket_live_team_name'>
                                                                {team1Flag ? <img src={team1Flag} alt="" className="cricket_live_team_flag" /> : null}
                                                                {teamA}
                                                            </div>
                                                            <div className='cricket_live_score_row'>
                                                                <span className='cricket_live_score_box'>{s.Team1OnlyScore || s.Team1Score || '—'}</span>
                                                                <span className='cricket_live_crr'>CRR: {crr}</span>
                                                            </div>
                                                            <div className='cricket_live_over_box desktop_view'>{overStr}</div>
                                                        </div>

                                                        <div className='cricket_live_team_right'>
                                                            <div className='cricket_live_team_name'>
                                                                {team2Flag ? <img src={team2Flag} alt="" className="cricket_live_team_flag" /> : null}
                                                                {teamB}
                                                            </div>
                                                            <div className='cricket_live_score_row'>
                                                                <span className='cricket_live_rrr'>RRR: {rrr}</span>
                                                                <span className='cricket_live_score_box'>{s.Team2OnlyScore || s.Team2Score || '—'}</span>
                                                            </div>
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
                                                                        {s.Player1 || '—'}
                                                                    </td>
                                                                    <td className='cricket_live_td_num'>{s.Player1Run ?? '—'}</td>
                                                                    <td className='cricket_live_td_num'>{s.Player1Balls ?? '—'}</td>
                                                                    <td className='cricket_live_td_num'>{s.Player1Fours ?? '—'}</td>
                                                                    <td className='cricket_live_td_num'>{s.Player1Sixes ?? '—'}</td>
                                                                    <td className='cricket_live_td_num'>{s.Player1StrikeRate ?? '—'}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className='cricket_live_td_name'>
                                                                        <i className='ri-cricket-line cricket_live_bat_icon' aria-hidden />
                                                                        {s.Player2 || '—'}
                                                                    </td>
                                                                    <td className='cricket_live_td_num'>{s.Player2Run ?? '—'}</td>
                                                                    <td className='cricket_live_td_num'>{s.Player2Balls ?? '—'}</td>
                                                                    <td className='cricket_live_td_num'>{s.Player2Fours ?? '—'}</td>
                                                                    <td className='cricket_live_td_num'>{s.Player2Sixes ?? '—'}</td>
                                                                    <td className='cricket_live_td_num'>{s.Player2StrikeRate ?? '—'}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <div className='cricket_live_over_box mobile_view'>{overStr}</div>

                                                    {/* <div className='cricket_live_bowler_section'>
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
                                                    {s.Bowler && s.Bowler !== '-' ? s.Bowler : '—'}
                                                </td>
                                                <td className='cricket_live_td_num'>—</td>
                                                <td className='cricket_live_td_num'>—</td>
                                                <td className='cricket_live_td_num'>—</td>
                                                <td className='cricket_live_td_num'>—</td>
                                                <td className='cricket_live_td_num'>—</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div> */}
                                                </>
                                            )
                                        })()}
                                    </div>

                                </div>

                                <div className={`cricket_summary_details_wrapper ${sportName === 'soccer' ? 'soccer_odds_page' : ''}`} ref={marketsSectionRef}>
                                    {showMarketsSection ? (
                                        <>
                                            <div className='top_tabs_cricket top_tabs_markets'>
                                                <ul>
                                                    <li className={activeTab === 'all' ? 'active' : ''}>
                                                        <button onClick={() => setActiveTab('all')}>ALL</button>
                                                    </li>
                                                    {sportName === 'cricket' && (
                                                        <>
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
                                                        </>
                                                    )}
                                                    <li className={`open_bets_tab ${activeTab === 'open-bets' ? 'active' : ''}`}>
                                                        <button onClick={() => setActiveTab('open-bets')}>(OPEN BETS) ({openBetsCount})</button>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className='match_summary_content_tabs'>
                                                {activeTab === 'all' && (
                                                    <>
                                                        {oddsLoading && gameId && (
                                                            <div className='match_block' style={{ padding: '1rem', color: 'var(--text-secondary, #888)' }}>Loading odds...</div>
                                                        )}
                                                        {!oddsLoading && oddsData && (oddsData.marketClosed || !oddsData.matchOdds?.length) && (
                                                            <div className='match_block odds_market_closed' style={{ padding: '1rem', color: 'var(--text-secondary, #888)', textAlign: 'center' }}>Market closed</div>
                                                        )}
                                                        {!oddsLoading && oddsData && !oddsData.marketClosed && oddsData.matchOdds?.length > 0 && (sportName === 'soccer' || sportName === 'tennis') ? (
                                                            <>
                                                                {oddsData?.matchOdds?.[0] && renderOddsSection('match_odds_0', oddsData.matchOdds[0].marketName || oddsData.matchOdds[0].market || 'MATCH ODDS', 'ri-settings-3-line', oddsData.matchOdds[0].minMax || 'MIN: 100 MAX: 25K', [oddsData.matchOdds[0]], 'match_odds')}
                                                                {oddsData?.bookMakerOdds?.length > 0
                                                                    ? renderOddsSection('bookmaker', 'BOOKMAKER', 'ri-settings-3-line', 'MIN: 100 MAX: 1000K', oddsData.bookMakerOdds, 'bookmaker')
                                                                    : (() => {
                                                                        const firstMarket = oddsData?.matchOdds?.[0]
                                                                        const runners = (firstMarket && (Array.isArray(firstMarket.runners) ? firstMarket.runners : toOddDatasArray(firstMarket.oddDatas))) || []
                                                                        const lockedRunners = runners.length
                                                                            ? runners.map((r) => ({ ...r, rname: r.rname ?? r.selectionName ?? r.name ?? '—', b1: null, b2: null, b3: null, l1: null, l2: null, l3: null }))
                                                                            : [{ rname: '—', selectionName: '—', b1: null, l1: null }, { rname: '—', selectionName: '—', b1: null, l1: null }, { rname: '—', selectionName: '—', b1: null, l1: null }]
                                                                        const dummyMarket = { mid: 'bookmaker-empty', marketId: 'bookmaker-empty', market: 'BOOKMAKER', status: 'CLOSED', runners: lockedRunners }
                                                                        return renderOddsSection('bookmaker', 'BOOKMAKER', 'ri-settings-3-line', 'MIN: 100 MAX: 1000K', [dummyMarket], 'bookmaker')
                                                                    })()}
                                                                {/* Tennis: API se aaye extra markets – Set Betting, Total Games, etc. */}
                                                                {sportName === 'tennis' && (() => {
                                                                    const extra = [
                                                                        ...(oddsData?.matchOdds?.length > 1 ? oddsData.matchOdds.slice(1) : []),
                                                                        ...(oddsData?.otherMarketOdds ?? []),
                                                                    ]
                                                                    return extra.map((m, idx) => {
                                                                        const title = m.marketName || m.market || `Market ${idx + 1}`
                                                                        const minMax = m.minMax || 'MIN: 100 MAX: 25K'
                                                                        return renderOddsSection(`tennis_extra_${idx}`, title, 'ri-settings-3-line', minMax, [m], 'match_odds')
                                                                    })
                                                                })()}
                                                                {/* Soccer only: First Half Goals, Half Time, Over/Under – tennis pe ye nahi */}
                                                                {sportName === 'soccer' && (() => {
                                                                    const allBelow = [
                                                                        ...(oddsData?.matchOdds?.length > 1 ? oddsData.matchOdds.slice(1) : []),
                                                                        ...(oddsData?.otherMarketOdds ?? []),
                                                                    ]
                                                                    const firstMarketRunners = (() => {
                                                                        const m = oddsData?.matchOdds?.[0]
                                                                        if (!m) return []
                                                                        return getMarketOddList(m)
                                                                    })()
                                                                    return SOCCER_MARKETS_BELOW.map((def, idx) => {
                                                                        const apiMarket = findSoccerMarketByTitle(def.title, allBelow)
                                                                        if (apiMarket) {
                                                                            return renderOddsSection(
                                                                                `soccer_below_${idx}`,
                                                                                apiMarket.marketName || apiMarket.market || def.title,
                                                                                'ri-settings-3-line',
                                                                                apiMarket.minMax || def.minMax,
                                                                                [apiMarket],
                                                                                'match_odds'
                                                                            )
                                                                        }
                                                                        const runnerLabels = def.runnerLabels || (firstMarketRunners.length >= 3
                                                                            ? firstMarketRunners.slice(0, 3).map((r) => r.rname ?? r.selectionName ?? r.name ?? '—')
                                                                            : ['—', '—', 'The Draw'])
                                                                        const lockedRunners = runnerLabels.map((label) => ({
                                                                            rname: label,
                                                                            selectionName: label,
                                                                            b1: null, b2: null, b3: null,
                                                                            l1: null, l2: null, l3: null,
                                                                        }))
                                                                        const dummyMarket = { mid: `soccer-placeholder-${idx}`, marketId: `soccer-placeholder-${idx}`, market: def.title, status: 'CLOSED', runners: lockedRunners }
                                                                        return renderOddsSection(`soccer_below_${idx}`, def.title, 'ri-settings-3-line', def.minMax, [dummyMarket], 'match_odds')
                                                                    })
                                                                })()}
                                                                {(oddsData?.fancyOdds?.length > 0 || oddsData?.premiumFancy?.length > 0) && renderOddsSection('mini_bookmaker', 'MINI BOOKMAKER', 'ri-tools-line', 'MIN: 100 MAX: 100K', oddsData.fancyOdds?.length ? oddsData.fancyOdds : oddsData.premiumFancy, 'fancy')}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {!oddsData?.marketClosed && oddsData?.matchOdds?.length > 0 && renderOddsSection('match_odds', 'MATCH ODDS', 'ri-rocket-line', 'MIN: 100 MAX: 10K', oddsData.matchOdds, 'match_odds')}
                                                                {!oddsData?.marketClosed && oddsData?.bookMakerOdds?.length > 0 && renderOddsSection('bookmaker', 'BOOKMAKER', 'ri-tools-line', 'MIN: 100 MAX: 300K', oddsData.bookMakerOdds, 'bookmaker')}
                                                                {!oddsData?.marketClosed && (oddsData?.fancyOdds?.length > 0 || oddsData?.premiumFancy?.length > 0) && renderOddsSection('mini_bookmaker', 'MINI BOOKMAKER', 'ri-tools-line', 'MIN: 100 MAX: 100K', oddsData.fancyOdds?.length ? oddsData.fancyOdds : oddsData.premiumFancy, 'fancy')}
                                                            </>
                                                        )}

                                                        {/* Neeche: SESSIONS, W/P MARKET, EXTRA MARKET, ODD/EVEN – cricket only */}
                                                        {sportName === 'cricket' && (
                                                            <div className="markets_below_wrap">
                                                                {renderNoYesSection('below_sessions', 'SESSIONS', sessionsRows)}
                                                                {renderNoYesSection('below_wp', 'W/P MARKET', wpMarketRows)}
                                                                {renderNoYesSection('below_extra', 'EXTRA MARKET', extraMarketRows)}
                                                                {renderNoYesSection('below_odd_even', 'ODD/EVEN', oddEvenRows)}
                                                                {backOnlyBlocks.map((block) => renderBackOnlySection(block))}
                                                            </div>
                                                        )}

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
                                                            <div className='betslip_open_bets betdel_sl'>{renderOpenBetsContent()}</div>
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
                        </>
                    )}
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
                                        <div className='betslip_open_bets betslip_open_bets_panel'>{renderOpenBetsContent()}</div>
                                    )}
                                </>
                            ) : placeBetSuccessMessage ? (
                                <>
                                    <LossCutIndicator currentLoss={betslipCurrentLoss ?? betslipExposure ?? 0} lossLimit={betslipLossLimit} compact onSetLimit={handleSetLossLimit} />
                                    <div className='betslip_success'>
                                        <p className='betslip_success_title'>Bet placed</p>
                                        <p className='betslip_success_msg'>{placeBetSuccessMessage}</p>
                                    </div>
                                </>
                            ) : selectedBets.length > 0 ? (
                                <>
                                    <LossCutIndicator currentLoss={betslipCurrentLoss ?? betslipExposure ?? 0} lossLimit={betslipLossLimit} compact onSetLimit={handleSetLossLimit} />
                                    {lossLimitReached && <p className='betslip_error'>Loss limit reached. Betting is disabled.</p>}
                                    {selectedBets.map((bet) => {
                                        const betType = (bet.placePayload?.betType ?? bet.betType ?? 'back').toLowerCase()
                                        const isBack = betType === 'back'
                                        const cardClass = `betslip_card_light betslip_card_${isBack ? 'back' : 'lay'}`
                                        return (
                                            <div key={bet.id} className={cardClass}>
                                                <div className='betslip_card_header'>
                                                    <span className='betslip_match_title'>{eventNameFromState || 'Match'}</span>
                                                    <button type='button' className='betslip_card_close' onClick={() => removeBet(bet.id)} aria-label='Remove'>×</button>
                                                </div>
                                                <div className='betslip_selection'>
                                                    {bet.betName} @ {(Number(slipOdds ?? bet.oddsDisplay ?? bet.odds) || 0).toFixed(2)}
                                                </div>
                                            </div>
                                        )
                                    })}

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

                                    {/* <p className='betslip_clear_all'>
                                        <button type='button' className='betslip_clear_all_btn' onClick={clearAllBets}>Clear all bets</button>
                                    </p> */}
                                    {placeBetError && <p className='betslip_error'>{placeBetError}</p>}
                                    <button className='betslip_place_bet_btn' onClick={handlePlaceBet} disabled={placeBetLoading || lossLimitReached || isDemo}>
                                        {placeBetLoading ? 'Placing...' : lossLimitReached ? 'Betting disabled' : isDemo ? 'Login to play' : 'Place Bet'}
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

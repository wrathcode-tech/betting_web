import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import './CricketDetail.css'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import { getEventStakeConfig, unwrapPlaceBetResponse } from '../api/services/sportsbookApi'
import {
    addMatchesListener,
    removeMatchesListener,
} from '../socket/sportsbookSocket'
import {
    subscribeMatchDataDetail,
    unsubscribeMatchDataDetail,
    addMatchDataDetailListener,
    removeMatchDataDetailListener,
} from '../socket/matchDataSocket'
import { getMatchRowsFromSocketPayload, expandSocketBatchPayload } from '../utils/sportsbookMatchesPayload'
import { alertSuccessMessage, alertErrorMessage } from '../customComponents/CustomAlertMessage'
import { usePlatformConfig } from '../context/PlatformConfigContext'
import { useAuth } from '../context/AuthContext'
import LossCutIndicator from '../customComponents/LossCutIndicator'
import { BackPriceCell, LayPriceCell } from './OddsMarketComponents'
import {
    formatMinMaxLabel,
    extractStakeLimitFields,
    getNumericStakeLimitsFromPayload,
} from '../utils/marketMinMax'
import BookSummary from './BookSummary'
import { collectBookBetsFromOpenAndSlip } from './bookSummaryUtils'

// const CASHOUT_COMMISSION = 0.05 // Temporarily disabled with cashout UI
/** Open bets: high limit. (gameId/sport query kuch backends par error / empty deta hai — filter client-side.) */
const OPEN_BETS_QUERY = () => ({ page: 1, limit: 100 })
/** API / axios pehle hi response.data de chuka hota hai — alag-alag shapes */
function parseOpenBetsFromResponse(res) {
    const raw = res?.data ?? res
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw?.bets)) return raw.bets
    if (Array.isArray(raw?.data)) return raw.data
    if (Array.isArray(raw?.openBets)) return raw.openBets
    if (Array.isArray(raw?.records)) return raw.records
    return []
}

// /** Open bet object par cashout (open-bets REST / socket betUpdate) */
// function cashoutValueFromBetObject(b) {
//     if (!b || typeof b !== 'object') return null
//     const v =
//         b.cashoutValue ??
//         b.cashout_value ??
//         b.currentCashout ??
//         b.current_cashout ??
//         b.liveCashout ??
//         b.cashOutValue
//     if (v == null || v === '') return null
//     const n = Number(v)
//     return Number.isNaN(n) ? null : n
// }

/** Runner / selection id — APIs alag-alag fields bhej sakti hain */
function pickSelectionId(node) {
    if (!node || typeof node !== 'object') return null
    const v =
        node.selectionId ??
        node.sid ??
        node.id ??
        node.runnerId ??
        node.selection_id ??
        node.runner_id
    if (v == null || v === '') return null
    return String(v)
}

function pickMarketId(market) {
    if (!market || typeof market !== 'object') return null
    const v = market.mid ?? market.mId ?? market.marketId ?? market.market_id ?? market.id
    if (v == null || v === '') return null
    return v
}

/** Match update payloads: bookMakerOdds can be `[{ bm1: { mid, oddDatas, ... } }]` instead of a flat market list. */
function flattenBookMakerOdds(raw) {
    if (!Array.isArray(raw)) return []
    const out = []
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue
        const bmKeys = Object.keys(item).filter((k) => /^bm\d+$/i.test(k))
        if (bmKeys.length > 0) {
            bmKeys.sort((a, b) => {
                const na = parseInt(a.replace(/\D/g, ''), 10) || 0
                const nb = parseInt(b.replace(/\D/g, ''), 10) || 0
                return na - nb
            })
            for (const k of bmKeys) {
                const sub = item[k]
                if (sub && typeof sub === 'object' && (sub.oddDatas != null || sub.mid != null)) out.push(sub)
            }
        } else {
            out.push(item)
        }
    }
    return out
}

function oddDatasLenForNormalize(m) {
    if (!m || typeof m !== 'object') return 0
    const od = m.oddDatas
    if (od == null) return 0
    if (Array.isArray(od)) return od.length
    if (typeof od === 'object') return Object.values(od).filter(Boolean).length
    return 0
}

function oddDatasToArray(oddDatas) {
    if (!oddDatas) return []
    if (Array.isArray(oddDatas)) return oddDatas
    if (typeof oddDatas === 'object') return Object.values(oddDatas).filter(Boolean)
    return []
}

/** Exchange ladder helpers — same rules as `renderOddsSection` (compact = best price only). */
function sortOddsCellsAsc(a, b) {
    const na = parseFloat(a.odds)
    const nb = parseFloat(b.odds)
    if (Number.isNaN(na) && Number.isNaN(nb)) return 0
    if (Number.isNaN(na)) return 1
    if (Number.isNaN(nb)) return -1
    return na - nb
}

function pickSingleBestBackLadder(raw, isCellLocked) {
    const valid = raw.filter((c) => !isCellLocked(c.odds))
    if (valid.length === 0) return [raw[0] ?? { odds: null, size: null }]
    return [valid.reduce((best, c) => (parseFloat(c.odds) > parseFloat(best.odds) ? c : best))]
}

function pickSingleBestLayLadder(raw, isCellLocked) {
    const valid = raw.filter((c) => !isCellLocked(c.odds))
    if (valid.length === 0) return [raw[0] ?? { odds: null, size: null }]
    return [valid.reduce((best, c) => (parseFloat(c.odds) < parseFloat(best.odds) ? c : best))]
}

function collectNormalizedOddsMarkets(od) {
    if (!od || typeof od !== 'object') return []
    const keys = ['matchOdds', 'bookMakerOdds', 'fancyOdds', 'fancyOddsSessions', 'otherMarketOdds', 'oddEvenOdds', 'premiumFancy']
    const out = []
    for (const k of keys) {
        const arr = od[k]
        if (Array.isArray(arr)) out.push(...arr)
    }
    return out
}

function isPairedNoYesOddList(oddList) {
    if (!oddList || oddList.length !== 2) return false
    const n0 = String(oddList[0]?.rname ?? oddList[0]?.selectionName ?? '').trim()
    const n1 = String(oddList[1]?.rname ?? oddList[1]?.selectionName ?? '').trim()
    return (
        /^(no|yes|n\/a)$/i.test(n0) ||
        /^(no|yes|n\/a)$/i.test(n1) ||
        (n0.toLowerCase() === 'no' && n1.toLowerCase() === 'yes') ||
        (n0.toLowerCase() === 'yes' && n1.toLowerCase() === 'no')
    )
}

/** Parse `…-back-2` / `…-lay-0` from price-cell element ids (full ladder layout). */
function ladderColumnFromElementId(elementId, side) {
    if (!elementId || typeof elementId !== 'string') return null
    const suffix = side === 'lay' ? '-lay-' : '-back-'
    const i = elementId.lastIndexOf(suffix)
    if (i < 0) return null
    const rest = elementId.slice(i + suffix.length)
    const m = rest.match(/^(\d+)/)
    return m ? parseInt(m[1], 10) : null
}

/**
 * Live socket odds → same selection’s current ladder price for betslip (match odds, bookmaker, fancy ladders).
 * `isCellLocked` must match component `isOddsLocked`.
 */
function resolveSlipOddsFromOddsData(oddsData, bet, isOddsTableCompact, isCellLocked) {
    const pp = bet?.placePayload
    if (!pp || !oddsData || typeof oddsData !== 'object') return null
    const wantMid = String(pp.marketId ?? '')
    const wantSid = String(pp.selectionId ?? '')
    if (!wantMid || !wantSid) return null
    const betType = String(pp.betType ?? 'back').toLowerCase()
    const isLay = betType === 'lay'

    const market = collectNormalizedOddsMarkets(oddsData).find((m) => String(pickMarketId(m) ?? '') === wantMid)
    if (!market) return null

    const oddList =
        Array.isArray(market.runners) && market.runners.length > 0 ? market.runners : oddDatasToArray(market.oddDatas)

    const finalize = (rawVal) => {
        if (isCellLocked(rawVal)) return null
        const s = String(rawVal ?? '').trim()
        const n = parseFloat(s)
        if (Number.isNaN(n) || n < 1.01) return null
        return { oddsNum: n, oddsStr: s }
    }

    if (oddList.length === 2 && isPairedNoYesOddList(oddList)) {
        const noSel = oddList[0]
        const yesSel = oddList[1]
        const yesSid = pickSelectionId(yesSel)
        const noSid = pickSelectionId(noSel)
        if (!isLay && wantSid === String(yesSid)) {
            if (selectionStatusRowLabel(yesSel?.status)) return null
            return finalize(yesSel.b1)
        }
        if (isLay && wantSid === String(noSid)) {
            if (selectionStatusRowLabel(noSel?.status)) return null
            return finalize(noSel.l1 ?? noSel.b1)
        }
    }

    const odd = oddList.find((o) => String(pickSelectionId(o) ?? '') === wantSid)
    if (!odd) return null
    if (selectionStatusRowLabel(odd?.status)) return null

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
    const rawSide = isLay ? layCellsRaw : backCellsRaw
    const pickBest = isLay ? pickSingleBestLayLadder : pickSingleBestBackLadder

    if (isOddsTableCompact) {
        const cells = pickBest(rawSide, isCellLocked)
        if (!cells.length) return null
        return finalize(cells[0].odds)
    }

    const cells = [...rawSide].sort(sortOddsCellsAsc)
    let cIdx = ladderColumnFromElementId(bet.elementId, isLay ? 'lay' : 'back')
    if (cIdx != null && cIdx >= 0 && cIdx < cells.length) {
        const cell = cells[cIdx]
        if (cell && !isCellLocked(cell.odds)) return finalize(cell.odds)
    }
    const best = pickBest(rawSide, isCellLocked)
    if (!best.length) return null
    return finalize(best[0].odds)
}

function isOddsValueLocked(val) {
    if (val == null || val === '') return true
    const n = parseFloat(String(val).trim())
    return Number.isNaN(n) || n <= 0
}

/**
 * fancyOdds often mixes: Normal (many runners → mini bookmaker table), fancy1 (toss, 2 runners), oddeven (many lines).
 */
/** Per-runner `oddDatas[].status` — full row replaces prices (mini bookmaker / no-yes / back-only). */
function selectionStatusRowLabel(raw) {
    if (raw == null || raw === '') return null
    const s = String(raw).trim().toLowerCase()
    if (s === 'ball running') return 'Ball Running'
    if (s === 'suspended') return 'Suspended'
    return null
}

/** Uppercase banner text on top of dimmed odds (reference UI). */
function formatStatusOverlayText(label) {
    if (!label) return ''
    if (label === 'Ball Running') return 'BALL RUNNING'
    if (label === 'Suspended') return 'SUSPENDED'
    return String(label).toUpperCase()
}

/** P/L box: lakh+ rupee amounts need smaller / wrapping layout so they do not overlap Back cells */
const LARGE_PL_RUPEE_THRESHOLD = 100000

function isLargePlRupeeAmount(value) {
    const n = Number(value)
    if (!Number.isFinite(n)) return false
    return Math.abs(n) >= LARGE_PL_RUPEE_THRESHOLD
}

function partitionFancyOdds(fancyArr) {
    if (!Array.isArray(fancyArr)) return { miniFancy: [], sessionFancy: [], oddEvenFancy: [] }
    const oddEven = []
    const sessions = []
    const mini = []
    for (const m of fancyArr) {
        const gt = String(m?.gtype ?? '').toLowerCase()
        const mn = String(m?.mname ?? '').toLowerCase()
        const mk = String(m?.market ?? '').toLowerCase()
        const isOddEven =
            gt === 'oddeven' ||
            mn.includes('oddeven') ||
            mk === 'oddeven' ||
            (mk.includes('odd') && mk.includes('even') && (mk.includes('run') || mk.includes('over')))
        if (isOddEven) {
            oddEven.push(m)
            continue
        }
        const len = oddDatasLenForNormalize(m)
        if (len > 2) {
            mini.push(m)
        } else {
            sessions.push(m)
        }
    }
    return { miniFancy: mini, sessionFancy: sessions, oddEvenFancy: oddEven }
}

function formatInr2(n) {
    const x = Number(n)
    if (!Number.isFinite(x)) return null
    return x.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** @returns {'open'|'won'|'lost'|'void'|'cashed_out'|'closed'} */
function settlementKindFromBet(b) {
    if (!b || typeof b !== 'object') return 'closed'
    const statusRaw = String(b.status ?? b.betStatus ?? '').toLowerCase().trim()
    const resultRaw = String(b.result ?? b.betResult ?? b.outcome ?? '').toLowerCase().trim()
    const token = resultRaw || statusRaw
    if (token === 'open' || token === 'matched' || token === 'active' || token === 'pending' || statusRaw === 'open') return 'open'
    if (['won', 'win', 'winner'].includes(token)) return 'won'
    if (['lost', 'loss', 'lose', 'loser'].includes(token)) return 'lost'
    if (['void', 'voided', 'cancelled', 'canceled', 'refunded'].includes(token)) return 'void'
    if (['cashed_out', 'cashout', 'cashedout'].includes(token) || statusRaw === 'cashed_out') return 'cashed_out'
    if (statusRaw && statusRaw !== 'open') return 'closed'
    return 'open'
}

function settlementAmountFromBet(b) {
    if (!b || typeof b !== 'object') return null
    const keys = [
        'profit', 'pnl', 'netProfit', 'net_profit', 'amountWon', 'amount_won',
        'winAmount', 'win_amount', 'settlementAmount', 'settlement_amount',
        'returns', 'returnAmount', 'payout', 'winnings', 'netReturn', 'net_return',
    ]
    for (const k of keys) {
        const v = b[k]
        if (v != null && v !== '') {
            const n = Number(v)
            if (!Number.isNaN(n)) return n
        }
    }
    return null
}

function flattenBetUpdatePayload(payload) {
    if (!payload || typeof payload !== 'object') return {}
    const nested = payload.bet ?? payload.data ?? payload.payload
    return typeof nested === 'object' && nested !== null ? { ...payload, ...nested } : { ...payload }
}

function betUpdatePayloadRelatesToMatch(payload, gameId, eventId) {
    const p = flattenBetUpdatePayload(payload)
    const g = p.gameId ?? p.game_id
    const e = p.eventId ?? p.event_id
    if (g == null && e == null) return true
    if (gameId && g != null && String(g) === String(gameId)) return true
    if (eventId && e != null && String(e) === String(eventId)) return true
    return false
}

/**
 * Socket `betUpdate` → BalanceContext `sportsbookBetUpdate`. Toast sirf jab payload mein clear result ho (spam kam).
 */
/** Place-bet body: backend expects `marketName` (e.g. "Match Odds") when not already on selection payload. */
function marketNameForPlaceBet(p) {
    if (p?.marketName != null && String(p.marketName).trim() !== '') return String(p.marketName).trim()
    const t = String(p?.marketType || '').toLowerCase()
    if (t === 'match_odds') return 'Match Odds'
    if (t === 'bookmaker') return 'Bookmaker'
    if (t === 'fancy') return 'Fancy'
    return t ? t.replace(/_/g, ' ') : 'Market'
}

function tryNotifyBetSettlement(payload, gameId, eventId, dedupeRef) {
    if (!gameId && !eventId) return
    const p = flattenBetUpdatePayload(payload)
    if (!betUpdatePayloadRelatesToMatch(p, gameId, eventId)) return
    const type = String(p.type ?? p.eventType ?? '').toLowerCase()
    if (type === 'cashout' || type === 'cashed_out') return
    const result = String(p.result ?? p.betResult ?? p.outcome ?? '').toLowerCase()
    const status = String(p.status ?? p.betStatus ?? '').toLowerCase()
    const effective = (result || status).trim()
    if (!['won', 'win', 'lost', 'loss', 'void', 'voided', 'cancelled', 'canceled'].includes(effective)) return
    const bid = String(p.betId ?? p.bet_id ?? p.id ?? p._id ?? '')
    const dedupeKey = `${bid}:${effective}`
    const now = Date.now()
    if (dedupeRef.current.key === dedupeKey && now - dedupeRef.current.at < 10000) return
    dedupeRef.current = { key: dedupeKey, at: now }
    const amtStr = formatInr2(settlementAmountFromBet(p))
    if (['won', 'win'].includes(effective)) {
        alertSuccessMessage(amtStr != null ? `Bet won · ₹${amtStr}` : 'Bet won!')
    } else if (['lost', 'loss'].includes(effective)) {
        alertErrorMessage(amtStr != null ? `Bet lost · ₹${amtStr}` : 'Bet lost')
    } else {
        alertSuccessMessage('Bet voided / refunded')
    }
}

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
    // const [cashoutId, setCashoutId] = useState(null) // Temporarily disabled with cashout UI
    const [openCashoutSection, setOpenCashoutSection] = useState(null)
    const [openLossCutSection, setOpenLossCutSection] = useState(null)
    const betUpdateRefreshTimerRef = useRef(null)
    const settlementToastDedupeRef = useRef({ key: '', at: 0 })
    const openBetsCount = openBetsList.length
    /** Betslip khula ya Open Bets tab — open bets + exposure dono yahi par sync */
    const pullOpenBets = useCallback(async ({ showLoading = false } = {}) => {
        if (isDemo) {
            setOpenBetsList([])
            setOpenBetsLoading(false)
            return
        }
        if (showLoading) setOpenBetsLoading(true)
        try {
            const res = await AuthService.sportsbookOpenBets(OPEN_BETS_QUERY())
            setOpenBetsList(parseOpenBetsFromResponse(res))
        } catch {
            setOpenBetsList([])
        } finally {
            if (showLoading) setOpenBetsLoading(false)
        }
    }, [isDemo])
    const [isMobileBetslipOpen, setIsMobileBetslipOpen] = useState(false)
    const [isOddsTableCompact, setIsOddsTableCompact] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
    )

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)')
        const onChange = () => setIsOddsTableCompact(mq.matches)
        onChange()
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])

    // Ensure betslip popup opens whenever at least one bet is selected (desktop & mobile)
    useEffect(() => {
        if (selectedBets.length > 0) {
            setIsBetslipOpen(true)
        }
    }, [selectedBets.length])

    // Login modal must sit above inline mobile slip — hide slip when login opens from anywhere
    useEffect(() => {
        const onOpenLogin = () => setIsMobileBetslipOpen(false)
        window.addEventListener('openLoginModal', onOpenLogin)
        return () => window.removeEventListener('openLoginModal', onOpenLogin)
    }, [])

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

    // Cashout map temporarily disabled with cashout UI.
    // const cashoutValuesMap = useMemo(() => {
    //     const next = {}
    //     for (const b of openBetsList || []) {
    //         if (settlementKindFromBet(b) !== 'open') continue
    //         const bid = b._id ?? b.id
    //         if (bid == null || bid === '') continue
    //         const key = String(bid)
    //         const embedded = cashoutValueFromBetObject(b)
    //         const suspendedFlag = b.cashoutSuspended ?? b.cashout_suspended
    //         next[key] = {
    //             value: embedded,
    //             suspended: suspendedFlag === true || embedded == null,
    //         }
    //     }
    //     return next
    // }, [openBetsList])

    const [defaultMatch, setDefaultMatch] = useState(null)
    const gameIdFromState = location.state?.gameId ?? location.state?.game_id
    const eventIdFromState = location.state?.eventId ?? location.state?.event_id
    /** Search / link with explicit match: never replace with "first match" from list */
    const hasExplicitMatchNav = !!(gameIdFromState || eventIdFromState)
    const eventNameFromState = location.state?.eventName ?? defaultMatch?.eventName
    const seriesOrTournamentName = location.state?.seriesName ?? location.state?.tournamentName ?? location.state?.series_name ?? defaultMatch?.seriesName ?? defaultMatch?.series_name ?? defaultMatch?.tournamentName ?? defaultMatch?.tournament ?? ''
    const sportFromPath = location.pathname?.includes('/tennis') ? 'tennis' : location.pathname?.includes('/soccer') ? 'soccer' : null
    const sportName = (location.state?.sportName || sportFromPath || 'cricket').toLowerCase()
    /** Professorji / score.akamaized `sport` query (app tab is `soccer`). */
    const professorjiSportParam = sportName === 'soccer' ? 'football' : sportName === 'tennis' ? 'tennis' : 'cricket'
    // Old tab ids (sessions, wp-market, …) — migrate to single markets view
    useEffect(() => {
        const legacy = ['sessions', 'wp-market', 'extra-market', 'odd-even']
        if (legacy.includes(activeTab)) setActiveTab('all')
    }, [activeTab])

    // Cricket/soccer: odds REST uses gameId; search may send only eventId — use as fallback.
    const gameId =
        sportName === 'tennis'
            ? (gameIdFromState ?? defaultMatch?.gameId ?? eventIdFromState)
            : (gameIdFromState ?? eventIdFromState ?? defaultMatch?.gameId)
    const eventId =
        eventIdFromState ??
        gameIdFromState ??
        defaultMatch?.eventId ??
        gameId
    /** Cricket: Professorji / score.akamaized; Tennis & Football: cricketbz.app iframe by event id */
    const professorScoreIframeUrl = useMemo(() => {
        if (!['cricket', 'tennis', 'soccer'].includes(sportName) || !eventId) return null
        const id = String(eventId)
        if (sportName === 'tennis' || sportName === 'soccer') {
            return `https://cricketbz.app/iframe/${encodeURIComponent(id)}`
        }
        const params = new URLSearchParams()
        params.set('id', id)
        params.set('sport', professorjiSportParam)
        const mn = eventNameFromState
        if (mn != null && String(mn).trim() !== '') params.set('matchName', String(mn).trim())
        return `https://score.akamaized.uk/?${params.toString()}`
    }, [sportName, eventId, eventNameFromState, professorjiSportParam])
    const professorTvIframeUrl = useMemo(() => {
        if (!['cricket', 'tennis', 'soccer'].includes(sportName) || !eventId) return null
        return `https://apis.professorji.in/api/tv?eventId=${encodeURIComponent(String(eventId))}&sport=${encodeURIComponent(professorjiSportParam)}`
    }, [sportName, eventId, professorjiSportParam])
    const [oddsData, setOddsData] = useState(null)
    /** Event config / REST — minStack, maxStack, etc.; merged under socket odds for MIN/MAX labels */
    const [eventStakeLimits, setEventStakeLimits] = useState(() => ({}))

    const limitsFallbackPayload = useMemo(
        () => ({
            ...eventStakeLimits,
            ...(oddsData && typeof oddsData === 'object' ? oddsData : {}),
        }),
        [eventStakeLimits, oddsData]
    )

    const globalStakeLimitsLabel = useMemo(
        () => formatMinMaxLabel({}, limitsFallbackPayload),
        [limitsFallbackPayload]
    )

    const effectiveStakeBounds = useMemo(() => {
        const { min, max } = getNumericStakeLimitsFromPayload(limitsFallbackPayload)
        return {
            min: min != null ? min : 100,
            max: max != null ? max : 10000,
        }
    }, [limitsFallbackPayload])
    const [oddsLoading, setOddsLoading] = useState(true)
    const [liveScore, setLiveScore] = useState(null)
    // eslint-disable-next-line no-unused-vars -- used in commented-out Live TV iframe
    const [streamUrl, setStreamUrl] = useState(null)
    const [isLiveTvDropdownOpen, setIsLiveTvDropdownOpen] = useState(false)
    const [isLiveScoreDropdownOpen, setIsLiveScoreDropdownOpen] = useState(false)

    useEffect(() => {
        setIsLiveTvDropdownOpen(false)
        setIsLiveScoreDropdownOpen(false)
    }, [professorTvIframeUrl, professorScoreIframeUrl, gameId, eventId, sportName])

    /** Place bet API ke liye — sirf state pe depend na ho; odds / match list se fallback */
    const eventNameForBets = useMemo(() => {
        const t = (v) => {
            if (v == null) return ''
            const s = String(v).trim()
            return s === '' ? '' : s
        }
        return (
            t(eventNameFromState) ||
            t(oddsData?.eventName) ||
            t(oddsData?.matchName) ||
            t(defaultMatch?.eventName) ||
            'Match'
        )
    }, [eventNameFromState, oddsData?.eventName, oddsData?.matchName, defaultMatch?.eventName])

    const eventTimeForPlaceBet = useMemo(() => {
        const raw =
            location.state?.eventTime ??
            location.state?.event_time ??
            defaultMatch?.eventTime ??
            defaultMatch?.event_time ??
            defaultMatch?.eventDate ??
            oddsData?.eventTime
        if (raw == null || raw === '') return undefined
        if (typeof raw === 'string') {
            const d = new Date(raw)
            return Number.isNaN(d.getTime()) ? raw : d.toISOString()
        }
        if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw.toISOString()
        return undefined
    }, [
        location.state?.eventTime,
        location.state?.event_time,
        defaultMatch?.eventTime,
        defaultMatch?.event_time,
        defaultMatch?.eventDate,
        oddsData?.eventTime,
    ])

    // defaultMatch: socket `matches` only (no REST sportsbookMatches)
    useEffect(() => {
        const onMatches = (raw) => {
            for (const payload of expandSocketBatchPayload(raw)) {
                if (payload?.sport !== sportName) continue
                const { rows, error } = getMatchRowsFromSocketPayload(payload)
                if (error || rows.length === 0) continue
                if (hasExplicitMatchNav && gameId) {
                    const fromNav = location.state?.eventName ?? location.state?.event_name
                    if (fromNav != null && String(fromNav).trim() !== '') continue
                    const found = rows.find((m) => String(m.gameId ?? m.game_id ?? '') === String(gameId))
                    if (!found) continue
                    setDefaultMatch((prev) => {
                        const gid = String(gameId)
                        const pgid = String(prev?.gameId ?? prev?.game_id ?? '')
                        const name = found.eventName ?? found.event_name
                        if (prev && pgid === gid) {
                            if (name && (!prev.eventName || String(prev.eventName).trim() === '')) {
                                return { ...prev, eventName: name, eventId: found.eventId ?? found.event_id ?? prev.eventId }
                            }
                            return prev
                        }
                        return {
                            gameId: found.gameId ?? found.game_id,
                            eventName: name,
                            eventId: found.eventId ?? found.event_id,
                            seriesName:
                                found.seriesName ??
                                found.series_name ??
                                found.tournamentName ??
                                found.tournament ??
                                found.competitionName ??
                                null,
                        }
                    })
                    continue
                }
                if (!hasExplicitMatchNav) {
                    const first = rows.find((m) => m.gameId || m.game_id)
                    if (first) {
                        setDefaultMatch({
                gameId: first.gameId ?? first.game_id,
                eventName: first.eventName ?? first.event_name,
                eventId: first.eventId ?? first.event_id,
                seriesName: first.seriesName ?? first.series_name ?? first.tournamentName ?? first.tournament ?? first.competitionName ?? null,
            })
                    }
                }
            }
        }
        addMatchesListener(onMatches)
        return () => {
            removeMatchesListener(onMatches)
        }
    }, [hasExplicitMatchNav, sportName, gameId, location.state?.eventName, location.state?.event_name])

    const normalizeOdds = (d) => {
        const matchOdds = Array.isArray(d?.matchOdds) ? d.matchOdds : (Array.isArray(d?.match_odds) ? d.match_odds : [])
        const firstMarket = matchOdds?.[0]
        const otherMarketOdds = Array.isArray(d?.otherMarketOdds) ? d.otherMarketOdds : (Array.isArray(d?.other_market_odds) ? d.other_market_odds : [])
        const totalGoalsOdds = Array.isArray(d?.totalGoalsOdds) ? d.totalGoalsOdds : (Array.isArray(d?.total_goals_odds) ? d.total_goals_odds : [])
        const overUnderOdds = Array.isArray(d?.overUnderOdds) ? d.overUnderOdds : (Array.isArray(d?.over_under_odds) ? d.over_under_odds : [])
        const eventNameFromPayload =
            d?.eventName ??
            d?.event_name ??
            d?.matchName ??
            d?.match_name ??
            firstMarket?.eventName ??
            firstMarket?.event_name ??
            firstMarket?.matchName ??
            firstMarket?.match_name ??
            null
        const rawFancy = Array.isArray(d?.fancyOdds) ? d.fancyOdds : (Array.isArray(d?.fancy_odds) ? d.fancy_odds : [])
        const fancyPart = partitionFancyOdds(rawFancy)
        const baseOddEven = Array.isArray(d?.oddEvenOdds) ? d.oddEvenOdds : (Array.isArray(d?.odd_even_odds) ? d.odd_even_odds : [])
        const bookMakerOddsFlat = flattenBookMakerOdds(
            Array.isArray(d?.bookMakerOdds) ? d.bookMakerOdds : (Array.isArray(d?.book_maker_odds) ? d.book_maker_odds : [])
        )
        return {
            ...extractStakeLimitFields(d),
            ...(firstMarket ? extractStakeLimitFields(firstMarket) : {}),
            matchOdds,
            marketClosed: d?.marketClosed === true,
            eventName: eventNameFromPayload,
            matchName: d?.matchName ?? d?.match_name ?? firstMarket?.matchName ?? firstMarket?.match_name ?? null,
            eventTime: d?.eventTime ?? d?.event_time ?? d?.eventDate ?? d?.event_date ?? d?.startDate ?? d?.start_date ?? null,
            tvUrl: d?.tv_url ?? d?.tvUrl ?? firstMarket?.tv_url ?? firstMarket?.tvUrl ?? null,
            isTv: d?.IsTv ?? d?.isTv ?? firstMarket?.IsTv ?? firstMarket?.isTv ?? false,
            fancyOdds: fancyPart.miniFancy,
            fancyOddsSessions: fancyPart.sessionFancy,
            otherMarketOdds: [...otherMarketOdds, ...totalGoalsOdds, ...overUnderOdds],
            bookMakerOdds: bookMakerOddsFlat,
            premiumFancy: Array.isArray(d?.premiumFancy) ? d.premiumFancy : (Array.isArray(d?.premium_fancy) ? d.premium_fancy : []),
            oddEvenOdds: [...baseOddEven, ...fancyPart.oddEvenFancy],
            oddsUpdatedAt: d?.oddsUpdatedAt ?? d?.odds_updated_at ?? null,
        }
    }

    // 0) On match open: fetch event config for initial tvUrl (REST). Clear stream when match changes.
    const oddsId = sportName === 'tennis' ? (eventId || gameId) : gameId
    useEffect(() => {
        if (!oddsId) {
            setOddsLoading(false)
            setOddsData(null)
            setEventStakeLimits({})
        } else {
            setOddsLoading(true)
            setEventStakeLimits({})
        }
    }, [oddsId])

    // Event config (min/max, tv) — REST only. Odds: `/matchdata` `matchData:matchUpdate`.
    useEffect(() => {
        if (!oddsId) return
        setStreamUrl(null)
        let cancelled = false
        getEventStakeConfig(oddsId)
            .then((cfgRes) => {
                if (cancelled) return
                if (cfgRes != null && typeof cfgRes === 'object') {
                    const cfg = cfgRes?.response ?? cfgRes?.data ?? cfgRes
                    if (cfg && typeof cfg === 'object') {
                        setEventStakeLimits(extractStakeLimitFields(cfg))
                    }
                    const url = cfgRes?.tvUrl ?? cfgRes?.response?.tvUrl ?? cfgRes?.response?.tv_url ?? null
                if (url) setStreamUrl(url)
                }
            })
            .catch(() => { })
        return () => {
            cancelled = true
        }
    }, [oddsId])

    // Odds + live fields from `matchData:subscribeMatch` → `matchData:matchUpdate` (same `/matchdata` socket).
    useEffect(() => {
        if (!oddsId) return
        const wantSport = String(sportName || 'cricket').toLowerCase()
        const wantId = String(oddsId)
        subscribeMatchDataDetail(wantSport, wantId)
        const onMatchDetail = (payload) => {
            const pSport = String(payload?.sportName ?? '').toLowerCase()
            const pGid = payload?.gameId != null ? String(payload.gameId) : ''
            if (pSport !== wantSport || pGid !== wantId) return
            const match = payload?.match
            if (!match || typeof match !== 'object') return
            setOddsData(normalizeOdds(match))
            setOddsLoading(false)
            const ls = match?.liveScore ?? match?.live_score
            if (ls != null) setLiveScore(ls)
            const tvUrl = match?.tvUrl ?? match?.tv_url ?? null
            if (tvUrl != null && String(tvUrl).trim() !== '') setStreamUrl(tvUrl)
        }
        addMatchDataDetailListener(onMatchDetail)
        return () => {
            removeMatchDataDetailListener(onMatchDetail)
            unsubscribeMatchDataDetail(wantSport, wantId)
        }
    }, [oddsId, sportName])

    // Guests + demo: fetch live score via REST (no Socket score polling when logged-in real user)
    useEffect(() => {
        if (!eventId && !gameId) return
        // Professorji scorecard iframe (cricket/tennis/football) + socket — duplicate REST poll avoid karein.
        if (['cricket', 'tennis', 'soccer'].includes(sportName) && eventId) return
        const token = sessionStorage.getItem('token')
        if (token && !isDemo) return
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
    }, [eventId, gameId, isDemo, sportName])

    // Open bets: sirf match (gameId) change par — betslip / cashout UI toggle par dubara GET mat bhejo
    useEffect(() => {
        pullOpenBets({ showLoading: true })
    }, [pullOpenBets, gameId])

    // Socket betUpdate → wallet; BalanceContext `sportsbookBetUpdate` — yahan list turant sync (debounced)
    useEffect(() => {
        if (isDemo) return
        const onBetUpdate = (e) => {
            const payload = e?.detail
            if (betUpdateRefreshTimerRef.current) clearTimeout(betUpdateRefreshTimerRef.current)
            betUpdateRefreshTimerRef.current = setTimeout(() => {
                betUpdateRefreshTimerRef.current = null
                tryNotifyBetSettlement(payload, gameId, eventId, settlementToastDedupeRef)
                pullOpenBets({ showLoading: false })
            }, 450)
        }
        window.addEventListener('sportsbookBetUpdate', onBetUpdate)
        return () => {
            window.removeEventListener('sportsbookBetUpdate', onBetUpdate)
            if (betUpdateRefreshTimerRef.current) clearTimeout(betUpdateRefreshTimerRef.current)
        }
    }, [isDemo, pullOpenBets, gameId, eventId])

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

    const clearAllBets = () => {
        setSelectedBets([])
        setSlipOdds(null)
        setIsMobileBetslipOpen(false)
    }

    const [placeBetLoading, setPlaceBetLoading] = useState(false)
    const [placeBetError, setPlaceBetError] = useState(null)

    const handlePlaceBet = async () => {
        if (isDemo) {
            alertErrorMessage('Demo mode: Sportsbook betting is disabled. Log in with a real account to place bets.')
            return
        }
        if (!sessionStorage.getItem('token')) {
            setIsMobileBetslipOpen(false)
            window.dispatchEvent(new CustomEvent('openLoginModal', { detail: 'login' }))
            return
        }
        const toPlace = selectedBets.filter((b) => b.placePayload)
        if (toPlace.length === 0) {
            const msg =
                'Is selection par bet API ke liye tayyar nahi hai. Match Odds / Bookmaker / Sessions / Fancy jaisi live lines se chunein — static demo lines par bet nahi lagti.'
            setPlaceBetError(msg)
            alertErrorMessage(msg)
            return
        }
        const stakeNum = Number(stake) || 0
        const { min: minStake, max: maxStake } = effectiveStakeBounds
        if (stakeNum < minStake) {
            const msg = `Minimum stake is ₹${minStake}`
            setPlaceBetError(msg)
            alertErrorMessage(msg)
            return
        }
        if (stakeNum > maxStake) {
            const msg = `Maximum stake is ₹${maxStake}`
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
                const priceVersion = oddsData?.oddsUpdatedAt ?? oddsData?.odds_updated_at
                const body = {
                    sport: p.sport ?? sportName,
                    gameId: String(p.gameId),
                    eventName: p.eventName ?? eventNameForBets,
                    ...(seriesOrTournamentName ? { seriesName: seriesOrTournamentName } : {}),
                    ...(eventTimeForPlaceBet ? { eventTime: eventTimeForPlaceBet } : {}),
                    marketType: p.marketType,
                    marketId: String(p.marketId),
                    marketName: marketNameForPlaceBet(p),
                    selectionId: String(p.selectionId),
                    selectionName: p.selectionName,
                    betType: p.betType,
                    odds: Number(oddsNum),
                    stake: stakeNum,
                    isLive,
                    requestId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-${bet.elementId}-${Date.now()}`,
                    ...(priceVersion != null && priceVersion !== '' ? { priceVersion } : {}),
                }
                const res = await AuthService.sportsbookPlaceBet(body)
                lastRes = res
                const { ok, message: failMsg } = unwrapPlaceBetResponse(res)
                if (!ok) throw new Error(failMsg || res?.message || 'Bet failed')
            }
            // Keep current selection visible after successful place-bet.
            // User can manually clear/edit via existing action buttons.
            const { message: placedMsg, balanceAfter } = unwrapPlaceBetResponse(lastRes)
            const successMsg = placedMsg || lastRes?.message
            alertSuccessMessage(successMsg || 'Bet placed successfully.')
            if (balanceAfter != null) {
                window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { detail: { balance: balanceAfter } }))
            }
            // Open bets + exposure turant refresh — cashout amounts openBetsList / socket fields se derive
            try {
                await pullOpenBets({ showLoading: false })
            } catch {
                /* keep previous list */
            }
            setTimeout(() => {
                pullOpenBets({ showLoading: false }).catch(() => { })
            }, 900)
            Promise.all([
                AuthService.sportsbookGetLossLimit(),
                AuthService.sportsbookExposure(),
            ])
                .then(([limitRes, exposureRes]) => {
                    const limitData = limitRes?.data ?? limitRes
                    const exposureData = exposureRes?.data ?? exposureRes
                    setBetslipLossLimit(limitData?.dailyLossLimit ?? null)
                    setBetslipExposure(exposureData?.totalExposure ?? null)
                    setBetslipCurrentLoss(exposureData?.current_loss ?? exposureData?.currentLoss ?? exposureData?.totalExposure ?? null)
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

    // Cashout action temporarily disabled with cashout UI.
    // const cashoutInProgressRef = useRef(false)
    // const handleCashoutBetslip = async (betId) => {
    //     if (!betId) return
    //     if (isDemo) {
    //         alertErrorMessage('Demo mode: View only. Login to play.')
    //         return
    //     }
    //     if (cashoutInProgressRef.current) return
    //     cashoutInProgressRef.current = true
    //     setCashoutId(String(betId))
    //     try {
    //         const res = await AuthService.sportsbookCashout(betId)
    //         const ok = res?.success === true || (res && res.success !== false && !res?.message)
    //         if (ok) {
    //             await pullOpenBets({ showLoading: false })
    //             const successMsg = res?.data?.message ?? res?.message
    //             if (successMsg) alertSuccessMessage(successMsg)
    //         } else {
    //             const errMsg = res?.data?.message ?? res?.message
    //             if (errMsg) alertErrorMessage(errMsg)
    //         }
    //     } catch (err) {
    //         const errMsg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message
    //         if (errMsg) alertErrorMessage(errMsg)
    //     } finally {
    //         cashoutInProgressRef.current = false
    //         setCashoutId(null)
    //     }
    // }

    const getBetType = (b) => String(b.betType ?? b.bet_type ?? b.type ?? 'back').toLowerCase()
    const renderOpenBetsContent = () => {
        const list = openBetsList || []
        const backBets = list.filter((b) => getBetType(b) === 'back')
        const layBets = list.filter((b) => getBetType(b) === 'lay')
        const displayBack = backBets.length > 0 ? backBets : (list.length > 0 && layBets.length === 0 ? list : [])
        const displayLay = layBets
        const renderBetCard = (b, isBack) => {
            const bidRaw = b._id ?? b.id
            const bid = bidRaw != null && bidRaw !== '' ? String(bidRaw) : ''
            const kind = settlementKindFromBet(b)
            const isOpenBet = kind === 'open'
            const settleAmt = settlementAmountFromBet(b)
            const settleAmtFmt = settleAmt != null ? formatInr2(settleAmt) : null
            return (
                <div key={bid || bidRaw} className={`betslip_open_bet_card betslip_open_bet_${isBack ? 'back' : 'lay'}`}>
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
                    {/* Temporarily disabled open bets cashout value */}
                    {/* <div className='betslip_open_bet_row betslip_cashout_value_row'>
                        <span>Cash Out Value</span>
                        <span className='betslip_cashout_balance'>
                            {isOpenBet && netCashout != null ? `₹${netCashout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </span>
                    </div> */}
                    <div className='betslip_open_bet_actions'>
                        {isOpenBet ? (
                            null
                        ) : (
                            <div className='betslip_open_bet_settled'>
                                {kind === 'won' && (
                                    <>
                                        <span className='betslip_open_bet_result betslip_open_bet_result_won'>Won</span>
                                        {settleAmtFmt != null && <span className='betslip_settlement_amount'>₹{settleAmtFmt}</span>}
                                    </>
                                )}
                                {kind === 'lost' && (
                                    <>
                                        <span className='betslip_open_bet_result betslip_open_bet_result_lost'>Lost</span>
                                        {settleAmtFmt != null && <span className='betslip_settlement_amount'>₹{settleAmtFmt}</span>}
                                    </>
                                )}
                                {kind === 'void' && <span className='betslip_open_bet_result betslip_open_bet_result_void'>Void / Refunded</span>}
                                {kind === 'cashed_out' && (
                                    <>
                                        <span className='betslip_open_bet_result betslip_open_bet_result_void'>Cashed out</span>
                                        {settleAmtFmt != null && <span className='betslip_settlement_amount'>₹{settleAmtFmt}</span>}
                                    </>
                                )}
                                {kind === 'closed' && <span className='betslip_open_bet_closed'>Settled</span>}
                            </div>
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
        if (isDemo) {
            alertErrorMessage('Demo mode: Log in to manage loss limits.')
            return
        }
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
    }, [isDemo])

    // Slip header odds: always mirror first selection (socket updates change selectedBets below).
    useEffect(() => {
        if (selectedBets.length > 0) {
            const first = selectedBets[0]
            const raw = first.oddsDisplay != null ? first.oddsDisplay : first.odds
            const num = Number(raw)
            if (!Number.isNaN(num) && num >= 1.01) setSlipOdds(num)
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
        { title: 'FIRST HALF GOALS 0.5', runnerLabels: ['Under 0.5 Goals', 'Over 0.5 Goals'] },
        { title: 'FIRST HALF GOALS 1.5', runnerLabels: ['Under 1.5 Goals', 'Over 1.5 Goals'] },
        { title: 'HALF TIME', runnerLabels: null },
        { title: 'OVER/UNDER 0.5 GOALS', runnerLabels: ['Under 0.5 Goals', 'Over 0.5 Goals'] },
        { title: 'OVER/UNDER 1.5 GOALS', runnerLabels: ['Under 1.5 Goals', 'Over 1.5 Goals'] },
        { title: 'OVER/UNDER 2.5 GOALS', runnerLabels: ['Under 2.5 Goals', 'Over 2.5 Goals'] },
        { title: 'OVER/UNDER 3.5 GOALS', runnerLabels: ['Under 3.5 Goals', 'Over 3.5 Goals'] },
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

    /** API alag-alag: match_odds / MATCH_ODDS / match-odds */
    const normSportsbookMarketType = (t) => (t || '').toString().toLowerCase().replace(/[\s_-]+/g, '')

    /**
     * Isi screen ke match + market ki open bets (cashout / P&L).
     * Backend kabhi gameId, kabhi eventId bet par rakhta hai — dono se match.
     * marketId bet par missing ho to sirf type se match (tab tak jab tak dono side par id na ho).
     */
    const openBetMatchesSection = (b, gid, sectionMarketId, sectionMarketType, evtId) => {
        if (!b) return false
        if (settlementKindFromBet(b) !== 'open') return false
        const betGid = String(b.gameId ?? b.game_id ?? '').trim()
        const betEid = String(b.eventId ?? b.event_id ?? '').trim()
        const pageGid = String(gid ?? '').trim()
        const pageEid = String(evtId ?? '').trim()
        const onSameEvent =
            (pageGid && betGid && betGid === pageGid) ||
            (pageGid && betEid && betEid === pageGid) ||
            (pageEid && betEid && betEid === pageEid) ||
            (pageEid && betGid && betGid === pageEid)
        if (!onSameEvent) return false

        const smid = sectionMarketId != null && sectionMarketId !== '' ? String(sectionMarketId).trim() : ''
        const bmidRaw = b.marketId ?? b.mid ?? b.market_id
        const bmid = bmidRaw != null && bmidRaw !== '' ? String(bmidRaw).trim() : ''
        if (smid && bmid && bmid !== smid) return false

        const smt = normSportsbookMarketType(sectionMarketType)
        const bmt = normSportsbookMarketType(b.marketType ?? b.market_type)
        if (smt && bmt && smt !== bmt) return false

        return true
    }

    const normSelectionLabel = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ')

    /** Agar yeh runner jeet jaye to net P/L (open bets, isi market) — exchange-style back/lay */
    const computeRunnerPlIfWins = (runnerName, betsInMarket) => {
        let pl = 0
        const rkey = normSelectionLabel(runnerName)
        for (const bet of betsInMarket) {
            const sel = normSelectionLabel(bet.selectionName)
            const s = Number(bet.stake) || 0
            const o = Number(bet.odds ?? bet.executedOdds) || 0
            const bt = String(bet.betType ?? bet.bet_type ?? 'back').toLowerCase()
            if (s <= 0 || o < 1.01) continue
            const onRunner = sel && rkey && (sel === rkey || sel.includes(rkey) || rkey.includes(sel))
            if (bt === 'lay') {
                if (onRunner) pl -= s * (o - 1)
                else pl += s
            } else {
                if (onRunner) pl += s * (o - 1)
                else pl -= s
            }
        }
        return pl
    }

    const renderOddsSection = (sectionKey, title, icon, fallbackMinMax, markets, marketTypeApi) => {
        if (!markets?.length) return null
        const market = markets[0]
        const limitsText =
            formatMinMaxLabel(market, limitsFallbackPayload) ||
            (typeof fallbackMinMax === 'string' && fallbackMinMax.trim()) ||
            ''
        const marketTitle = market?.marketName || market?.market || market?.name || title
        const marketId = pickMarketId(market)
        const oddList = getMarketOddList(market)
        if (!oddList.length) return null
        const isOpen = market.status !== 'CLOSED'
        const showMatchOddsPlColumn =
            (marketTypeApi === 'match_odds' || marketTypeApi === 'bookmaker') && oddList.length >= 2
        /** Cricket (/cricket): P/L column on every market table; tennis/football: match odds + bookmaker only */
        const showIndicatorPlColumn = sportName === 'cricket' || showMatchOddsPlColumn
        const sectionOpenBets = (openBetsList || []).filter((b) =>
            openBetMatchesSection(b, gameId, marketId, marketTypeApi, eventId)
        )
        // Mobile betslip should appear only in the block whose marketType matches the selected bet (cricket + soccer + tennis)
        const currentMarketType = selectedBets[0]?.placePayload?.marketType
        const isMatchOddsSection = sectionKey === 'match_odds' || sectionKey.startsWith('match_odds_') || sectionKey.startsWith('soccer_below_') || sectionKey.startsWith('tennis_extra_')
        const isBookmakerSection = sectionKey === 'bookmaker' || sectionKey.startsWith('bookmaker_')
        const isSlipForMatchOdds = isMatchOddsSection && currentMarketType === 'match_odds'
        const isSlipForBookmaker = isBookmakerSection && currentMarketType === 'bookmaker'
        const isSlipForMiniBookmaker = sectionKey.startsWith('mini_bookmaker') && currentMarketType === 'fancy'
        const showMobileSlipHere =
            isMobileBetslipOpen &&
            selectedBets.length > 0 &&
            (isSlipForMatchOdds || isSlipForBookmaker || isSlipForMiniBookmaker)

        const bookBets = collectBookBetsFromOpenAndSlip({
            openBetsInSection: sectionOpenBets,
            selectedBets,
            slipStake: stake,
            marketId,
            marketTypeApi,
        })

        return (
            <div key={sectionKey} className="odds_section_block">
                <div className="odds_section_header">
                    <span className="odds_section_title"><i className={icon} aria-hidden /> {marketTitle}</span>
                    <div className="odds_section_header_right d-flex align-items-center gap-2 flex-wrap">

                        {limitsText ? <span className="odds_section_limits">{limitsText}</span> : null}

                        <BookSummary marketTitle={marketTitle} bets={bookBets} />

                        {/* Temporarily disabled cashout and loss cut controls */}
                        {/* <div className='d-flex gap-2'>
                            <div className="odds_section_cashout_wrap">
                                <button
                                    type="button"
                                    className="odds_section_cashout_btn"
                                    onClick={handleCashoutClick}
                                    disabled={isDemo}
                                    title={isDemo ? 'Demo mode: View only' : undefined}
                                >
                                    {isDemo ? 'Cashout (Login to play)' : `Cashout : ₹${fmtCashoutRupee(sectionCashoutTotal)}`}
                                </button>
                                {openCashoutSection === sectionKey && hasMultipleBets && (
                                    <div className="odds_section_cashout_inline">
                                        {openBetsLoading ? (
                                            <p className="odds_section_popover_loading">Loading...</p>
                                        ) : (
                                            <div className="odds_section_popover_list">
                                                {gameBets.map((b) => {
                                                    const bidRaw = b._id ?? b.id
                                                    const bid = bidRaw != null && bidRaw !== '' ? String(bidRaw) : ''
                                                    const apiEntry = bid ? cashoutValuesMap[bid] : undefined
                                                    const rawVal = apiEntry?.value ?? cashoutValueFromBetObject(b) ?? b.cashout_value
                                                    const cashoutVal = rawVal != null ? Number(rawVal) : null
                                                    const stakeVal = Number(b.stake) || 0
                                                    const netCashout = cashoutVal != null ? Math.max(0, cashoutVal - stakeVal * CASHOUT_COMMISSION) : null
                                                    const suspended = apiEntry?.suspended === true || b.cashout_suspended === true || b.cashoutSuspended === true
                                                    const isCashingOut = bid && cashoutId != null && String(cashoutId) === bid
                                                    return (
                                                        <div key={bid || bidRaw} className="odds_section_popover_item">
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
                        </div> */}

                    </div>
                </div>
                <div className="odds_section_table_wrap">
                    <table
                        className={`odds_section_table${isOddsTableCompact ? ' odds_section_table_compact' : ''}${
                            showIndicatorPlColumn ? ' odds_section_table_with_pl' : ''
                        }`}
                    >
                        <thead>
                            <tr>
                                <th>Market</th>
                                <th className="odds_section_indicator_th odds_section_pl_header" scope="col" title="Profit / loss (betslip or open bets)">
                                    P/L
                                </th>
                                <th colSpan={isOddsTableCompact ? 1 : 3}>Back</th>
                                <th colSpan={isOddsTableCompact ? 1 : 3}>Lay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {oddList.map((odd, oIdx) => {
                                const name = odd.rname ?? odd.selectionName ?? odd.name ?? ''
                                const selId = pickSelectionId(odd)
                                const statusBanner = selectionStatusRowLabel(odd.status)
                                const backCols = isOddsTableCompact ? 1 : 3
                                const layCols = isOddsTableCompact ? 1 : 3
                                const oddsAreaColSpan = backCols + layCols
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
                                const pickSingleBestBack = (raw) => {
                                    const valid = raw.filter((c) => !isOddsLocked(c.odds))
                                    if (valid.length === 0) return [raw[0] ?? { odds: null, size: null }]
                                    return [valid.reduce((best, c) => (parseFloat(c.odds) > parseFloat(best.odds) ? c : best))]
                                }
                                const pickSingleBestLay = (raw) => {
                                    const valid = raw.filter((c) => !isOddsLocked(c.odds))
                                    if (valid.length === 0) return [raw[0] ?? { odds: null, size: null }]
                                    return [valid.reduce((best, c) => (parseFloat(c.odds) < parseFloat(best.odds) ? c : best))]
                                }
                                const backCells = isOddsTableCompact
                                    ? pickSingleBestBack(backCellsRaw)
                                    : [...backCellsRaw].sort(sortByOddsAsc)
                                const layCells = isOddsTableCompact
                                    ? pickSingleBestLay(layCellsRaw)
                                    : [...layCellsRaw].sort(sortByOddsAsc)
                                if (statusBanner) {
                                    const overlayText = formatStatusOverlayText(statusBanner)
                                    const overlayPriceCount = backCells.length + layCells.length
                                    return (
                                        <tr
                                            key={odd.sid ?? odd.selectionId ?? oIdx}
                                            className={`odds_section_row_status${statusBanner === 'Suspended' ? ' odds_section_row_status_suspended' : ''}`}
                                        >
                                            <td className="odds_section_market_name">{name}</td>
                                            <td className="odds_section_indicator_cell" aria-hidden />
                                            <td
                                                colSpan={oddsAreaColSpan}
                                                className="odds_section_status_overlay_td"
                                                style={{ '--odds-status-cols': String(overlayPriceCount) }}
                                            >
                                                <div className="odds_section_status_overlay_root">
                                                    <div className="odds_section_status_overlay_muted" aria-hidden>
                                                        <div className="odds_section_status_overlay_cells">
                                                            {backCells.map((cell, cIdx) => {
                                                                const locked = isOddsLocked(cell.odds)
                                                                if (locked) {
                                                                    return (
                                                                        <div key={`st-b-${cIdx}`} className="odds_section_cell odds_section_cell_back odds_section_status_overlay_cell">
                                                                            <span className="odds_section_locked"><i className="ri-lock-line" aria-hidden /></span>
                                                                        </div>
                                                                    )
                                                                }
                                                                return (
                                                                    <div key={`st-b-${cIdx}`} className="odds_section_cell odds_section_cell_back odds_section_status_overlay_cell">
                                                                        <button type="button" className="odds_section_btn odds_section_back" disabled tabIndex={-1}>
                                                                            <span className="odds_val">{cell.odds}</span>
                                                                            <span className="odds_size">{formatOddsSize(cell.size)}</span>
                                                                        </button>
                                                                    </div>
                                                                )
                                                            })}
                                                            {layCells.map((cell, cIdx) => {
                                                                const locked = isOddsLocked(cell.odds)
                                                                if (locked) {
                                                                    return (
                                                                        <div key={`st-l-${cIdx}`} className="odds_section_cell odds_section_cell_lay odds_section_status_overlay_cell">
                                                                            <span className="odds_section_locked"><i className="ri-lock-line" aria-hidden /></span>
                                                                        </div>
                                                                    )
                                                                }
                                                                return (
                                                                    <div key={`st-l-${cIdx}`} className="odds_section_cell odds_section_cell_lay odds_section_status_overlay_cell">
                                                                        <button type="button" className="odds_section_btn odds_section_lay" disabled tabIndex={-1}>
                                                                            <span className="odds_val">{cell.odds}</span>
                                                                            <span className="odds_size">{formatOddsSize(cell.size)}</span>
                                                                        </button>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="odds_section_status_overlay_scrim" aria-hidden />
                                                    <div className="odds_section_status_overlay_text">{overlayText}</div>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                }
                                /* match_odds_0 / soccer_below_* / tennis: sectionKey alag ho sakta hai */
                                const isMatchOdds =
                                    (marketTypeApi === 'match_odds' || marketTypeApi === 'bookmaker') && oddList.length >= 2
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
                                const plIfThisRunnerWins = isMatchOdds ? computeRunnerPlIfWins(name, sectionOpenBets) : 0
                                const showPlFromOpenBets =
                                    isMatchOdds &&
                                    !matchOddsBet &&
                                    sectionOpenBets.length > 0 &&
                                    (Math.abs(plIfThisRunnerWins) > 0.005)

                                const indicatorCellPlLarge =
                                    (showProfitOnThisRow && profitAmount != null && isLargePlRupeeAmount(profitAmount)) ||
                                    (showLossOnThisRow && lossAmount != null && isLargePlRupeeAmount(lossAmount)) ||
                                    (showPlFromOpenBets && isLargePlRupeeAmount(plIfThisRunnerWins))

                                // Mobile slip row colspan: Market + optional visible P/L + Back + Lay
                                const totalCols =
                                    (showIndicatorPlColumn ? 2 : 1) + backCells.length + layCells.length
                                const isMiniBookRowSelected =
                                    showMobileSlipHere &&
                                    sectionKey.startsWith('mini_bookmaker') &&
                                    selectedBets[0]?.betName === name &&
                                    selectedBets[0]?.market === market.market

                                return (
                                    <React.Fragment key={odd.sid ?? odd.selectionId ?? oIdx}>
                                        <tr>
                                            <td className="odds_section_market_name">{name}</td>
                                            <td
                                                className={`odds_section_indicator_cell${indicatorCellPlLarge ? ' odds_section_indicator_cell_pl_large' : ''}`}
                                            >
                                                {isMatchOdds && matchOddsBet && stakeNum > 0 && (
                                                    <>
                                                        {showProfitOnThisRow && profitAmount != null && (
                                                            <span
                                                                className={`odds_section_pl_box odds_section_pl_box_positive${isLargePlRupeeAmount(profitAmount) ? ' odds_section_pl_box_large' : ''}`}
                                                                title="Jit gaya to itna profit"
                                                            >
                                                                +₹{profitAmount.toFixed(2)}
                                                            </span>
                                                        )}
                                                        {showLossOnThisRow && lossAmount != null && (
                                                            <span
                                                                className={`odds_section_pl_box odds_section_pl_box_negative${isLargePlRupeeAmount(lossAmount) ? ' odds_section_pl_box_large' : ''}`}
                                                                title="Harega to itna loss"
                                                            >
                                                                −₹{lossAmount.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                                {showPlFromOpenBets && (
                                                    plIfThisRunnerWins >= 0 ? (
                                                        <span
                                                            className={`odds_section_pl_box odds_section_pl_box_positive${isLargePlRupeeAmount(plIfThisRunnerWins) ? ' odds_section_pl_box_large' : ''}`}
                                                            title="Is selection par open bets · agar yeh jeete"
                                                        >
                                                            +₹{plIfThisRunnerWins.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={`odds_section_pl_box odds_section_pl_box_negative${isLargePlRupeeAmount(plIfThisRunnerWins) ? ' odds_section_pl_box_large' : ''}`}
                                                            title="Is selection par open bets · agar yeh jeete"
                                                        >
                                                            −₹{Math.abs(plIfThisRunnerWins).toFixed(2)}
                                                        </span>
                                                    )
                                                )}
                                            </td>
                                            {backCells.map((cell, cIdx) => {
                                                const locked = isOddsLocked(cell.odds)
                                                const oddsStr = String(cell.odds ?? '')
                                                const placePayload = !locked && isOpen && gameId && marketId && selId ? { sport: sportName, gameId, eventName: eventNameForBets, marketType: marketTypeApi, marketId: String(marketId), marketName: marketTitle, selectionId: String(selId), selectionName: name, betType: 'back', odds: parseFloat(oddsStr) || 0 } : null
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
                                                const placePayloadLay = !locked && isOpen && gameId && marketId && selId ? { sport: sportName, gameId, eventName: eventNameForBets, marketType: marketTypeApi, marketId: String(marketId), marketName: marketTitle, selectionId: String(selId), selectionName: name, betType: 'lay', odds: parseFloat(oddsStr) || 0 } : null
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
                                                                                    disabled
                                                                                    aria-label="Decrease odds (disabled)"
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
                                                                                    disabled
                                                                                    aria-label="Increase odds (disabled)"
                                                                                >+</button>
                                                                            </div>
                                                                        </div>

                                                                        <div className="betslip_amount_section">
                                                                            <label className="betslip_label">Amount</label>
                                                                            <input
                                                                                className="betslip_amount_input"
                                                                                type="number"
                                                                                placeholder="0"
                                                                                min={effectiveStakeBounds.min}
                                                                                max={effectiveStakeBounds.max}
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
                                                                                onClick={() => setStake(prev => Math.min(effectiveStakeBounds.max, (Number(prev) || 0) + amt))}
                                                                            >
                                                                                +{amt >= 1000 ? (amt / 1000).toFixed(0) + ',' + (amt % 1000 ? String(amt).slice(-3) : '000') : amt}
                                                                            </button>
                                                                        ))}
                                                                    </div>

                                                                    <div className="betslip_actions">
                                                                        <button type="button" className="betslip_act_min" onClick={() => setStake(effectiveStakeBounds.min)}>MIN STAKE</button>
                                                                        <button type="button" className="betslip_act_max" onClick={() => setStake(effectiveStakeBounds.max)}>MAX STAKE</button>
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


                {showMobileSlipHere && (isMatchOddsSection || isBookmakerSection) && (
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
                                                disabled
                                                aria-label="Decrease odds (disabled)"
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
                                                disabled
                                                aria-label="Increase odds (disabled)"
                                            >+</button>
                                        </div>
                                    </div>

                                    <div className="betslip_amount_section">
                                        <label className="betslip_label">Amount</label>
                                        <input
                                            className="betslip_amount_input"
                                            type="number"
                                            placeholder="0"
                                            min={effectiveStakeBounds.min}
                                            max={effectiveStakeBounds.max}
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
                                            onClick={() => setStake(prev => Math.min(effectiveStakeBounds.max, (Number(prev) || 0) + amt))}
                                        >
                                            +{amt >= 1000 ? (amt / 1000).toFixed(0) + ',' + (amt % 1000 ? String(amt).slice(-3) : '000') : amt}
                                        </button>
                                    ))}
                                </div>

                                <div className="betslip_actions">
                                    <button type="button" className="betslip_act_min" onClick={() => setStake(effectiveStakeBounds.min)}>MIN STAKE</button>
                                    <button type="button" className="betslip_act_max" onClick={() => setStake(effectiveStakeBounds.max)}>MAX STAKE</button>
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
    const isOddsLocked = isOddsValueLocked

    // Socket `oddsData` refresh → same betslip selection, latest ladder price (match odds / bookmaker / fancy).
    useEffect(() => {
        if (!oddsData) return
        setSelectedBets((prev) => {
            if (prev.length === 0) return prev
            const bet = prev[0]
            if (!bet.placePayload) return prev
            const r = resolveSlipOddsFromOddsData(oddsData, bet, isOddsTableCompact, isOddsValueLocked)
            if (!r) return prev
            const cur = Number(bet.oddsDisplay ?? bet.odds)
            if (Number.isFinite(cur) && Math.abs(cur - r.oddsNum) < 1e-6) return prev
            return [{
                ...bet,
                odds: r.oddsNum,
                oddsDisplay: r.oddsStr,
                placePayload: { ...bet.placePayload, odds: r.oddsNum },
            }]
        })
    }, [oddsData, isOddsTableCompact])

    // Neeche: SESSIONS / W/P MARKET / EXTRA MARKET – API se (fancyOdds / otherMarketOdds). Static data nahi.
    const buildNoYesRowsFromMarkets = (markets, marketType = 'fancy') => {
        if (!markets?.length) return []
        const rows = []
        markets.forEach((m) => {
            const oddList = toOddDatasArray(m.oddDatas)
            const marketId = pickMarketId(m)
            const marketName = m.marketName || m.market || m.name || 'Market'
            const pushOneLineRow = (o) => {
                rows.push({
                    label: o.rname ?? o.selectionName ?? marketName,
                    noOdds: o.l1 ?? '—',
                    noSize: o.ls1 ?? '—',
                    yesOdds: o.b1 ?? '—',
                    yesSize: o.bs1 ?? '—',
                    limitsLine: formatMinMaxLabel(m, limitsFallbackPayload),
                    marketId,
                    marketName,
                    marketType,
                    noSid: pickSelectionId(o),
                    yesSid: pickSelectionId(o),
                    rowStatusText: selectionStatusRowLabel(o?.status),
                })
            }
            if (oddList.length > 2) {
                oddList.forEach(pushOneLineRow)
            } else if (oddList.length === 2) {
                const n0 = String(oddList[0]?.rname ?? oddList[0]?.selectionName ?? '').trim()
                const n1 = String(oddList[1]?.rname ?? oddList[1]?.selectionName ?? '').trim()
                const pairedNoYes =
                    /^(no|yes|n\/a)$/i.test(n0) ||
                    /^(no|yes|n\/a)$/i.test(n1) ||
                    (n0.toLowerCase() === 'no' && n1.toLowerCase() === 'yes') ||
                    (n0.toLowerCase() === 'yes' && n1.toLowerCase() === 'no')
                if (pairedNoYes) {
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
                        limitsLine: formatMinMaxLabel(m, limitsFallbackPayload),
                        marketId,
                        marketName,
                        marketType,
                        noSid: pickSelectionId(noSel),
                        yesSid: pickSelectionId(yesSel),
                        rowStatusText:
                            selectionStatusRowLabel(noSel?.status) ||
                            selectionStatusRowLabel(yesSel?.status),
                    })
                } else {
                    oddList.forEach(pushOneLineRow)
                }
            } else if (oddList.length === 1) {
                const o = oddList[0]
                pushOneLineRow(o)
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
            const marketId = pickMarketId(m)
            const marketName = m.marketName || m.market || m.name || 'Market'
            const oddList = toOddDatasArray(m.oddDatas)
            const rows = oddList.map((o) => ({
                label: o.rname ?? o.selectionName ?? '—',
                backOdds: o.b1 ?? '—',
                backSize: o.bs1 ?? '—',
                selectionId: pickSelectionId(o),
                rowStatusText: selectionStatusRowLabel(o?.status),
            }))
            const allLocked = rows.every((r) => isOddsLocked(r.backOdds))
            return {
                key: marketId || marketName,
                marketId,
                title: marketName,
                marketType: 'fancy',
                minMax: formatMinMaxLabel(m, limitsFallbackPayload),
                rows,
                isLocked: allLocked,
            }
        })
    }

    const sessionsRows = buildNoYesRowsFromMarkets(oddsData?.fancyOddsSessions ?? [], 'fancy')
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
                        const rowSectionBets = (openBetsList || []).filter((b) =>
                            openBetMatchesSection(b, gameId, row.marketId, row.marketType || 'fancy', eventId)
                        )
                        const rowBookBets = collectBookBetsFromOpenAndSlip({
                            openBetsInSection: rowSectionBets,
                            selectedBets,
                            slipStake: stake,
                            marketId: row.marketId,
                            marketTypeApi: row.marketType || 'fancy',
                        })
                        const noLocked = isOddsLocked(row.noOdds)
                        const yesLocked = isOddsLocked(row.yesOdds)
                        const yesOddsStr = String(row.yesOdds ?? '')
                        const noOddsStr = String(row.noOdds ?? '')
                        const yesElementId = `${sectionKey}-${row.marketId || rIdx}-yes`
                        const noElementId = `${sectionKey}-${row.marketId || rIdx}-no`
                        const canPlaceYes = !yesLocked && gameId && row.marketId && row.yesSid != null && row.yesSid !== ''
                        const canPlaceNo = !noLocked && gameId && row.marketId && row.noSid != null && row.noSid !== ''
                        const yesPayload = canPlaceYes ? {
                            sport: sportName,
                            gameId,
                            eventName: eventNameForBets,
                            marketType: row.marketType || 'fancy',
                            marketId: String(row.marketId),
                            marketName: row.marketName || row.label || 'Market',
                            selectionId: String(row.yesSid),
                            selectionName: row.label,
                            betType: 'back',
                            odds: parseFloat(yesOddsStr) || 0,
                        } : null
                        const noPayload = canPlaceNo ? {
                            sport: sportName,
                            gameId,
                            eventName: eventNameForBets,
                            marketType: row.marketType || 'fancy',
                            marketId: String(row.marketId),
                            marketName: row.marketName || row.label || 'Market',
                            selectionId: String(row.noSid),
                            selectionName: row.label,
                            betType: 'lay',
                            odds: parseFloat(noOddsStr) || 0,
                        } : null
                        return (
                            <div key={rIdx} className="market_no_yes_row">
                                <div className="market_no_yes_label">{row.label}</div>
                              
                                <div className="market_no_yes_limits_container d-flex justify-content-between">
                                    {row.limitsLine ? (
                                        <div className="market_no_yes_limits">{row.limitsLine}</div>
                                    ) : null}
                                    <div className="market_no_yes_odds_container">
                                        <BookSummary
                                            marketTitle={row.label || row.marketName || 'Market'}
                                            bets={rowBookBets}
                                            buttonClassName="market_no_yes_book_btn"
                                        />
                                        {row.rowStatusText ? (
                                            <div
                                                className={`market_no_yes_odds_overlay_wrap${row.rowStatusText === 'Suspended' ? ' market_no_yes_odds_overlay_wrap_suspended' : ''}`}
                                            >
                                                <div className="market_no_yes_odds_overlay_muted" aria-hidden>
                                        <div className="market_no_yes_odds">
                                                        <button
                                                            type="button"
                                                            className={`market_no_yes_btn market_yes_btn ${yesLocked ? 'locked' : ''}`}
                                                            disabled
                                                            tabIndex={-1}
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
                                                        <button
                                                            type="button"
                                                            className={`market_no_yes_btn market_no_btn ${noLocked ? 'locked' : ''}`}
                                                            disabled
                                                            tabIndex={-1}
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
                                                <div className="market_no_yes_odds_overlay_scrim" aria-hidden />
                                                <div className="market_no_yes_odds_overlay_text">{formatStatusOverlayText(row.rowStatusText)}</div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="market_no_yes_odds">
                                                    {/* <span className="market_no_yes_lbl">Yes</span> */}
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
                                                    {/* <span className="market_no_yes_lbl">No</span> */}
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
                                            </>
                                        )}

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
        const blockSectionBets = (openBetsList || []).filter((b) =>
            openBetMatchesSection(b, gameId, marketId, marketType || 'fancy', eventId)
        )
        const blockBookBets = collectBookBetsFromOpenAndSlip({
            openBetsInSection: blockSectionBets,
            selectedBets,
            slipStake: stake,
            marketId,
            marketTypeApi: marketType || 'fancy',
        })
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
                    <div className="market_back_only_header_right d-flex align-items-center gap-2 flex-wrap">
                        {minMax ? <span className="market_back_only_limits">{minMax}</span> : null}
                        <BookSummary marketTitle={title} bets={blockBookBets} />
                    </div>
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
                        const canPlaceBack = !backLocked && gameId && marketId && row.selectionId != null && row.selectionId !== ''
                        const backPayload = canPlaceBack ? {
                            sport: sportName,
                            gameId,
                            eventName: eventNameForBets,
                            marketType: marketType || 'fancy',
                            marketId: String(marketId),
                            marketName: title,
                            selectionId: String(row.selectionId),
                            selectionName: row.label,
                            betType: 'back',
                            odds: parseFloat(backOddsStr) || 0,
                        } : null
                        if (row.rowStatusText) {
                            return (
                                <div
                                    key={rIdx}
                                    className={`market_back_only_row market_back_only_row_overlay${row.rowStatusText === 'Suspended' ? ' market_back_only_row_overlay_suspended' : ''}`}
                                >
                                    <span className="market_back_only_label">{row.label}</span>
                                    <div className="market_back_only_cell market_back_only_overlay_wrap">
                                        <div className="market_back_only_overlay_muted" aria-hidden>
                                            {backLocked ? (
                                                <span className="market_no_yes_locked"><i className="ri-lock-line" aria-hidden /></span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={`market_no_yes_btn market_yes_btn ${isBetSelected(row.label, title, backOddsStr, backElementId) ? 'selected' : ''}`}
                                                    disabled
                                                    tabIndex={-1}
                                                >
                                                    <span className="odds_val">{row.backOdds}</span>
                                                    <span className="odds_size">{formatOddsSize(row.backSize)}</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="market_back_only_overlay_scrim" aria-hidden />
                                        <div className="market_back_only_overlay_text">{formatStatusOverlayText(row.rowStatusText)}</div>
                                    </div>
                                </div>
                            )
                        }
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

    // Loss limit + exposure: ek effect (pehle mount + slip/tab dono par alag-alag = duplicate GET)
    useEffect(() => {
        if (isDemo) {
                setBetslipLossLimit(null)
                setBetslipExposure(null)
                setBetslipCurrentLoss(null)
            return
        }
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
        return () => {
            cancelled = true
        }
    }, [isDemo])

    useEffect(() => {
        if (platformConfig.sportsBookServiceStatus === false || platformConfig.inPlayServiceStatus === false) {
            alertErrorMessage('Sports / In-Play is temporarily unavailable. Please try again later.')
        }
    }, [platformConfig.sportsBookServiceStatus, platformConfig.inPlayServiceStatus])

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
            {professorTvIframeUrl && sportName === 'cricket' && (
                <div className='match_tv_iframe_wrap rightside_iframe'>
                    <button
                        type="button"
                        className={`match_tv_iframe_header match_tv_iframe_header_btn ${isLiveTvDropdownOpen ? 'open' : ''}`}
                        onClick={() => setIsLiveTvDropdownOpen((v) => !v)}
                        aria-expanded={isLiveTvDropdownOpen ? 'true' : 'false'}
                    >
                        <span>Live TV</span>
                        <i className={`ri-arrow-${isLiveTvDropdownOpen ? 'up' : 'down'}-s-line`} aria-hidden />
                    </button>
                    {isLiveTvDropdownOpen && (
                        <iframe
                            title='Professorji Live TV'
                            src={professorTvIframeUrl}
                            className='match_tv_iframe'
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                            allowFullScreen
                        />
                    )}
                </div>
            )}
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
                                            if (professorScoreIframeUrl) {
                                                return (
                                                    <div className="match_tv_iframe_wrap cricket_score_iframe_wrap">
                                                        <button
                                                            type="button"
                                                            className={`match_tv_iframe_header match_tv_iframe_header_btn ${isLiveScoreDropdownOpen ? 'open' : ''}`}
                                                            onClick={() => setIsLiveScoreDropdownOpen((v) => !v)}
                                                            aria-expanded={isLiveScoreDropdownOpen ? 'true' : 'false'}
                                                        >
                                                            <span>Live Score</span>
                                                            <i className={`ri-arrow-${isLiveScoreDropdownOpen ? 'up' : 'down'}-s-line`} aria-hidden />
                                                        </button>
                                                        {isLiveScoreDropdownOpen && (
                                                            <iframe
                                                                title={sportName === 'cricket' ? 'Professorji Scorecard' : 'Live score'}
                                                                src={professorScoreIframeUrl}
                                                                className='match_tv_iframe'
                                                                style={{ minHeight: '420px', background: '#1a2332' }}
                                                            />
                                                        )}
                                                    </div>
                                                )
                                            }
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
                                                    <div className='cricket_live_center flex_direction_column'>
                                                        <span className='cricket_live_toss'>{statusText}</span>
                                                        <div className='cricket_live_over_box desktop_view'>{overStr}</div>
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

                                                    <li className={activeTab !== 'open-bets' ? 'active' : ''}>
                                                        <button type="button" onClick={() => setActiveTab('all')}>Markets</button>
                                                    </li>
                                                    <li className={`open_bets_tab ${activeTab === 'open-bets' ? 'active' : ''}`}>
                                                        <button type="button" onClick={() => setActiveTab('open-bets')}>OPEN BETS ({openBetsCount})</button>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className='match_summary_content_tabs'>
                                                {activeTab !== 'open-bets' && (
                                                    <>
                                                        {oddsLoading && gameId && (
                                                            <div className='match_block' style={{ padding: '1rem', color: 'var(--text-secondary, #888)' }}>Loading odds...</div>
                                                        )}
                                                        {!oddsLoading && oddsData && (oddsData.marketClosed || !oddsData.matchOdds?.length) && (
                                                            <div className='match_block odds_market_closed' style={{ padding: '1rem', color: 'var(--text-secondary, #888)', textAlign: 'center' }}>Market closed</div>
                                                        )}
                                                        {!oddsLoading && oddsData && !oddsData.marketClosed && oddsData.matchOdds?.length > 0 && (sportName === 'soccer' || sportName === 'tennis') ? (
                                                            <>
                                                                {oddsData?.matchOdds?.[0] && renderOddsSection('match_odds_0', oddsData.matchOdds[0].marketName || oddsData.matchOdds[0].market || 'MATCH ODDS', 'ri-settings-3-line', '', [oddsData.matchOdds[0]], 'match_odds')}
                                                                {oddsData?.bookMakerOdds?.length > 0
                                                                    ? oddsData.bookMakerOdds.map((m, i) =>
                                                                        renderOddsSection(
                                                                            `bookmaker_${i}`,
                                                                            m.marketName || m.market || 'BOOKMAKER',
                                                                            'ri-settings-3-line',
                                                                            '',
                                                                            [m],
                                                                            'bookmaker'
                                                                        )
                                                                    )
                                                                    : (() => {
                                                                        const firstMarket = oddsData?.matchOdds?.[0]
                                                                        const runners = (firstMarket && (Array.isArray(firstMarket.runners) ? firstMarket.runners : toOddDatasArray(firstMarket.oddDatas))) || []
                                                                        const lockedRunners = runners.length
                                                                            ? runners.map((r) => ({ ...r, rname: r.rname ?? r.selectionName ?? r.name ?? '—', b1: null, b2: null, b3: null, l1: null, l2: null, l3: null }))
                                                                            : [{ rname: '—', selectionName: '—', b1: null, l1: null }, { rname: '—', selectionName: '—', b1: null, l1: null }, { rname: '—', selectionName: '—', b1: null, l1: null }]
                                                                        const dummyMarket = { mid: 'bookmaker-empty', marketId: 'bookmaker-empty', market: 'BOOKMAKER', status: 'CLOSED', runners: lockedRunners }
                                                                        return renderOddsSection('bookmaker', 'BOOKMAKER', 'ri-settings-3-line', '', [dummyMarket], 'bookmaker')
                                                                    })()}
                                                                {/* Tennis: API se aaye extra markets – Set Betting, Total Games, etc. */}
                                                                {sportName === 'tennis' && (() => {
                                                                    const extra = [
                                                                        ...(oddsData?.matchOdds?.length > 1 ? oddsData.matchOdds.slice(1) : []),
                                                                        ...(oddsData?.otherMarketOdds ?? []),
                                                                    ]
                                                                    return extra.map((m, idx) => {
                                                                        const title = m.marketName || m.market || `Market ${idx + 1}`
                                                                        return renderOddsSection(`tennis_extra_${idx}`, title, 'ri-settings-3-line', '', [m], 'match_odds')
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
                                                                                '',
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
                                                                        return renderOddsSection(`soccer_below_${idx}`, def.title, 'ri-settings-3-line', '', [dummyMarket], 'match_odds')
                                                                    })
                                                                })()}
                                                                {(oddsData?.fancyOdds?.length > 0 || oddsData?.premiumFancy?.length > 0) &&
                                                                    (oddsData.fancyOdds?.length ? oddsData.fancyOdds : oddsData.premiumFancy).map((m, i) =>
                                                                        renderOddsSection(
                                                                            `mini_bookmaker_${i}`,
                                                                            m.marketName || m.market || 'MINI BOOKMAKER',
                                                                            'ri-tools-line',
                                                                            '',
                                                                            [m],
                                                                            'fancy'
                                                                        )
                                                                    )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {!oddsData?.marketClosed &&
                                                                    oddsData?.matchOdds?.length > 0 &&
                                                                    oddsData.matchOdds.map((m, i) =>
                                                                        renderOddsSection(
                                                                            `match_odds_${i}`,
                                                                            m.marketName || m.market || 'MATCH ODDS',
                                                                            'ri-rocket-line',
                                                                            '',
                                                                            [m],
                                                                            'match_odds'
                                                                        )
                                                                    )}
                                                                {!oddsData?.marketClosed &&
                                                                    oddsData?.bookMakerOdds?.length > 0 &&
                                                                    oddsData.bookMakerOdds.map((m, i) =>
                                                                        renderOddsSection(
                                                                            `bookmaker_${i}`,
                                                                            m.marketName || m.market || 'BOOKMAKER',
                                                                            'ri-tools-line',
                                                                            '',
                                                                            [m],
                                                                            'bookmaker'
                                                                        )
                                                                    )}
                                                                {!oddsData?.marketClosed &&
                                                                    (oddsData?.fancyOdds?.length > 0 || oddsData?.premiumFancy?.length > 0) &&
                                                                    (oddsData.fancyOdds?.length ? oddsData.fancyOdds : oddsData.premiumFancy).map((m, i) =>
                                                                        renderOddsSection(
                                                                            `mini_bookmaker_${i}`,
                                                                            m.marketName || m.market || 'MINI BOOKMAKER',
                                                                            'ri-tools-line',
                                                                            '',
                                                                            [m],
                                                                            'fancy'
                                                                        )
                                                                    )}
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
                                                    const marketId = pickMarketId(market)
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
                                                                    const sidMo = pickSelectionId(odd)
                                                                    const placeBack = !backLocked && gameId && marketId && sidMo ? { sport: 'cricket', gameId, eventName: eventNameForBets, marketType: 'match_odds', marketId: String(marketId), selectionId: String(sidMo), selectionName: name, betType: 'back', odds: parseFloat(backOdds) || 0 } : null
                                                                    const placeLay = !layLocked && gameId && marketId && sidMo ? { sport: 'cricket', gameId, eventName: eventNameForBets, marketType: 'match_odds', marketId: String(marketId), selectionId: String(sidMo), selectionName: name, betType: 'lay', odds: parseFloat(layOdds) || 0 } : null
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
                            >                                (OPEN BETS ({openBetsCount})
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
                                                    <span className='betslip_match_title'>{eventNameForBets}</span>
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
                                            <button type='button' className='betslip_odd_btn' disabled aria-label='Decrease odds (disabled)'>−</button>
                                            <input
                                                type='text'
                                                className='betslip_odd_input'
                                                value={selectedBets.length > 0 ? (Number(slipOdds ?? selectedBets[0]?.oddsDisplay ?? selectedBets[0]?.odds) || 0).toFixed(2) : '0.00'}
                                                readOnly
                                            />
                                            <button type='button' className='betslip_odd_btn' disabled aria-label='Increase odds (disabled)'>+</button>
                                        </div>
                                    </div>

                                    <div className='betslip_amount_section'>
                                        <label className='betslip_label'>Amount</label>
                                        <input
                                            type='number'
                                            className='betslip_amount_input'
                                            placeholder='0'
                                            min={effectiveStakeBounds.min}
                                            max={effectiveStakeBounds.max}
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
                                            <button key={amt} type='button' className='betslip_quick_btn' onClick={() => setStake(prev => Math.min(effectiveStakeBounds.max, (Number(prev) || 0) + amt))}>
                                                +{amt >= 1000 ? (amt / 1000).toFixed(0) + ',' + (amt % 1000 ? String(amt).slice(-3) : '000') : amt}
                                            </button>
                                        ))}
                                    </div>

                                    <div className='betslip_actions'>
                                        <button type='button' className='betslip_act_min' onClick={() => setStake(effectiveStakeBounds.min)}>MIN STAKE</button>
                                        <button type='button' className='betslip_act_max' onClick={() => setStake(effectiveStakeBounds.max)}>MAX STAKE</button>
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

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './sportsGame.css'
import MobileMenu from '../customComponents/MobileMenu'
import { getMatchRowsFromSocketPayload, expandSocketBatchPayload } from '../utils/sportsbookMatchesPayload'
import { usePlatformConfig } from '../context/PlatformConfigContext'
import { alertErrorMessage } from '../customComponents/CustomAlertMessage'
import {
    addMatchesListener,
    removeMatchesListener,
    subscribeMatches,
    unsubscribeMatches,
} from '../socket/sportsbookSocket'
import {
    getMarketPillsFromSources,
    getMatchStreamVisible,
} from '../utils/matchMarketPills'

const GALLERY_SLIDES = ['images/sports_slider_img2.png', 'images/sports_slider_img.png', 'images/sports_slider_img3.png']
const GALLERY_SLIDES_MOBILE = ['images/sports_bnr_mobile2.jpg', 'images/sports_bnr_mobile.jpg', 'images/sports_bnr_mobile3.jpg']
const TABS = [
    { id: 'cricket', label: 'Cricket', icon: 'images/menu-icon19.svg' },
    { id: 'tennis', label: 'Tennis', icon: 'images/menu-icon20.svg' },
    { id: 'soccer', label: 'Football', icon: 'ri-football-line' },
    { id: 'sportsbook', label: 'Sportsbook', icon: 'ri-book-open-line', to: '/sportsbook' },
]

const NO_MATCHES_MSG = () => 'No matches available'

function toOddDatasArray(oddDatas) {
    if (!oddDatas) return []
    if (Array.isArray(oddDatas)) return oddDatas
    if (typeof oddDatas === 'object') return Object.values(oddDatas).filter(Boolean)
    return []
}

function getRunnerOrSelectionLabel(x) {
    if (!x || typeof x !== 'object') return ''
    return String(x.selectionName ?? x.name ?? x.runnerName ?? x.selectionId ?? '').trim()
}

function isDrawName(name) {
    const n = String(name || '').toLowerCase()
    if (!n) return false
    if (n === 'draw' || n === 'tie' || n === 'the draw' || n === 'x') return true
    if (n.includes('draw') && !n.includes('withdraw') && !n.includes('w/d')) return true
    return false
}

/** Map list to [ home/1, draw/X, away/2 ] for match-odds / listSummary. */
function orderFor1x2(list, getLabel) {
    const items = Array.isArray(list) ? list.filter(Boolean) : []
    if (items.length === 0) return [null, null, null]
    if (items.length === 1) return [items[0], null, null]
    const drawIdx = items.findIndex((x) => isDrawName(getLabel(x)))
    if (items.length === 2) {
        if (drawIdx === 0) return [null, items[0], items[1]]
        if (drawIdx === 1) return [items[0], items[1], null]
        return [items[0], null, items[1]]
    }
    if (drawIdx >= 0) {
        const rest = items.filter((_, i) => i !== drawIdx)
        return [rest[0] ?? null, items[drawIdx], rest[1] ?? null]
    }
    return [items[0], items[1] ?? null, items[2] ?? null]
}

function firstLadderPrice(rung) {
    if (!rung || typeof rung !== 'object') return null
    const open = rung.open !== false
    const p = rung.price
    return open && p != null ? p : null
}

function emptyOddsLadderCell() {
    return { price: null, sizeFormatted: '—' }
}

const B_KEYS = ['b1', 'b2', 'b3']
const BS_KEYS = ['bs1', 'bs2', 'bs3']
const L_KEYS = ['l1', 'l2', 'l3']
const LS_KEYS = ['ls1', 'ls2', 'ls3']

function runnerBackCellAtRung(runner, rungIdx, isOddsValid, formatOddsSize) {
    if (!runner || typeof runner !== 'object') return emptyOddsLadderCell()
    let price = runner[B_KEYS[rungIdx]] ?? runner[`back${rungIdx + 1}`] ?? null
    let stack = runner[BS_KEYS[rungIdx]] ?? null
    const arr = Array.isArray(runner.back) ? runner.back : null
    if (arr?.[rungIdx]) {
        const p = firstLadderPrice(arr[rungIdx])
        if (p != null) price = p
        if (stack == null) stack = arr[rungIdx]?.stack
    }
    if (price == null && rungIdx === 0) {
        if (typeof runner.back === 'number' || typeof runner.back === 'string') price = runner.back
    }
    const valid = price != null && isOddsValid(price)
    return {
        price: valid ? price : null,
        sizeFormatted: valid ? formatOddsSize(stack ?? runner.size) : '—',
    }
}

function runnerLayCellAtRung(runner, rungIdx, isOddsValid, formatOddsSize) {
    if (!runner || typeof runner !== 'object') return emptyOddsLadderCell()
    let price = runner[L_KEYS[rungIdx]] ?? runner[`lay${rungIdx + 1}`] ?? null
    let stack = runner[LS_KEYS[rungIdx]] ?? null
    const arr = Array.isArray(runner.lay) ? runner.lay : null
    if (arr?.[rungIdx]) {
        const p = firstLadderPrice(arr[rungIdx])
        if (p != null) price = p
        if (stack == null) stack = arr[rungIdx]?.stack
    }
    if (price == null && rungIdx === 0) {
        if (typeof runner.lay === 'number' || typeof runner.lay === 'string') price = runner.lay
    }
    const valid = price != null && isOddsValid(price)
    return {
        price: valid ? price : null,
        sizeFormatted: valid ? formatOddsSize(stack ?? runner.size) : '—',
    }
}

function selectionBackCellAtRung(sel, rungIdx, isOddsValid, formatOddsSize) {
    if (!sel || typeof sel !== 'object') return emptyOddsLadderCell()
    const br = Array.isArray(sel.back) ? sel.back[rungIdx] : null
    if (br) {
        const open = br.open !== false
        const bp = open && br.price != null ? br.price : null
        const valid = bp != null && isOddsValid(bp)
        return {
            price: valid ? bp : null,
            sizeFormatted: valid ? formatOddsSize(br.stack) : '—',
        }
    }
    if (rungIdx === 0) {
        const p = sel.b1 ?? sel.back1
        if (p != null && isOddsValid(p)) {
            return { price: p, sizeFormatted: formatOddsSize(sel.bs1 ?? sel.stack) }
        }
    }
    return emptyOddsLadderCell()
}

function selectionLayCellAtRung(sel, rungIdx, isOddsValid, formatOddsSize) {
    if (!sel || typeof sel !== 'object') return emptyOddsLadderCell()
    const lr = Array.isArray(sel.lay) ? sel.lay[rungIdx] : null
    if (lr) {
        const open = lr.open !== false
        const lp = open && lr.price != null ? lr.price : null
        const valid = lp != null && isOddsValid(lp)
        return {
            price: valid ? lp : null,
            sizeFormatted: valid ? formatOddsSize(lr.stack) : '—',
        }
    }
    if (rungIdx === 0) {
        const p = sel.l1 ?? sel.lay1
        if (p != null && isOddsValid(p)) {
            return { price: p, sizeFormatted: formatOddsSize(sel.ls1 ?? sel.stack) }
        }
    }
    return emptyOddsLadderCell()
}

/** Desktop list: screenshot-style 1X2 (top back/lay only). */
function computeTop1x2Cells(match, odds, isOddsValid, formatOddsSize) {
    const empty = { back: emptyOddsLadderCell(), lay: emptyOddsLadderCell() }
    const mapOrdered = (ordered, useRunnerFns) =>
        ordered.map((node) => {
            if (!node) return empty
            const back = useRunnerFns
                ? runnerBackCellAtRung(node, 0, isOddsValid, formatOddsSize)
                : selectionBackCellAtRung(node, 0, isOddsValid, formatOddsSize)
            const lay = useRunnerFns
                ? runnerLayCellAtRung(node, 0, isOddsValid, formatOddsSize)
                : selectionLayCellAtRung(node, 0, isOddsValid, formatOddsSize)
            return { back, lay }
        })

    const matchOddsArr = Array.isArray(odds?.matchOdds)
        ? odds.matchOdds
        : Array.isArray(odds?.match_odds)
          ? odds.match_odds
          : null
    if (matchOddsArr?.length) {
        const market = matchOddsArr[0]
        const runners = Array.isArray(market.runners) ? market.runners : toOddDatasArray(market.oddDatas)
        if (runners.length) return mapOrdered(orderFor1x2(runners, getRunnerOrSelectionLabel), true)
    }

    const selections = Array.isArray(match?.selections) ? match.selections : []
    if (selections.length) return mapOrdered(orderFor1x2(selections, getRunnerOrSelectionLabel), false)

    return [empty, empty, empty]
}

function formatMatchTime(isoStr) {
    if (!isoStr) return ''
    try {
        const d = new Date(isoStr)
        if (isNaN(d.getTime())) return isoStr
        const today = new Date()
        const isToday = d.toDateString() === today.toDateString()
        const dateStr = isToday ? 'Today' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        return `${dateStr} ${timeStr}`
    } catch {
        return isoStr
    }
}

function getDayGroup(isoStr) {
    if (!isoStr) return ''
    try {
        const d = new Date(isoStr)
        if (isNaN(d.getTime())) return ''
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        if (d.toDateString() === today.toDateString()) return 'Today'
        if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
        return d.toLocaleDateString('en-IN', { weekday: 'long' })
    } catch {
        return ''
    }
}

function formatOddsSize(size) {
    if (size == null || size === '') return '0.00'
    const n = Number(size)
    if (!Number.isFinite(n)) return String(size)
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 2)}K`
    return n % 1 === 0 ? String(n) : n.toFixed(2)
}

function getSportsOddsScrollKey(tab, match, day, idx) {
    return `${tab}-${match.eventId ?? match.gameId ?? `${day}-${idx}`}`
}

function SportsGame() {
    const navigate = useNavigate()
    const { config: platformConfig } = usePlatformConfig()
    const [activeTab, setActiveTab] = useState('cricket')
    const [currentSlide, setCurrentSlide] = useState(0)
    const [arrowsVisible, setArrowsVisible] = useState(false)
    const sliderRef = useRef(null)
    const bannerSwipeRef = useRef({ startX: 0 })
    const touchHideTimerRef = useRef(null)

    const [cricketMatches, setCricketMatches] = useState([])
    const [tennisMatches, setTennisMatches] = useState([])
    const [soccerMatches, setSoccerMatches] = useState([])
    const [cricketMatchesLoading, setCricketMatchesLoading] = useState(true)
    const [tennisMatchesLoading, setTennisMatchesLoading] = useState(true)
    const [soccerMatchesLoading, setSoccerMatchesLoading] = useState(true)
    const sportsOddsScrollRefs = useRef(new Map())
    const isSyncingSportsOddsScrollRef = useRef(false)
    const [searchParams] = useSearchParams()
    const filterFromUrl = searchParams.get('filter') || ''
    /** Per sport, same as home: toggle + Live / Virtual / Premium (no separate All). */
    const [sportsFiltersByTab, setSportsFiltersByTab] = useState({
        cricket: 'all',
        tennis: 'all',
        soccer: 'all',
    })
    useEffect(() => {
        if (filterFromUrl === 'live') {
            setSportsFiltersByTab({ cricket: 'live', tennis: 'live', soccer: 'live' })
        }
    }, [filterFromUrl])

    const sportsFilter =
        activeTab === 'tennis'
            ? sportsFiltersByTab.tennis
            : activeTab === 'soccer'
              ? sportsFiltersByTab.soccer
              : sportsFiltersByTab.cricket

    const toggleSportsFilter = useCallback(
        (value) => {
            setSportsFiltersByTab((prev) => {
                const tab =
                    activeTab === 'tennis' ? 'tennis' : activeTab === 'soccer' ? 'soccer' : 'cricket'
                const cur = prev[tab] ?? 'all'
                const next = cur === value ? 'all' : value
                return { ...prev, [tab]: next }
            })
        },
        [activeTab],
    )

    const sortLiveFirst = useCallback(
        (list) => [...list].sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0)),
        [],
    )

    const hasTagInMatch = useCallback((match, tag) => {
        const badgeText = Array.isArray(match?.marketBadges) ? match.marketBadges.join(' ') : ''
        const marketText = Array.isArray(match?.markets)
            ? match.markets.map((m) => `${m?.marketName ?? ''} ${m?.market ?? ''}`).join(' ')
            : ''
        const fullText = `${badgeText} ${marketText} ${match?.tournament ?? ''} ${match?.teams ?? ''} ${match?.category ?? ''}`.toLowerCase()
        return fullText.includes(tag)
    }, [])

    const filterSportsMatches = useCallback(
        (matches, filterValue) => {
            if (filterValue === 'live') return matches.filter((m) => m.inPlay)
            if (filterValue === 'virtual') return matches.filter((m) => hasTagInMatch(m, 'virtual'))
            if (filterValue === 'premium') return matches.filter((m) => hasTagInMatch(m, 'premium'))
            return sortLiveFirst(matches)
        },
        [hasTagInMatch, sortLiveFirst],
    )

    // `/sports`: only the **active tab** sport is subscribed; switching tabs unsubscribes the previous (home `/` still gets all three via SportsbookRouteMatchStreams).
    useEffect(() => {
        const sport =
            activeTab === 'tennis' ? 'tennis' : activeTab === 'soccer' ? 'soccer' : 'cricket'
        subscribeMatches(sport)
        return () => unsubscribeMatches(sport)
    }, [activeTab])

    // Matches: socket only (subscribe:matches from route). Watchdog clears spinners if WS is slow/empty.
    const MATCH_LOAD_MAX_WAIT_MS = 10000

    useEffect(() => {
        const t = window.setTimeout(() => {
            setCricketMatchesLoading(false)
            setTennisMatchesLoading(false)
            setSoccerMatchesLoading(false)
        }, MATCH_LOAD_MAX_WAIT_MS)
        return () => window.clearTimeout(t)
    }, [])

    // Socket: live match lists — `/sports` uses tab-scoped subscribe above; home `/` uses SportsbookRouteMatchStreams. No subscribe:odds here — list uses listSummary selections; detail subscribes odds.
    useEffect(() => {
        const onMatches = (raw) => {
            for (const payload of expandSocketBatchPayload(raw)) {
                const { sport, rows, error, schema } = getMatchRowsFromSocketPayload(payload)
                if (!sport || error) continue
                const list = rows
                const merge = (prev) => {
                    if (schema === 'listSummary') return list
                    return list.length === 0 && prev.length > 0 ? prev : list
                }
                if (sport === 'cricket') {
                    setCricketMatches(merge)
                    setCricketMatchesLoading(false)
                } else if (sport === 'tennis') {
                    setTennisMatches(merge)
                    setTennisMatchesLoading(false)
                } else if (sport === 'soccer') {
                    setSoccerMatches(merge)
                    setSoccerMatchesLoading(false)
                }
            }
        }
        addMatchesListener(onMatches)

        return () => {
            removeMatchesListener(onMatches)
        }
    }, [])

    const totalSlides = GALLERY_SLIDES.length
    const mapToDisplayMatch = useCallback((m, defaultTournament, defaultIcon) => {
        const eventTime = m.eventTime ?? m.event_time ?? m.startTime
        let timeOnly = ''
        if (eventTime) {
            try {
                const d = new Date(eventTime)
                if (!isNaN(d.getTime())) timeOnly = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            } catch { }
        }
        const inPlay = !!((m.inPlay ?? m.in_play ?? m.isLive) || (m.status && String(m.status).toLowerCase() === 'live') || (m.matchStatus && String(m.matchStatus).toLowerCase().includes('live')))
        return {
            tournament: m.seriesName ?? m.series_name ?? defaultTournament,
            teams: m.eventName ?? m.event_name ?? m.name ?? '',
            time: formatMatchTime(eventTime),
            timeOnly,
            dayGroup: getDayGroup(eventTime),
            icon: defaultIcon,
            eventId: m.eventId ?? m.event_id,
            gameId: m.gameId ?? m.game_id,
            marketId: m.marketId ?? m.market_id,
            inPlay,
            seriesId: m.seriesId ?? m.series_id,
            tvUrl: m.tv_url ?? m.tvUrl,
            isTv: !!(m.IsTv ?? m.isTv),
            marketBadges: m.marketBadges ?? m.market_badges ?? m.marketPills ?? m.market_pills,
            selections: m.selections,
            markets: m.markets,
            category: m.category ?? m.Category ?? m.eventCategory ?? m.event_category,
        }
    }, [])

    const cricketDisplayMatches = useMemo(() => {
        const list = (cricketMatches || []).map((m) => mapToDisplayMatch(m, 'Cricket', 'images/cricket_world.png'))
        return list.sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0))
    }, [cricketMatches, mapToDisplayMatch])
    const tennisDisplayMatches = useMemo(() => {
        const list = (tennisMatches || []).map((m) => mapToDisplayMatch(m, 'Tennis', 'images/menu-icon20.svg'))
        return list.sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0))
    }, [tennisMatches, mapToDisplayMatch])
    const soccerDisplayMatches = useMemo(() => {
        const list = (soccerMatches || []).map((m) => mapToDisplayMatch(m, 'Football', 'images/menu-icon19.svg'))
        return list.sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0))
    }, [soccerMatches, mapToDisplayMatch])

    const activeMatches = useMemo(() => {
        if (activeTab === 'cricket') return cricketDisplayMatches
        if (activeTab === 'tennis') return tennisDisplayMatches
        if (activeTab === 'soccer') return soccerDisplayMatches
        return []
    }, [activeTab, cricketDisplayMatches, tennisDisplayMatches, soccerDisplayMatches])

    const gridMatches = useMemo(
        () => filterSportsMatches(activeMatches, sportsFilter),
        [filterSportsMatches, activeMatches, sportsFilter],
    )

    const listLoading =
        activeTab === 'cricket' ? cricketMatchesLoading : activeTab === 'tennis' ? tennisMatchesLoading : soccerMatchesLoading

    const matchesByDay = useMemo(() => {
        const liveMatches = gridMatches.filter((m) => m.inPlay)
        const nonLive = gridMatches.filter((m) => !m.inPlay)
        const groups = {}
        nonLive.forEach((m) => {
            const day = m.dayGroup || 'Other'
            if (!groups[day]) groups[day] = []
            groups[day].push(m)
        })
        const order = ['Today', 'Tomorrow']
        const rest = Object.keys(groups).filter((d) => !order.includes(d))
        const daySections = [...order.filter((d) => groups[d]?.length), ...rest].map((day) => ({ day, matches: groups[day], isLiveSection: false }))
        if (liveMatches.length > 0) {
            return [{ day: 'Live', matches: liveMatches, isLiveSection: true }, ...daySections]
        }
        return daySections
    }, [gridMatches])

    const handleBannerPrev = useCallback(() => {
        setCurrentSlide((prev) => (prev <= 0 ? totalSlides - 1 : prev - 1))
    }, [totalSlides])
    const handleBannerNext = useCallback(() => {
        setCurrentSlide((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1))
    }, [totalSlides])

    useEffect(() => {
        if (!sliderRef.current) return
        sliderRef.current.style.transform = `translateX(-${currentSlide * 100}%)`
    }, [currentSlide])

    const handleBannerPointerDown = useCallback((e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return
        const el = e.currentTarget
        if (el.setPointerCapture) el.setPointerCapture(e.pointerId)
        bannerSwipeRef.current.startX = e.clientX
    }, [])
    const handleBannerPointerUp = useCallback((e) => {
        const deltaX = e.clientX - bannerSwipeRef.current.startX
        if (deltaX < -50) setCurrentSlide((prev) => (prev + 1) % totalSlides)
        else if (deltaX > 50) setCurrentSlide((prev) => (prev <= 0 ? totalSlides - 1 : prev - 1))
    }, [totalSlides])

    useEffect(() => {
        const t = setInterval(() => setCurrentSlide((prev) => (prev + 1) % totalSlides), 5000)
        return () => clearInterval(t)
    }, [totalSlides])

    useEffect(() => () => {
        if (touchHideTimerRef.current) clearTimeout(touchHideTimerRef.current)
    }, [])

    useEffect(() => {
        if (platformConfig.sportsBookServiceStatus === false || platformConfig.inPlayServiceStatus === false) {
            alertErrorMessage('Sports / In-Play is temporarily unavailable. Please try again later.')
        }
    }, [platformConfig.sportsBookServiceStatus, platformConfig.inPlayServiceStatus])

    const handleSliderEnter = () => setArrowsVisible(true)
    const handleSliderLeave = () => setArrowsVisible(false)
    const handleSliderTouchStart = () => {
        if (touchHideTimerRef.current) clearTimeout(touchHideTimerRef.current)
        setArrowsVisible(true)
    }
    const handleSliderTouchEnd = () => {
        touchHideTimerRef.current = setTimeout(() => setArrowsVisible(false), 400)
    }

    const handleMatchCardClick = useCallback((e, match) => {
        if (e.target.closest('button')) {
            e.preventDefault()
            e.stopPropagation()
            return
        }
        const sportName = activeTab
        const path = sportName === 'tennis' ? '/tennis' : sportName === 'soccer' ? '/soccer' : '/cricket'
        const state = (match?.gameId || match?.eventId) ? {
            gameId: match.gameId,
            eventId: match.eventId,
            eventName: match.teams,
            sportName,
            seriesName: match.tournament ?? match.seriesName ?? match.series_name,
            tv_url: match.tvUrl ?? match.tv_url,
            IsTv: match.isTv ?? match.IsTv,
        } : undefined
        navigate(path, { state })
    }, [navigate, activeTab])

    const registerSportsOddsScrollRef = useCallback((key, node) => {
        if (node) sportsOddsScrollRefs.current.set(key, node)
        else sportsOddsScrollRefs.current.delete(key)
    }, [])

    const syncSportsOddsScroll = useCallback((sourceKey, scrollLeft) => {
        if (isSyncingSportsOddsScrollRef.current) return
        const sourceSection = sourceKey.split('-')[0]
        isSyncingSportsOddsScrollRef.current = true
        sportsOddsScrollRefs.current.forEach((node, key) => {
            const section = key.split('-')[0]
            if (section !== sourceSection) return
            if (!node || key === sourceKey) return
            if (Math.abs(node.scrollLeft - scrollLeft) > 1) node.scrollLeft = scrollLeft
        })
        requestAnimationFrame(() => {
            isSyncingSportsOddsScrollRef.current = false
        })
    }, [])

    const isOddsValid = useCallback((val) => {
        if (val == null || val === '') return false
        const n = parseFloat(String(val).trim())
        return !Number.isNaN(n) && n > 0
    }, [])

    const getTop1x2Cells = useCallback(
        (match, oddsPayload) => computeTop1x2Cells(match, oddsPayload ?? null, isOddsValid, formatOddsSize),
        [isOddsValid]
    )

    const renderMatchCard = useCallback((match, index) => {
        const oddsPayload = null
        const marketPills = getMarketPillsFromSources(match, oddsPayload)
        const top1x2Cells = getTop1x2Cells(match, oddsPayload)
        return (
            <div
                key={match.eventId ?? index}
                className='match_slider'
                onClick={(e) => handleMatchCardClick(e, match)}
                style={{ display: 'block', cursor: 'pointer' }}
            >
                <div className='match_slider_inner'>
                    <div className='matchtp_hd d-flex justify-content-between align-items-center gap-2'>
                        <div className='hd_match d-flex align-items-center gap-2'>
                            <img src={match.icon} alt="match" loading="lazy" decoding="async" />
                            <h3>Match</h3>
                            {match.inPlay && (
                                <span className='match_live_badge' style={{
                                    background: '#e53935',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    Live
                                </span>
                            )}
                        </div>
                        {marketPills.length > 0 ? (
                            <ul>
                                {marketPills.map((pill, pi) => (
                                    <li key={`${pill}-${pi}`}>{pill}</li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                    <p>{match.tournament}</p>
                    <div className='match_info'>
                        <p className='match_team'>{match.teams}</p>
                        <span>{match.inPlay ? 'Live' : match.time}</span>
                    </div>
                    <div className='sports_card_bl6_head d-flex mb-1'>
                        <span className='sports_card_bl6_head_back flex-fill text-center'>1 X 2</span>
                        <span className='sports_card_bl6_head_lay flex-fill text-center'>1 X 2</span>
                    </div>
                    <div className='sports_card_bl6_body'>
                        <div className='sports_card_bl6_row d-flex flex-column gap-1'>
                            <div className='d-flex justify-content-center gap-1'>
                                {top1x2Cells.map((pair, ci) => {
                                    const hb = pair.back.price != null
                                    return (
                                        <button
                                            key={`cb-${ci}`}
                                            type='button'
                                            className='view_match sports_card_bl6_cell'
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {hb ? pair.back.price : '—'}{' '}
                                            <span>{pair.back.sizeFormatted}</span>
                                        </button>
                                    )
                                })}
                            </div>
                            <div className='d-flex justify-content-center gap-1'>
                                {top1x2Cells.map((pair, ci) => {
                                    const hl = pair.lay.price != null
                                    return (
                                        <button
                                            key={`cl-${ci}`}
                                            type='button'
                                            className='like_match sports_card_bl6_cell'
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {hl ? pair.lay.price : '—'}{' '}
                                            <span>{pair.lay.sizeFormatted}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }, [handleMatchCardClick, getTop1x2Cells])

    return (
        <>
            <div className='dashboard_page'>
                <div className='container-fluid'>
                    {(!platformConfig.sportsBookServiceStatus || !platformConfig.inPlayServiceStatus) && (
                        <div className="platform_service_banner platform_service_banner_disabled" role="alert">
                            Sports / In-Play is temporarily unavailable. Please try again later.
                        </div>
                    )}
                    {(platformConfig.sportsBookServiceStatus && platformConfig.inPlayServiceStatus) && (
                        <>
                            <div className='sports_hero_section'>
                                <div
                                    className={`sports_bnr_gallery_wrapper ${arrowsVisible ? 'sports_bnr_arrows_visible' : ''}`}
                                    onMouseEnter={handleSliderEnter}
                                    onMouseLeave={handleSliderLeave}
                                    onTouchStart={handleSliderTouchStart}
                                    onTouchEnd={handleSliderTouchEnd}
                                    onPointerDown={handleBannerPointerDown}
                                    onPointerUp={handleBannerPointerUp}
                                    onPointerCancel={handleBannerPointerUp}
                                    style={{ touchAction: 'pan-y' }}
                                >
                                    <button type="button" className="sports_bnr_arrow sports_bnr_arrow_prev" onClick={handleBannerPrev} aria-label="Previous slide">
                                        <i className="ri-arrow-left-s-line"></i>
                                    </button>
                                    <button type="button" className="sports_bnr_arrow sports_bnr_arrow_next" onClick={handleBannerNext} aria-label="Next slide">
                                        <i className="ri-arrow-right-s-line"></i>
                                    </button>
                                    <div className="sports_bnr_gallery_track" ref={sliderRef}>
                                        {GALLERY_SLIDES.map((image, index) => (
                                            <div key={index} className="sports_bnr_gallery_slide">
                                                <img
                                                    src={image}
                                                    alt={`Sports gallery ${index + 1}`}
                                                    className="sports_bnr_desktop"
                                                    loading={index === 0 ? undefined : 'lazy'}
                                                    decoding="async"
                                                    {...(index === 0 ? { fetchPriority: 'high' } : {})}
                                                />
                                                <img
                                                    src={GALLERY_SLIDES_MOBILE[index]}
                                                    alt={`Sports gallery ${index + 1}`}
                                                    className="sports_bnr_mobile"
                                                    loading={index === 0 ? undefined : 'lazy'}
                                                    decoding="async"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="sports_bnr_slider_dots">
                                        {Array.from({ length: totalSlides }, (_, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className={`dot ${index === currentSlide ? 'active' : ''}`}
                                                onClick={() => setCurrentSlide(index)}
                                                aria-label={`Page ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className='sports_game_section inplay_section_bl'>
                                <div className='sports_top_match_section'>
                                    <div className="top_match_section pt-0">
                                        <ul className='match_type_tabs'>
                                            {TABS.map((tab) => (
                                                <li
                                                    key={tab.id}
                                                    className={tab.to ? '' : (activeTab === tab.id ? 'active' : '')}
                                                >
                                                    <button
                                                        type='button'
                                                        onClick={() => { if (tab.to) navigate(tab.to); else setActiveTab(tab.id); }}
                                                    >
                                                        {tab.icon.startsWith('ri-') ? (
                                                            <i className={tab.icon} aria-hidden />
                                                        ) : (
                                                            <img alt={tab.label} src={tab.icon} loading="lazy" decoding="async" />
                                                        )}
                                                        <span>{tab.label}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>

                                        {(activeTab === 'cricket' || activeTab === 'tennis' || activeTab === 'soccer') && (
                                            <div className='sports_grid_section sports_grid_section_landing'>
                                                <div className='sports_grid_header top_hd d-flex align-items-center justify-content-between w-100'>
                                                    <div className='sports_grid_title'>
                                                        <img src={activeTab === 'tennis' ? 'images/menu-icon20.svg' : activeTab === 'soccer' ? 'images/menu-icon19.svg' : 'images/menu-icon19.svg'} alt='' className='sports_grid_icon' />
                                                        <h2 className='heading_h2 sports_grid_heading'>{activeTab === 'cricket' ? 'Cricket' : activeTab === 'tennis' ? 'Tennis' : 'Football'}</h2>
                                                    </div>
                                                    <div className='top_hd_right d-flex align-items-center gap-2'>
                                                        <div className='sports_grid_filters'>
                                                            <button type='button' className={`sports_filter_btn ${sportsFilter === 'live' ? 'active' : ''}`} onClick={() => toggleSportsFilter('live')}>+ Live</button>
                                                            <button type='button' className={`sports_filter_btn ${sportsFilter === 'virtual' ? 'active' : ''}`} onClick={() => toggleSportsFilter('virtual')}>+ Virtual</button>
                                                            <button type='button' className={`sports_filter_btn ${sportsFilter === 'premium' ? 'active' : ''}`} onClick={() => toggleSportsFilter('premium')}>+ Premium</button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='sports_grid_table_wrap desktop_view'>
                                                    <div className='sports_grid_desktop_layout'>
                                                        {(activeTab === 'cricket' ? cricketMatchesLoading : activeTab === 'tennis' ? tennisMatchesLoading : soccerMatchesLoading) ? (
                                                            <div className='sports_grid_loading sports_grid_desktop_fullbleed'>Loading {activeTab} matches...</div>
                                                        ) : matchesByDay.length === 0 ? (
                                                            <div className='sports_grid_empty sports_grid_desktop_fullbleed'>{NO_MATCHES_MSG()}</div>
                                                        ) : (
                                                            <>
                                                            {!listLoading && matchesByDay.length > 0 ? (
                                                                <div className='sports_grid_desktop_row sports_grid_1x2_header_row sports_grid_bl_header_row' role="row">
                                                                    <div className='leftside_matchlist sports_grid_1x2_header_spacer' aria-hidden />
                                                                    <div className='rightside_odds'>
                                                                        <div className='sports_grid_odds_columns sports_grid_desktop_odds_strip sports_grid_bl6_strip sports_grid_back_lay_only_strip sports_grid_1x2_header_strip'>
                                                                            <div className='sports_grid_bl6_runner_row' role="presentation">
                                                                                <div className='sports_grid_1x2_header_pair'>1</div>
                                                                                <div className='sports_grid_1x2_header_pair'>X</div>
                                                                                <div className='sports_grid_1x2_header_pair'>2</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                            {matchesByDay.map(({ day, matches, isLiveSection }) => (
                                                                <React.Fragment key={day}>
                                                                    {                                                                    matches.map((match, idx) => {
                                                                        const top1x2Cells = getTop1x2Cells(match, null)
                                                                        const oddsPayloadRow = null
                                                                        const rowPills = getMarketPillsFromSources(match, oddsPayloadRow)
                                                                        const rowShowStream = getMatchStreamVisible(match)
                                                                        return (
                                                                            <div
                                                                                key={match.eventId ?? match.gameId ?? `${day}-${idx}`}
                                                                                className='sports_grid_row sports_grid_desktop_row two_column_row'
                                                                                onClick={(e) => !e.target.closest('button') && handleMatchCardClick(e, match)}
                                                                            >
                                                                                <div className='leftside_matchlist'>
                                                                                    <div className='sports_grid_desktop_match'>
                                                                                        <div className='sports_grid_desktop_time_block'>
                                                                                            <div className='sports_grid_desktop_time_row'>
                                                                                                <div className='sports_grid_desktop_time_stack'>
                                                                                                    <span className='sports_grid_desktop_day'>{match.dayGroup}</span>
                                                                                                    {match.timeOnly ? <span className='sports_grid_desktop_clock'>{match.timeOnly}</span> : null}
                                                                                                </div>
                                                                                                {match.inPlay ? <span className='sports_grid_desktop_live_badge'>LIVE</span> : null}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className='sports_grid_desktop_match_info'>
                                                                                            <div className='sports_grid_desktop_match_mid'>
                                                                                                {/* <div className='sports_grid_desktop_series'>{match.tournament}</div> */}
                                                                                                <div className='sports_grid_desktop_teamnames'>
                                                                                                    <span className='sports_grid_desktop_teamline'>{match.teams}</span>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className='sports_grid_desktop_match_tools'>
                                                                                                {rowShowStream ? (
                                                                                                    <i className='ri-play-circle-line sports_grid_desktop_tool_icon' aria-hidden />
                                                                                                ) : null}
                                                                                                {rowPills.length > 0 ? (
                                                                                                    <div className='sports_grid_desktop_pills'>
                                                                                                        {rowPills.map((icon, pillIdx) => (
                                                                                                            <span key={`${icon}-${pillIdx}`} className='sports_grid_desktop_pill'>{icon}</span>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                ) : null}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div
                                                                                    className='rightside_odds sports_grid_bl6_odds_stack'
                                                                                    ref={(node) => registerSportsOddsScrollRef(getSportsOddsScrollKey(activeTab, match, day, idx), node)}
                                                                                    onScroll={(e) => syncSportsOddsScroll(getSportsOddsScrollKey(activeTab, match, day, idx), e.currentTarget.scrollLeft)}
                                                                                >
                                                                                    <div className='sports_grid_odds_columns sports_grid_desktop_odds_strip sports_grid_bl6_strip sports_grid_back_lay_only_strip'>
                                                                                        <div className='sports_grid_bl6_runner_row'>
                                                                                            {top1x2Cells.map((pair, ci) => {
                                                                                                const hb = pair.back.price != null
                                                                                                const hl = pair.lay.price != null
                                                                                                return (
                                                                                                    <React.Fragment key={`p-${ci}`}>
                                                                                                        <div className={`sports_grid_odds_cell sports_grid_back ${!hb ? 'sports_grid_odds_disabled' : ''}`}>
                                                                                                            {hb ? (
                                                                                                                <button type='button' className='sports_grid_odds_btn' onClick={(e) => { e.stopPropagation(); handleMatchCardClick(e, match); }}>
                                                                                                                    <span className='sports_grid_odds_val'>{pair.back.price}</span>
                                                                                                                    <span className='sports_grid_odds_size'>{pair.back.sizeFormatted}</span>
                                                                                                                </button>
                                                                                                            ) : (
                                                                                                                <span className='sports_grid_odds_dash sports_grid_bl6_dash_cell'>
                                                                                                                    <span className='sports_grid_odds_val'>—</span>
                                                                                                                    <span className='sports_grid_odds_size'>—</span>
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <div className={`sports_grid_odds_cell sports_grid_lay ${!hl ? 'sports_grid_odds_disabled' : ''}`}>
                                                                                                            {hl ? (
                                                                                                                <button type='button' className='sports_grid_odds_btn' onClick={(e) => { e.stopPropagation(); handleMatchCardClick(e, match); }}>
                                                                                                                    <span className='sports_grid_odds_val'>{pair.lay.price}</span>
                                                                                                                    <span className='sports_grid_odds_size'>{pair.lay.sizeFormatted}</span>
                                                                                                                </button>
                                                                                                            ) : (
                                                                                                                <span className='sports_grid_odds_dash sports_grid_bl6_dash_cell'>
                                                                                                                    <span className='sports_grid_odds_val'>—</span>
                                                                                                                    <span className='sports_grid_odds_size'>—</span>
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </React.Fragment>
                                                                                                )
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </React.Fragment>
                                                            ))}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>


                                            </div>
                                        )}

                                        <div className={`match_slider_wrapper ${(activeTab === 'cricket' || activeTab === 'tennis' || activeTab === 'soccer') ? 'sports_grid_cards_hidden' : ''}`}>
                                            {(activeTab === 'cricket' ? cricketMatchesLoading : activeTab === 'tennis' ? tennisMatchesLoading : activeTab === 'soccer' ? soccerMatchesLoading : false) ? (
                                                <div className="match_slider_loading" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #888)' }}>
                                                    Loading {activeTab} matches...
                                                </div>
                                            ) : activeMatches.length === 0 ? (
                                                <div className="match_slider_empty" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #888)' }}>
                                                    {NO_MATCHES_MSG()}
                                                </div>
                                            ) : (
                                                activeMatches.map((match, index) => renderMatchCard(match, index))
                                            )}
                                        </div>

                                    </div>
                                </div>

                            </div>
                        </>
                    )}
                </div>
            </div>
            <MobileMenu />
        </>
    )
}

export default SportsGame

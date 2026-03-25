import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './sportsGame.css'
import MobileMenu from '../customComponents/MobileMenu'
import { usePlatformConfig } from '../context/PlatformConfigContext'
import { alertErrorMessage } from '../customComponents/CustomAlertMessage'
import {
    subscribeMatchDataLanding,
    unsubscribeMatchDataLanding,
    addMatchDataListener,
    normalizeMatchDataUpdatePayload,
} from '../socket/matchDataSocket'
import { getMarketPillsFromSources, getMatchStreamVisible, mergeAndSortPillCodes } from '../utils/matchMarketPills'
import { normalizeMatchDataEventTime, pickMatchEventTime } from '../utils/matchDataNormalize'
import { computeTop1x2Cells } from '../utils/sportsGameOdds'

const GALLERY_SLIDES = ['images/sports_slider_img2.png', 'images/sports_slider_img.png', 'images/sports_slider_img3.png']
const GALLERY_SLIDES_MOBILE = ['images/sports_bnr_mobile2.jpg', 'images/sports_bnr_mobile.jpg', 'images/sports_bnr_mobile3.jpg']

const INPLAY_SPORTS = ['cricket', 'tennis', 'soccer']

const SPORT_UI = {
    cricket: { title: 'Cricket', gridIcon: 'images/menu-icon19.svg', cardIcon: 'images/cricket_world.png', route: '/cricket' },
    tennis: { title: 'Tennis', gridIcon: 'images/menu-icon20.svg', cardIcon: 'images/menu-icon20.svg', route: '/tennis' },
    soccer: { title: 'Football', gridIcon: 'images/menu-icon19.svg', cardIcon: 'images/menu-icon19.svg', route: '/soccer' },
}

const TABS = [
    { id: 'cricket', label: 'Cricket', icon: 'images/menu-icon19.svg' },
    { id: 'tennis', label: 'Tennis', icon: 'images/menu-icon20.svg' },
    { id: 'soccer', label: 'Football', icon: 'ri-football-line' },
    { id: 'sportsbook', label: 'Sportsbook', icon: 'ri-book-open-line', to: '/sportsbook' },
]

const NO_MATCHES = 'No matches available'

function mapSocketRows(matches, seriesLabel) {
    if (!Array.isArray(matches)) return []
    return matches
        .filter((r) => {
            if (!r || typeof r !== 'object') return false
            const id = r.gameId ?? r.eventId
            return id != null && String(id).trim() !== ''
        })
        .map((r) => {
            const gid = String(r.gameId ?? r.eventId)
            const rawTime = pickMatchEventTime(r)
            const et = rawTime != null ? normalizeMatchDataEventTime(rawTime) : null
            return {
                gameId: gid,
                eventId: gid,
                eventName: r.eventName ?? '—',
                eventTime: et,
                inPlay: !!r.inPlay,
                seriesName: seriesLabel,
                marketId: r.marketId,
                matchOdds: Array.isArray(r.matchOdds) ? r.matchOdds : [],
                pills: Array.isArray(r.pills) ? r.pills : undefined,
                marketFlags: {
                    MO: !!r.MO,
                    BM: !!r.BM,
                    OM: !!r.OM,
                    FO: !!r.FO,
                    PF: !!r.PF,
                },
            }
        })
        .sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0))
}

function rowPills(match, oddsPayload) {
    const flags = []
    const f = match?.marketFlags
    if (f && typeof f === 'object') {
        if (f.MO) flags.push('MO')
        if (f.BM) flags.push('BM')
        if (f.FO) flags.push('F')
        if (f.OM) flags.push('OM')
        if (f.PF) flags.push('P')
    }
    return mergeAndSortPillCodes(flags, getMarketPillsFromSources(match, oddsPayload))
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

function dayGroupLabel(isoStr) {
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

function toDisplayRow(m, sport) {
    const ui = SPORT_UI[sport]
    const rawTime = m.eventTime ?? pickMatchEventTime(m)
    const eventTime = rawTime != null ? normalizeMatchDataEventTime(rawTime) : null
    let timeOnly = ''
    if (eventTime) {
        try {
            const d = new Date(eventTime)
            if (!isNaN(d.getTime())) timeOnly = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        } catch { /* ignore */ }
    }
    const inPlay = !!(
        m.inPlay ||
        (m.status && String(m.status).toLowerCase() === 'live') ||
        (m.matchStatus && String(m.matchStatus).toLowerCase().includes('live'))
    )
    const mo = Array.isArray(m.matchOdds) ? m.matchOdds : Array.isArray(m.matchOddsResponseDTO) ? m.matchOddsResponseDTO : []
    const title = m.eventName ?? '—'
    return {
        tournament: m.seriesName ?? ui.title,
        teams: title,
        eventName: title,
        time: formatMatchTime(eventTime),
        timeOnly,
        dayGroup: dayGroupLabel(eventTime),
        icon: ui.cardIcon,
        eventId: m.eventId,
        gameId: m.gameId,
        marketId: m.marketId,
        inPlay,
        tvUrl: m.tv_url ?? m.tvUrl,
        isTv: !!(m.IsTv ?? m.isTv),
        marketBadges: m.marketBadges ?? m.market_badges,
        marketFlags: m.marketFlags,
        pills: m.pills,
        matchOdds: mo,
        markets: m.markets,
        category: m.category ?? m.Category,
    }
}

function oddsScrollKey(tab, match, day, idx) {
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
    const prevSportsTabRef = useRef(activeTab)
    const serviceAlertShown = useRef(false)

    const [rowsBySport, setRowsBySport] = useState(() => ({ cricket: [], tennis: [], soccer: [] }))
    const [loadingBySport, setLoadingBySport] = useState(() => ({ cricket: true, tennis: true, soccer: true }))

    const oddsScrollRefs = useRef(new Map())
    const syncingOddsScroll = useRef(false)

    const [searchParams] = useSearchParams()
    const filterFromUrl = searchParams.get('filter') || ''
    const [filtersBySport, setFiltersBySport] = useState({ cricket: 'all', tennis: 'all', soccer: 'all' })

    useEffect(() => {
        if (filterFromUrl === 'live') {
            setFiltersBySport({ cricket: 'live', tennis: 'live', soccer: 'live' })
        }
    }, [filterFromUrl])

    const sportFilter =
        activeTab === 'tennis' ? filtersBySport.tennis : activeTab === 'soccer' ? filtersBySport.soccer : filtersBySport.cricket

    const toggleFilter = useCallback(
        (value) => {
            setFiltersBySport((prev) => {
                const key = activeTab === 'tennis' ? 'tennis' : activeTab === 'soccer' ? 'soccer' : 'cricket'
                const cur = prev[key] ?? 'all'
                return { ...prev, [key]: cur === value ? 'all' : value }
            })
        },
        [activeTab],
    )

    const hasTag = useCallback((match, tag) => {
        const badges = Array.isArray(match?.marketBadges) ? match.marketBadges.join(' ') : ''
        const mk = Array.isArray(match?.markets) ? match.markets.map((x) => `${x?.marketName ?? ''} ${x?.market ?? ''}`).join(' ') : ''
        return `${badges} ${mk} ${match?.tournament ?? ''} ${match?.teams ?? ''} ${match?.category ?? ''}`.toLowerCase().includes(tag)
    }, [])

    const filterList = useCallback(
        (list, mode) => {
            if (mode === 'live') return list.filter((m) => m.inPlay)
            if (mode === 'virtual') return list.filter((m) => hasTag(m, 'virtual'))
            if (mode === 'premium') return list.filter((m) => hasTag(m, 'premium'))
            return [...list].sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0))
        },
        [hasTag],
    )

    useEffect(() => {
        if (!INPLAY_SPORTS.includes(activeTab)) return undefined
        subscribeMatchDataLanding(activeTab)
        return () => unsubscribeMatchDataLanding(activeTab)
    }, [activeTab])

    useEffect(() => {
        if (!INPLAY_SPORTS.includes(activeTab)) return
        const prev = prevSportsTabRef.current
        prevSportsTabRef.current = activeTab
        if (prev === activeTab) return
        if (rowsBySport[activeTab].length === 0) {
            setLoadingBySport((s) => ({ ...s, [activeTab]: true }))
        }
    }, [activeTab, rowsBySport])

    useEffect(() => {
        const remove = addMatchDataListener((kind, payload) => {
            if (kind === 'error') {
                setLoadingBySport({ cricket: false, tennis: false, soccer: false })
                return
            }
            const { sportName, matches } = normalizeMatchDataUpdatePayload(payload)
            const key = typeof sportName === 'string' ? sportName.toLowerCase() : ''
            if (!INPLAY_SPORTS.includes(key)) return
            if (!Array.isArray(matches)) return

            const label = SPORT_UI[key].title
            const rows = matches.length === 0 ? [] : mapSocketRows(matches, label)
            setRowsBySport((prev) => ({ ...prev, [key]: rows }))
            setLoadingBySport((prev) => ({ ...prev, [key]: false }))
        })
        return remove
    }, [])

    const displayForSport = useCallback((sport) => {
        return (rowsBySport[sport] || []).map((r) => toDisplayRow(r, sport))
    }, [rowsBySport])

    const cricketRows = useMemo(() => displayForSport('cricket'), [displayForSport])
    const tennisRows = useMemo(() => displayForSport('tennis'), [displayForSport])
    const soccerRows = useMemo(() => displayForSport('soccer'), [displayForSport])

    const activeRows = useMemo(() => {
        if (activeTab === 'cricket') return cricketRows
        if (activeTab === 'tennis') return tennisRows
        if (activeTab === 'soccer') return soccerRows
        return []
    }, [activeTab, cricketRows, tennisRows, soccerRows])

    const gridRows = useMemo(() => filterList(activeRows, sportFilter), [filterList, activeRows, sportFilter])

    const listLoading = INPLAY_SPORTS.includes(activeTab) ? loadingBySport[activeTab] : false

    const matchesByDay = useMemo(() => {
        const live = gridRows.filter((m) => m.inPlay)
        const nonLive = gridRows.filter((m) => !m.inPlay)
        const groups = {}
        nonLive.forEach((m) => {
            const day = m.dayGroup || 'Other'
            if (!groups[day]) groups[day] = []
            groups[day].push(m)
        })
        const order = ['Today', 'Tomorrow']
        const rest = Object.keys(groups).filter((d) => !order.includes(d))
        const sections = [...order.filter((d) => groups[d]?.length), ...rest].map((day) => ({ day, matches: groups[day] }))
        if (live.length) return [{ day: 'Live', matches: live }, ...sections]
        return sections
    }, [gridRows])

    const totalSlides = GALLERY_SLIDES.length

    useEffect(() => {
        if (!sliderRef.current) return
        sliderRef.current.style.transform = `translateX(-${currentSlide * 100}%)`
    }, [currentSlide])

    useEffect(() => {
        const t = setInterval(() => setCurrentSlide((p) => (p + 1) % totalSlides), 5000)
        return () => clearInterval(t)
    }, [totalSlides])

    useEffect(() => () => touchHideTimerRef.current && clearTimeout(touchHideTimerRef.current), [])

    useEffect(() => {
        if (
            serviceAlertShown.current ||
            platformConfig.sportsBookServiceStatus !== false ||
            platformConfig.inPlayServiceStatus !== false
        ) {
            return
        }
        serviceAlertShown.current = true
        alertErrorMessage('Sports / In-Play is temporarily unavailable. Please try again later.')
    }, [platformConfig.sportsBookServiceStatus, platformConfig.inPlayServiceStatus])

    const isOddsValid = useCallback((v) => {
        if (v == null || v === '') return false
        const n = parseFloat(String(v).trim())
        return !Number.isNaN(n) && n > 0
    }, [])

    const topCells = useCallback(
        (match, oddsPayload) => computeTop1x2Cells(match, oddsPayload, isOddsValid),
        [isOddsValid],
    )

    const goMatch = useCallback(
        (e, match) => {
            if (e.target.closest('button')) {
                e.preventDefault()
                e.stopPropagation()
                return
            }
            const sportName = activeTab
            if (!INPLAY_SPORTS.includes(sportName)) return
            const path = SPORT_UI[sportName].route
            const id = match?.gameId ?? match?.eventId
            navigate(path, {
                state: id
                    ? {
                          gameId: match.gameId,
                          eventId: match.eventId,
                          eventName: match.teams,
                          sportName,
                          inPlay: match.inPlay,
                          seriesName: match.tournament,
                          tv_url: match.tvUrl,
                          IsTv: match.isTv,
                          marketId: match.marketId,
                          ...(match.matchOdds?.length ? { matchOdds: match.matchOdds } : {}),
                      }
                    : undefined,
            })
        },
        [navigate, activeTab],
    )

    const registerOddsScroll = useCallback((key, el) => {
        if (el) oddsScrollRefs.current.set(key, el)
        else oddsScrollRefs.current.delete(key)
    }, [])

    const syncOddsScroll = useCallback((sourceKey, scrollLeft) => {
        if (syncingOddsScroll.current) return
        const section = sourceKey.split('-')[0]
        syncingOddsScroll.current = true
        oddsScrollRefs.current.forEach((node, key) => {
            if (key.split('-')[0] !== section || key === sourceKey || !node) return
            if (Math.abs(node.scrollLeft - scrollLeft) > 1) node.scrollLeft = scrollLeft
        })
        requestAnimationFrame(() => {
            syncingOddsScroll.current = false
        })
    }, [])

    const renderCard = useCallback(
        (match, index) => {
            const oddsPayload = match.matchOdds?.length ? { matchOdds: match.matchOdds } : null
            const cells = topCells(match, oddsPayload)
            const pills = rowPills(match, oddsPayload)
            return (
                <div
                    key={match.eventId ?? index}
                    className="match_slider"
                    onClick={(e) => goMatch(e, match)}
                    style={{ display: 'block', cursor: 'pointer' }}
                >
                    <div className="match_slider_inner">
                        <div className="matchtp_hd d-flex justify-content-between align-items-center gap-2">
                            <div className="hd_match d-flex align-items-center gap-2">
                                <img src={match.icon} alt="" loading="lazy" decoding="async" />
                                <h3>Match</h3>
                                {match.inPlay && (
                                    <span
                                        className="match_live_badge"
                                        style={{
                                            background: '#e53935',
                                            color: '#fff',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        Live
                                    </span>
                                )}
                            </div>
                            {pills.length > 0 ? (
                                <ul>
                                    {pills.map((p, i) => (
                                        <li key={`${p}-${i}`}>{p}</li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                        <p>{match.tournament}</p>
                        <div className="match_info">
                            <p className="match_team">{match.teams}</p>
                            <span>{match.inPlay ? 'Live' : match.time}</span>
                        </div>
                        <div className="sports_card_bl6_head d-flex mb-1">
                            <span className="sports_card_bl6_head_back flex-fill text-center">1 X 2</span>
                            <span className="sports_card_bl6_head_lay flex-fill text-center">1 X 2</span>
                        </div>
                        <div className="sports_card_bl6_body">
                            <div className="sports_card_bl6_row d-flex flex-column gap-1">
                                <div className="d-flex justify-content-center gap-1">
                                    {cells.map((pair, ci) => (
                                        <button
                                            key={`cb-${ci}`}
                                            type="button"
                                            className="view_match sports_card_bl6_cell"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {pair.back.price != null ? pair.back.price : '—'}{' '}
                                            <span>{pair.back.sizeFormatted}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="d-flex justify-content-center gap-1">
                                    {cells.map((pair, ci) => (
                                        <button
                                            key={`cl-${ci}`}
                                            type="button"
                                            className="like_match sports_card_bl6_cell"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {pair.lay.price != null ? pair.lay.price : '—'}{' '}
                                            <span>{pair.lay.sizeFormatted}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        [goMatch, topCells],
    )

    const inplay = platformConfig.sportsBookServiceStatus && platformConfig.inPlayServiceStatus

    return (
        <>
            <div className="dashboard_page">
                <div className="container-fluid">
                    {!inplay && (
                        <div className="platform_service_banner platform_service_banner_disabled" role="alert">
                            Sports / In-Play is temporarily unavailable. Please try again later.
                        </div>
                    )}
                    {inplay && (
                        <>
                            <div className="sports_hero_section">
                                <div
                                    className={`sports_bnr_gallery_wrapper ${arrowsVisible ? 'sports_bnr_arrows_visible' : ''}`}
                                    onMouseEnter={() => setArrowsVisible(true)}
                                    onMouseLeave={() => setArrowsVisible(false)}
                                    onTouchStart={() => {
                                        if (touchHideTimerRef.current) clearTimeout(touchHideTimerRef.current)
                                        setArrowsVisible(true)
                                    }}
                                    onTouchEnd={() => {
                                        touchHideTimerRef.current = setTimeout(() => setArrowsVisible(false), 400)
                                    }}
                                    onPointerDown={(e) => {
                                        if (e.button !== 0 && e.pointerType === 'mouse') return
                                        e.currentTarget.setPointerCapture?.(e.pointerId)
                                        bannerSwipeRef.current.startX = e.clientX
                                    }}
                                    onPointerUp={(e) => {
                                        const d = e.clientX - bannerSwipeRef.current.startX
                                        if (d < -50) setCurrentSlide((p) => (p + 1) % totalSlides)
                                        else if (d > 50) setCurrentSlide((p) => (p <= 0 ? totalSlides - 1 : p - 1))
                                    }}
                                    onPointerCancel={(e) => {
                                        const d = e.clientX - bannerSwipeRef.current.startX
                                        if (d < -50) setCurrentSlide((p) => (p + 1) % totalSlides)
                                        else if (d > 50) setCurrentSlide((p) => (p <= 0 ? totalSlides - 1 : p - 1))
                                    }}
                                    style={{ touchAction: 'pan-y' }}
                                >
                                    <button type="button" className="sports_bnr_arrow sports_bnr_arrow_prev" onClick={() => setCurrentSlide((p) => (p <= 0 ? totalSlides - 1 : p - 1))} aria-label="Previous slide">
                                        <i className="ri-arrow-left-s-line" />
                                    </button>
                                    <button type="button" className="sports_bnr_arrow sports_bnr_arrow_next" onClick={() => setCurrentSlide((p) => (p + 1) % totalSlides)} aria-label="Next slide">
                                        <i className="ri-arrow-right-s-line" />
                                    </button>
                                    <div className="sports_bnr_gallery_track" ref={sliderRef}>
                                        {GALLERY_SLIDES.map((src, i) => (
                                            <div key={src} className="sports_bnr_gallery_slide">
                                                <img src={src} alt="" className="sports_bnr_desktop" loading={i === 0 ? undefined : 'lazy'} decoding="async" {...(i === 0 ? { fetchPriority: 'high' } : {})} />
                                                <img src={GALLERY_SLIDES_MOBILE[i]} alt="" className="sports_bnr_mobile" loading={i === 0 ? undefined : 'lazy'} decoding="async" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="sports_bnr_slider_dots">
                                        {Array.from({ length: totalSlides }, (_, i) => (
                                            <button key={i} type="button" className={`dot ${i === currentSlide ? 'active' : ''}`} onClick={() => setCurrentSlide(i)} aria-label={`Page ${i + 1}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="sports_game_section inplay_section_bl">
                                <div className="sports_top_match_section">
                                    <div className="top_match_section pt-0">
                                        <ul className="match_type_tabs">
                                            {TABS.map((tab) => (
                                                <li key={tab.id} className={tab.to ? '' : activeTab === tab.id ? 'active' : ''}>
                                                    <button type="button" onClick={() => (tab.to ? navigate(tab.to) : setActiveTab(tab.id))}>
                                                        {tab.icon.startsWith('ri-') ? <i className={tab.icon} aria-hidden /> : <img alt="" src={tab.icon} loading="lazy" decoding="async" />}
                                                        <span>{tab.label}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>

                                        {INPLAY_SPORTS.includes(activeTab) && (
                                            <div className="sports_grid_section sports_grid_section_landing">
                                                <div className="sports_grid_header top_hd d-flex align-items-center justify-content-between w-100">
                                                    <div className="sports_grid_title">
                                                        <img src={SPORT_UI[activeTab].gridIcon} alt="" className="sports_grid_icon" />
                                                        <h2 className="heading_h2 sports_grid_heading">{SPORT_UI[activeTab].title}</h2>
                                                    </div>
                                                    <div className="top_hd_right d-flex align-items-center gap-2">
                                                        <div className="sports_grid_filters">
                                                            <button type="button" className={`sports_filter_btn ${sportFilter === 'live' ? 'active' : ''}`} onClick={() => toggleFilter('live')}>
                                                                + Live
                                                            </button>
                                                            <button type="button" className={`sports_filter_btn ${sportFilter === 'virtual' ? 'active' : ''}`} onClick={() => toggleFilter('virtual')}>
                                                                + Virtual
                                                            </button>
                                                            <button type="button" className={`sports_filter_btn ${sportFilter === 'premium' ? 'active' : ''}`} onClick={() => toggleFilter('premium')}>
                                                                + Premium
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="sports_grid_table_wrap desktop_view">
                                                    <div className="sports_grid_desktop_layout">
                                                        {listLoading ? (
                                                            <div className="sports_grid_loading sports_grid_desktop_fullbleed">Loading {activeTab} matches...</div>
                                                        ) : matchesByDay.length === 0 ? (
                                                            <div className="sports_grid_empty sports_grid_desktop_fullbleed">{NO_MATCHES}</div>
                                                        ) : (
                                                            <>
                                                                {!listLoading && matchesByDay.length > 0 ? (
                                                                    <div className="sports_grid_desktop_row sports_grid_1x2_header_row sports_grid_bl_header_row" role="row">
                                                                        <div className="leftside_matchlist sports_grid_1x2_header_spacer" aria-hidden />
                                                                        <div className="rightside_odds">
                                                                            <div className="sports_grid_odds_columns sports_grid_desktop_odds_strip sports_grid_bl6_strip sports_grid_back_lay_only_strip sports_grid_1x2_header_strip">
                                                                                <div className="sports_grid_bl6_runner_row" role="presentation">
                                                                                    <div className="sports_grid_1x2_header_pair">1</div>
                                                                                    <div className="sports_grid_1x2_header_pair">X</div>
                                                                                    <div className="sports_grid_1x2_header_pair">2</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : null}
                                                                {matchesByDay.map(({ day, matches }) => (
                                                                    <React.Fragment key={day}>
                                                                        {matches.map((match, idx) => {
                                                                            const oddsPayload = match.matchOdds?.length ? { matchOdds: match.matchOdds } : null
                                                                            const cells = topCells(match, oddsPayload)
                                                                            const pills = rowPills(match, oddsPayload)
                                                                            const showTv = getMatchStreamVisible(match)
                                                                            return (
                                                                                <div
                                                                                    key={match.eventId ?? match.gameId ?? `${day}-${idx}`}
                                                                                    className="sports_grid_row sports_grid_desktop_row two_column_row"
                                                                                    onClick={(e) => !e.target.closest('button') && goMatch(e, match)}
                                                                                >
                                                                                    <div className="leftside_matchlist">
                                                                                        <div className="sports_grid_desktop_match">
                                                                                            <div className="sports_grid_desktop_time_block">
                                                                                                <div className="sports_grid_desktop_time_row">
                                                                                                    <div className="sports_grid_desktop_time_stack">
                                                                                                        <span className="sports_grid_desktop_day">{match.dayGroup}</span>
                                                                                                        {match.timeOnly ? <span className="sports_grid_desktop_clock">{match.timeOnly}</span> : null}
                                                                                                    </div>
                                                                                                    {match.inPlay ? <span className="sports_grid_desktop_live_badge">LIVE</span> : null}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="sports_grid_desktop_match_info">
                                                                                                <div className="sports_grid_desktop_match_mid">
                                                                                                    <div className="sports_grid_desktop_teamnames">
                                                                                                        <span className="sports_grid_desktop_teamline">{match.teams}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="sports_grid_desktop_match_tools">
                                                                                                    {showTv ? <i className="ri-play-circle-line sports_grid_desktop_tool_icon" aria-hidden /> : null}
                                                                                                    {pills.length > 0 ? (
                                                                                                        <div className="sports_grid_desktop_pills">
                                                                                                            {pills.map((icon, pillIdx) => (
                                                                                                                <span key={`${icon}-${pillIdx}`} className="sports_grid_desktop_pill">
                                                                                                                    {icon}
                                                                                                                </span>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    ) : null}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div
                                                                                        className="rightside_odds sports_grid_bl6_odds_stack"
                                                                                        ref={(node) => registerOddsScroll(oddsScrollKey(activeTab, match, day, idx), node)}
                                                                                        onScroll={(e) => syncOddsScroll(oddsScrollKey(activeTab, match, day, idx), e.currentTarget.scrollLeft)}
                                                                                    >
                                                                                        <div className="sports_grid_odds_columns sports_grid_desktop_odds_strip sports_grid_bl6_strip sports_grid_back_lay_only_strip">
                                                                                            <div className="sports_grid_bl6_runner_row">
                                                                                                {cells.map((pair, ci) => {
                                                                                                    const hb = pair.back.price != null
                                                                                                    const hl = pair.lay.price != null
                                                                                                    return (
                                                                                                        <React.Fragment key={`p-${ci}`}>
                                                                                                            <div className={`sports_grid_odds_cell sports_grid_back ${!hb ? 'sports_grid_odds_disabled' : ''}`}>
                                                                                                                {hb ? (
                                                                                                                    <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); goMatch(e, match); }}>
                                                                                                                        <span className="sports_grid_odds_val">{pair.back.price}</span>
                                                                                                                        <span className="sports_grid_odds_size">{pair.back.sizeFormatted}</span>
                                                                                                                    </button>
                                                                                                                ) : (
                                                                                                                    <span className="sports_grid_odds_dash sports_grid_bl6_dash_cell">
                                                                                                                        <span className="sports_grid_odds_val">—</span>
                                                                                                                        <span className="sports_grid_odds_size">—</span>
                                                                                                                    </span>
                                                                                                                )}
                                                                                                            </div>
                                                                                                            <div className={`sports_grid_odds_cell sports_grid_lay ${!hl ? 'sports_grid_odds_disabled' : ''}`}>
                                                                                                                {hl ? (
                                                                                                                    <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); goMatch(e, match); }}>
                                                                                                                        <span className="sports_grid_odds_val">{pair.lay.price}</span>
                                                                                                                        <span className="sports_grid_odds_size">{pair.lay.sizeFormatted}</span>
                                                                                                                    </button>
                                                                                                                ) : (
                                                                                                                    <span className="sports_grid_odds_dash sports_grid_bl6_dash_cell">
                                                                                                                        <span className="sports_grid_odds_val">—</span>
                                                                                                                        <span className="sports_grid_odds_size">—</span>
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

                                        <div className={`match_slider_wrapper ${INPLAY_SPORTS.includes(activeTab) ? 'sports_grid_cards_hidden' : ''}`}>
                                            {INPLAY_SPORTS.includes(activeTab) && listLoading ? (
                                                <div className="match_slider_loading" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #888)' }}>
                                                    Loading {activeTab} matches...
                                                </div>
                                            ) : INPLAY_SPORTS.includes(activeTab) && activeRows.length === 0 ? (
                                                <div className="match_slider_empty" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #888)' }}>
                                                    {NO_MATCHES}
                                                </div>
                                            ) : INPLAY_SPORTS.includes(activeTab) ? (
                                                activeRows.map((m, i) => renderCard(m, i))
                                            ) : null}
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

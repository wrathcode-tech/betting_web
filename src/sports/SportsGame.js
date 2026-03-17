import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import './sportsGame.css'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import { usePlatformConfig } from '../context/PlatformConfigContext'
import { alertErrorMessage } from '../customComponents/CustomAlertMessage'
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

const GALLERY_SLIDES = ['images/sports_slider_img2.png', 'images/sports_slider_img.png', 'images/sports_slider_img3.png']
const GALLERY_SLIDES_MOBILE = ['images/sports_bnr_mobile2.jpg', 'images/sports_bnr_mobile.jpg', 'images/sports_bnr_mobile3.jpg']
const TABS = [
    { id: 'cricket', label: 'Cricket', icon: 'images/menu-icon19.svg' },
    { id: 'tennis', label: 'Tennis', icon: 'images/menu-icon20.svg' },
    { id: 'soccer', label: 'Football', icon: 'ri-football-line' },
]

const NO_MATCHES_MSG = () => 'No matches available'

function toOddDatasArray(oddDatas) {
    if (!oddDatas) return []
    if (Array.isArray(oddDatas)) return oddDatas
    if (typeof oddDatas === 'object') return Object.values(oddDatas).filter(Boolean)
    return []
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

const MARKET_ICONS = ['MC', 'BM', 'P', 'D', 'F']

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
    const [oddsByGameId, setOddsByGameId] = useState({})
    const subscribedOddsRef = useRef(new Set())
    const [searchParams] = useSearchParams()
    const filterFromUrl = searchParams.get('filter') || ''
    const [sportsFilter, setSportsFilter] = useState(() => (filterFromUrl === 'live' ? 'live' : 'all')) // 'all' | 'live' | 'virtual' | 'premium'
    useEffect(() => {
        if (filterFromUrl === 'live') setSportsFilter('live')
    }, [filterFromUrl])

    const parseMatchesFromResponse = (res) => {
        if (!res) return []
        if (Array.isArray(res)) return res
        const raw = res.data ?? res
        const d = raw?.data ?? raw
        if (Array.isArray(d)) return d
        if (Array.isArray(d?.data)) return d.data
        if (Array.isArray(d?.matches)) return d.matches
        if (Array.isArray(d?.list)) return d.list
        if (Array.isArray(raw?.matches)) return raw.matches
        return []
    }

    const getMatchGameId = (m) => m?.gameId ?? m?.game_id
    const getMatchEventId = (m) => m?.eventId ?? m?.event_id

    const fetchMatchesForSport = useCallback((sport) => {
        setCricketMatchesLoading((p) => (sport === 'cricket' ? true : p))
        setTennisMatchesLoading((p) => (sport === 'tennis' ? true : p))
        setSoccerMatchesLoading((p) => (sport === 'soccer' ? true : p))
        AuthService.sportsbookMatches(sport)
            .then((res) => {
                const list = parseMatchesFromResponse(res)
                if (sport === 'cricket') setCricketMatches(list)
                else if (sport === 'tennis') setTennisMatches(list)
                else if (sport === 'soccer') setSoccerMatches(list)
            })
            .catch(() => {
                if (sport === 'cricket') setCricketMatches([])
                else if (sport === 'tennis') setTennisMatches([])
                else if (sport === 'soccer') setSoccerMatches([])
                toast.error('Failed to load matches')
            })
            .finally(() => {
                setCricketMatchesLoading((p) => (sport === 'cricket' ? false : p))
                setTennisMatchesLoading((p) => (sport === 'tennis' ? false : p))
                setSoccerMatchesLoading((p) => (sport === 'soccer' ? false : p))
            })
    }, [])

    useEffect(() => {
        fetchMatchesForSport('cricket')
    }, [fetchMatchesForSport])
    useEffect(() => {
        fetchMatchesForSport('tennis')
    }, [fetchMatchesForSport])
    useEffect(() => {
        fetchMatchesForSport('soccer')
    }, [fetchMatchesForSport])

    // Stable key: only re-fetch odds when the set of ids actually changes. Tennis uses eventId.
    const oddsFetchKey = useMemo(() => {
        const c = (cricketMatches || []).map(getMatchGameId).filter(Boolean).slice(0, 10).sort().join(',')
        const t = (tennisMatches || []).map(getMatchEventId).filter(Boolean).slice(0, 5).sort().join(',')
        const s = (soccerMatches || []).map(getMatchGameId).filter(Boolean).slice(0, 5).sort().join(',')
        return `${c}|${t}|${s}`
    }, [cricketMatches, tennisMatches, soccerMatches])

    useEffect(() => {
        const cricket = (cricketMatches || []).map((m) => ({ id: getMatchGameId(m), sport: 'cricket' })).filter((x) => x.id).slice(0, 10)
        const tennis = (tennisMatches || []).map((m) => ({ id: getMatchEventId(m), sport: 'tennis' })).filter((x) => x.id).slice(0, 5)
        const soccer = (soccerMatches || []).map((m) => ({ id: getMatchGameId(m), sport: 'soccer' })).filter((x) => x.id).slice(0, 5)
        const list = [...cricket, ...tennis, ...soccer]
        if (list.length === 0) return
        let cancelled = false
        Promise.all(
            list.map(({ id, sport }) =>
                AuthService.sportsbookOdds(sport, id).then((res) => ({ id, res }))
            )
        ).then((results) => {
            if (cancelled) return
            setOddsByGameId((prev) => {
                const next = { ...prev }
                results.forEach(({ id, res }) => {
                    if (!res) return
                    const raw = res.data ?? res
                    const d = raw?.data ?? raw
                    const matchOdds = Array.isArray(d?.matchOdds) ? d.matchOdds : (Array.isArray(d?.match_odds) ? d.match_odds : [])
                    next[id] = { ...(next[id] || {}), matchOdds }
                })
                return next
            })
        }).catch(() => { })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when id set changes (oddsFetchKey), not when match array ref changes
    }, [oddsFetchKey])

    // Socket (doc): sport screen → subscribe:matches { sport: 'cricket' }
    useEffect(() => {
        const token = sessionStorage.getItem('token')
        const oddsSubs = subscribedOddsRef.current
        if (!token) return

        connectSportsbookSocket(token)
        const onMatches = (payload) => {
            const sport = payload?.sport
            const raw = payload.data ?? payload.matches
            if (raw === undefined || !sport) return
            const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
            if (sport === 'cricket') {
                setCricketMatches((prev) => (list.length === 0 && prev.length > 0 ? prev : list))
                setCricketMatchesLoading(false)
            } else if (sport === 'tennis') {
                setTennisMatches((prev) => (list.length === 0 && prev.length > 0 ? prev : list))
                setTennisMatchesLoading(false)
            } else if (sport === 'soccer') {
                setSoccerMatches((prev) => (list.length === 0 && prev.length > 0 ? prev : list))
                setSoccerMatchesLoading(false)
            }
        }
        addMatchesListener(onMatches)
        subscribeMatches('cricket')
        subscribeMatches('tennis')
        subscribeMatches('soccer')

        return () => {
            removeMatchesListener(onMatches)
            unsubscribeMatches('cricket')
            unsubscribeMatches('tennis')
            unsubscribeMatches('soccer')
            oddsSubs.forEach((gid) => unsubscribeOdds(gid))
            oddsSubs.clear()
        }
    }, [])

    // Socket (doc): on('odds') { gameId or eventId (tennis), data: { matchOdds?, ... }, timestamp }
    useEffect(() => {
        const onOdds = (payload) => {
            const oddsKey = payload?.eventId ?? payload?.gameId
            if (!oddsKey || payload?.data === undefined) return
            const matchOdds = Array.isArray(payload.data?.matchOdds) ? payload.data.matchOdds : []
            setOddsByGameId((prev) => ({ ...prev, [oddsKey]: { matchOdds } }))
        }
        addOddsListener(onOdds)
        return () => removeOddsListener(onOdds)
    }, [])

    useEffect(() => {
        const cricketEntries = (cricketMatches || []).map(getMatchGameId).filter(Boolean).slice(0, 15).map((id) => ({ id, sport: 'cricket' }))
        const tennisEntries = (tennisMatches || []).map(getMatchEventId).filter(Boolean).slice(0, 10).map((id) => ({ id, sport: 'tennis' }))
        const soccerEntries = (soccerMatches || []).map(getMatchGameId).filter(Boolean).slice(0, 10).map((id) => ({ id, sport: 'soccer' }))
        const entries = [...cricketEntries, ...tennisEntries, ...soccerEntries]
        const prev = subscribedOddsRef.current
        const idToSport = new Map(entries.map((e) => [e.id, e.sport]))
        entries.forEach(({ id, sport }) => {
            if (!prev.has(id)) {
                subscribeOdds(id, sport)
                prev.add(id)
            }
        })
        const currentIds = new Set(entries.map((e) => e.id))
        prev.forEach((id) => {
            if (!currentIds.has(id)) {
                unsubscribeOdds(id, idToSport.get(id) || 'cricket')
                prev.delete(id)
            }
        })
    }, [cricketMatches, tennisMatches, soccerMatches])

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
            inPlay: m.inPlay ?? m.in_play ?? false,
            seriesId: m.seriesId ?? m.series_id,
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

    const gridMatches = useMemo(() => {
        if (sportsFilter === 'live') return activeMatches.filter((m) => m.inPlay)
        return [...activeMatches].sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0))
    }, [sportsFilter, activeMatches])

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
            tv_url: match.tv_url ?? match.tvUrl,
            IsTv: match.IsTv ?? match.isTv,
        } : undefined
        navigate(path, { state })
    }, [navigate, activeTab])

    const isOddsValid = useCallback((val) => {
        if (val == null || val === '') return false
        const n = parseFloat(String(val).trim())
        return !Number.isNaN(n) && n > 0
    }, [])

    const getCardOdds = useCallback((match, oddsPayload) => {
        const odds = oddsPayload ?? oddsByGameId[activeTab === 'tennis' ? match?.eventId : match?.gameId]
        if (!odds?.matchOdds?.length) return []
        const market = odds.matchOdds[0]
        const list = Array.isArray(market.runners) ? market.runners : toOddDatasArray(market.oddDatas)
        const arr = list.slice(0, 6)
        return arr.map((o) => {
            const backVal = o.b1 ?? o.back
            const layVal = o.l1 ?? o.lay
            return {
                back: isOddsValid(backVal) ? backVal : null,
                lay: isOddsValid(layVal) ? layVal : null,
                size: o.bs1 ?? o.ls1 ?? o.size,
                sizeFormatted: formatOddsSize(o.bs1 ?? o.ls1 ?? o.size),
            }
        })
    }, [oddsByGameId, activeTab, isOddsValid])

    const renderMatchCard = useCallback((match, index) => {
        const cardOdds = getCardOdds(match)
        const o1 = cardOdds[0]
        const o2 = cardOdds[1]
        const o3 = cardOdds[2]
        const hasBack1 = o1 && o1.back != null
        const hasLay1 = o1 && o1.lay != null
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
                        <ul>
                            <li>MO</li>
                            <li>BM</li>
                            <li>F</li>
                        </ul>
                    </div>
                    <p>{match.tournament}</p>
                    <div className='match_info'>
                        <p className='match_team'>{match.teams}</p>
                        <span>{match.inPlay ? 'Live' : match.time}</span>
                    </div>
                    <div className='d-flex justify-content-between align-items-center gap-2'>
                        <div className='view_matchlike'>
                            <button className='view_match' onClick={(e) => e.stopPropagation()}>
                                {hasBack1 ? o1.back : '—'} <span>{hasBack1 && (o1.sizeFormatted ?? o1.size) ? (o1.sizeFormatted ?? o1.size) : '—'}</span>
                            </button>
                            <button className='like_match' onClick={(e) => e.stopPropagation()}>
                                {hasLay1 ? o1.lay : '—'} <span>{hasLay1 && (o1.sizeFormatted ?? o1.size) ? (o1.sizeFormatted ?? o1.size) : '—'}</span>
                            </button>
                        </div>
                        <div className='view_matchlike'>
                            {(o2 && (o2.back != null || o2.lay != null)) ? (
                                <>
                                    <button className='view_match' onClick={(e) => e.stopPropagation()} disabled={o2.back == null}>{o2.back != null ? o2.back : '—'} <span>{(o2.sizeFormatted ?? o2.size) || '—'}</span></button>
                                    <button className='like_match' onClick={(e) => e.stopPropagation()} disabled={o2.lay == null}>{o2.lay != null ? o2.lay : '—'} <span>{(o2.sizeFormatted ?? o2.size) || '—'}</span></button>
                                </>
                            ) : (
                                <>
                                    <button className='view_match disabled' onClick={(e) => e.stopPropagation()}><i className="ri-lock-line" aria-hidden /></button>
                                    <button className='like_match disabled' onClick={(e) => e.stopPropagation()}><i className="ri-lock-line" aria-hidden /></button>
                                </>
                            )}
                        </div>
                        <div className='view_matchlike'>
                            <button className='view_match' onClick={(e) => e.stopPropagation()} disabled={!o3 || o3.back == null}>
                                {o3 && o3.back != null ? o3.back : '—'} <span>{o3 && o3.back != null && (o3.sizeFormatted ?? o3.size) ? (o3.sizeFormatted ?? o3.size) : '—'}</span>
                            </button>
                            <button className='like_match' onClick={(e) => e.stopPropagation()} disabled={!o3 || o3.lay == null}>
                                {o3 && o3.lay != null ? o3.lay : '—'} <span>{o3 && o3.lay != null && (o3.sizeFormatted ?? o3.size) ? (o3.sizeFormatted ?? o3.size) : '—'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }, [handleMatchCardClick, getCardOdds])

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

                    <div className='sports_game_section'>
                        <div className='sports_top_match_section'>
                            <div className="top_match_section pt-0">
                                <ul className='match_type_tabs'>
                                    {TABS.map((tab) => (
                                        <li
                                            key={tab.id}
                                            className={activeTab === tab.id ? 'active' : ''}
                                        >
                                            <button type='button' onClick={() => setActiveTab(tab.id)}>
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
                                    <div className='sports_grid_section'>
                                        <div className='sports_grid_header'>
                                            <div className='sports_grid_title'>
                                                <img src={activeTab === 'tennis' ? 'images/menu-icon20.svg' : activeTab === 'soccer' ? 'images/menu-icon19.svg' : 'images/menu-icon19.svg'} alt='' className='sports_grid_icon' />
                                                <h2 className='sports_grid_heading'>{activeTab === 'cricket' ? 'Cricket' : activeTab === 'tennis' ? 'Tennis' : 'Football'}</h2>
                                            </div>
                                            <div className='sports_grid_filters'>
                                                <button type='button' className={`sports_filter_btn ${sportsFilter === 'all' ? 'active' : ''}`} onClick={() => setSportsFilter('all')}>All</button>
                                                <button type='button' className={`sports_filter_btn ${sportsFilter === 'live' ? 'active' : ''}`} onClick={() => setSportsFilter('live')}>+ Live</button>
                                                <button type='button' className={`sports_filter_btn ${sportsFilter === 'virtual' ? 'active' : ''}`} onClick={() => setSportsFilter('virtual')}>+ Virtual</button>
                                                <button type='button' className={`sports_filter_btn ${sportsFilter === 'premium' ? 'active' : ''}`} onClick={() => setSportsFilter('premium')}>+ Premium</button>
                                            </div>
                                        </div>
                                        <div className='sports_grid_table_wrap desktop_view'>
                                            <table className='sports_grid_table'>
                                                <thead>
                                                    <tr className='sports_grid_header_row'>
                                                        <th className='sports_grid_match_cell'>MATCH</th>
                                                        <th className='sports_grid_icons_cell' aria-label="Markets"><span className='sports_grid_header_markets'>Markets</span></th>
                                                        {Array.from({ length: 3 }, (_, i) => (
                                                            <React.Fragment key={i}>
                                                                <th className='sports_grid_odds_cell'>Back</th>
                                                                <th className='sports_grid_odds_cell'>Lay</th>
                                                            </React.Fragment>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(activeTab === 'cricket' ? cricketMatchesLoading : activeTab === 'tennis' ? tennisMatchesLoading : soccerMatchesLoading) ? (
                                                        <tr><td colSpan={8} className='sports_grid_loading'>Loading {activeTab} matches...</td></tr>
                                                    ) : matchesByDay.length === 0 ? (
                                                        <tr><td colSpan={8} className='sports_grid_empty'>{NO_MATCHES_MSG()}</td></tr>
                                                    ) : (
                                                        matchesByDay.map(({ day, matches }) =>
                                                            matches.map((match, idx) => {
                                                                const cardOdds = getCardOdds(match)
                                                                return (
                                                                    <tr
                                                                        key={match.eventId ?? match.gameId ?? `${day}-${idx}`}
                                                                        className='sports_grid_row'
                                                                        onClick={(e) => !e.target.closest('button') && handleMatchCardClick(e, match)}
                                                                    >
                                                                        <td className='sports_grid_match_cell d-flex align-items-center gap-3'>

                                                                            <div className='sports_grid_match_cell_inner'>
                                                                                <span className='sports_grid_day_time'>{match.dayGroup}{match.timeOnly ? ` ${match.timeOnly}` : ''}</span>
                                                                                {match.inPlay && <span className='sports_grid_live'>LIVE</span>}
                                                                            </div>

                                                                            <div className='sports_grid_match_info'>

                                                                                <div className='sports_grid_tournament'>{match.tournament}</div>
                                                                                <div className='sports_grid_teams'>{match.teams}</div>
                                                                            </div>
                                                                        </td>
                                                                        <td className='sports_grid_icons_cell'>
                                                                            <div className='sports_grid_market_icons'>
                                                                                {MARKET_ICONS.map((icon) => (
                                                                                    <span key={icon} className='sports_grid_market_icon'>{icon}</span>
                                                                                ))}
                                                                            </div>
                                                                        </td>
                                                                        {Array.from({ length: 3 }).map((_, i) => {
                                                                            const pair = cardOdds[i]
                                                                            const hasBack = pair && pair.back != null
                                                                            const hasLay = pair && pair.lay != null
                                                                            const disabledBack = !hasBack
                                                                            const disabledLay = !hasLay
                                                                            return (
                                                                                <React.Fragment key={i}>
                                                                                    <td className={`sports_grid_odds_cell sports_grid_back ${disabledBack ? 'sports_grid_odds_disabled' : ''}`}>
                                                                                        {hasBack ? (
                                                                                            <button type='button' className='sports_grid_odds_btn' onClick={(e) => { e.stopPropagation(); handleMatchCardClick(e, match); }}>
                                                                                                <span className='sports_grid_odds_val'>{pair.back}</span>
                                                                                                <span className='sports_grid_odds_size'>{pair.sizeFormatted}</span>
                                                                                            </button>
                                                                                        ) : (
                                                                                            <span className='sports_grid_odds_dash'><i className='ri-lock-line' aria-hidden /></span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className={`sports_grid_odds_cell sports_grid_lay ${disabledLay ? 'sports_grid_odds_disabled' : ''}`}>
                                                                                        {hasLay ? (
                                                                                            <button type='button' className='sports_grid_odds_btn' onClick={(e) => { e.stopPropagation(); handleMatchCardClick(e, match); }}>
                                                                                                <span className='sports_grid_odds_val'>{pair.lay}</span>
                                                                                                <span className='sports_grid_odds_size'>{pair.sizeFormatted}</span>
                                                                                            </button>
                                                                                        ) : (
                                                                                            <span className='sports_grid_odds_dash'><i className='ri-lock-line' aria-hidden /></span>
                                                                                        )}
                                                                                    </td>
                                                                                </React.Fragment>
                                                                            )
                                                                        })}
                                                                    </tr>
                                                                )
                                                            })
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>


                                        <div className='sports_grid_table_wrap mobile_view'>
                                            <table className='sports_grid_table sports_grid_table_mobile'>
                                                <thead>
                                                    <tr className='sports_grid_header_row'>
                                                        <th className='sports_grid_match_cell'>MATCH</th>
                                                        <th className='sports_grid_mobile_backs_header'>Back</th>
                                                        <th className='sports_grid_mobile_lays_header'>Lay</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(activeTab === 'cricket' ? cricketMatchesLoading : activeTab === 'tennis' ? tennisMatchesLoading : soccerMatchesLoading) ? (
                                                        <tr><td colSpan={3} className='sports_grid_loading'>Loading {activeTab} matches...</td></tr>
                                                    ) : matchesByDay.length === 0 ? (
                                                        <tr><td colSpan={3} className='sports_grid_empty'>{NO_MATCHES_MSG()}</td></tr>
                                                    ) : (
                                                        matchesByDay.map(({ day, matches }) =>
                                                            matches.map((match, idx) => {
                                                                const cardOdds = getCardOdds(match)
                                                                const padTo3 = (arr) => { const a = [...arr]; while (a.length < 3) a.push(null); return a.slice(0, 3) }
                                                                const sortByBack = (a, b) => {
                                                                    const na = a ? parseFloat(a.back) : NaN
                                                                    const nb = b ? parseFloat(b.back) : NaN
                                                                    if (Number.isNaN(na) && Number.isNaN(nb)) return 0
                                                                    if (Number.isNaN(na)) return 1
                                                                    if (Number.isNaN(nb)) return -1
                                                                    return na - nb
                                                                }
                                                                const sortByLay = (a, b) => {
                                                                    const na = a ? parseFloat(a.lay) : NaN
                                                                    const nb = b ? parseFloat(b.lay) : NaN
                                                                    if (Number.isNaN(na) && Number.isNaN(nb)) return 0
                                                                    if (Number.isNaN(na)) return 1
                                                                    if (Number.isNaN(nb)) return -1
                                                                    return na - nb
                                                                }
                                                                const backSorted = padTo3([...cardOdds].sort(sortByBack))
                                                                const laySorted = padTo3([...cardOdds].sort(sortByLay))
                                                                return (
                                                                    <tr
                                                                        key={match.eventId ?? match.gameId ?? `${day}-${idx}`}
                                                                        className='sports_grid_row'
                                                                        onClick={(e) => !e.target.closest('button') && handleMatchCardClick(e, match)}
                                                                    >
                                                                        <td className='sports_grid_match_cell d-flex align-items-center gap-3'>
                                                                            <div className='sports_grid_match_cell_inner'>
                                                                                {/* <span className='sports_grid_day_time'>{match.dayGroup}{match.timeOnly ? <span className='sports_grid_time_only'>` ${match.timeOnly}`</span> : ''}</span> */}
                                                                                <span className="sports_grid_day_time">
                                                                                    {match.dayGroup}
                                                                                    {match.timeOnly && <span className='sports_grid_time_only'> {match.timeOnly}</span>}
                                                                                </span>
                                                                                {match.inPlay && <span className='sports_grid_live'>LIVE</span>}
                                                                            </div>
                                                                            <div className='sports_grid_match_info'>
                                                                                {/* <div className='sports_grid_tournament'>{match.tournament}</div> */}
                                                                                <div className='sports_grid_teams'>{match.teams}</div>
                                                                            </div>
                                                                        </td>
                                                                        <td className='sports_grid_mobile_backs_cell'>
                                                                            <div className='sports_grid_mobile_odds_list'>
                                                                                {backSorted.map((pair, i) => {
                                                                                    const hasBack = pair && pair.back != null
                                                                                    const disabledClass = !hasBack ? 'sports_grid_odds_disabled' : ''
                                                                                    return (
                                                                                        <div key={i} className={`sports_grid_mobile_odds_item sports_grid_back ${disabledClass}`}>
                                                                                            {hasBack ? (
                                                                                                <button type='button' className='sports_grid_odds_btn' onClick={(e) => { e.stopPropagation(); handleMatchCardClick(e, match); }}>
                                                                                                    <span className='sports_grid_odds_val'>{pair.back}</span>
                                                                                                    <span className='sports_grid_odds_size'>{pair.sizeFormatted}</span>
                                                                                                </button>
                                                                                            ) : (
                                                                                                <span className='sports_grid_odds_dash'><i className='ri-lock-line' aria-hidden /></span>
                                                                                            )}
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </td>
                                                                        <td className='sports_grid_mobile_lays_cell'>
                                                                            <div className='sports_grid_mobile_odds_list'>
                                                                                {laySorted.map((pair, i) => {
                                                                                    const hasLay = pair && pair.lay != null
                                                                                    const disabledClass = !hasLay ? 'sports_grid_odds_disabled' : ''
                                                                                    return (
                                                                                        <div key={i} className={`sports_grid_mobile_odds_item sports_grid_lay ${disabledClass}`}>
                                                                                            {hasLay ? (
                                                                                                <button type='button' className='sports_grid_odds_btn' onClick={(e) => { e.stopPropagation(); handleMatchCardClick(e, match); }}>
                                                                                                    <span className='sports_grid_odds_val'>{pair.lay}</span>
                                                                                                    <span className='sports_grid_odds_size'>{pair.sizeFormatted}</span>
                                                                                                </button>
                                                                                            ) : (
                                                                                                <span className='sports_grid_odds_dash'><i className='ri-lock-line' aria-hidden /></span>
                                                                                            )}
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
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

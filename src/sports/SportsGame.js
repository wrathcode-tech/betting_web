import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './sportsGame.css'
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

const GALLERY_SLIDES = ['images/sports_slider_img2.png', 'images/sports_slider_img.png', 'images/sports_slider_img3.png']
const GALLERY_SLIDES_MOBILE = ['images/sports_bnr_mobile2.jpg', 'images/sports_bnr_mobile.jpg', 'images/sports_bnr_mobile3.jpg']
const TABS = [
    { id: 'cricket', label: 'Cricket', icon: 'images/menu-icon19.svg' },
    // { id: 'tennis', label: 'Tennis', icon: 'images/menu-icon20.svg' },
    // { id: 'basketball', label: 'Basketball', icon: 'images/menu-icon6.svg' },
    // { id: 'table-tennis', label: 'Table Tennis', icon: 'images/menu-icon7.svg' },
    // { id: 'hockey', label: 'Hockey', icon: 'images/menu-icon10.svg' },
    // { id: 'counter-strike', label: 'Counter-Strike', icon: 'images/menu-icon11.svg' },
]
// Dummy data – commented out; cricket uses API (sportsbookMatches). Other tabs show empty until API is added.
// const MATCH_DATA = {
//     cricket: [
//         { tournament: 'ICC U19 World Cup', teams: 'India vs Australia', time: 'Today 01:00 PM', icon: 'images/cricket_world.png' },
//         ...
//     ],
//     tennis: [ ... ],
//     basketball: [ ... ],
//     'table-tennis': [ ... ],
//     hockey: [ ... ],
//     'counter-strike': [ ... ],
// }

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
    if (size == null || size === '') return '0.00K'
    const n = Number(size)
    if (!Number.isFinite(n)) return String(size)
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 2)}K`
    return `${n}`
}

const MARKET_ICONS = ['MC', 'BM', 'P', 'D', 'F']

function SportsGame() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('cricket')
    const [currentSlide, setCurrentSlide] = useState(0)
    const [arrowsVisible, setArrowsVisible] = useState(false)
    const sliderRef = useRef(null)
    const bannerSwipeRef = useRef({ startX: 0 })
    const touchHideTimerRef = useRef(null)

    const [cricketMatches, setCricketMatches] = useState([])
    const [cricketMatchesLoading, setCricketMatchesLoading] = useState(true)
    const [cricketOddsByGameId, setCricketOddsByGameId] = useState({})
    const subscribedOddsRef = useRef(new Set())
    const [sportsFilter, setSportsFilter] = useState('all') // 'all' | 'live' | 'virtual' | 'premium'

    const parseMatchesFromResponse = (res) => {
        if (!res) return []
        if (Array.isArray(res)) return res
        const raw = res.data ?? res
        const d = raw?.data ?? raw
        if (Array.isArray(d)) return d
        if (Array.isArray(d?.data)) return d.data
        if (Array.isArray(d?.matches)) return d.matches
        if (Array.isArray(raw?.matches)) return raw.matches
        return []
    }

    // REST: pehle matches load – taaki matches hamesha dikhen (bina login / socket fail bhi)
    useEffect(() => {
        let cancelled = false
        setCricketMatchesLoading(true)
        AuthService.sportsbookMatches('cricket')
            .then((res) => {
                if (cancelled) return
                setCricketMatches(parseMatchesFromResponse(res))
            })
            .catch(() => { if (!cancelled) setCricketMatches([]) })
            .finally(() => { if (!cancelled) setCricketMatchesLoading(false) })
        return () => { cancelled = true }
    }, [])

    // REST: pehle odds API – first 15 games ke liye initial odds
    useEffect(() => {
        const gameIds = cricketMatches.filter((m) => m.gameId).map((m) => m.gameId).slice(0, 15)
        if (gameIds.length === 0) return
        let cancelled = false
        const sportName = 'cricket'
        Promise.all(
            gameIds.map((gameId) =>
                AuthService.sportsbookOdds(sportName, gameId).then((res) => ({ gameId, res }))
            )
        ).then((results) => {
            if (cancelled) return
            setCricketOddsByGameId((prev) => {
                const next = { ...prev }
                results.forEach(({ gameId, res }) => {
                    if (!res) return
                    const raw = res.data ?? res
                    const d = raw?.data ?? raw
                    const matchOdds = Array.isArray(d?.matchOdds) ? d.matchOdds : []
                    next[gameId] = { ...(next[gameId] || {}), matchOdds }
                })
                return next
            })
        }).catch(() => {})
        return () => { cancelled = true }
    }, [cricketMatches])

    // Socket (doc): sport screen → subscribe:matches { sport: 'cricket' }, on('matches') { sport, data, timestamp }. Leave → unsubscribe:matches.
    useEffect(() => {
        const token = sessionStorage.getItem('token')
        const oddsSubs = subscribedOddsRef.current
        if (!token) return

        connectSportsbookSocket(token)
        const onMatches = (payload) => {
            if (payload?.sport !== 'cricket') return
            const raw = payload.data ?? payload.matches
            if (raw === undefined) return
            const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
            setCricketMatches((prev) => {
                if (list.length === 0 && prev.length > 0) return prev
                return list
            })
            setCricketMatchesLoading(false)
        }
        addMatchesListener(onMatches)
        subscribeMatches('cricket')

        return () => {
            removeMatchesListener(onMatches)
            unsubscribeMatches('cricket')
            oddsSubs.forEach((gid) => unsubscribeOdds(gid))
            oddsSubs.clear()
        }
    }, [])

    // Socket (doc): on('odds') { gameId, data: { matchOdds?, bookMakerOdds?, ... }, timestamp } – snapshot then ~500ms.
    useEffect(() => {
        const onOdds = (payload) => {
            if (!payload?.gameId || payload?.data === undefined) return
            const matchOdds = Array.isArray(payload.data?.matchOdds) ? payload.data.matchOdds : []
            setCricketOddsByGameId((prev) => ({ ...prev, [payload.gameId]: { matchOdds } }))
        }
        addOddsListener(onOdds)
        return () => removeOddsListener(onOdds)
    }, [])

    useEffect(() => {
        const gameIds = cricketMatches.filter((m) => m.gameId).map((m) => m.gameId).slice(0, 15)
        const prev = subscribedOddsRef.current
        gameIds.forEach((gameId) => {
            if (!prev.has(gameId)) {
                subscribeOdds(gameId)
                prev.add(gameId)
            }
        })
        prev.forEach((gameId) => {
            if (!gameIds.includes(gameId)) {
                unsubscribeOdds(gameId)
                prev.delete(gameId)
            }
        })
    }, [cricketMatches])

    const totalSlides = GALLERY_SLIDES.length
    const cricketDisplayMatches = useMemo(() => {
        const list = cricketMatches.map((m) => {
            const eventTime = m.eventTime ?? m.event_time ?? m.startTime
            let timeOnly = ''
            if (eventTime) {
                try {
                    const d = new Date(eventTime)
                    if (!isNaN(d.getTime())) timeOnly = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                } catch {}
            }
            return {
                tournament: m.seriesName ?? m.series_name ?? 'Cricket',
                teams: m.eventName ?? m.event_name ?? m.name ?? '',
                time: formatMatchTime(eventTime),
                timeOnly,
                dayGroup: getDayGroup(eventTime),
                icon: 'images/cricket_world.png',
                eventId: m.eventId ?? m.event_id,
                gameId: m.gameId ?? m.game_id,
                marketId: m.marketId ?? m.market_id,
                inPlay: m.inPlay ?? m.in_play ?? false,
                seriesId: m.seriesId ?? m.series_id,
            }
        })
        return list.sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0))
    }, [cricketMatches])
    const activeMatches = useMemo(() => {
        if (activeTab === 'cricket') return cricketDisplayMatches
        return [] // Other tabs: no dummy data; add API (e.g. sportsbookMatches('soccer')) when ready
    }, [activeTab, cricketDisplayMatches])

    const gridMatches = useMemo(() => {
        if (activeTab !== 'cricket') return []
        if (sportsFilter === 'live') return activeMatches.filter((m) => m.inPlay)
        // all / virtual / premium: show all, with live matches at top
        return [...activeMatches].sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0))
    }, [activeTab, sportsFilter, activeMatches])

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
        const state = match?.gameId ? { gameId: match.gameId, eventName: match.teams, sportName: 'cricket' } : undefined
        navigate('/cricket', { state })
    }, [navigate])

    const getCardOdds = useCallback((match) => {
        if (!match.gameId) return []
        const oddsPayload = cricketOddsByGameId[match.gameId]
        if (!oddsPayload?.matchOdds?.length) return []
        const market = oddsPayload.matchOdds[0]
        const arr = toOddDatasArray(market.oddDatas).slice(0, 6)
        return arr.map((o) => ({
            back: o.b1 ?? o.back ?? '-',
            lay: o.l1 ?? o.lay ?? '-',
            size: o.bs1 ?? o.ls1 ?? o.size,
            sizeFormatted: formatOddsSize(o.bs1 ?? o.ls1 ?? o.size),
        }))
    }, [cricketOddsByGameId])

    const renderMatchCard = useCallback((match, index) => {
        const cardOdds = getCardOdds(match)
        const o1 = cardOdds[0]
        const o2 = cardOdds[1]
        const o3 = cardOdds[2]
        const hasOdds = cardOdds.length > 0
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
                                {hasOdds && o1 ? o1.back : '3.12'} <span>{hasOdds && o1 && (o1.sizeFormatted ?? o1.size) ? (o1.sizeFormatted ?? o1.size) : '357K'}</span>
                            </button>
                            <button className='like_match' onClick={(e) => e.stopPropagation()}>
                                {hasOdds && o1 ? o1.lay : '3.12'} <span>{hasOdds && o1 && (o1.sizeFormatted ?? o1.size) ? (o1.sizeFormatted ?? o1.size) : '357K'}</span>
                            </button>
                        </div>
                        <div className='view_matchlike'>
                            {hasOdds && o2 ? (
                                <>
                                    <button className='view_match' onClick={(e) => e.stopPropagation()}>{o2.back} <span>{(o2.sizeFormatted ?? o2.size) || '357K'}</span></button>
                                    <button className='like_match' onClick={(e) => e.stopPropagation()}>{o2.lay} <span>{(o2.sizeFormatted ?? o2.size) || '357K'}</span></button>
                                </>
                            ) : (
                                <>
                                    <button className='view_match disabled' onClick={(e) => e.stopPropagation()}><i className="ri-lock-line"></i></button>
                                    <button className='like_match disabled' onClick={(e) => e.stopPropagation()}><i className="ri-lock-line"></i></button>
                                </>
                            )}
                        </div>
                        <div className='view_matchlike'>
                            <button className='view_match' onClick={(e) => e.stopPropagation()}>
                                {hasOdds && o3 ? o3.back : '3.12'} <span>{hasOdds && o3 && (o3.sizeFormatted ?? o3.size) ? (o3.sizeFormatted ?? o3.size) : '357K'}</span>
                            </button>
                            <button className='like_match' onClick={(e) => e.stopPropagation()}>
                                {hasOdds && o3 ? o3.lay : '3.12'} <span>{hasOdds && o3 && (o3.sizeFormatted ?? o3.size) ? (o3.sizeFormatted ?? o3.size) : '357K'}</span>
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
                            <div className="top_match_section">
                                {/* <div className="top_hd d-flex align-items-center justify-content-between">
                                    <h2 className="heading_h2">TOP SLOTS</h2>
                                </div> */}

                                <ul className='match_type_tabs'>
                                    {TABS.map((tab) => (
                                        <li
                                            key={tab.id}
                                            className={activeTab === tab.id ? 'active' : ''}
                                        >
                                            <button onClick={() => setActiveTab(tab.id)}>
                                                <img alt={tab.label} src={tab.icon} loading="lazy" decoding="async" />
                                                <span>{tab.label}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                {activeTab === 'cricket' && (
                                    <div className='sports_grid_section'>
                                        <div className='sports_grid_header'>
                                            <div className='sports_grid_title'>
                                                <img src='images/menu-icon19.svg' alt='' className='sports_grid_icon' />
                                                <h2 className='sports_grid_heading'>Cricket</h2>
                                            </div>
                                            <div className='sports_grid_filters'>
                                                <button type='button' className={`sports_filter_btn ${sportsFilter === 'all' ? 'active' : ''}`} onClick={() => setSportsFilter('all')}>All</button>
                                                <button type='button' className={`sports_filter_btn ${sportsFilter === 'live' ? 'active' : ''}`} onClick={() => setSportsFilter('live')}>+ Live</button>
                                                <button type='button' className={`sports_filter_btn ${sportsFilter === 'virtual' ? 'active' : ''}`} onClick={() => setSportsFilter('virtual')}>+ Virtual</button>
                                                <button type='button' className={`sports_filter_btn ${sportsFilter === 'premium' ? 'active' : ''}`} onClick={() => setSportsFilter('premium')}>+ Premium</button>
                                            </div>
                                        </div>
                                        <div className='sports_grid_table_wrap'>
                                            <table className='sports_grid_table'>
                                                <tbody>
                                                    {cricketMatchesLoading ? (
                                                        <tr><td colSpan={20} className='sports_grid_loading'>Loading cricket matches...</td></tr>
                                                    ) : matchesByDay.length === 0 ? (
                                                        <tr><td colSpan={20} className='sports_grid_empty'>No matches at the moment.</td></tr>
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
                                                                        <td className='sports_grid_match_cell'>
                                                                            <div className='sports_grid_day_time'>
                                                                                {match.dayGroup}{match.timeOnly ? ` ${match.timeOnly}` : ''}
                                                                            </div>
                                                                            {match.inPlay && <span className='sports_grid_live'>LIVE</span>}
                                                                            <div className='sports_grid_tournament'>{match.tournament}</div>
                                                                            <div className='sports_grid_teams'>{match.teams}</div>
                                                                        </td>
                                                                        <td className='sports_grid_icons_cell'>
                                                                            {MARKET_ICONS.map((icon) => (
                                                                                <span key={icon} className='sports_grid_market_icon'>{icon}</span>
                                                                            ))}
                                                                        </td>
                                                                        {Array.from({ length: 6 }).map((_, i) => {
                                                                            const pair = cardOdds[i]
                                                                            return (
                                                                                <React.Fragment key={i}>
                                                                                    <td className='sports_grid_odds_cell sports_grid_back'>
                                                                                        {pair ? (
                                                                                            <button type='button' className='sports_grid_odds_btn' onClick={(e) => { e.stopPropagation(); handleMatchCardClick(e, match); }}>
                                                                                                <span className='sports_grid_odds_val'>{pair.back}</span>
                                                                                                <span className='sports_grid_odds_size'>{pair.sizeFormatted}</span>
                                                                                            </button>
                                                                                        ) : (
                                                                                            <span className='sports_grid_odds_dash'>−</span>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className='sports_grid_odds_cell sports_grid_lay'>
                                                                                        {pair ? (
                                                                                            <button type='button' className='sports_grid_odds_btn' onClick={(e) => { e.stopPropagation(); handleMatchCardClick(e, match); }}>
                                                                                                <span className='sports_grid_odds_val'>{pair.lay}</span>
                                                                                                <span className='sports_grid_odds_size'>{pair.sizeFormatted}</span>
                                                                                            </button>
                                                                                        ) : (
                                                                                            <span className='sports_grid_odds_dash'>−</span>
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
                                    </div>
                                )}

                                <div className={`match_slider_wrapper ${activeTab === 'cricket' ? 'sports_grid_cards_hidden' : ''}`}>
                                    {activeTab === 'cricket' && cricketMatchesLoading ? (
                                        <div className="match_slider_loading" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #888)' }}>
                                            Loading cricket matches...
                                        </div>
                                    ) : activeMatches.length === 0 ? (
                                        <div className="match_slider_empty" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #888)' }}>
                                            No matches at the moment.
                                        </div>
                                    ) : (
                                        activeMatches.map((match, index) => renderMatchCard(match, index))
                                    )}
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <MobileMenu />
        </>
    )
}

export default SportsGame

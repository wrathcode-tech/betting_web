import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './sportsGame.css'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'

const GALLERY_SLIDES = ['images/sports_slider_img2.png', 'images/sports_slider_img.png', 'images/sports_slider_img3.png']
const GALLERY_SLIDES_MOBILE = ['images/sports_bnr_mobile2.jpg', 'images/sports_bnr_mobile.jpg', 'images/sports_bnr_mobile3.jpg']
const TABS = [
    { id: 'cricket', label: 'Cricket', icon: 'images/menu-icon19.svg' },
    { id: 'tennis', label: 'Tennis', icon: 'images/menu-icon20.svg' },
    { id: 'basketball', label: 'Basketball', icon: 'images/menu-icon6.svg' },
    { id: 'table-tennis', label: 'Table Tennis', icon: 'images/menu-icon7.svg' },
    { id: 'hockey', label: 'Hockey', icon: 'images/menu-icon10.svg' },
    { id: 'counter-strike', label: 'Counter-Strike', icon: 'images/menu-icon11.svg' },
]
const MATCH_DATA = {
    cricket: [
        { tournament: 'ICC U19 World Cup', teams: 'India vs Australia', time: 'Today 01:00 PM', icon: 'images/cricket_world.png' },
        { tournament: 'ICC U19 World Cup', teams: 'India vs Australia', time: 'Today 01:00 PM', icon: 'images/cricket_world.png' },
        { tournament: 'ICC U19 World Cup', teams: 'India vs Australia', time: 'Today 01:00 PM', icon: 'images/cricket_world.png' },
        { tournament: 'ICC U19 World Cup', teams: 'India vs Australia', time: 'Today 01:00 PM', icon: 'images/cricket_world.png' },
        { tournament: 'ICC U19 World Cup', teams: 'India vs Australia', time: 'Today 01:00 PM', icon: 'images/cricket_world.png' },
        { tournament: 'ICC U19 World Cup', teams: 'India vs Australia', time: 'Today 01:00 PM', icon: 'images/cricket_world.png' },
    ],
    tennis: [
        { tournament: 'ATP Masters 1000', teams: 'Djokovic vs Nadal', time: 'Today 02:30 PM', icon: 'images/menu-icon20.svg' },
        { tournament: 'Wimbledon Championship', teams: 'Federer vs Murray', time: 'Today 03:00 PM', icon: 'images/menu-icon20.svg' },
        { tournament: 'US Open', teams: 'Medvedev vs Tsitsipas', time: 'Today 04:00 PM', icon: 'images/menu-icon20.svg' },
    ],
    basketball: [
        { tournament: 'NBA Regular Season', teams: 'Lakers vs Warriors', time: 'Today 06:00 PM', icon: 'images/menu-icon6.svg' },
        { tournament: 'NBA Regular Season', teams: 'Celtics vs Heat', time: 'Today 07:00 PM', icon: 'images/menu-icon6.svg' },
        { tournament: 'NBA Regular Season', teams: 'Bucks vs Nets', time: 'Today 08:00 PM', icon: 'images/menu-icon6.svg' },
    ],
    'table-tennis': [
        { tournament: 'ITTF World Tour', teams: 'Ma Long vs Fan Zhendong', time: 'Today 10:00 AM', icon: 'images/menu-icon7.svg' },
        { tournament: 'ITTF World Tour', teams: 'Xu Xin vs Lin Gaoyuan', time: 'Today 11:00 AM', icon: 'images/menu-icon7.svg' },
        { tournament: 'ITTF World Tour', teams: 'Ma Long vs Fan Zhendong', time: 'Today 10:00 AM', icon: 'images/menu-icon7.svg' },
    ],
    hockey: [
        { tournament: 'NHL Regular Season', teams: 'Maple Leafs vs Canadiens', time: 'Today 12:00 PM', icon: 'images/menu-icon10.svg' },
        { tournament: 'NHL Regular Season', teams: 'Rangers vs Bruins', time: 'Today 01:30 PM', icon: 'images/menu-icon10.svg' },
        { tournament: 'NHL Regular Season', teams: 'Avalanche vs Lightning', time: 'Today 03:00 PM', icon: 'images/menu-icon10.svg' },
    ],
    'counter-strike': [
        { tournament: 'ESL Pro League', teams: 'NAVI vs FaZe Clan', time: 'Today 07:00 PM', icon: 'images/menu-icon11.svg' },
        { tournament: 'BLAST Premier', teams: 'G2 vs Team Liquid', time: 'Today 08:00 PM', icon: 'images/menu-icon11.svg' },
        { tournament: 'IEM Katowice', teams: 'Vitality vs Astralis', time: 'Today 09:00 PM', icon: 'images/menu-icon11.svg' },
    ],
}

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

    useEffect(() => {
        let cancelled = false
        setCricketMatchesLoading(true)
        AuthService.sportsbookMatches('cricket')
            .then((res) => {
                if (cancelled || !res) return
                const raw = res.data ?? res
                const d = raw?.data ?? raw
                const list = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : [])
                setCricketMatches(list)
            })
            .catch(() => { if (!cancelled) setCricketMatches([]) })
            .finally(() => { if (!cancelled) setCricketMatchesLoading(false) })
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        const gameIds = cricketMatches.filter((m) => m.gameId).map((m) => m.gameId).slice(0, 15)
        if (gameIds.length === 0) return
        let cancelled = false
        gameIds.forEach((gameId) => {
            AuthService.sportsbookOdds('cricket', gameId)
                .then((res) => {
                    if (cancelled || !res) return
                    const raw = res.data ?? res
                    const d = raw?.data ?? raw
                    if (!d || typeof d !== 'object') return
                    const matchOdds = Array.isArray(d.matchOdds) ? d.matchOdds : []
                    setCricketOddsByGameId((prev) => ({ ...prev, [gameId]: { matchOdds } }))
                })
                .catch(() => {})
        })
        return () => { cancelled = true }
    }, [cricketMatches])

    const totalSlides = GALLERY_SLIDES.length
    const cricketDisplayMatches = useMemo(() =>
        cricketMatches.map((m) => ({
            tournament: m.seriesName || 'Cricket',
            teams: m.eventName || '',
            time: formatMatchTime(m.eventTime),
            icon: 'images/cricket_world.png',
            eventId: m.eventId,
            gameId: m.gameId,
            marketId: m.marketId,
            inPlay: m.inPlay,
            seriesId: m.seriesId,
        })),
        [cricketMatches]
    )
    const activeMatches = useMemo(() => {
        if (activeTab === 'cricket') return cricketDisplayMatches
        return MATCH_DATA[activeTab] || MATCH_DATA.cricket
    }, [activeTab, cricketDisplayMatches])

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
        const arr = toOddDatasArray(market.oddDatas).slice(0, 3)
        return arr.map((o) => ({ back: o.b1 ?? '-', lay: o.l1 ?? '-', size: o.bs1 || o.ls1 }))
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
                                {hasOdds && o1 ? o1.back : '3.12'} <span>{hasOdds && o1 && o1.size ? o1.size : '357K'}</span>
                            </button>
                            <button className='like_match' onClick={(e) => e.stopPropagation()}>
                                {hasOdds && o1 ? o1.lay : '3.12'} <span>{hasOdds && o1 && o1.size ? o1.size : '357K'}</span>
                            </button>
                        </div>
                        <div className='view_matchlike'>
                            {hasOdds && o2 ? (
                                <>
                                    <button className='view_match' onClick={(e) => e.stopPropagation()}>{o2.back} <span>{o2.size || '357K'}</span></button>
                                    <button className='like_match' onClick={(e) => e.stopPropagation()}>{o2.lay} <span>{o2.size || '357K'}</span></button>
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
                                {hasOdds && o3 ? o3.back : '3.12'} <span>{hasOdds && o3 && o3.size ? o3.size : '357K'}</span>
                            </button>
                            <button className='like_match' onClick={(e) => e.stopPropagation()}>
                                {hasOdds && o3 ? o3.lay : '3.12'} <span>{hasOdds && o3 && o3.size ? o3.size : '357K'}</span>
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
                                <div className="top_hd d-flex align-items-center justify-content-between">
                                    <h2 className="heading_h2">TOP SLOTS</h2>
                                </div>

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

                                <div className="match_slider_wrapper">
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

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './sportsGame.css'
import UserHeader from '../customComponents/UserHeader'
import MobileMenu from '../customComponents/MobileMenu'

function SportsGame() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('cricket')

    const gallerySlides = [
        'images/sports_slider_img.jpg',
        'images/sports_slider_img2.jpg',
        'images/sports_slider_img3.jpg',
        'images/sports_slider_img4.jpg',
        'images/sports_slider_img5.jpg',
    ]
    const [currentSlide, setCurrentSlide] = useState(0)
    const sliderRef = useRef(null)

    const getSlidesPerView = () => {
        if (typeof window === 'undefined') return 1
        const w = window.innerWidth
        if (w >= 1025) return 3
        if (w >= 769) return 2
        return 1
    }
    const [slidesPerView, setSlidesPerView] = useState(getSlidesPerView)
    const [layoutKey, setLayoutKey] = useState(0)
    useEffect(() => {
        const mq3 = window.matchMedia('(min-width: 1025px)')
        const mq2 = window.matchMedia('(min-width: 769px)')
        const update = () => setSlidesPerView(mq3.matches ? 3 : mq2.matches ? 2 : 1)
        update()
        mq3.addEventListener('change', update)
        mq2.addEventListener('change', update)
        return () => {
            mq3.removeEventListener('change', update)
            mq2.removeEventListener('change', update)
        }
    }, [])
    useEffect(() => {
        const onResize = () => setLayoutKey((k) => k + 1)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    const maxIndex = Math.max(0, gallerySlides.length - slidesPerView)
    const handleBannerPrev = () => {
        if (slidesPerView === 1) setCurrentSlide((prev) => (prev <= 0 ? gallerySlides.length - 1 : prev - 1))
        else setCurrentSlide((prev) => (prev <= 0 ? maxIndex : prev - 1))
    }
    const handleBannerNext = () => {
        if (slidesPerView === 1) setCurrentSlide((prev) => (prev >= gallerySlides.length - 1 ? 0 : prev + 1))
        else setCurrentSlide((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }

    const GALLERY_GAP = 18
    useEffect(() => {
        if (!sliderRef.current) return
        if (slidesPerView === 1) {
            sliderRef.current.style.transform = `translateX(-${currentSlide * 100}%)`
        } else {
            const firstSlide = sliderRef.current.querySelector('.sports_bnr_gallery_slide')
            const slideWidth = firstSlide ? firstSlide.offsetWidth : 0
            const step = slideWidth + GALLERY_GAP
            sliderRef.current.style.transform = `translateX(-${currentSlide * step}px)`
        }
    }, [currentSlide, slidesPerView, layoutKey])

    const dotCount = slidesPerView === 1 ? gallerySlides.length : maxIndex + 1
    const handleDotClick = (index) => setCurrentSlide(index)
    const isDotActive = (index) => index === currentSlide

    const [arrowsVisible, setArrowsVisible] = useState(false)
    const touchHideTimerRef = useRef(null)
    const handleSliderEnter = () => setArrowsVisible(true)
    const handleSliderLeave = () => setArrowsVisible(false)
    const handleSliderTouchStart = () => {
        if (touchHideTimerRef.current) clearTimeout(touchHideTimerRef.current)
        setArrowsVisible(true)
    }
    const handleSliderTouchEnd = () => {
        touchHideTimerRef.current = setTimeout(() => setArrowsVisible(false), 400)
    }
    useEffect(() => {
        return () => {
            if (touchHideTimerRef.current) clearTimeout(touchHideTimerRef.current)
        }
    }, [])

    const tabs = [
        { id: 'cricket', label: 'Cricket', icon: 'images/menu-icon19.svg' },
        { id: 'tennis', label: 'Tennis', icon: 'images/menu-icon20.svg' },
        { id: 'basketball', label: 'Basketball', icon: 'images/menu-icon6.svg' },
        { id: 'table-tennis', label: 'Table Tennis', icon: 'images/menu-icon7.svg' },
        { id: 'hockey', label: 'Hockey', icon: 'images/menu-icon10.svg' },
        { id: 'counter-strike', label: 'Counter-Strike', icon: 'images/menu-icon11.svg' },
    ]

    // Function to get match data for each sport
    const getMatchData = (sportId) => {
        const matchData = {
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
        return matchData[sportId] || matchData.cricket
    }

    // Handle match card click
    const handleMatchCardClick = (e) => {
        // Prevent navigation if clicking on buttons
        if (e.target.closest('button')) {
            e.preventDefault()
            e.stopPropagation()
            return
        }
        navigate('/cricket')
    }

    // Function to render match card
    const renderMatchCard = (match, index) => (
        <div
            key={index}
            className='match_slider'
            onClick={handleMatchCardClick}
            style={{ display: 'block', cursor: 'pointer' }}
        >
            <div className='match_slider_inner'>
                <div className='matchtp_hd d-flex justify-content-between align-items-center gap-2'>
                    <div className='hd_match d-flex align-items-center gap-2'>
                        <img src={match.icon} alt="match" />
                        <h3>Match</h3>
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
                    <span>{match.time}</span>
                </div>
                <div className='d-flex justify-content-between align-items-center gap-2'>
                    <div className='view_matchlike'>
                        <button
                            className='view_match'
                            onClick={(e) => e.stopPropagation()}
                        >3.12 <span>357K</span></button>
                        <button
                            className='like_match'
                            onClick={(e) => e.stopPropagation()}
                        >3.12 <span>357K</span></button>
                    </div>
                    <div className='view_matchlike'>
                        <button
                            className='view_match disabled'
                            onClick={(e) => e.stopPropagation()}
                        ><i className="ri-lock-line"></i></button>
                        <button
                            className='like_match disabled'
                            onClick={(e) => e.stopPropagation()}
                        ><i className="ri-lock-line"></i></button>
                    </div>
                    <div className='view_matchlike'>
                        <button
                            className='view_match'
                            onClick={(e) => e.stopPropagation()}
                        >3.12 <span>357K</span></button>
                        <button
                            className='like_match'
                            onClick={(e) => e.stopPropagation()}
                        >3.12 <span>357K</span></button>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <>
            <UserHeader />
            <div className='dashboard_page'>
                <div className='container'>
                    <div className='sports_hero_section'>
                        <div
                            className={`sports_bnr_gallery_wrapper ${arrowsVisible ? 'sports_bnr_arrows_visible' : ''}`}
                            onMouseEnter={handleSliderEnter}
                            onMouseLeave={handleSliderLeave}
                            onTouchStart={handleSliderTouchStart}
                            onTouchEnd={handleSliderTouchEnd}
                        >
                            <button type="button" className="sports_bnr_arrow sports_bnr_arrow_prev" onClick={handleBannerPrev} aria-label="Previous slide">
                                <i className="ri-arrow-left-s-line"></i>
                            </button>
                            <button type="button" className="sports_bnr_arrow sports_bnr_arrow_next" onClick={handleBannerNext} aria-label="Next slide">
                                <i className="ri-arrow-right-s-line"></i>
                            </button>
                            <div className="sports_bnr_gallery_track" ref={sliderRef}>
                                {gallerySlides.map((image, index) => (
                                    <div key={index} className="sports_bnr_gallery_slide">
                                        <img src={image} alt={`Sports gallery ${index + 1}`} />
                                    </div>
                                ))}
                            </div>
                            <div className="sports_bnr_slider_dots">
                                {Array.from({ length: dotCount }, (_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`dot ${isDotActive(index) ? 'active' : ''}`}
                                        onClick={() => handleDotClick(index)}
                                        aria-label={`Page ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className='sports_game_section'>

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

                        {/* <div className='sports_hero_banr'>
                            <div className='bnr_cnt'>
                                <h1>LIVE CRICKET <br></br>BETTING</h1>
                                <p>Har Ball • Har Run • Jeet Ka Mauka</p>
                                <button className='btn betnow'>BET NOW</button>
                            </div>

                            <div className='sports_banr_img'>
                                <img src="images/world_cup_trophy.png" alt="sports" />
                            </div>

                        </div> */}

                        <div className='sports_top_match_section'>
                            <div className="top_match_section">
                                <div className="top_hd d-flex align-items-center justify-content-between">
                                    <h2 className="heading_h2">TOP SLOTS</h2>
                                </div>

                                <ul className='match_type_tabs'>
                                    {tabs.map((tab) => (
                                        <li
                                            key={tab.id}
                                            className={activeTab === tab.id ? 'active' : ''}
                                        >
                                            <button onClick={() => setActiveTab(tab.id)}>
                                                <img alt={tab.label} src={tab.icon} />
                                                <span>{tab.label}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                {tabs.map((tab) => (
                                    <div
                                        key={tab.id}
                                        className={`match_slider_wrapper ${activeTab === tab.id ? '' : 'hidden'}`}
                                    >
                                        {getMatchData(tab.id).map((match, index) => renderMatchCard(match, index))}
                                    </div>
                                ))}

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

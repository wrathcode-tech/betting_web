import React, { useMemo, useState, useEffect, useRef } from 'react'
import './gamePlay.css'
import UserHeader from '../customComponents/UserHeader'
import MobileMenu from '../customComponents/MobileMenu'

function GamePlay() {
    const [isInfoExpanded, setIsInfoExpanded] = useState(false)
    const [isSectionOpen, setIsSectionOpen] = useState(true) // Default open

    // Slider 1 (Best Spribe games) state
    const [slider1Index, setSlider1Index] = useState(0)
    const slider1Ref = useRef(null)

    // Slider 2 (Most popular games) state
    const [slider2Index, setSlider2Index] = useState(0)
    const slider2Ref = useRef(null)

    // Game items data
    const gameItems = [
        { badge: 'Top', image: 'images/betcasino_img.png' },
        { badge: null, image: 'images/betcasino_img2.png' },
        { badge: 'Top', image: 'images/betcasino_img3.png' },
        { badge: null, image: 'images/betcasino_img4.png' },
        { badge: 'Hot', image: 'images/betcasino_img5.png' },
        { badge: null, image: 'images/betcasino_img6.png' },
        { badge: null, image: 'images/betcasino_img7.png' },
        { badge: null, image: 'images/betcasino_img.png' },
    ]

    const itemsPerSet = gameItems.length
    // Duplicate items for seamless infinite loop (3 copies total)
    const duplicatedItems = [...gameItems, ...gameItems, ...gameItems]

    // Get item width based on screen size (including gap for translateX calculation)
    const getItemWidth = () => {
        if (window.innerWidth <= 480) {
            // Mobile: 2 items visible
            // Get actual slider wrapper width
            const sliderWrapper = document.querySelector('.game_items_slider_wrapper')
            if (sliderWrapper) {
                const wrapperWidth = sliderWrapper.offsetWidth
                // Each item width = (wrapperWidth - gap) / 2, then add gap for translateX
                return (wrapperWidth - 18) / 2 + 18
            }
            // Fallback calculation
            const containerWidth = Math.min(window.innerWidth - 32, 480)
            return (containerWidth - 18) / 2 + 18
        }
        // Desktop: default width (min-width + gap)
        return 178 + 18
    }

    const infoBtnLabel = useMemo(
        () => (isInfoExpanded ? 'Show Less' : 'Show More'),
        [isInfoExpanded]
    )

    const infoBtnIcon = useMemo(
        () => (isInfoExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'),
        [isInfoExpanded]
    )

    // Slider 1 (Best Spribe games) - Initial setup
    useEffect(() => {
        if (slider1Ref.current) {
            const itemWidth = getItemWidth()
            slider1Ref.current.style.transition = 'none'
            slider1Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`
            setTimeout(() => {
                if (slider1Ref.current) {
                    slider1Ref.current.style.transition = 'transform 0.8s ease-in-out'
                }
            }, 500)
        }
        setSlider1Index(itemsPerSet)
    }, [itemsPerSet])

    // Handle window resize for responsive slider
    useEffect(() => {
        const handleResize = () => {
            if (slider1Ref.current && slider1Index > 0) {
                const itemWidth = getItemWidth()
                slider1Ref.current.style.transform = `translateX(${-slider1Index * itemWidth}px)`
            }
            if (slider2Ref.current && slider2Index > 0) {
                const itemWidth = getItemWidth()
                slider2Ref.current.style.transform = `translateX(${-slider2Index * itemWidth}px)`
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [slider1Index, slider2Index])

    // Slider 1 navigation handlers
    const handleSlider1Next = () => {
        setSlider1Index((prevIndex) => {
            const nextIndex = prevIndex + 1
            if (nextIndex >= itemsPerSet * 2) {
                requestAnimationFrame(() => {
                    if (slider1Ref.current) {
                        const itemWidth = getItemWidth()
                        slider1Ref.current.style.transition = 'none'
                        slider1Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`
                        void slider1Ref.current.offsetWidth
                        slider1Ref.current.style.transition = 'transform 0.8s ease-in-out'
                    }
                })
                return itemsPerSet
            }
            return nextIndex
        })
    }

    const handleSlider1Prev = () => {
        setSlider1Index((prevIndex) => {
            const nextIndex = prevIndex - 1
            if (nextIndex < 0) {
                requestAnimationFrame(() => {
                    if (slider1Ref.current) {
                        const itemWidth = getItemWidth()
                        slider1Ref.current.style.transition = 'none'
                        slider1Ref.current.style.transform = `translateX(${-(itemsPerSet * 2 - 1) * itemWidth}px)`
                        void slider1Ref.current.offsetWidth
                        slider1Ref.current.style.transition = 'transform 0.8s ease-in-out'
                    }
                })
                return itemsPerSet * 2 - 1
            }
            return nextIndex
        })
    }

    // Slider 1 transform
    useEffect(() => {
        if (slider1Ref.current && slider1Index > 0) {
            const itemWidth = getItemWidth()
            const translateX = -slider1Index * itemWidth
            slider1Ref.current.style.transform = `translateX(${translateX}px)`
        }
    }, [slider1Index])

    // Slider 2 (Most popular games) - Initial setup
    useEffect(() => {
        if (slider2Ref.current) {
            const itemWidth = getItemWidth()
            slider2Ref.current.style.transition = 'none'
            slider2Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`
            setTimeout(() => {
                if (slider2Ref.current) {
                    slider2Ref.current.style.transition = 'transform 0.8s ease-in-out'
                }
            }, 500)
        }
        setSlider2Index(itemsPerSet)
    }, [itemsPerSet])

    // Slider 2 navigation handlers
    const handleSlider2Next = () => {
        setSlider2Index((prevIndex) => {
            const nextIndex = prevIndex + 1
            if (nextIndex >= itemsPerSet * 2) {
                requestAnimationFrame(() => {
                    if (slider2Ref.current) {
                        const itemWidth = getItemWidth()
                        slider2Ref.current.style.transition = 'none'
                        slider2Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`
                        void slider2Ref.current.offsetWidth
                        slider2Ref.current.style.transition = 'transform 0.8s ease-in-out'
                    }
                })
                return itemsPerSet
            }
            return nextIndex
        })
    }

    const handleSlider2Prev = () => {
        setSlider2Index((prevIndex) => {
            const nextIndex = prevIndex - 1
            if (nextIndex < 0) {
                requestAnimationFrame(() => {
                    if (slider2Ref.current) {
                        const itemWidth = getItemWidth()
                        slider2Ref.current.style.transition = 'none'
                        slider2Ref.current.style.transform = `translateX(${-(itemsPerSet * 2 - 1) * itemWidth}px)`
                        void slider2Ref.current.offsetWidth
                        slider2Ref.current.style.transition = 'transform 0.8s ease-in-out'
                    }
                })
                return itemsPerSet * 2 - 1
            }
            return nextIndex
        })
    }

    // Slider 2 transform
    useEffect(() => {
        if (slider2Ref.current && slider2Index > 0) {
            const itemWidth = getItemWidth()
            const translateX = -slider2Index * itemWidth
            slider2Ref.current.style.transform = `translateX(${translateX}px)`
        }
    }, [slider2Index])

    return (
        <>
            <UserHeader />
            <div className='dashboard_page'>
                <div className='gameplay_outer'>
                <div className='container'>
                    <div className='gameplay_section'>

                        <div className='playgame_data_summary'>

                            <div className='header game-header d-flex align-items-center justify-content-between'>
                                <div className='game-header-left d-flex align-items-center gap-2'>
                                    <span className='rtp-text'>RTP</span>
                                    <span className='rtp-value'>97.00%</span>
                                    <i className="ri-information-line rtp-info-icon"></i>

                                    <div className='game-header-center'>
                                        <div className='play-mode-toggle'>
                                            <span className='toggle-label'>Demo Play</span>
                                            <label className='toggle-switch'>
                                                <input type="checkbox" />
                                                <span className='toggle-slider'></span>
                                            </label>
                                            <span className='toggle-label'>Real Play</span>
                                        </div>
                                    </div>

                                </div>

                                <div className='game-header-right d-flex align-items-center gap-1'>
                                    <button className='game-header-icon-btn'>
                                        <i className="ri-heart-line"></i>
                                    </button>
                                    <button className='game-header-icon-btn'>
                                        <i className="ri-fullscreen-line"></i>
                                    </button>
                                    <button className='game-header-icon-btn'>
                                        <i className="ri-window-line"></i>
                                    </button>
                                </div>
                            </div>

                            <img src="images/playgame_img.png" alt="Play Game Data Summary" />
                        </div>


                        <div className='gameplay_info_summary'>

                            <div className='gameplay_info_summary_inner'>

                                <div 
                                    className='gameplay_top_hdr d-flex align-items-center justify-content-between'
                                    onClick={() => setIsSectionOpen((v) => !v)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <h2>Aviator <span>By Spribe</span></h2>
                                    <i className={`ri-arrow-down-s-line ${isSectionOpen ? '' : 'rotated'}`}></i>
                                </div>

                              
                                <div className={`gametype ${isSectionOpen ? '' : 'hidden'}`}>
                                <h3>Game Attributes</h3>
                                   <p> Game Type: <span>Instant win</span></p>
                                </div>

                            </div>

                            <div className={`playgame_info_cnt ${isInfoExpanded ? 'expanded' : 'collapsed'} ${isSectionOpen ? '' : 'hidden'}`}>

                                <h4>Aviator Crash Casino Game Review</h4>

                                <p>The sky and big wins are calling. Aviator is one of the most viral online casino games.
                                    Created by Spribe in 2019, it has brought innovative
                                    gameplay to the crash genre. Play Aviator on CROWNBET to feel the prime of gliding high.
                                    Double your bets, set auto cash out, and create useful
                                    strategies to earn a lot of crypto!</p>

                                <h4>How to Play Aviator?</h4>

                                <p>As an innovative game, Aviator combines simplicity and unique features. It has been
                                    implemented with a propeller plane and a runway on a black
                                    background. This minimalism allows you to run the game even on weak devices. So, how
                                    do you play and win in Aviator? Follow our step-by-step
                                    guide:</p>

                                <ul>
                                    <li>Select a cryptocurrency and specify the bet size.</li>
                                    <li>Place one or two bets before the start of the next round.</li>
                                    <li>When the plane takes off, seize the moment for "Cash Out".</li>
                                    <li>If you do this before the plane "Flew Away", you win.</li>
                                </ul>

                                <h4>About Aviator Features</h4>
                                <p>The game has a few features which will help you perform any winning strategy.
                                    The auto mode lets you specify the "Cash Out" value in advance. Live statistics
                                    provide useful information about other players’ bets. You can also adjust two
                                    independent bets and try to cash out the twice profit. Moreover, don't forget
                                    to view the history of your rounds. Analyze all bets and test different withdrawal
                                    moments to improve your results.
                                    Perhaps you will create an outstanding strategy to increase the chances of victory.</p>

                                <h4>Play For Free In Demo Mode</h4>
                                <p>When playing on BetFury, you can launch the Demo mode. It's an ideal option for beginners 
                                    who play Aviator for the first time. You can practice your skills without worrying about
                                     your funds. After a certain number of bets, you will feel ready. Then, you can switch
                                      to the normal mode and place bets with real cryptocurrency.</p>

                                <h4>Why the Aviator Algorithm is Fair?</h4>
                                <p>Aviator uses a random outcome protection algorithm. This powerful cryptographic method 
                                    processes user values ​​and server-side generated data. This algorithm also allows you 
                                    to verify the fairness of each result.</p>
                                <p>How to check that the round result is random? Click on the green shield emblem. Follow 
                                    the instructions, checking the match of the received hash. Therefore, any game that
                                     uses Provably Fair technology is invulnerable to hacking.</p>

                                <h4>How to Talk in the In-Game Chat?</h4>
                                <p>You can communicate with other players via an atmospheric Live Chat. Get to know each other 
                                    during the game, joke, and send various memes. Moreover, integrated tools allow you to
                                     share statistics about each round played. It will add a touch of fun to this 
                                     exciting game!</p>
                                <h4>Some Strategies For Aviator By Spribe</h4>

                                <ul>
                                    <li>Low-Risk Strategy: Make small bets and cash out at low multipliers (e.g., 1.1x to 1.2x). 
                                        This approach aims to secure small, consistent gains by minimizing risk. It's ideal 
                                        for players who want to slowly build their balance with minimal losses.</li>
                                    <li>High-Risk Strategy: Delay cashing out until higher multipliers (e.g., 10x or above)
                                         for the potential of more significant payouts. This strategy carries greater risk and
                                 is better suited for players willing to accept volatility for a chance at substantial wins.</li>
                                 <li>Progressive Betting Strategies: Methods like the Paroli system, 1-3-2-6 system,
                                     and Reverse Labouchere system involve adjusting bets after wins or losses to maximize
                                      streak profits. These systems aim to capitalize on winning streaks while limiting
                                       losses when luck turns.</li>
                                </ul>

                            </div>

                            <div className={`playgame_info_actions ${isSectionOpen ? '' : 'hidden'}`}>
                                <button
                                    type="button"
                                    className="playgame_info_toggle_btn"
                                    onClick={() => setIsInfoExpanded((v) => !v)}
                                >
                                    {infoBtnLabel} <i className={infoBtnIcon}></i>
                                </button>
                            </div>

                        </div>


                        <div className='best_popular_games'>

                            <div className="top_slot_outer">
                                    <div className="top_hd d-flex align-items-center justify-content-between">
                                        <h2 className="heading_h2">Best Spribe games</h2>
                                        <div className="slider-arrows-group d-flex align-items-center gap-2">
                                            <button 
                                                className="slider-arrow slider-arrow-left" 
                                                onClick={handleSlider1Prev}
                                                aria-label="Previous"
                                            >
                                                <i className="ri-arrow-left-s-line"></i>
                                            </button>
                                            <button 
                                                className="slider-arrow slider-arrow-right" 
                                                onClick={handleSlider1Next}
                                                aria-label="Next"
                                            >
                                                <i className="ri-arrow-right-s-line"></i>
                                            </button>
                                        </div>
                                  </div>
                                    <div className="game_items_slider_wrapper">
                                        <div ref={slider1Ref} className="game_items_slider mt-2">
                                            {duplicatedItems.map((item, index) => (
                                                <div key={`slider1-${index}`} className="game_items_inner">
                                                    <div className="playbtn"><img alt="game" src="images/playbtn.png" /></div>
                                                    {item.badge && <div className="top_ads">{item.badge}</div>}
                                                    <img alt="game" src={item.image} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                
                            </div>


                            <div className="top_slot_outer">
                                    <div className="top_hd d-flex align-items-center justify-content-between">
                                        <h2 className="heading_h2">Most popular games </h2>
                                        <div className="slider-arrows-group d-flex align-items-center gap-2">
                                            <button 
                                                className="slider-arrow slider-arrow-left" 
                                                onClick={handleSlider2Prev}
                                                aria-label="Previous"
                                            >
                                                <i className="ri-arrow-left-s-line"></i>
                                            </button>
                                            <button 
                                                className="slider-arrow slider-arrow-right" 
                                                onClick={handleSlider2Next}
                                                aria-label="Next"
                                            >
                                                <i className="ri-arrow-right-s-line"></i>
                                            </button>
                                        </div>
                                   </div>
                                    <div className="game_items_slider_wrapper">
                                        <div ref={slider2Ref} className="game_items_slider mt-2">
                                            {duplicatedItems.map((item, index) => (
                                                <div key={`slider2-${index}`} className="game_items_inner">
                                                    <div className="playbtn"><img alt="game" src="images/playbtn.png" /></div>
                                                    {item.badge && <div className="top_ads">{item.badge}</div>}
                                                    <img alt="game" src={item.image} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                
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

export default GamePlay

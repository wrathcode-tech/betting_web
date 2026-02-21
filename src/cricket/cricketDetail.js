import React, { useRef, useEffect, useState } from 'react'
import './cricketDetail.css'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'

function CricketDetail() {
    const scrollContainerRef = useRef(null)
    const betslipContentRef = useRef(null)
    const [activeTab, setActiveTab] = useState('all')
    const [closedBlocks, setClosedBlocks] = useState(new Set())
    const [isBetslipOpen, setIsBetslipOpen] = useState(false)
    const [selectedBets, setSelectedBets] = useState([])
    const [betslipTab, setBetslipTab] = useState('single')
    const [stake, setStake] = useState(5)

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

    const handleBetClick = (betName, market, odds, elementId) => {
        setIsBetslipOpen(true)
        const betId = `${market}-${betName}-${odds}`
        // Use elementId to track exact clicked element
        const uniqueId = elementId || `${betId}-${Date.now()}`
        const existingBet = selectedBets.find(bet => bet.elementId === uniqueId)
        
        if (existingBet) {
            // Remove only if same element is clicked again (return click)
            setSelectedBets(selectedBets.filter(bet => bet.elementId !== uniqueId))
        } else {
            // Add new bet - allow multiple selections from same or different markets
            setSelectedBets([...selectedBets, {
                id: betId,
                betName,
                market,
                odds: parseFloat(odds),
                elementId: uniqueId
            }])
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

    const calculatePotentialWin = () => {
        if (selectedBets.length === 0) return 0
        if (betslipTab === 'single' && selectedBets.length > 0) {
            return (stake * selectedBets[0].odds).toFixed(2)
        }
        return 0
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

    // Auto-scroll betslip content when new bets are added
    useEffect(() => {
        if (betslipContentRef.current && selectedBets.length > 0) {
            const scrollContainer = betslipContentRef.current
            scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
    }, [selectedBets])

    return (
        <>
            <Header />
            <div className='dashboard_page removebgsports'>
                <div className='container'>
                    <div className='cricket_detail_section'>
                        <div className='sports_top_tabs'>
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
                        </div>

                        <div className='match_vs_team_list d-flex align-items-center justify-content-between gap-2'>
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
                        </div>

                        <div className='match_info_section_wrapper'>
                            <div className='cricket_info_inner'>
                                <div className='cricket_vector_icon'>
                                    <img src="images/t20_vector.svg" alt="cricket" />
                                </div>
                                <h2>Premier League, Women</h2>
                                <div className='cricket_info_content'>
                                    <div className='vs_vector_icon'>
                                        <img src="images/vs_vector.svg" alt="cricket" />
                                    </div>

                                    <img className='team_bg_img' src="images/team_bg.svg" alt="cricket" />

                                    <div className='d-flex align-items-center gap-2 team_dlex'>

                                        <div className='team_cricket_bl'>
                                            <div className='team_logo_lft'>
                                                <img src="images/rcb_vector.svg" alt="cricket" />
                                            </div>
                                            <p>Royal Challengers
                                                Bengaluru</p>
                                        </div>

                                        <div className='team_cricket_bl rightreverse'>
                                            <div className='team_logo_lft'>
                                                <img src="images/delhi_vector.svg" alt="cricket" />
                                            </div>
                                            <p>Delhi
                                                Capitals</p>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='cricket_summary_details_wrapper'>
                            <div className='top_tabs_cricket'>
                                <ul>
                                    <li className={activeTab === 'all' ? 'active' : ''}>
                                        <button onClick={() => setActiveTab('all')}>ALL<span>40</span></button>
                                    </li>
                                    <li className={activeTab === 'player-props' ? 'active' : ''}>
                                        <button onClick={() => setActiveTab('player-props')}>Player Props<span>10</span></button>
                                    </li>
                                    <li className={activeTab === 'innings' ? 'active' : ''}>
                                        <button onClick={() => setActiveTab('innings')}>Innings<span>12</span></button>
                                    </li>
                                    <li className={activeTab === 'overs' ? 'active' : ''}>
                                        <button onClick={() => setActiveTab('overs')}>Overs<span>6</span></button>
                                    </li>
                                    <li className={activeTab === 'deliveries' ? 'active' : ''}>
                                        <button onClick={() => setActiveTab('deliveries')}>Deliveries<span>6</span></button>
                                    </li>
                                    <li className={activeTab === 'wickets' ? 'active' : ''}>
                                        <button onClick={() => setActiveTab('wickets')}>Wickets<span>6</span></button>
                                    </li>
                                    <li className={activeTab === 'extras' ? 'active' : ''}>
                                        <button onClick={() => setActiveTab('extras')}>Extras<span>6</span></button>
                                    </li>
                                </ul>
                            </div>

                            <div className='match_summary_content_tabs'>
                                {activeTab === 'all' && (
                                    <>
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
                                        </div>
                                    </>
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
                        </div>

                    </div>
                </div>
            </div>

            {/* Betslip Panel */}
            {isBetslipOpen && (
                <>
                    <div className='betslip_overlay' onClick={() => setIsBetslipOpen(false)}></div>
                    <div className='betslip_panel'>
                        <div className='betslip_header'>
                            <h3><img alt="sports" src="images/betslip_icon.svg"/> Betslip {selectedBets.length}</h3>
                         
                                         <span className='quicktext'><strong>QUICK BET</strong></span>
                                         <button className='betslip_close_btn' onClick={() => setIsBetslipOpen(false)}>
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        <div className='betslip_tabs'>
                            <button 
                                className={betslipTab === 'single' ? 'active' : ''} 
                                onClick={() => setBetslipTab('single')}
                            >
                                Single
                            </button>
                            <button 
                                className={betslipTab === 'combo' ? 'active' : ''} 
                                onClick={() => setBetslipTab('combo')}
                            >
                                Combo
                            </button>
                            <button 
                                className={betslipTab === 'system' ? 'active' : ''} 
                                onClick={() => setBetslipTab('system')}
                            >
                                System
                            </button>
                        </div>

                        <div className='betslip_content' ref={betslipContentRef}>
                            {betslipTab === 'single' && (
                                <>
                                    {selectedBets.length > 0 ? (
                                        <>
                                            {selectedBets.map((bet) => (
                                                <div key={bet.id} className='betslip_bet_item'>
                                                    <div className='betslip_bet_header'>
                                                        <span className='betslip_bet_name'><img alt="sports" src="images/menu-icon19.svg"/> {bet.betName}</span>
                                                        <button className='betslip_remove_btn' onClick={() => removeBet(bet.id)}>
                                                            <i className="ri-delete-bin-line"></i>
                                                        </button>
                                           
                                                    </div>
                                                    <div className='betslip_bet_market'>{bet.market}</div>
                                                    
                                                <div className='d-flex align-items-center justify-content-between gap-4'>    
                                                    
                                                    <div className='betslip_bet_odds'>{bet.odds}</div>
                                                    <div className='betslip_stake_input_wrapper'>
                                                    <input 
                                                        type="number" 
                                                        className='betslip_stake_input' 
                                                        value={stake}
                                                        onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                                                    />
                                                    <span className='betslip_stake_currency'>$</span>
                                                    <button className='betslip_max_btn'>MAX</button>
                                                </div>
                                                </div>

                                                </div>
                                            ))}

                                            <div className='betslip_stake_section'>
                                             

                                                <div className='betslip_quick_stakes'>
                                                    <button onClick={() => setStake(1)}>1</button>
                                                    <button onClick={() => setStake(10)}>10</button>
                                                    <button onClick={() => setStake(30)}>30</button>
                                                    <button onClick={() => setStake(50)}>50</button>
                                                </div>
                                            </div>

                                            <div className='betslip_summary'>
                                                <div className='betslip_summary_row'>
                                                    <span>Total Bet</span>
                                                    <span>{stake}$</span>
                                                </div>
                                                <div className='betslip_summary_row'>
                                                    <span>POTENTIAL WIN</span>
                                                    <span>{calculatePotentialWin()} $</span>
                                                </div>
                                            </div>

                                            <button className='betslip_place_bet_btn'>PLACE BET</button>
                                            <button className='betslip_share_btn'>SHARE</button>
                                        </>
                                    ) : (
                                        <div className='betslip_empty'>
                                            <p>No bets selected</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {betslipTab === 'combo' && (
                                <div className='betslip_empty'>
                                    <p>Combo bets coming soon</p>
                                </div>
                            )}

                            {betslipTab === 'system' && (
                                <div className='betslip_empty'>
                                    <p>System bets coming soon</p>
                                </div>
                            )}
                        </div>

                        <div className='betslip_footer'>
                            <button className='betslip_setting_btn'>Settings</button>
                            <button className='betslip_settings_btn' onClick={clearAllBets}>
                                <i className="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    </div>
                </>
            )}
            <MobileMenu />
        </>
    )
}

export default CricketDetail

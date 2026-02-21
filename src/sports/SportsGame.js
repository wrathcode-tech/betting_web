import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './sportsGame.css'
import AuthHeader from '../customComponents/AuthHeader'
import MobileMenu from '../customComponents/MobileMenu'

function SportsGame() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('cricket')

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
            <AuthHeader />
            <div className='dashboard_page'>
                <div className='container'>
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

                        <div className='sports_hero_banr'>
                            <div className='bnr_cnt'>
                                <h1>LIVE CRICKET <br></br>BETTING</h1>
                                <p>Har Ball • Har Run • Jeet Ka Mauka</p>
                                <button className='btn betnow'>BET NOW</button>
                            </div>

                            <div className='sports_banr_img'>
                                <img src="images/world_cup_trophy.png" alt="sports" />
                            </div>

                        </div>

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

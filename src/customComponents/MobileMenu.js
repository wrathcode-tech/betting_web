import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSidebar } from '../context/SidebarContext'

function MobileMenu() {
    const location = useLocation()
    const { sidebarOpen, setSidebarOpen } = useSidebar()

    return (
        <>
            <div className='mobile-menu-wrapper'>
                <ul className="mobile-menu">
                    <li className={`mobile-menu__item ${sidebarOpen ? 'active' : ''}`}>
                        <button type="button" className="mobile-menu__link" onClick={() => setSidebarOpen((prev) => !prev)}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-menu-line"></i>
                            </span>
                            <span className="mobile-menu__name">Menu</span>
                        </button>
                    </li>

                    <li className={`mobile-menu__item ${!sidebarOpen && (location.pathname === '/casino' || location.pathname.startsWith('/casino/')) ? 'active' : ''}`}>
                        <NavLink to="/casino" className="mobile-menu__link" onClick={() => setSidebarOpen(false)}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-poker-spades-fill"></i>
                            </span>
                            <span className="mobile-menu__name">Casino</span>
                        </NavLink>
                    </li>

                    <li className={`mobile-menu__item ${!sidebarOpen && location.pathname === '/' ? 'active' : ''}`}>
                        <NavLink to="/" end className="mobile-menu__link" onClick={() => setSidebarOpen(false)}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-home-4-line"></i>
                            </span>
                            <span className="mobile-menu__name">Home</span>
                        </NavLink>
                    </li>

                    <li className={`mobile-menu__item ${!sidebarOpen && (location.pathname === '/sports' || location.pathname.startsWith('/sports/')) ? 'active' : ''}`}>
                        <NavLink to="/sports" className="mobile-menu__link" onClick={() => setSidebarOpen(false)}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-live-line"></i>
                            </span>
                            <span className="mobile-menu__name">Inplay</span>
                        </NavLink>
                    </li>

                    <li className={`mobile-menu__item ${!sidebarOpen && (location.pathname === '/sportsbook' || location.pathname.startsWith('/sportsbook/')) ? 'active' : ''}`}>
                        <NavLink to="/sportsbook" className="mobile-menu__link" onClick={() => setSidebarOpen(false)}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-basketball-fill"></i>
                            </span>
                            <span className="mobile-menu__name">SportsBook</span>
                        </NavLink>
                    </li>
                </ul>
            </div>
        </>
    )
}

export default MobileMenu

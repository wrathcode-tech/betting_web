import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import SideBar from './SideBar/sideBar'

function MobileMenu() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            <div className='mobile-menu-wrapper'>
                <ul className="mobile-menu">
                    <li className="mobile-menu__item">
                        <button type="button" className="mobile-menu__link" onClick={() => setSidebarOpen(true)}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-menu-line"></i>
                            </span>
                            <span className="mobile-menu__name">Menu</span>
                        </button>
                    </li>

                    <li className="mobile-menu__item">
                        <NavLink to="/casino" className={({ isActive }) => `mobile-menu__link ${isActive ? 'active' : ''}`}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-poker-spades-fill"></i>
                            </span>
                            <span className="mobile-menu__name">Casino</span>
                        </NavLink>
                    </li>

                    <li className="mobile-menu__item">
                        <NavLink to="/" end className={({ isActive }) => `mobile-menu__link ${isActive ? 'active' : ''}`}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-home-4-line"></i>
                            </span>
                            <span className="mobile-menu__name">Home</span>
                        </NavLink>
                    </li>

                    <li className="mobile-menu__item">
                        <NavLink to="/sports" className={({ isActive }) => `mobile-menu__link ${isActive ? 'active' : ''}`}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-basketball-fill"></i>
                            </span>
                            <span className="mobile-menu__name">Sports</span>
                        </NavLink>
                    </li>

                    <li className="mobile-menu__item">
                        <NavLink to="/profile" className={({ isActive }) => `mobile-menu__link ${isActive ? 'active' : ''}`}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-wallet-line"></i>
                            </span>
                            <span className="mobile-menu__name">Wallet</span>
                        </NavLink>
                    </li>
                </ul>
            </div>

            <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
    )
}

export default MobileMenu

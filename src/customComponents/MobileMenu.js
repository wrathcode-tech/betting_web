import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SideBar from './SideBar/sideBar'
import Chat from '../cricket/Chat'

function MobileMenu() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

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
                        <Link to="/" className="mobile-menu__link">
                            <span className="icon mobile-menu__icon">
                                <i className="ri-home-4-line"></i>
                            </span>
                            <span className="mobile-menu__name">Home</span>
                        </Link>
                    </li>

                    <li className="mobile-menu__item">
                        <Link to="/rank" className="mobile-menu__link">
                            <span className="icon mobile-menu__icon">
                                <i className="ri-trophy-line"></i>
                            </span>
                            <span className="mobile-menu__name">Contests</span>
                        </Link>
                    </li>

                    <li className="mobile-menu__item">
                        <Link to="/casino" className="mobile-menu__link">
                            <span className="icon mobile-menu__icon">
                                <i className="ri-poker-spades-fill"></i>
                            </span>
                            <span className="mobile-menu__name">Casino</span>
                        </Link>
                    </li>

                    <li className="mobile-menu__item mobile-menu__item--sports">
                        <Link to="/sports" className="mobile-menu__link">
                            <span className="icon mobile-menu__icon">
                                <i className="ri-basketball-fill"></i>
                            </span>
                            <span className="mobile-menu__name">Sports</span>
                        </Link>
                    </li>

                    <li className="mobile-menu__item">
                        <button type="button" className="mobile-menu__link" onClick={() => setIsChatOpen(!isChatOpen)}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-discuss-line"></i>
                            </span>
                            <span className="mobile-menu__name">Chat</span>
                        </button>
                    </li>
                </ul>
            </div>

            <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
    )
}

export default MobileMenu

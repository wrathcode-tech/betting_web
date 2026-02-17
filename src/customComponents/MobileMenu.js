import React, { useState } from 'react'
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
                        <a href="#" className="mobile-menu__link" onClick={(e) => { e.preventDefault(); setSidebarOpen(true); }}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-menu-line"></i>
                            </span>
                            <span className="mobile-menu__name">Menu</span>
                        </a>
                    </li>

                    <li className="mobile-menu__item">
                        <a href="#" className="mobile-menu__link">
                            <span className="icon mobile-menu__icon">
                                <i className="ri-trophy-line"></i>
                            </span>
                            <span className="mobile-menu__name">Contests</span>
                        </a>
                    </li>

                    <li className="mobile-menu__item">
                        <a href="#" className="mobile-menu__link">
                            <span className="icon mobile-menu__icon">
                                <i className="ri-poker-spades-fill"></i>
                            </span>
                            <span className="mobile-menu__name">Casino</span>
                        </a>
                    </li>

                    <li className="mobile-menu__item mobile-menu__item--sports">
                        <a href="#" className="mobile-menu__link">
                            <span className="icon mobile-menu__icon">
                                <i className="ri-basketball-fill"></i>
                            </span>
                            <span className="mobile-menu__name">Sports</span>
                        </a>
                    </li>

                    <li className="mobile-menu__item">
                        <a href="#" className="mobile-menu__link" onClick={(e) => { e.preventDefault(); setIsChatOpen(!isChatOpen); }}>
                            <span className="icon mobile-menu__icon">
                                <i className="ri-discuss-line"></i>
                            </span>
                            <span className="mobile-menu__name">Chat</span>
                        </a>
                    </li>
                </ul>
            </div>

            <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
    )
}

export default MobileMenu

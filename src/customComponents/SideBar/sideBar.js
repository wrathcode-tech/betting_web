import React, { useState, useRef, useEffect } from 'react'
import './sidebar.css'

export default function SideBar({ isOpen, onClose }) {
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const sidebarRef = useRef(null);

  const toggleSubmenu = (menuName) => {
    setOpenSubmenu(openSubmenu === menuName ? null : menuName);
  };

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    let scrollTimeout;
    const handleScroll = () => {
      sidebar.classList.add('scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        sidebar.classList.remove('scrolling');
      }, 500);
    };

    sidebar.addEventListener('scroll', handleScroll);
    return () => {
      sidebar.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isOpen]);

  return (
    <>
      <div className={`sidebar_overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      <div ref={sidebarRef} className={`sidebar ${isOpen ? 'sidebar_open' : ''}`}>
        <div className="sidebar_header">
          <div className="sidebar_search">
            <input type="text" placeholder="Search" className="sidebar_search_input" />
            <i className="ri-search-line"></i>
          </div>
          <button className="sidebar_close_btn" onClick={onClose}>
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="sidebar_content">
          <nav className="sidebar_nav">
            <ul className="sidebar_menu">
              <li className={`sidebar_menu_item ${openSubmenu === 'casino' ? 'active' : ''}`}>
                <a href="#!" onClick={(e) => { e.preventDefault(); toggleSubmenu('casino'); }}>
                  <i className={openSubmenu === 'casino' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  <span><img src="images/casino_icon.svg" alt="casino" />Casino</span>
                </a>
                {openSubmenu === 'casino' && (
                  <ul className="sidebar_submenu">
                    <li><a href="#!"><img src="images/original_icon.svg" alt="originals" />Originals</a></li>
                    <li><a href="#!"><img src="images/slots_icon.svg" alt="slots" />Slots</a></li>
                    <li><a href="#!"><img src="images/livecasion_icon.svg" alt="live casino" />Live Casino</a></li>
                    <li><a href="#!"><img src="images/referral_icon.svg" alt="table game" />Table Game</a></li>
                    <li><a href="#!"><img src="images/setting_icon.svg" alt="slots" />Providers</a></li>
                    <li><a href="#!"><img src="images/original_icon.svg" alt="slots" />Hot Picks</a></li>
                    <li><a href="#!"><img src="images/slots_icon.svg" alt="slots" />Exclusives</a></li>
                    <li><a href="#!"><img src="images/livecasion_icon.svg" alt="slots" />Buy Feature</a></li>
                    <li><a href="#!"><img src="images/referral_icon.svg" alt="slots" />New Releases</a></li>
                    <li><a href="#!"><img src="images/setting_icon.svg" alt="slots" />Highroller Hall</a></li>
                    <li><a href="#!"><img src="images/original_icon.svg" alt="slots" />Game Shows</a></li>
                    <li><a href="#!"><img src="images/slots_icon.svg" alt="slots" />Roulette</a></li>
                    <li><a href="#!"><img src="images/livecasion_icon.svg" alt="slots" />Blackjack</a></li>
                    <li><a href="#!"><img src="images/referral_icon.svg" alt="slots" />Baccarat</a></li>
                    <li><a href="#!"><img src="images/slots_icon.svg" alt="slots" />Drops & Wins</a></li>
                  </ul>
                )}
              </li>
              <li className={`sidebar_menu_item ${openSubmenu === 'sports' ? 'active' : ''}`}>
                <a href="#!" onClick={(e) => { e.preventDefault(); toggleSubmenu('sports'); }}>
                  <i className={openSubmenu === 'sports' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  <span><img src="images/sports_icon.svg" alt="sports" />Sports</span>
                </a>
                {openSubmenu === 'sports' && (
                  <ul className="sidebar_submenu">
                    <li><a href="#!">Football</a></li>
                    <li><a href="#!">Basketball</a></li>
                    <li><a href="#!">Tennis</a></li>
                    <li><a href="#!">Cricket</a></li>
                    <li><a href="#!">Horse Racing</a></li>
                  </ul>
                )}
              </li>
              <li className={`sidebar_menu_item ${openSubmenu === 'other' ? 'active' : ''}`}>
                <a href="#!" onClick={(e) => { e.preventDefault(); toggleSubmenu('other'); }}>
                  <i className={openSubmenu === 'other' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  <span>Other</span>
                </a>
                {openSubmenu === 'other' && (
                  <ul className="sidebar_submenu">
                    <li><a href="#!">Virtual Sports</a></li>
                    <li><a href="#!">Lottery</a></li>
                    <li><a href="#!">Poker</a></li>
                    <li><a href="#!">Bingo</a></li>
                  </ul>
                )}
              </li>
              <li className="sidebar_menu_item">
                <a href="#!">
                  <span>
                  <img src="images/promotions_icon.svg" alt="promotions" />Promotions</span>
                </a>
              </li>
              <li className="sidebar_menu_item">
                <a href="#!">
                  <span>
                  <img src="images/referral_icon.svg" alt="referral" />Referral</span>
                </a>
              </li>
              <li className="sidebar_menu_item">
                <a href="#!">
                  <span>
                  <img src="images/referral_icon.svg" alt="referral" />VIP Club</span>
                </a>
              </li>
              <li className="sidebar_menu_item">
                <a href="#!">
                  <span>
                  <img src="images/referral_icon.svg" alt="referral" />News</span>
                </a>
              </li>
              <li className="sidebar_menu_item">
                <a href="#!">
                  <span>
                  <img src="images/referral_icon.svg" alt="referral" />Live Support</span>
                </a>
              </li>
              
            </ul>
          </nav>
          <div className="setting_hdr">
            <img src="images/en.png" alt="language" />
            <div className="setting_icon">
              <img src="images/settingicon.svg" alt="setting" />
            </div>
          </div>
          
        </div>

   
      </div>
    </>
  )
}

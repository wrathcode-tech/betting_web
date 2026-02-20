import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
              <li className="sidebar_menu_item">
                <Link to="/" onClick={onClose}>
                  <span><img src="images/casino_icon.svg" alt="home" />Home</span>
                </Link>
              </li>
              <li className={`sidebar_menu_item ${openSubmenu === 'casino' ? 'active' : ''}`}>
                <a href="#!" onClick={(e) => { e.preventDefault(); toggleSubmenu('casino'); }}>
                  <i className={openSubmenu === 'casino' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  <span><img src="images/casino_icon.svg" alt="casino" />Casino</span>
                </a>
                {openSubmenu === 'casino' && (
                  <ul className="sidebar_submenu">
                    <li><Link to="/casino" onClick={onClose}><img src="images/original_icon.svg" alt="originals" />Originals</Link></li>
                    <li><Link to="/game" onClick={onClose}><img src="images/slots_icon.svg" alt="slots" />Slots</Link></li>
                    <li><Link to="/casino" onClick={onClose}><img src="images/livecasion_icon.svg" alt="live casino" />Live Casino</Link></li>
                    <li><Link to="/casino" onClick={onClose}><img src="images/referral_icon.svg" alt="table game" />Table Game</Link></li>
                    <li><Link to="/casino" onClick={onClose}><img src="images/setting_icon.svg" alt="slots" />Providers</Link></li>
                    <li><Link to="/casino" onClick={onClose}><img src="images/original_icon.svg" alt="slots" />Hot Picks</Link></li>
                    <li><Link to="/game" onClick={onClose}><img src="images/slots_icon.svg" alt="slots" />Exclusives</Link></li>
                    <li><Link to="/casino" onClick={onClose}><img src="images/livecasion_icon.svg" alt="slots" />Buy Feature</Link></li>
                    <li><Link to="/casino" onClick={onClose}><img src="images/referral_icon.svg" alt="slots" />New Releases</Link></li>
                    <li><Link to="/casino" onClick={onClose}><img src="images/setting_icon.svg" alt="slots" />Highroller Hall</Link></li>
                    <li><Link to="/casino" onClick={onClose}><img src="images/original_icon.svg" alt="slots" />Game Shows</Link></li>
                    <li><Link to="/game" onClick={onClose}><img src="images/slots_icon.svg" alt="slots" />Roulette</Link></li>
                    <li><Link to="/casino" onClick={onClose}><img src="images/livecasion_icon.svg" alt="slots" />Blackjack</Link></li>
                    <li><Link to="/casino" onClick={onClose}><img src="images/referral_icon.svg" alt="slots" />Baccarat</Link></li>
                    <li><Link to="/game" onClick={onClose}><img src="images/slots_icon.svg" alt="slots" />Drops & Wins</Link></li>
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
                    <li><Link to="/sports" onClick={onClose}>Football</Link></li>
                    <li><Link to="/sports" onClick={onClose}>Basketball</Link></li>
                    <li><Link to="/sports" onClick={onClose}>Tennis</Link></li>
                    <li><Link to="/cricket" onClick={onClose}>Cricket</Link></li>
                    <li><Link to="/sports" onClick={onClose}>Horse Racing</Link></li>
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
                    <li><Link to="/sports" onClick={onClose}>Virtual Sports</Link></li>
                    <li><Link to="/game" onClick={onClose}>Lottery</Link></li>
                    <li><Link to="/game" onClick={onClose}>Poker</Link></li>
                    <li><Link to="/game" onClick={onClose}>Bingo</Link></li>
                  </ul>
                )}
              </li>
              <li className="sidebar_menu_item">
                <Link to="/" onClick={onClose}>
                  <span><img src="images/promotions_icon.svg" alt="promotions" />Promotions</span>
                </Link>
              </li>
              <li className="sidebar_menu_item">
                <Link to="/referral" onClick={onClose}>
                  <span><img src="images/referral_icon.svg" alt="referral" />Referral</span>
                </Link>
              </li>
              <li className="sidebar_menu_item">
                <Link to="/transactions" onClick={onClose}>
                  <span><img src="images/referral_icon.svg" alt="transactions" />Transactions</span>
                </Link>
              </li>
              <li className="sidebar_menu_item">
                <Link to="/rank" onClick={onClose}>
                  <span><img src="images/referral_icon.svg" alt="referral" />VIP Club</span>
                </Link>
              </li>
              <li className="sidebar_menu_item">
                <Link to="/" onClick={onClose}>
                  <span><img src="images/referral_icon.svg" alt="referral" />News</span>
                </Link>
              </li>
              <li className="sidebar_menu_item">
                <Link to="/profile" onClick={onClose}>
                  <span><img src="images/referral_icon.svg" alt="referral" />Live Support</span>
                </Link>
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

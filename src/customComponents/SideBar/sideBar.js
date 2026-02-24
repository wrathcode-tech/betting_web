import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSidebar } from '../../context/SidebarContext'
import './sidebar.css'

export default function SideBar({ isOpen, onClose }) {
  const { setSidebarOpen } = useSidebar()
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const sidebarRef = useRef(null);
  const isCollapsed = !isOpen

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
      <div ref={sidebarRef} className={`sidebar ${isOpen ? 'sidebar_open' : 'sidebar_collapsed'}`}>
        <div className="sidebar_content">
          <div className="deposit_withdrawal_btn">
            <Link to="/deposit" className="deposit_withdrawal_menu_btn deposit_btn" onClick={onClose}>
              <i className="ri-wallet-3-line" aria-hidden />
              <span>Deposit</span>
            </Link>
            <Link to="/withdrawal" className="deposit_withdrawal_menu_btn withdraw_btn" onClick={onClose}>
              <i className="ri-bank-line" aria-hidden />
              <span>Withdraw</span>
            </Link>
          </div>
          <nav className="sidebar_nav">
            <ul className="sidebar_menu">
              {/* <li className="sidebar_menu_item">
                <Link to="/" onClick={onClose}>
                  <span><img src="/images/casino_icon.svg" alt="home" />Home</span>
                </Link>
              </li> */}
              <li className={`sidebar_menu_item ${openSubmenu === 'casino' ? 'active' : ''}`}>
                <a href="#!" onClick={(e) => { e.preventDefault(); toggleSubmenu('casino'); }}>
                  <i className={openSubmenu === 'casino' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  <span><i className="ri-poker-spades-fill" aria-hidden />Casino</span>
                </a>
                <ul className="sidebar_submenu">
                    <li className="sidebar_flyout_header">Casino</li>
                    <li><Link to="/casino" onClick={onClose}><i className="ri-gamepad-line" aria-hidden />Originals</Link></li>
                    <li><Link to="/game" onClick={onClose}><i className="ri-dice-5-fill" aria-hidden />Slots</Link></li>
                    <li><Link to="/casino" onClick={onClose}><i className="ri-live-line" aria-hidden />Live Casino</Link></li>
                    <li><Link to="/casino" onClick={onClose}><i className="ri-table-line" aria-hidden />Table Game</Link></li>
                    <li><Link to="/casino" onClick={onClose}><i className="ri-apps-line" aria-hidden />Providers</Link></li>
                    <li><Link to="/casino" onClick={onClose}><i className="ri-fire-fill" aria-hidden />Hot Picks</Link></li>
                    <li><Link to="/game" onClick={onClose}><i className="ri-star-fill" aria-hidden />Exclusives</Link></li>
                    <li><Link to="/casino" onClick={onClose}><i className="ri-shopping-bag-line" aria-hidden />Buy Feature</Link></li>
                    <li><Link to="/casino" onClick={onClose}><i className="ri-new-folder-line" aria-hidden />New Releases</Link></li>
                    <li><Link to="/casino" onClick={onClose}><i className="ri-vip-crown-line" aria-hidden />Highroller Hall</Link></li>
                    <li><Link to="/casino" onClick={onClose}><i className="ri-tv-line" aria-hidden />Game Shows</Link></li>
                    <li><Link to="/game" onClick={onClose}><i className="ri-dice-5-fill" aria-hidden />Roulette</Link></li>
                    <li><Link to="/casino" onClick={onClose}><i className="ri-spades-fill" aria-hidden />Blackjack</Link></li>
                    <li><Link to="/casino" onClick={onClose}><i className="ri-diamond-fill" aria-hidden />Baccarat</Link></li>
                    <li><Link to="/game" onClick={onClose}><i className="ri-gift-line" aria-hidden />Drops & Wins</Link></li>
                  </ul>
              </li>
              <li className={`sidebar_menu_item ${openSubmenu === 'sports' ? 'active' : ''}`}>
                <a href="#!" onClick={(e) => { e.preventDefault(); toggleSubmenu('sports'); }}>
                  <i className={openSubmenu === 'sports' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  <span><i className="ri-basketball-fill" aria-hidden />Sports</span>
                </a>
                <ul className="sidebar_submenu">
                    <li className="sidebar_flyout_header">Sports</li>
                    <li><Link to="/sports" onClick={onClose}>Football</Link></li>
                    <li><Link to="/sports" onClick={onClose}>Basketball</Link></li>
                    <li><Link to="/sports" onClick={onClose}>Tennis</Link></li>
                    <li><Link to="/cricket" onClick={onClose}>Cricket</Link></li>
                    <li><Link to="/sports" onClick={onClose}>Horse Racing</Link></li>
                  </ul>
              </li>
              <li className={`sidebar_menu_item ${openSubmenu === 'other' ? 'active' : ''}`}>
                <a href="#!" onClick={(e) => { e.preventDefault(); toggleSubmenu('other'); }}>
                  <i className={openSubmenu === 'other' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  <span><i className="ri-more-2-line" aria-hidden style={{ fontSize: '20px' }} />Other</span>
                </a>
                <ul className="sidebar_submenu">
                    <li className="sidebar_flyout_header">Other</li>
                    <li><Link to="/sports" onClick={onClose}>Virtual Sports</Link></li>
                    <li><Link to="/game" onClick={onClose}>Lottery</Link></li>
                    <li><Link to="/game" onClick={onClose}>Poker</Link></li>
                    <li><Link to="/game" onClick={onClose}>Bingo</Link></li>
                  </ul>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/" onClick={onClose}>
                  <span><i className="ri-megaphone-line" aria-hidden />Promotions</span>
                  <span className="sidebar_collapsed_label">Promotions</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/referral" onClick={onClose}>
                  <span><i className="ri-user-shared-line" aria-hidden />Referral</span>
                  <span className="sidebar_collapsed_label">Refer & Earn</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/transactions" onClick={onClose}>
                  <span><i className="ri-file-list-3-line" aria-hidden />Transactions</span>
                  <span className="sidebar_collapsed_label">Transactions</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <a 
                  href="#!" 
                  onClick={(e) => {
                    e.preventDefault()
                    onClose()
                    window.dispatchEvent(new CustomEvent('openChat'))
                  }}
                >
                  <span><i className="ri-customer-service-2-line" aria-hidden />Live Support</span>
                  <span className="sidebar_collapsed_label">Live Support</span>
                </a>
              </li>
              
            </ul>
          </nav>
          <div className="setting_hdr">
            <i className="ri-global-line" aria-hidden />
            <div className="setting_icon">
              <i className="ri-settings-3-line" aria-hidden />
            </div>
          </div>
          
        </div>

   
      </div>
    </>
  )
}

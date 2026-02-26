import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSidebar } from '../../context/SidebarContext'
import './sidebar.css'

const MOBILE_BREAKPOINT = 991

export default function SideBar({ isOpen, onClose }) {
  useSidebar()
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const sidebarRef = useRef(null);

  const closeIfMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT) {
      onClose()
    }
  }

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
            <Link to="/deposit" className="deposit_withdrawal_menu_btn deposit_btn" onClick={closeIfMobile}>
              <i className="ri-wallet-3-line" aria-hidden />
              <span>Deposit</span>
            </Link>
            <Link to="/withdrawal" className="deposit_withdrawal_menu_btn withdraw_btn" onClick={closeIfMobile}>
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
                    <li><Link to="/casino" onClick={closeIfMobile}><i className="ri-gamepad-line" aria-hidden />Originals</Link></li>
                    <li><Link to="/game" onClick={closeIfMobile}><i className="ri-dice-5-fill" aria-hidden />Slots</Link></li>
                    <li><Link to="/casino" onClick={closeIfMobile}><i className="ri-live-line" aria-hidden />Live Casino</Link></li>
                    <li><Link to="/casino" onClick={closeIfMobile}><i className="ri-table-line" aria-hidden />Table Game</Link></li>
                    <li><Link to="/casino" onClick={closeIfMobile}><i className="ri-apps-line" aria-hidden />Providers</Link></li>
                    <li><Link to="/casino" onClick={closeIfMobile}><i className="ri-fire-fill" aria-hidden />Hot Picks</Link></li>
                    <li><Link to="/game" onClick={closeIfMobile}><i className="ri-star-fill" aria-hidden />Exclusives</Link></li>
                    <li><Link to="/casino" onClick={closeIfMobile}><i className="ri-shopping-bag-line" aria-hidden />Buy Feature</Link></li>
                    <li><Link to="/casino" onClick={closeIfMobile}><i className="ri-new-folder-line" aria-hidden />New Releases</Link></li>
                    <li><Link to="/casino" onClick={closeIfMobile}><i className="ri-vip-crown-line" aria-hidden />Highroller Hall</Link></li>
                    <li><Link to="/casino" onClick={closeIfMobile}><i className="ri-tv-line" aria-hidden />Game Shows</Link></li>
                    <li><Link to="/game" onClick={closeIfMobile}><i className="ri-dice-5-fill" aria-hidden />Roulette</Link></li>
                    <li><Link to="/casino" onClick={closeIfMobile}><i className="ri-spades-fill" aria-hidden />Blackjack</Link></li>
                    <li><Link to="/casino" onClick={closeIfMobile}><i className="ri-diamond-fill" aria-hidden />Baccarat</Link></li>
                    <li><Link to="/game" onClick={closeIfMobile}><i className="ri-gift-line" aria-hidden />Drops & Wins</Link></li>
                  </ul>
              </li>
              <li className={`sidebar_menu_item ${openSubmenu === 'sports' ? 'active' : ''}`}>
                <a href="#!" onClick={(e) => { e.preventDefault(); toggleSubmenu('sports'); }}>
                  <i className={openSubmenu === 'sports' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  <span><i className="ri-basketball-fill" aria-hidden />Sports</span>
                </a>
                <ul className="sidebar_submenu">
                    <li className="sidebar_flyout_header">Sports</li>
                    <li><Link to="/sports" onClick={closeIfMobile}>Football</Link></li>
                    <li><Link to="/sports" onClick={closeIfMobile}>Basketball</Link></li>
                    <li><Link to="/sports" onClick={closeIfMobile}>Tennis</Link></li>
                    <li><Link to="/cricket" onClick={closeIfMobile}>Cricket</Link></li>
                    <li><Link to="/sports" onClick={closeIfMobile}>Horse Racing</Link></li>
                  </ul>
              </li>
              {/* <li className={`sidebar_menu_item ${openSubmenu === 'other' ? 'active' : ''}`}>
                <a href="#!" onClick={(e) => { e.preventDefault(); toggleSubmenu('other'); }}>
                  <i className={openSubmenu === 'other' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  <span><i className="ri-more-2-line" aria-hidden style={{ fontSize: '20px' }} />Other</span>
                </a>
                <ul className="sidebar_submenu">
                    <li className="sidebar_flyout_header">Other</li>
                    <li><Link to="/sports" onClick={closeIfMobile}>Virtual Sports</Link></li>
                    <li><Link to="/game" onClick={closeIfMobile}>Lottery</Link></li>
                    <li><Link to="/game" onClick={closeIfMobile}>Poker</Link></li>
                    <li><Link to="/game" onClick={closeIfMobile}>Bingo</Link></li>
                  </ul>
              </li> */}
              <div className="sh-sub-title">
                <i className="ri-more-2-line" aria-hidden />
                <span className="sh-sub-title_text">Other Menu</span>
              </div>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/promotions" onClick={closeIfMobile}>
                  <span><i className="ri-megaphone-line" aria-hidden />Promotions</span>
                  <span className="sidebar_collapsed_label">Promotions</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/referral" onClick={closeIfMobile}>
                  <span><i className="ri-user-shared-line" aria-hidden />Referral</span>
                  <span className="sidebar_collapsed_label">Refer & Earn</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/transactions" onClick={closeIfMobile}>
                  <span><i className="ri-file-list-3-line" aria-hidden />Transactions</span>
                  <span className="sidebar_collapsed_label">Transactions</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/my-bets" onClick={closeIfMobile}>
                  <span><i className="ri-flag-line" aria-hidden />My Bets</span>
                  <span className="sidebar_collapsed_label">My Bets</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/my-wallet" onClick={closeIfMobile}>
                  <span><i className="ri-wallet-3-line" aria-hidden />My Wallet</span>
                  <span className="sidebar_collapsed_label">My Wallet</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/betting-profit-loss" onClick={closeIfMobile}>
                  <span><i className="ri-line-chart-line" aria-hidden />Betting P&L</span>
                  <span className="sidebar_collapsed_label">Betting P&L</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/turnover-history" onClick={closeIfMobile}>
                  <span><i className="ri-repeat-line" aria-hidden />Turnover History</span>
                  <span className="sidebar_collapsed_label">Turnover</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/account-statement" onClick={closeIfMobile}>
                  <span><i className="ri-bank-card-line" aria-hidden />Account Statement</span>
                  <span className="sidebar_collapsed_label">Statement</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/bonus-statement" onClick={closeIfMobile}>
                  <span><i className="ri-gift-line" aria-hidden />Bonus Statement</span>
                  <span className="sidebar_collapsed_label">Bonus</span>
                </Link>
              </li>
              <li className="sidebar_menu_item sidebar_direct_link">
                <Link to="/deposit-turnover" onClick={closeIfMobile}>
                  <span><i className="ri-exchange-dollar-line" aria-hidden />Deposit Turnover</span>
                  <span className="sidebar_collapsed_label">Deposit Turnover</span>
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

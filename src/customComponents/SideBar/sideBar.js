import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useSidebar } from '../../context/SidebarContext'
import { useCasinoProviders } from '../../context/CasinoProvidersContext'
import './sidebar.css'

const MOBILE_BREAKPOINT = 991

export default function SideBar({ isOpen, onClose }) {
  const { setSidebarOpen } = useSidebar()
  const { providers } = useCasinoProviders()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const [openSubmenu, setOpenSubmenu] = useState(null)
  const sidebarRef = useRef(null)

  const closeIfMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT) {
      onClose()
    }
  }
  const onLinkClick = () => {
    closeIfMobile()
    onClose()
  }

  // Keep submenu open based on current route (works after reload)
  useEffect(() => {
    if (pathname.startsWith('/casino')) {
      setOpenSubmenu('casino')
    } else if (pathname === '/sports' || pathname === '/cricket' || pathname.startsWith('/sports')) {
      setOpenSubmenu('sports')
    }
  }, [pathname])

  const toggleSubmenu = (menuName) => {
    setOpenSubmenu(openSubmenu === menuName ? null : menuName)
  }

  const providerCodeParam = searchParams.get('provider') || ''
  const isCasinoAllGames = pathname === '/casino' && !providerCodeParam
  const isCasinoProvider = (code) => pathname === '/casino' && providerCodeParam.toLowerCase() === (code || '').toLowerCase()
  const isSportsActive = pathname === '/sports'
  const isCricketActive = pathname === '/cricket'
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
            <Link to="/deposit" className={`deposit_withdrawal_menu_btn deposit_btn ${pathname === '/deposit' ? 'active' : ''}`} onClick={onLinkClick}>
              <i className="ri-wallet-3-line" aria-hidden />
              <span>Deposit</span>
            </Link>
            <Link to="/withdrawal" className={`deposit_withdrawal_menu_btn withdraw_btn ${pathname === '/withdrawal' ? 'active' : ''}`} onClick={onLinkClick}>
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
              <li className={`sidebar_menu_item ${openSubmenu === 'casino' ? 'active' : ''} ${pathname.startsWith('/casino') ? 'current_section' : ''}`}>
                <a href="#!" onClick={(e) => { e.preventDefault(); toggleSubmenu('casino'); }}>
                  <i className={openSubmenu === 'casino' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  <span><i className="ri-poker-spades-fill" aria-hidden />Casino</span>
                </a>
                <ul className="sidebar_submenu">
                    <li className="sidebar_flyout_header">Casino</li>
                    <li><Link to="/casino" onClick={onLinkClick} className={isCasinoAllGames ? 'active' : ''}><i className="ri-gamepad-line" aria-hidden />All Games</Link></li>
                    {providers.map((p) => (
                      <li key={p.code}>
                        <Link to={`/casino?provider=${encodeURIComponent(p.code)}`} onClick={onLinkClick} className={isCasinoProvider(p.code) ? 'active' : ''}>
                          <i className="ri-poker-spades-fill" aria-hidden />
                          {p.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
              </li>
              <li className={`sidebar_menu_item ${openSubmenu === 'sports' ? 'active' : ''} ${pathname === '/sports' || pathname === '/cricket' ? 'current_section' : ''}`}>
                <a href="#!" onClick={(e) => { e.preventDefault(); toggleSubmenu('sports'); }}>
                  <i className={openSubmenu === 'sports' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                  <span><i className="ri-basketball-fill" aria-hidden />Sports</span>
                </a>
                <ul className="sidebar_submenu">
                    <li className="sidebar_flyout_header">Sports</li>
                    <li><Link to="/sports" onClick={onLinkClick} className={isSportsActive ? 'active' : ''}>Football</Link></li>
                    <li><Link to="/sports" onClick={onLinkClick} className={isSportsActive ? 'active' : ''}>Basketball</Link></li>
                    <li><Link to="/sports" onClick={onLinkClick} className={isSportsActive ? 'active' : ''}>Tennis</Link></li>
                    <li><Link to="/cricket" onClick={onLinkClick} className={isCricketActive ? 'active' : ''}>Cricket</Link></li>
                    <li><Link to="/sports" onClick={onLinkClick} className={isSportsActive ? 'active' : ''}>Horse Racing</Link></li>
                  </ul>
              </li>
              <div className="sh-sub-title">
                <i className="ri-more-2-line" aria-hidden />
                <span className="sh-sub-title_text">Other Menu</span>
              </div>
              <li className={`sidebar_menu_item sidebar_direct_link ${pathname === '/game-rules' ? 'active' : ''}`}>
                <Link to="/game-rules" onClick={onLinkClick}>
                  <span><i className="ri-book-2-line" aria-hidden />Game Rules</span>
                  <span className="sidebar_collapsed_label">Game Rules</span>
                </Link>
              </li>
              <li className={`sidebar_menu_item sidebar_direct_link ${pathname === '/promotions' ? 'active' : ''}`}>
                <Link to="/promotions" onClick={onLinkClick}>
                  <span><i className="ri-megaphone-line" aria-hidden />Promotions</span>
                  <span className="sidebar_collapsed_label">Promotions</span>
                </Link>
              </li>
              <li className={`sidebar_menu_item sidebar_direct_link ${pathname === '/referral' ? 'active' : ''}`}>
                <Link to="/referral" onClick={onLinkClick}>
                  <span><i className="ri-user-shared-line" aria-hidden />Referral</span>
                  <span className="sidebar_collapsed_label">Refer & Earn</span>
                </Link>
              </li>
              <li className={`sidebar_menu_item sidebar_direct_link ${pathname === '/transactions' ? 'active' : ''}`}>
                <Link to="/transactions" onClick={onLinkClick}>
                  <span><i className="ri-file-list-3-line" aria-hidden />Transactions</span>
                  <span className="sidebar_collapsed_label">Transactions</span>
                </Link>
              </li>
              <li className={`sidebar_menu_item sidebar_direct_link ${pathname === '/my-bets' ? 'active' : ''}`}>
                <Link to="/my-bets" onClick={onLinkClick}>
                  <span><i className="ri-flag-line" aria-hidden />My Bets</span>
                  <span className="sidebar_collapsed_label">My Bets</span>
                </Link>
              </li>
              <li className={`sidebar_menu_item sidebar_direct_link ${pathname === '/my-wallet' ? 'active' : ''}`}>
                <Link to="/my-wallet" onClick={onLinkClick}>
                  <span><i className="ri-wallet-3-line" aria-hidden />My Wallet</span>
                  <span className="sidebar_collapsed_label">My Wallet</span>
                </Link>
              </li>
              <li className={`sidebar_menu_item sidebar_direct_link ${pathname === '/betting-profit-loss' ? 'active' : ''}`}>
                <Link to="/betting-profit-loss" onClick={onLinkClick}>
                  <span><i className="ri-line-chart-line" aria-hidden />Betting P&L</span>
                  <span className="sidebar_collapsed_label">Betting P&L</span>
                </Link>
              </li>
              <li className={`sidebar_menu_item sidebar_direct_link ${pathname === '/turnover-history' ? 'active' : ''}`}>
                <Link to="/turnover-history" onClick={onLinkClick}>
                  <span><i className="ri-repeat-line" aria-hidden />Turnover History</span>
                  <span className="sidebar_collapsed_label">Turnover</span>
                </Link>
              </li>
              <li className={`sidebar_menu_item sidebar_direct_link ${pathname === '/account-statement' ? 'active' : ''}`}>
                <Link to="/account-statement" onClick={onLinkClick}>
                  <span><i className="ri-bank-card-line" aria-hidden />Account Statement</span>
                  <span className="sidebar_collapsed_label">Statement</span>
                </Link>
              </li>
              <li className={`sidebar_menu_item sidebar_direct_link ${pathname === '/bonus-statement' ? 'active' : ''}`}>
                <Link to="/bonus-statement" onClick={onLinkClick}>
                  <span><i className="ri-gift-line" aria-hidden />Bonus Statement</span>
                  <span className="sidebar_collapsed_label">Bonus</span>
                </Link>
              </li>
              <li className={`sidebar_menu_item sidebar_direct_link ${pathname === '/deposit-turnover' ? 'active' : ''}`}>
                <Link to="/deposit-turnover" onClick={onLinkClick}>
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

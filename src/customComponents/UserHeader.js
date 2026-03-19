import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSidebar } from '../context/SidebarContext'
import { useCasinoProviders } from '../context/CasinoProvidersContext'
import LoginModal from './LoginModal'
import Sidebar from './SideBar/Sidebar'
import Chat from '../cricket/Chat'
import Search from './Search'
import { useBalance } from '../context/BalanceContext'
import { usePlatformConfig } from '../context/PlatformConfigContext'
import { useAuth } from '../context/AuthContext'
import {
  connectSportsbookSocket,
  disconnectSportsbookSocket,
} from '../socket/sportsbookSocket'
import { disconnectBalanceSocket } from '../socket/balanceSocket'
import AuthService from '../api/services/AuthService'
import { clearAuth, getToken } from '../utils/authStorage'

const CURRENCY_LIST = [
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹', icon: 'images/digital_currency.svg' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$', icon: 'images/dollar_icon.svg' },
  { code: 'USDT', name: 'Tether', flag: null, symbol: '$', icon: 'images/digital_currency.svg' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€', icon: 'images/digital_currency.svg' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£', icon: 'images/digital_currency.svg' },
];

const INR_SYMBOL = '₹';

export default function UserHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('login');
  const returnTo = location.pathname + location.search;
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  /* eslint-disable no-unused-vars -- providers, casinoDropdownOpen used in JSX (casino dropdown) */
  const { providers } = useCasinoProviders();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [casinoDropdownOpen, setCasinoDropdownOpen] = useState(false);
  /* eslint-enable no-unused-vars */
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const { balance: balanceFromContext } = useBalance();
  const { config: platformConfig } = usePlatformConfig();
  const { isDemo } = useAuth();
  const [userDisplayName, setUserDisplayName] = useState('');
  const dropdownRef = useRef(null);
  const casinoDropdownRef = useRef(null);

  const balance = balanceFromContext != null ? Number(balanceFromContext) : 0;

  // Balance from socket only (INR) – no external rates API; demo mode shows "View only – ₹0"
  const balanceDisplay = isDemo
    ? `View only – ${INR_SYMBOL}0.00`
    : `${INR_SYMBOL}${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const currencies = useMemo(() => {
    return CURRENCY_LIST.map((c) => ({
      ...c,
      balance: c.code === 'INR' ? balanceDisplay : `${c.symbol}—`,
    }));
  }, [balanceDisplay]);

  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('INR');
  const filteredCurrencies = currencies.filter(
    (c) => c.code.toLowerCase().includes(currencySearch.toLowerCase()) || c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const fetchUserDisplayName = () => {
    const token = getToken();
    if (!token) {
      setUserDisplayName('');
      return;
    }
    AuthService.bettingGetMe()
      .then((res) => {
        const raw = res?.data ?? res;
        const user = raw?.user ?? raw;
        const name = user?.fullName ?? user?.full_name ?? user?.username ?? '';
        if (name && String(name).trim()) {
          setUserDisplayName(String(name).trim());
        } else if (user?.mobile) {
          const m = String(user.mobile);
          setUserDisplayName(m.length >= 4 ? `User ${m.slice(-4)}` : 'User');
        } else {
          setUserDisplayName('User');
        }
      })
      .catch(() => setUserDisplayName('User'));
  };

  useEffect(() => {
    fetchUserDisplayName();
    window.addEventListener('loginStateChange', fetchUserDisplayName);
    return () => window.removeEventListener('loginStateChange', fetchUserDisplayName);
  }, []);

  // Sportsbook socket for matches/odds (balance updates via BalanceContext). Guest = no token, still connect for odds.
  useEffect(() => {
    const sync = () => {
      const t = getToken();
      connectSportsbookSocket(t || null);
    };
    sync();
    window.addEventListener('loginStateChange', sync);
    return () => window.removeEventListener('loginStateChange', sync);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (casinoDropdownRef.current && !casinoDropdownRef.current.contains(event.target)) {
        setCasinoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const openChat = () => {
      setIsChatOpen(true);
    };
    window.addEventListener('openChat', openChat);
    return () => window.removeEventListener('openChat', openChat);
  }, []);

  useEffect(() => {
    const openSearch = () => setIsSearchOpen(true);
    window.addEventListener('openSearchModal', openSearch);
    return () => window.removeEventListener('openSearchModal', openSearch);
  }, []);

  return (
    <>
      <header>
        <div className="header_lft">
          <div className={`toggle_menu ${sidebarOpen ? 'toggle_menu_open' : ''}`} onClick={() => setSidebarOpen((prev) => !prev)}>
            <img src="/images/toggle_menu.svg" alt="menu" />
          </div>
          <Link to="/" className="header_logo">
          <img className="desktopview" src="/images/logo.png" alt="logo" />
          <img className="mobileview" src="/images/logo_mobile.svg" alt="logo" />
          </Link>
        </div>

      
    
        <div className="header_right">
        {isDemo && (
          <span className="demo_mode_badge" title="View only – login to place bets">Demo Mode (View Only)</span>
        )}
        <div className='d-flex align-items-center gap-2 depositheader'>
        <div className="currency_balance_wrapper currency_balance_inr_only">
          <div className='d-flex align-items-center gap-2 currency_balance'>
            <span className="currency_flag_emoji" aria-hidden>🇮🇳</span>
            <span>{balanceDisplay}</span>
          </div>
          {currencyDropdownOpen && (
          <div className="currency_dropdown">
            <div className="currency_dropdown_search">
              <i className="ri-search-line" aria-hidden />
              <input
                type="text"
                placeholder="Search"
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <ul className="currency_dropdown_list" role="listbox">
              {filteredCurrencies.map((curr) => (
                <li
                  key={curr.code}
                  role="option"
                  aria-selected={selectedCurrencyCode === curr.code}
                  className={`currency_dropdown_item ${selectedCurrencyCode === curr.code ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCurrencyCode(curr.code);
                    setCurrencyDropdownOpen(false);
                    setCurrencySearch('');
                  }}
                >
                  {curr.flag ? (
                    <span className="currency_flag_emoji" aria-hidden>{curr.flag}</span>
                  ) : (
                    <img src={curr.icon} alt="" />
                  )}
                  <span className="currency_code">{curr.code} ({curr.symbol})</span>
                  <span className="currency_balance_value">{curr.balance}</span>
                </li>
              ))}
            </ul>
          </div>
          )}
        </div>
        {isDemo ? (
          <span className="deposit_disabled_banner" aria-live="polite">Login to play and place bets</span>
        ) : platformConfig.depositServiceStatus ? (
          <button className="deposit_btn" onClick={() => navigate('/deposit')} aria-label="Deposit">
            <i className="ri-add-line deposit_btn_icon" aria-hidden />
            <span className="deposit_btn_text">Deposit</span>
          </button>
        ) : (
          <span className="deposit_disabled_banner" aria-live="polite">Deposits temporarily unavailable</span>
        )}
      </div>
     
          <div className="searchbtn" onClick={() => setIsSearchOpen(true)}>
            <img src="/images/search-icon.svg" alt="search" />
          </div>

          {/* <div className="header_casino_dropdown_wrapper" ref={casinoDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="header_casino_trigger"
              onClick={() => setCasinoDropdownOpen((o) => !o)}
              aria-expanded={casinoDropdownOpen}
              aria-haspopup="true"
            >
              <i className="ri-poker-spades-fill" aria-hidden />
              <span>Casino</span>
              <i className={`ri-arrow-${casinoDropdownOpen ? 'up' : 'down'}-s-line`} aria-hidden />
            </button>
            {casinoDropdownOpen && (
              <div className="header_casino_dropdown" role="menu">
                <Link to="/casino" className="header_casino_dropdown_item" onClick={() => setCasinoDropdownOpen(false)} role="menuitem">
                  <i className="ri-gamepad-line" aria-hidden />
                  All Games
                </Link>
                {providers.map((p) => (
                  <Link
                    key={p.code}
                    to={`/casino?provider=${encodeURIComponent(p.code)}`}
                    className="header_casino_dropdown_item"
                    onClick={() => setCasinoDropdownOpen(false)}
                    role="menuitem"
                  >
                    <i className="ri-poker-spades-fill" aria-hidden />
                    {p.name}
                  </Link>
                ))}
              </div>
            )}
          </div> */}

        <div className='user_header_right' ref={dropdownRef} style={{ position: 'relative' }}>
          <div className='d-flex' onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
            <img className='user_header_img' src="/images/user_vector.png" alt="user" />
            <i className="ri-arrow-down-s-line"></i>
          </div>
          
          {isProfileDropdownOpen && (
            <div className="user_profile_dropdown">
              <div className="user_profile_dropdown_header">
                <div className='user_top_dropdown_header d-flex align-items-center gap-2'>
              <img className='user_img' src="/images/user_vector.png" alt="user" />
                <h4 className="text_uppercase">{userDisplayName || 'User'}</h4>
                </div>
              </div>
              
              <div className="user_profile_dropdown_menu">
                <Link to="/profile" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-user-line"></i>
                  <span>My Profile</span>
                </Link>
                <Link to="/add-account" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-settings-3-line"></i>
                  <span>Account</span>
                </Link>
                <Link to="/transactions" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-file-list-3-line"></i>
                  <span>Transaction History</span>
                </Link>
                <Link to="/game-history" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-history-line"></i>
                  <span>Game History</span>
                </Link>
                {/* <Link to="/profile" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-time-line"></i>
                  <span>Sessions</span>
                </Link> */}
                {/* <Link to="/profile" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-safe-2-line"></i>
                  <span>Vault</span>
                </Link> */}
                {platformConfig.withdrawalServiceStatus && !isDemo && (
                  <Link 
                    to="/withdrawal" 
                    className="dropdown_menu_item" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <i className="ri-bank-line"></i>
                    <span>Withdrawal</span>
                  </Link>
                )}
              </div>
              
              <button
                type="button"
                className="dropdown_logout_btn"
                onClick={() => {
                  disconnectBalanceSocket();
                  clearAuth();
                  setUserDisplayName('');
                  window.dispatchEvent(new CustomEvent('loginStateChange'));
                  setIsProfileDropdownOpen(false);
                  navigate('/', { replace: true });
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>  
    
          {/* <div className="setting_hdr">
            <img src="/images/en.png" alt="language" />
            <div className="setting_icon">
              <img src="/images/settingicon.svg" alt="setting" />
            </div>
          </div>
    
          <div className="comment_hdr" onClick={() => setIsChatOpen(!isChatOpen)}>
            <img src="/images/comment-icon.svg" alt="comment" />
          </div>   */}
        </div>
      </header>

      {showModal && <LoginModal show={showModal} onHide={() => { setShowModal(false); setModalTab('login'); }} initialTab={modalTab} returnTo={returnTo} />}
      {sidebarOpen && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      {isChatOpen && <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />}
      {isSearchOpen && <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}

    </>
  )
}

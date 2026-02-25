import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSidebar } from '../context/SidebarContext'
import LoginModal from './LoginModal'
import SideBar from './SideBar/sideBar'
import Chat from '../cricket/Chat'
import Search from './Search'
import AuthService from '../api/services/AuthService'

const CURRENCY_LIST = [
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹', icon: 'images/digital_currency.svg' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$', icon: 'images/dollar_icon.svg' },
  { code: 'USDT', name: 'Tether', flag: null, symbol: '$', icon: 'images/digital_currency.svg' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€', icon: 'images/digital_currency.svg' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£', icon: 'images/digital_currency.svg' },
];

const RATES_API = 'https://open.er-api.com/v6/latest/INR';

export default function UserHeader() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('login');
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [balanceInr, setBalanceInr] = useState(null);
  const [rates, setRates] = useState(null);
  const dropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);

  const balance = balanceInr != null ? Number(balanceInr) : 0;
  const defaultCurrency = { ...CURRENCY_LIST[0], balance: '₹0.00' };

  const currencies = useMemo(() => {
    return CURRENCY_LIST.map((c) => {
      let displayBalance;
      if (c.code === 'INR') {
        displayBalance = `${c.symbol}${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else if (rates && typeof rates[c.code] === 'number') {
        const converted = balance * rates[c.code];
        displayBalance = `${c.symbol}${converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        displayBalance = `${c.symbol}—`;
      }
      return { ...c, balance: displayBalance };
    });
  }, [balance, rates]);

  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('INR');
  const selectedCurrency = currencies.find((c) => c.code === selectedCurrencyCode) || currencies[0] || defaultCurrency;
  const filteredCurrencies = currencies.filter(
    (c) => c.code.toLowerCase().includes(currencySearch.toLowerCase()) || c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const fetchBalance = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await AuthService.bettingGetBalance();
    if (res?.success && res?.data != null) setBalanceInr(res.data.balance);
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    const onBalanceUpdate = () => fetchBalance();
    window.addEventListener('walletBalanceUpdate', onBalanceUpdate);
    window.addEventListener('loginStateChange', onBalanceUpdate);
    return () => {
      window.removeEventListener('walletBalanceUpdate', onBalanceUpdate);
      window.removeEventListener('loginStateChange', onBalanceUpdate);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchRates = async () => {
      try {
        const res = await fetch(RATES_API);
        const data = await res.json();
        if (!cancelled && data?.rates) setRates(data.rates);
      } catch (_) {}
    };
    fetchRates();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
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
        <div className='d-flex align-items-center gap-2 depositheader'>
        <div className="currency_balance_wrapper currency_balance_inr_only">
          <div className='d-flex align-items-center gap-2 currency_balance'>
            <span className="currency_flag_emoji" aria-hidden>🇮🇳</span>
            <span>{selectedCurrency?.balance ?? '₹0.00'}</span>
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
        <button className="deposit_btn" onClick={() => navigate('/deposit')} aria-label="Deposit">
          <i className="ri-add-line deposit_btn_icon" aria-hidden />
          <span className="deposit_btn_text">Deposit</span>
        </button>
      </div>
     
          <div className="searchbtn" onClick={() => setIsSearchOpen(true)}>
            <img src="/images/search-icon.svg" alt="search" />
          </div>

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
                <h4>User12345</h4>
                </div>
              </div>
              
              <div className="user_profile_dropdown_menu">
                <Link to="/profile" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-user-line"></i>
                  <span>My Profile</span>
                </Link>
                <Link to="/profile" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-settings-3-line"></i>
                  <span>Account</span>
                </Link>
                <Link to="/transactions" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-file-list-3-line"></i>
                  <span>Transaction History</span>
                </Link>
                <Link to="/game" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
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
                <Link 
                  to="/withdrawal" 
                  className="dropdown_menu_item" 
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  <i className="ri-bank-line"></i>
                  <span>Withdrawal</span>
                </Link>
              </div>
              
              <button
                type="button"
                className="dropdown_logout_btn"
                onClick={() => {
                  sessionStorage.removeItem('token');
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

      {showModal && <LoginModal show={showModal} onHide={() => { setShowModal(false); setModalTab('login'); }} initialTab={modalTab} />}
      {sidebarOpen && <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      {isChatOpen && <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />}
      {isSearchOpen && <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}

    </>
  )
}

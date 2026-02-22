import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginModal from './LoginModal'
import SideBar from './SideBar/sideBar'
import Chat from '../cricket/Chat'
import Deposit from './Deposit'
import Withdrawal from './Withdrawal'
import Search from './Search'

export default function UserHeader() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('login');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const dropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);

  const currencies = [
    { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹', icon: 'images/digital_currency.svg' },
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$', icon: 'images/dollar_icon.svg' },
    { code: 'USDT', name: 'Tether', flag: null, symbol: '$', icon: 'images/digital_currency.svg' },
    { code: 'BFG', name: 'BetFury Token', flag: null, symbol: 'BFG', icon: 'images/digital_currency.svg' },
    { code: 'BTC', name: 'Bitcoin', flag: null, symbol: '₿', icon: 'images/digital_currency.svg' },
    { code: 'ETH', name: 'Ethereum', flag: null, symbol: 'Ξ', icon: 'images/digital_currency.svg' },
  ].map((c) => ({ ...c, balance: `${c.symbol}0.00` }));
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);
  const filteredCurrencies = currencies.filter(
    (c) => c.code.toLowerCase().includes(currencySearch.toLowerCase()) || c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setCurrencyDropdownOpen(false);
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
          <div className="toggle_menu" onClick={() => setSidebarOpen(true)}>
            <img src="images/toggle_menu.svg" alt="menu" />
          </div>
          <Link to="/" className="header_logo">
          <img className="desktopview" src="images/logo.png" alt="logo" />
          <img className="mobileview" src="images/logo_mobile.svg" alt="logo" />
          </Link>
        </div>

      <div className='d-flex align-items-center gap-2 depositheader'>
        <div className="currency_balance_wrapper" ref={currencyDropdownRef}>
          <div
            className='d-flex align-items-center gap-2 currency_balance currency_balance_trigger'
            onClick={() => setCurrencyDropdownOpen((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setCurrencyDropdownOpen((v) => !v)}
            aria-expanded={currencyDropdownOpen}
            aria-haspopup="listbox"
          >
            {selectedCurrency.flag ? (
              <span className="currency_flag_emoji" aria-hidden>{selectedCurrency.flag}</span>
            ) : (
              <img src={selectedCurrency.icon} alt="" />
            )}
            <span>{selectedCurrency.balance}</span>
            <i className={`ri-arrow-up-s-line currency_caret ${currencyDropdownOpen ? 'open' : ''}`} aria-hidden />
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
                  aria-selected={selectedCurrency.code === curr.code}
                  className={`currency_dropdown_item ${selectedCurrency.code === curr.code ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCurrency(curr);
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
        <button className="deposit_btn" onClick={() => setIsDepositOpen(true)}>Deposit</button>
   </div>
    
        <div className="header_right">
     
          <div className="searchbtn" onClick={() => setIsSearchOpen(true)}>
            <img src="images/search-icon.svg" alt="search" />
          </div>

        <div className='user_header_right' ref={dropdownRef} style={{ position: 'relative' }}>
          <div className='d-flex' onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
            <img className='user_header_img' src="images/user_vector.png" alt="user" />
            <i className="ri-arrow-down-s-line"></i>
          </div>
          
          {isProfileDropdownOpen && (
            <div className="user_profile_dropdown">
              <div className="user_profile_dropdown_header">
                <div className='user_top_dropdown_header d-flex align-items-center gap-2'>
              <img className='user_img' src="images/user_vector.png" alt="user" />
                <h4>User12345</h4>
                </div>
              </div>
              
              <div className="user_profile_dropdown_menu">
                <Link to="/profile" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-wallet-3-line"></i>
                  <span>Wallet</span>
                </Link>
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
                <Link to="/profile" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-time-line"></i>
                  <span>Sessions</span>
                </Link>
                <Link to="/profile" className="dropdown_menu_item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <i className="ri-safe-2-line"></i>
                  <span>Vault</span>
                </Link>
                <a 
                  href="#!" 
                  className="dropdown_menu_item" 
                  onClick={(e) => {
                    e.preventDefault()
                    setIsProfileDropdownOpen(false)
                    setIsWithdrawalOpen(true)
                  }}
                >
                  <i className="ri-bank-line"></i>
                  <span>Withdrawal</span>
                </a>
              </div>
              
              <button
                type="button"
                className="dropdown_logout_btn"
                onClick={() => {
                  sessionStorage.removeItem('token');
                  setIsProfileDropdownOpen(false);
                  navigate('/', { replace: true });
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>  
    
          <div className="setting_hdr">
            <img src="images/en.png" alt="language" />
            <div className="setting_icon">
              <img src="images/settingicon.svg" alt="setting" />
            </div>
          </div>
    
          <div className="comment_hdr" onClick={() => setIsChatOpen(!isChatOpen)}>
            <img src="images/comment-icon.svg" alt="comment" />
          </div>  
        </div>
      </header>

      <LoginModal show={showModal} onHide={() => { setShowModal(false); setModalTab('login'); }} initialTab={modalTab} />
      <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <Deposit isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <Withdrawal isOpen={isWithdrawalOpen} onClose={() => setIsWithdrawalOpen(false)} />
      <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

    </>
  )
}

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
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

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
            <img src="images/logo.png" alt="logo" />
          </Link>
        </div>

      <div className='d-flex align-items-center gap-2 depositheader'>  
        <div className='d-flex align-items-center gap-0 currency_balance'>
      <img src="images/digital_currency.svg" alt="balance" />
      <span>0.00000000</span>
      </div>
        <button className="deposit_btn desktop" onClick={() => setIsDepositOpen(true)}>Deposit</button>
        <button className="deposit_btn mobile" onClick={() => setIsDepositOpen(true)}><img src="images/deposithdr_icon.svg" alt="withdraw" /></button>
        {/* <button className="deposit_btn" onClick={() => setIsWithdrawalOpen(true)}>Withdraw</button> */}
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

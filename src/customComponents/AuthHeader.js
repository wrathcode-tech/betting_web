import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LoginModal from './LoginModal'
import SideBar from './SideBar/sideBar'
import Chat from '../cricket/Chat'
import Deposit from './Deposit'
import Withdrawal from './Withdrawal'
import Search from './Search'

export default function AuthHeader() {
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('login');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLoginClick = () => {
    setModalTab('login');
    setShowModal(true);
  };

  const handleSignupClick = () => {
    setModalTab('signup');
    setShowModal(true);
  };

  useEffect(() => {
    const openModal = (e) => {
      setModalTab(e.detail === 'signup' ? 'signup' : 'login');
      setShowModal(true);
    };
    window.addEventListener('openLoginModal', openModal);
    return () => window.removeEventListener('openLoginModal', openModal);
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
          <div className="login_hdr">
            <button type="button" onClick={handleLoginClick}>Login</button>
            <button className="signup_btn" onClick={handleSignupClick}>Sign Up</button>
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

      <LoginModal show={showModal} onHide={() => setShowModal(false)} initialTab={modalTab} />
      <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <Deposit isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <Withdrawal isOpen={isWithdrawalOpen} onClose={() => setIsWithdrawalOpen(false)} />
      <Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

    </>
  )
}

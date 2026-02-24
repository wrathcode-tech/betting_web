import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { useSidebar } from '../context/SidebarContext'

const LoginModal = lazy(() => import('./LoginModal'))
const Chat = lazy(() => import('../cricket/Chat'))
const Deposit = lazy(() => import('./Deposit'))
const Withdrawal = lazy(() => import('./Withdrawal'))
const Search = lazy(() => import('./Search'))

export default function AuthHeader() {
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('login');
  const { sidebarOpen, setSidebarOpen } = useSidebar();
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
      <header className="auth_header">
        <div className="header_lft">
          <div className={`toggle_menu ${sidebarOpen ? 'toggle_menu_open' : ''}`} onClick={() => setSidebarOpen((prev) => !prev)}>
            <img src="/images/toggle_menu.svg" alt="menu" />
          </div>
          <Link to="/" className="header_logo">
            <img src="/images/logo.png" alt="logo" />
          </Link>
        </div>

        <div className="header_right">
     
          <div className="searchbtn" onClick={() => setIsSearchOpen(true)}>
            <img src="/images/search-icon.svg" alt="search" />
          </div>
          <div className="login_hdr">
            <button type="button" onClick={handleLoginClick}>Login</button>
            <button className="signup_btn" onClick={handleSignupClick}>Sign Up</button>
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

      {showModal && <Suspense fallback={null}><LoginModal show={showModal} onHide={() => setShowModal(false)} initialTab={modalTab} /></Suspense>}
      {isChatOpen && <Suspense fallback={null}><Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} /></Suspense>}
      {isDepositOpen && <Suspense fallback={null}><Deposit isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} /></Suspense>}
      {isWithdrawalOpen && <Suspense fallback={null}><Withdrawal isOpen={isWithdrawalOpen} onClose={() => setIsWithdrawalOpen(false)} /></Suspense>}
      {isSearchOpen && <Suspense fallback={null}><Search isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} /></Suspense>}

    </>
  )
}

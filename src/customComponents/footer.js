import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import SideBar from './SideBar/sideBar'
import Chat from '../cricket/Chat'

const FOOTER_MOBILE_MENU = [
    {
        id: 'i-gaming',
        label: 'I-GAMING',
        links: [
            { to: '/casino', label: 'Casino' },
            { to: '/sports', label: 'Sports' },
            { to: '/casino', label: 'All games' },
            { to: '/game', label: 'Slots' },
            { to: '/casino', label: 'Live casino' },
            { to: '/casino', label: 'Dice' },
            { to: '/casino', label: 'Plinko' },
            { to: '/rank', label: 'Rank system' },
        ],
    },
    {
        id: 'features',
        label: 'FEATURES',
        links: [
            { to: '/rank', label: 'Rank system' },
            { to: '/referral', label: 'Referral' },
            { to: '/transactions', label: 'Transactions' },
        ],
    },
    {
        id: 'promo',
        label: 'PROMO',
        links: [
            { to: '/', label: 'Bonuses' },
            { to: '/', label: 'Tournaments' },
        ],
    },
    {
        id: 'about',
        label: 'ABOUT US',
        links: [
            { to: '/', label: 'About Us' },
            { to: '/', label: 'Terms & Conditions' },
            { to: '/', label: 'Privacy Policy' },
            { to: '/', label: 'Responsible gaming' },
        ],
    },
    {
        id: 'contact',
        label: 'CONTACT US',
        links: [
            { to: '/', label: 'Contact Us' },
            { to: '/', label: 'Support' },
            { to: '/', label: 'FAQ' },
        ],
    },
    {
        id: 'help',
        label: 'HELP',
        links: [
            { to: '/', label: 'Help Center' },
            { to: '/', label: 'Contact Support' },
        ],
    },
];

function Footer() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (id) => {
        setOpenSection((prev) => (prev === id ? null : id));
    };

    return (
        <>
        <footer>
            
        <div className='container'>

        <div className='p_space_footer'>

          <div className='d-flex topfooter'>
            <div className='secure_img'>
              <img src="images/secure.png" alt="game" />
            </div>
            <div className='safe_cnt'>
              <h5>Secure &amp; Private</h5>
              <p>Your data is protected with encryption. Bet and play with a secure, private connection.</p>
            </div>
          </div>

          </div>
          

          <div className='footermain'>

<div className='p_space_footer'>

<div className="footer_description_container">
              <div
                className="footer_description_content"
                style={{
                  maxHeight: showMore ? 'none' : '200px',
                  overflow: 'hidden',
                  transition: 'max-height 0.35s ease-out',
                  position: 'relative',
                }}
              >
                <h3>Online Casino &amp; Sports Betting Platform</h3>

                <p>Our platform offers a secure and smooth betting experience with multiple payment options. Place bets on casino games, slots, live casino, and sports—with quick deposits and withdrawals so you can focus on the game.</p>

                <ul>
                  <li>Slots, live casino, sports betting and more;</li>
                  <li>Fast deposits and payouts;</li>
                  <li>Secure transactions and encrypted data;</li>
                  <li>Rank system, referrals and promotions;</li>
                  <li>Support when you need it.</li>
                </ul>
              </div>

              <button
                type="button"
                className="footer_show_more_btn"
                onClick={() => setShowMore((prev) => !prev)}
                aria-expanded={showMore}
              >
                {showMore ? 'Show Less' : 'Show More'}
                <i className={showMore ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
              </button>
            </div>
            </div>


            <div className='mobilebgfooter'>

            <nav className="footer_mobile_menu" aria-label="Footer menu">
                {FOOTER_MOBILE_MENU.map((section) => {
                    const isOpen = openSection === section.id;
                    return (
                        <div key={section.id} className="footer_mobile_menu_section">
                            <button
                                type="button"
                                className="footer_mobile_menu_heading"
                                onClick={() => toggleSection(section.id)}
                                aria-expanded={isOpen}
                                aria-controls={`footer-menu-${section.id}`}
                            >
                                <span>{section.label}</span>
                                <i className={isOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} aria-hidden />
                            </button>
                            <div
                                id={`footer-menu-${section.id}`}
                                className={`footer_mobile_menu_content ${isOpen ? 'is-open' : ''}`}
                                role="region"
                                aria-hidden={!isOpen}
                            >
                                <ul className="footer_mobile_menu_links">
                                    {section.links.map((link) => (
                                        <li key={link.label}>
                                            <Link to={link.to} className="footer_mobile_menu_link">
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="footer_quick_links d-flex flex-wrap align-items-center gap-2 gap-md-3 mt-3" style={{ fontSize: '14px' }}>
              <Link to="/" style={{ color: 'inherit', opacity: 0.9 }}>Home</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/casino" style={{ color: 'inherit', opacity: 0.9 }}>Casino</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/sports" style={{ color: 'inherit', opacity: 0.9 }}>Sports</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/game" style={{ color: 'inherit', opacity: 0.9 }}>Slots</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/cricket" style={{ color: 'inherit', opacity: 0.9 }}>Cricket</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/profile" style={{ color: 'inherit', opacity: 0.9 }}>Profile</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/transactions" style={{ color: 'inherit', opacity: 0.9 }}>Transactions</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/referral" style={{ color: 'inherit', opacity: 0.9 }}>Referral</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/rank" style={{ color: 'inherit', opacity: 0.9 }}>Rank</Link>
            </div>




<div className='footer-info__icons mobileview'>
  <ul>
      <li>
        <img src="images/age_cricle.svg" alt="icon" />
      </li>
      <li>
        <img src="images/GCB_Seal.svg" width={60} height={60} alt="icon" />
      </li>
      <li>
        <img src="images/SIQ.webp" width={60} height={60} alt="icon" />
      </li>
  </ul>
</div>

<p>This site offers gaming and involves risk. You must be 18 or older to use our services. We are not responsible for any breach of your local laws regarding online gaming. Please play responsibly.</p>

            <p className="mt-2">© {new Date().getFullYear()} All Rights Reserved.</p>
            </div>

          </div>

        </div>
      </footer>

      <div className='mobile-menu-wrapper'>
        <ul className="mobile-menu">
          <li className="mobile-menu__item">
            <button type="button" className="mobile-menu__link" onClick={() => setSidebarOpen(true)}>
              <span className="icon mobile-menu__icon">
                <i className="ri-menu-line"></i>
              </span>
              <span className="mobile-menu__name">Menu</span>
            </button>
          </li>
          <li className="mobile-menu__item">
            <NavLink to="/casino" className={({ isActive }) => `mobile-menu__link ${isActive ? 'active' : ''}`}>
              <span className="icon mobile-menu__icon">
                <i className="ri-poker-spades-fill"></i>
              </span>
              <span className="mobile-menu__name">Casino</span>
            </NavLink>
          </li>

          <li className="mobile-menu__item">
            <NavLink to="/" end className={({ isActive }) => `mobile-menu__link ${isActive ? 'active' : ''}`}>
              <span className="icon mobile-menu__icon">
                <i className="ri-home-4-line"></i>
              </span>
              <span className="mobile-menu__name">Home</span>
            </NavLink>
          </li>

          <li className="mobile-menu__item mobile-menu__item--sports">
            <NavLink to="/sports" className={({ isActive }) => `mobile-menu__link ${isActive ? 'active' : ''}`}>
              <span className="icon mobile-menu__icon">
                <i className="ri-basketball-fill"></i>
              </span>
              <span className="mobile-menu__name">Sports</span>
            </NavLink>
          </li>

          <li className="mobile-menu__item mobile-menu__item--sports">
            <NavLink to="/profile" className={({ isActive }) => `mobile-menu__link ${isActive ? 'active' : ''}`}>
              <span className="icon mobile-menu__icon">
                <i className="ri-wallet-line"></i>
              </span>
              <span className="mobile-menu__name">Wallet</span>
            </NavLink>
          </li>

          {/* <li className="mobile-menu__item">
            <button type="button" className="mobile-menu__link" onClick={() => setIsChatOpen(!isChatOpen)}>
              <span className="icon mobile-menu__icon">
                <i className="ri-discuss-line"></i>
              </span>
              <span className="mobile-menu__name">Chat</span>
            </button>
          </li> */}
        </ul>
      </div>

      <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
    )
}

export default Footer

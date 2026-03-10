import React, { useState, Suspense, lazy } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useSidebar } from '../context/SidebarContext'
import './Footer.css'

const Chat = lazy(() => import('../cricket/Chat'))

/* Footer links – only available routes; update as you add more pages */
const FOOTER_MOBILE_MENU = [
    {
        id: 'i-gaming',
        label: 'I-GAMING',
        links: [
            { to: '/casino', label: 'Casino' },
            { to: '/sports', label: 'Inplay' },
            { to: '/sportsbook', label: 'SportsBook' },
            { to: '/casino', label: 'Live casino' },
            { to: '/game', label: 'Slots' },
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
            { to: '/my-bets', label: 'My Bets' },
            { to: '/bet-history', label: 'Bet History' },
        ],
    },
    {
        id: 'promo',
        label: 'PROMO',
        links: [
            { to: '/promotions', label: 'Promotions' },
        ],
    },
    {
        id: 'about',
        label: 'ABOUT US',
        links: [
            { to: '/terms-and-conditions', label: 'Terms & Conditions' },
            { to: '/game-rules', label: 'Game Rules' },
        ],
    },
];

function Footer() {
    const location = useLocation();
    const { sidebarOpen, setSidebarOpen } = useSidebar();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (id) => {
        setOpenSection((prev) => (prev === id ? null : id));
    };

    return (
        <>
        <footer>
            {/* <div className="footer_vector_top" aria-hidden="true">
                <img src="/images/bottom_img.svg" alt="" />
            </div> */}
        <div className='container'>

          <div className='footermain'>

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

            {/* <div className="footer_quick_links d-flex flex-wrap align-items-center gap-2 gap-md-3 mt-3" style={{ fontSize: '14px' }}>
              <Link to="/" style={{ color: 'inherit', opacity: 0.9 }}>Home</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/casino" style={{ color: 'inherit', opacity: 0.9 }}>Casino</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/sports" style={{ color: 'inherit', opacity: 0.9 }}>Inplay</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/game" style={{ color: 'inherit', opacity: 0.9 }}>Slots</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/cricket" style={{ color: 'inherit', opacity: 0.9 }}>Cricket</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/sportsbook" style={{ color: 'inherit', opacity: 0.9 }}>SportsBook</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/transactions" style={{ color: 'inherit', opacity: 0.9 }}>Transactions</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/referral" style={{ color: 'inherit', opacity: 0.9 }}>Referral</Link>
              <span style={{ opacity: 0.5 }}>|</span>
              <Link to="/rank" style={{ color: 'inherit', opacity: 0.9 }}>Rank</Link>
            </div> */}




<div className='footer-info__icons mobileview'>
  <ul>
      <li>
        <img src="/images/age_cricle.svg" alt="icon" />
      </li>
      <li>
        <img src="/images/GCB_Seal.svg" width={60} height={60} alt="icon" />
      </li>
      <li>
        <img src="/images/SIQ.webp" width={60} height={60} alt="icon" />
      </li>
  </ul>
</div>

<p className="footer_disclaimer">This site offers gaming and involves risk. You must be 18 or older to use our services. We are not responsible for any breach of your local laws regarding online gaming. Please play responsibly.</p>
            <p className="footer_copyright">© {new Date().getFullYear()} All Rights Reserved.</p>
            </div>

          </div>

        </div>
      </footer>

      <div className='mobile-menu-wrapper'>
        <ul className="mobile-menu">
          <li className={`mobile-menu__item ${sidebarOpen ? 'active' : ''}`}>
            <button type="button" className="mobile-menu__link" onClick={() => setSidebarOpen((prev) => !prev)}>
              <span className="icon mobile-menu__icon">
                <i className="ri-menu-line"></i>
              </span>
              <span className="mobile-menu__name">Menu</span>
            </button>
          </li>
          <li className={`mobile-menu__item ${!sidebarOpen && (location.pathname === '/casino' || location.pathname.startsWith('/casino/')) ? 'active' : ''}`}>
            <NavLink to="/casino" className="mobile-menu__link" onClick={() => setSidebarOpen(false)}>
              <span className="icon mobile-menu__icon">
                <i className="ri-poker-spades-fill"></i>
              </span>
              <span className="mobile-menu__name">Casino</span>
            </NavLink>
          </li>

          <li className={`mobile-menu__item ${!sidebarOpen && location.pathname === '/' ? 'active' : ''}`}>
            <NavLink to="/" end className="mobile-menu__link" onClick={() => setSidebarOpen(false)}>
              <span className="icon mobile-menu__icon">
                <i className="ri-home-4-line"></i>
              </span>
              <span className="mobile-menu__name">Home</span>
            </NavLink>
          </li>

          <li className={`mobile-menu__item mobile-menu__item--sports ${!sidebarOpen && (location.pathname === '/sports' || location.pathname.startsWith('/sports/')) ? 'active' : ''}`}>
            <NavLink to="/sports" className="mobile-menu__link" onClick={() => setSidebarOpen(false)}>
              <span className="icon mobile-menu__icon">
                <i className="ri-live-line"></i>
              </span>
              <span className="mobile-menu__name">Inplay</span>
            </NavLink>
          </li>

          <li className={`mobile-menu__item mobile-menu__item--sports ${!sidebarOpen && (location.pathname === '/sportsbook' || location.pathname.startsWith('/sportsbook/')) ? 'active' : ''}`}>
            <NavLink to="/sportsbook" className="mobile-menu__link" onClick={() => setSidebarOpen(false)}>
              <span className="icon mobile-menu__icon">
                <i className="ri-basketball-fill"></i>
              </span>
              <span className="mobile-menu__name">SportsBook</span>
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

      {isChatOpen && <Suspense fallback={null}><Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} /></Suspense>}
    </>
    )
}

export default Footer

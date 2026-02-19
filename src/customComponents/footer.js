import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SideBar from './SideBar/sideBar'
import Chat from '../cricket/Chat'

function Footer() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <>
        <footer>
            
        <div className='container'>
          <div className='d-flex topfooter'>
            <div className='secure_img'>
              <img src="images/secure.png" alt="game" />
            </div>
            <div className='safe_cnt'>
              <h5>100% Safe</h5>
              <p>Your data is safe with encrypted protection. Enjoy a
                secure and private connection.</p>
            </div>
          </div>

          <div className='footermain'>
            <p>CROWNBET provides a smooth and secure betting experience with a variety of reliable payment options. Whether you’re
              placing bets on casino games or sports, our platform ensures quick and hassle-free transactions. Enjoy the convenience of
              seamless deposits and withdrawals, and focus on the thrill of the game.</p>

            <p>© Copyright 2024. All Rights Reserved. Powered by Play.</p>

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
            <Link to="/rank" className="mobile-menu__link">
              <span className="icon mobile-menu__icon">
                <i className="ri-trophy-line"></i>
              </span>
              <span className="mobile-menu__name">Contests</span>
            </Link>
          </li>

          <li className="mobile-menu__item">
            <Link to="/casino" className="mobile-menu__link">
              <span className="icon mobile-menu__icon">
                <i className="ri-poker-spades-fill"></i>
              </span>
              <span className="mobile-menu__name">Casino</span>
            </Link>
          </li>

          <li className="mobile-menu__item mobile-menu__item--sports">
            <Link to="/sports" className="mobile-menu__link">
              <span className="icon mobile-menu__icon">
                <i className="ri-basketball-fill"></i>
              </span>
              <span className="mobile-menu__name">Sports</span>
            </Link>
          </li>

          <li className="mobile-menu__item">
            <button type="button" className="mobile-menu__link" onClick={() => setIsChatOpen(!isChatOpen)}>
              <span className="icon mobile-menu__icon">
                <i className="ri-discuss-line"></i>
              </span>
              <span className="mobile-menu__name">Chat</span>
            </button>
          </li>
        </ul>
      </div>

      <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
    )
}

export default Footer

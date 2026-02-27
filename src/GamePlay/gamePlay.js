import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './gamePlay.css';
import MobileMenu from '../customComponents/MobileMenu';
import AuthService from '../api/services/AuthService';
import { getLastBalance } from '../socket/balanceSocket';

const BEST_GAMES_ITEMS = [
  { id: 1, badge: 'Top', image: 'images/betcasino_img.png' },
  { id: 2, badge: null, image: 'images/betcasino_img2.png' },
  { id: 3, badge: 'Top', image: 'images/betcasino_img3.png' },
  { id: 4, badge: null, image: 'images/betcasino_img4.png' },
  { id: 5, badge: 'Hot', image: 'images/betcasino_img5.png' },
  { id: 6, badge: null, image: 'images/betcasino_img6.png' },
  { id: 7, badge: null, image: 'images/betcasino_img7.png' },
  { id: 8, badge: null, image: 'images/betcasino_img3.png' },
];

const TOP_SLOTS_ITEMS = [
  { id: 1, badge: 'Top', image: 'images/game_itemslider.png' },
  { id: 2, badge: null, image: 'images/game_itemslider2.png' },
  { id: 3, badge: 'Top', image: 'images/game_itemslider3.png' },
  { id: 4, badge: null, image: 'images/game_itemslider4.png' },
  { id: 5, badge: 'Hot', image: 'images/game_itemslider5.png' },
  { id: 6, badge: null, image: 'images/game_itemslider6.png' },
  { id: 7, badge: null, image: 'images/game_itemslider7.png' },
  { id: 8, badge: null, image: 'images/game_itemslider4.png' },
];

const GAME_SESSION_KEY = 'wcoGameSession';

function getStoredSession() {
  try {
    const raw = sessionStorage.getItem(GAME_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.launchURL && data?.gameCode && data?.providerCode) return data;
    return null;
  } catch {
    return null;
  }
}

function saveSession(data) {
  try {
    if (data?.launchURL && data?.gameCode && data?.providerCode) {
      sessionStorage.setItem(GAME_SESSION_KEY, JSON.stringify({
        launchURL: data.launchURL,
        sessionId: data.sessionId,
        gameCode: data.gameCode,
        providerCode: data.providerCode,
        gameName: data.gameName || '',
        balance: data.balance != null ? data.balance : null,
      }));
    }
  } catch (_) {}
}

function clearStoredSession() {
  try {
    sessionStorage.removeItem(GAME_SESSION_KEY);
  } catch (_) {}
}

function GamePlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateGame = location.state || {};
  const { gameCode: stateGameCode, providerCode: stateProviderCode, gameName: stateGameName } = stateGame;

  // sessionStorage me session sirf page refresh pe use hoga (casino se navigate = already cleared)
  const restored = useMemo(() => getStoredSession(), []);

  const [launchURL, setLaunchURL] = useState(restored?.launchURL ?? null);
  const [balance, setBalance] = useState(restored?.balance ?? getLastBalance() ?? null);
  const [gameName, setGameName] = useState(restored?.gameName ?? stateGameName ?? '');
  const [gameCode, setGameCode] = useState(restored?.gameCode ?? stateGameCode ?? null);
  const [providerCode, setProviderCode] = useState(restored?.providerCode ?? stateProviderCode ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasSession = launchURL && gameCode && providerCode;
  const hasStateOrRestored = (stateGameCode && stateProviderCode) || restored;

  const launchCalledRef = useRef(false);
  const bestGamesSliderWrapperRef = useRef(null);
  const popularGamesSliderWrapperRef = useRef(null);
  const topSlotsSliderWrapperRef = useRef(null);
  const gameplayIframeWrapRef = useRef(null);
  const sliderDragRef = useRef({ isDragging: false, startX: 0, startScrollLeft: 0, wrapperEl: null });
  const justDraggedRef = useRef(false);

  const bestGamesDisplayItems = useMemo(() => [
    ...BEST_GAMES_ITEMS.map((item) => ({ ...item, viewAll: false })),
    { viewAll: true, to: '/casino' },
  ], []);

  const topSlotsDisplayItems = useMemo(() => [
    ...TOP_SLOTS_ITEMS.map((item) => ({ ...item, viewAll: false })),
    { viewAll: true, to: '/casino' },
  ], []);

  const [popularGamesItems, setPopularGamesItems] = useState([]);
  const popularGamesDisplayItems = useMemo(() => {
    if (!popularGamesItems.length) return [{ viewAll: true, to: '/casino' }];
    return [
      ...popularGamesItems.map((item) => ({ ...item, viewAll: false })),
      { viewAll: true, to: '/casino' },
    ];
  }, [popularGamesItems]);

  const handleSliderClickCapture = (e) => {
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      justDraggedRef.current = false;
    }
  };

  const handleSliderMouseDown = (e, wrapperRef) => {
    const el = wrapperRef?.current;
    if (e.button !== 0 || !el) return;
    e.preventDefault();
    sliderDragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      wrapperEl: el,
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const wrap = gameplayIframeWrapRef.current;
    if (!wrap) return;
    let scrollTimeout;
    const handleScroll = () => {
      wrap.classList.add('gameplay_iframe_wrap_scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => wrap.classList.remove('gameplay_iframe_wrap_scrolling'), 600);
    };
    wrap.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      wrap.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      const d = sliderDragRef.current;
      if (!d.isDragging || !d.wrapperEl) return;
      const deltaX = e.clientX - d.startX;
      d.wrapperEl.scrollLeft = d.startScrollLeft - deltaX;
    };
    const onMouseUp = () => {
      const d = sliderDragRef.current;
      if (!d.isDragging) return;
      const moved = d.wrapperEl ? Math.abs(d.wrapperEl.scrollLeft - d.startScrollLeft) > 5 : false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      sliderDragRef.current = { ...d, isDragging: false, wrapperEl: null };
      if (moved) justDraggedRef.current = true;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    // Page refresh: sessionStorage se restore karo; balance from socket (getLastBalance) or restored
    if (restored?.launchURL) {
      setLaunchURL(restored.launchURL);
      setGameName(restored.gameName || stateGameName || '');
      setGameCode(restored.gameCode);
      setProviderCode(restored.providerCode);
      const initialBalance = getLastBalance() ?? restored.balance ?? null;
      setBalance(initialBalance);
      if (typeof initialBalance === 'number') {
        saveSession({ ...restored, balance: initialBalance });
      }
      return;
    }

    // Casino se navigate: fresh API call (sirf ek baar — ref StrictMode me persist hota hai)
    if (!stateGameCode || !stateProviderCode) return;
    if (launchCalledRef.current) return;
    launchCalledRef.current = true;

    setLoading(true);
    setError(null);
    setGameCode(stateGameCode);
    setProviderCode(stateProviderCode);
    setGameName(stateGameName || '');

    AuthService.bettingGamesLaunch(stateGameCode, stateProviderCode, 'desktop')
      .then((res) => {
        if (res?.success && res?.data?.launchURL) {
          const d = res.data;
          setLaunchURL(d.launchURL);
          setBalance(d.balance != null ? d.balance : null);
          saveSession({
            launchURL: d.launchURL,
            sessionId: d.sessionId,
            gameCode: d.gameCode ?? stateGameCode,
            providerCode: d.providerCode ?? stateProviderCode,
            gameName: stateGameName || d?.game?.name || '',
            balance: d.balance,
          });
        } else {
          setError(res?.message || 'Could not launch game');
        }
      })
      .catch((err) => {
        setError(err?.message || 'Failed to launch game');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [stateGameCode, stateProviderCode, stateGameName, restored?.launchURL]);

  // Real-time balance from socket (walletBalanceUpdate fired by UserHeader on balance event)
  useEffect(() => {
    const onBalance = (e) => {
      const bal = e.detail?.balance;
      if (typeof bal === 'number') {
        setBalance(bal);
        const stored = getStoredSession();
        if (stored) saveSession({ ...stored, balance: bal });
      }
    };
    window.addEventListener('walletBalanceUpdate', onBalance);
    return () => window.removeEventListener('walletBalanceUpdate', onBalance);
  }, []);

  const handleBack = () => {
    clearStoredSession();
    navigate('/casino');
  };

  if (!hasStateOrRestored) {
    return (
      <>
        <div className="dashboard_page">
          <div className="gameplay_outer">
            <div className="container">
              <div className="gameplay_placeholder">
                <p>Select a game from Casino to play.</p>
                <button type="button" className="btn btn-primary mt-3" onClick={() => navigate('/casino')}>
                  Go to Casino
                </button>
              </div>
            </div>
          </div>
        </div>
        <MobileMenu />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <div className="dashboard_page">
          <div />
        </div>
        <MobileMenu />
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="dashboard_page">
          <div className="gameplay_outer">
            <div className="container">
              <div className="gameplay_placeholder gameplay_error">
                <p>{error}</p>
                <button type="button" className="btn btn-primary mt-3" onClick={handleBack}>
                  Back to Casino
                </button>
              </div>
            </div>
          </div>
        </div>
        <MobileMenu />
      </>
    );
  }

  return (
    <>
      <div className='container-fluid'>
        <div className='dashboard_page'>
          <div className='gameplay_section_wrapper'>
      <div className="gameplay_page_with_iframe">
        {/* <div className="gameplay_iframe_header">
          <div className="gameplay_iframe_header_inner">
            <button type="button" className="gameplay_back_btn" onClick={handleBack} aria-label="Back to Casino">
              <i className="ri-arrow-left-s-line" /> Back
            </button>
            <span className="gameplay_game_title">{gameName || (providerCode && gameCode ? `${providerCode} - ${gameCode}` : 'Game')}</span>
            {balance != null && (
              <span className="gameplay_balance">Balance: ₹{Number(balance).toFixed(2)}</span>
            )}
          </div>
        </div> */}
        <div ref={gameplayIframeWrapRef} className="gameplay_iframe_wrap">
          {launchURL && (
            <iframe
              title="Game"
              src={launchURL}
              className="gameplay_iframe"
              allowFullScreen
              allow="payment; fullscreen; autoplay"
            />
          )}
        </div>
      </div>

      <div className="top_slot_outer top_slot_outer_casino">
        <div className="container-fluid">
          <div className="top_hd d-flex align-items-center justify-content-between">
            <h2 className="heading_h2">Best Pragmatic Play games</h2>
            <div className="top_hd_right d-flex align-items-center gap-2">
              <Link to="/casino"><button type="button" className="slotbtn">View All</button></Link>
            </div>
          </div>
          <div
            ref={bestGamesSliderWrapperRef}
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, bestGamesSliderWrapperRef)}
            onClickCapture={handleSliderClickCapture}
            style={{ cursor: 'grab' }}
          >
            <div className="game_items_slider mt-2">
              {bestGamesDisplayItems.map((item, index) =>
                item.viewAll ? (
                  <Link key="view-all" to={item.to} className="game_items_inner slider_view_all_card link_plain_block" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <span className="slider_view_all_text">View All</span>
                  </Link>
                ) : (
                  <Link key={item.id} to="/casino" className="game_items_inner link_plain_block" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <div className="playbtn"><img loading="lazy" alt="game" src="images/playbtn.png" /></div>
                    {item.badge && <div className="top_ads">{item.badge}</div>}
                    <img loading="lazy" alt="game" src={item.image} />
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>


      <div className="top_slot_outer most_popular_games_outer_casino">
        <div className="container-fluid">
          <div className="top_hd d-flex align-items-center justify-content-between">
            <h2 className="heading_h2">Most popular games</h2>
            <div className="top_hd_right d-flex align-items-center gap-2">
              <Link to="/casino"><button type="button" className="slotbtn">View All</button></Link>
            </div>
          </div>
          <div
            ref={topSlotsSliderWrapperRef}
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, topSlotsSliderWrapperRef)}
            onClickCapture={handleSliderClickCapture}
            style={{ cursor: 'grab' }}
          >
            <div className="game_items_slider mt-2">
              {topSlotsDisplayItems.map((item) =>
                item.viewAll ? (
                  <Link key="view-all-slots" to={item.to} className="game_items_inner slider_view_all_card link_plain_block" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <span className="slider_view_all_text">View All</span>
                  </Link>
                ) : (
                  <Link key={item.id} to="/casino" className="game_items_inner link_plain_block" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <div className="playbtn"><img loading="lazy" alt="game" src="images/playbtn.png" /></div>
                    {item.badge && <div className="top_ads">{item.badge}</div>}
                    <img loading="lazy" alt="game" src={item.image} />
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      </div>
      </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default GamePlay;

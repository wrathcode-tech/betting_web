import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './GamePlay.css';
import MobileMenu from '../customComponents/MobileMenu';
import AuthService from '../api/services/AuthService';
import { useBalance } from '../context/BalanceContext';
import { useAuth } from '../context/AuthContext';
import { getLastBalance, getLastDemoPlayBalance } from '../socket/balanceSocket';

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
        providerName: data.providerName || '',
        gameName: data.gameName || '',
        balance: data.balance != null ? data.balance : null,
        demoPlayBalance: data.demoPlayBalance != null ? data.demoPlayBalance : null,
      }));
    }
  } catch (_) {}
}

function clearStoredSession() {
  try {
    sessionStorage.removeItem(GAME_SESSION_KEY);
  } catch (_) {}
}

/** Normalize launch API body (different backends use success/status and nested data). */
function extractLaunchPayload(res) {
  if (!res || typeof res !== 'object') return null;
  if (res.success === false || res.status === 'error') return null;
  const d = res.data ?? res.response?.data ?? res.result ?? res;
  if (!d || typeof d !== 'object') return null;
  const launchURL =
    d.launchURL ||
    d.launchUrl ||
    d.url ||
    d.gameUrl ||
    d.gameURL ||
    d.iframeUrl ||
    (typeof d === 'string' ? d : null);
  if (!launchURL || typeof launchURL !== 'string') return null;
  return {
    launchURL,
    sessionId: d.sessionId ?? d.session_id,
    gameCode: d.gameCode ?? d.code,
    providerCode: d.providerCode ?? d.provider,
    balance: d.balance,
    demoPlayBalance: d.demoPlayBalance ?? d.demo_play_balance ?? res?.demoPlayBalance ?? res?.data?.demoPlayBalance,
    game: d.game,
  };
}

function GamePlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateGame = location.state || {};
  const { gameCode: stateGameCode, providerCode: stateProviderCode, gameName: stateGameName, providerName: stateProviderName } = stateGame;

  // sessionStorage me session sirf page refresh pe use hoga (casino se navigate = already cleared)
  const restored = useMemo(() => getStoredSession(), []);
  const { balance, setBalance, setDemoPlayBalance } = useBalance();
  const { isDemo } = useAuth();

  const [launchURL, setLaunchURL] = useState(restored?.launchURL ?? null);
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

  const [featuredGames, setFeaturedGames] = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  const providerForList = providerCode || stateProviderCode;
  const providerDisplayName = stateProviderName || restored?.providerName || providerForList || '';

  const bestGamesDisplayItems = useMemo(() => {
    if (!featuredGames.length) return [{ viewAll: true, to: providerForList ? `/casino?provider=${encodeURIComponent(providerForList)}` : '/casino' }];
    return [
      ...featuredGames.map((g) => ({ ...g, viewAll: false })),
      { viewAll: true, to: providerForList ? `/casino?provider=${encodeURIComponent(providerForList)}` : '/casino' },
    ];
  }, [featuredGames, providerForList]);

  const topSlotsDisplayItems = useMemo(() => {
    if (!popularGames.length) return [{ viewAll: true, to: providerForList ? `/casino?provider=${encodeURIComponent(providerForList)}` : '/casino' }];
    return [
      ...popularGames.map((g) => ({ ...g, viewAll: false })),
      { viewAll: true, to: providerForList ? `/casino?provider=${encodeURIComponent(providerForList)}` : '/casino' },
    ];
  }, [popularGames, providerForList]);

  useEffect(() => {
    let cancelled = false;
    setGamesLoading(true);
    const toList = (res) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.games)) return res.games;
      if (Array.isArray(res.response?.games)) return res.response.games;
      if (Array.isArray(res.response?.data)) return res.response.data;
      const d = res.data?.data ?? res.data?.games ?? res.data?.list ?? res.data;
      return Array.isArray(d) ? d : [];
    };

    if (providerForList) {
      Promise.all([
        AuthService.bettingGamesList(providerForList, 'all', 1, 20),
        AuthService.bettingGamesList(providerForList, 'all', 2, 20),
      ])
        .then(([page1Res, page2Res]) => {
          if (cancelled) return;
          const list1 = toList(page1Res);
          const list2 = toList(page2Res);
          setFeaturedGames(list1);
          setPopularGames(list2.length > 0 ? list2 : list1);
        })
        .catch(() => {
          if (!cancelled) {
            setFeaturedGames([]);
            setPopularGames([]);
          }
        })
        .finally(() => {
          if (!cancelled) setGamesLoading(false);
        });
    } else {
      Promise.all([
        AuthService.bettingGamesFeatured(20),
        AuthService.bettingGamesPopular(20),
      ])
        .then(([featuredRes, popularRes]) => {
          if (cancelled) return;
          setFeaturedGames(toList(featuredRes));
          setPopularGames(toList(popularRes));
        })
        .catch(() => {
          if (!cancelled) {
            setFeaturedGames([]);
            setPopularGames([]);
          }
        })
        .finally(() => {
          if (!cancelled) setGamesLoading(false);
        });
    }
    return () => { cancelled = true; };
  }, [providerForList]);

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
    // Page refresh: sessionStorage se restore karo; balance from context (already synced by BalanceProvider)
    if (restored?.launchURL) {
      setLaunchURL(restored.launchURL);
      setGameName(restored.gameName || stateGameName || '');
      setGameCode(restored.gameCode);
      setProviderCode(restored.providerCode);
      if (isDemo) {
        setBalance(0);
        const dpb = restored.demoPlayBalance ?? getLastDemoPlayBalance();
        if (dpb != null && Number.isFinite(Number(dpb))) setDemoPlayBalance(Number(dpb));
      } else {
        const initialBalance = getLastBalance() ?? restored.balance ?? null;
        if (typeof initialBalance === 'number') {
          setBalance(initialBalance);
          saveSession({ ...restored, balance: initialBalance });
        }
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

    const platform = typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop';
    AuthService.bettingGamesLaunch(stateGameCode, stateProviderCode, platform)
      .then((res) => {
        const payload = extractLaunchPayload(res);
        const explicitFail =
          res?.success === false ||
          res?.status === 'error' ||
          res?.status === 'failed' ||
          res?.code === 'ERROR';
        if (explicitFail) {
          setError(res?.message || res?.msg || 'Could not launch game');
          return;
        }
        if (payload?.launchURL) {
          setLaunchURL(payload.launchURL);
          if (isDemo) {
            setBalance(0);
            if (payload.demoPlayBalance != null) setDemoPlayBalance(Number(payload.demoPlayBalance));
          } else if (payload.balance != null) {
            setBalance(payload.balance);
          }
          saveSession({
            launchURL: payload.launchURL,
            sessionId: payload.sessionId,
            gameCode: payload.gameCode ?? stateGameCode,
            providerCode: payload.providerCode ?? stateProviderCode,
            providerName: stateProviderName || '',
            gameName: stateGameName || payload?.game?.name || '',
            balance: isDemo ? 0 : payload.balance,
            demoPlayBalance: isDemo ? payload.demoPlayBalance : null,
          });
        } else {
          setError(res?.message || res?.msg || 'Could not launch game — invalid response from server');
        }
      })
      .catch((err) => {
        setError(err?.message || 'Failed to launch game');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [stateGameCode, stateProviderCode, stateGameName, stateProviderName, restored?.launchURL, restored?.demoPlayBalance, isDemo, setBalance, setDemoPlayBalance]);

  // Persist context balance to session when it changes (e.g. socket update)
  useEffect(() => {
    const stored = getStoredSession();
    if (stored && balance != null) saveSession({ ...stored, balance });
  }, [balance]);

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
          {loading && !launchURL ? (
            <div className="gameplay_iframe_loading" role="status" aria-live="polite">
              <p>Loading game…</p>
            </div>
          ) : null}
          {launchURL ? (
            <iframe
              title="Game"
              src={launchURL}
              className="gameplay_iframe"
              allowFullScreen
              allow="payment; fullscreen; autoplay; geolocation; microphone; camera"
            />
          ) : null}
        </div>
      </div>

      <div className="top_slot_outer top_slot_outer_casino">
        <div className="container-fluid">
          <div className="top_hd d-flex align-items-center justify-content-between">
            <h2 className="heading_h2">{providerDisplayName ? `Best ${providerDisplayName} games` : 'Best Pragmatic Play games'}</h2>
            <div className="top_hd_right d-flex align-items-center gap-2">
              <Link to={providerForList ? `/casino?provider=${encodeURIComponent(providerForList)}` : '/casino'}><button type="button" className="slotbtn">View All</button></Link>
            </div>
          </div>
          {gamesLoading ? (
            <div className="game_items_slider_wrapper"><div className="game_items_slider mt-2 text-muted">Loading...</div></div>
          ) : (
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
                    <Link key={item.code || index} to={`/casino?provider=${encodeURIComponent(item.providerCode || 'all')}&category=${encodeURIComponent(item.category?.[0]?.code || item.category?.[0]?.name || 'lobby')}&gameName=${encodeURIComponent(item.name || '')}`} className="game_items_inner link_plain_block" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                      <div className="playbtn"><img loading="lazy" alt="game" src="images/playbtn.png" /></div>
                      {item.badge && <div className="top_ads">{item.badge}</div>}
                      <img loading="lazy" alt="game" src={item.thumb || item.thumbnail || item.image} />
                    </Link>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="top_slot_outer most_popular_games_outer_casino">
        <div className="container-fluid">
          <div className="top_hd d-flex align-items-center justify-content-between">
            <h2 className="heading_h2">{providerDisplayName ? `Most popular ${providerDisplayName} games` : 'Most popular games'}</h2>
            <div className="top_hd_right d-flex align-items-center gap-2">
              <Link to={providerForList ? `/casino?provider=${encodeURIComponent(providerForList)}` : '/casino'}><button type="button" className="slotbtn">View All</button></Link>
            </div>
          </div>
          {gamesLoading ? (
            <div className="game_items_slider_wrapper"><div className="game_items_slider mt-2 text-muted">Loading...</div></div>
          ) : (
            <div
              ref={topSlotsSliderWrapperRef}
              className="game_items_slider_wrapper"
              onMouseDown={(e) => handleSliderMouseDown(e, topSlotsSliderWrapperRef)}
              onClickCapture={handleSliderClickCapture}
              style={{ cursor: 'grab' }}
            >
              <div className="game_items_slider mt-2">
                {topSlotsDisplayItems.map((item, index) =>
                  item.viewAll ? (
                    <Link key="view-all-slots" to={item.to} className="game_items_inner slider_view_all_card link_plain_block" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                    <Link key={item.code || index} to={`/casino?provider=${encodeURIComponent(item.providerCode || 'all')}&category=${encodeURIComponent(item.category?.[0]?.code || item.category?.[0]?.name || 'lobby')}&gameName=${encodeURIComponent(item.name || '')}`} className="game_items_inner link_plain_block" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                      <div className="playbtn"><img loading="lazy" alt="game" src="images/playbtn.png" /></div>
                      {item.badge && <div className="top_ads">{item.badge}</div>}
                      <img loading="lazy" alt="game" src={item.thumb || item.thumbnail || item.image} />
                    </Link>
                  )
                )}
              </div>
            </div>
          )}
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

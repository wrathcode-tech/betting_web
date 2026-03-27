import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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

/** Only restore iframe from sessionStorage when it matches the game in the URL (avoid "URL says X but Aviator plays"). */
function storedSessionMatchesUrl(session, gameCode, providerCode) {
  if (!session?.gameCode || !session?.providerCode || !gameCode || !providerCode) return false;
  return (
    String(session.gameCode).toLowerCase() === String(gameCode).toLowerCase() &&
    String(session.providerCode).toLowerCase() === String(providerCode).toLowerCase()
  );
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

function qp(searchParams, key) {
  const v = searchParams.get(key);
  return v != null && String(v).trim() !== '' ? String(v).trim() : undefined;
}

/** Same as home: /game when codes exist, else casino lobby hint. */
function buildGameTileTo(item, fallbackProvider) {
  if (!item || item.viewAll) return '/casino';
  const gameCode = item.gameCode ?? item.code;
  const providerCode = item.providerCode ?? fallbackProvider;
  if (gameCode != null && String(gameCode).trim() !== '' && providerCode != null && String(providerCode).trim() !== '') {
    const q = new URLSearchParams({
      gameCode: String(gameCode).trim(),
      providerCode: String(providerCode).trim(),
    });
    if (item.name) q.set('gameName', String(item.name));
    return `/game?${q.toString()}`;
  }
  const cat = item.category?.[0]?.code || item.category?.[0]?.name || 'lobby';
  const prov = item.providerCode || fallbackProvider || 'all';
  return `/casino?provider=${encodeURIComponent(prov)}&category=${encodeURIComponent(cat)}&gameName=${encodeURIComponent(item.name || '')}`;
}

function GamePlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stateGame = location.state || {};
  /** Query string survives /login redirect; location.state does not. */
  const stateGameCode = stateGame.gameCode ?? qp(searchParams, 'gameCode');
  const stateProviderCode = stateGame.providerCode ?? qp(searchParams, 'providerCode');
  const stateGameName = stateGame.gameName ?? qp(searchParams, 'gameName');
  const stateProviderName = stateGame.providerName ?? qp(searchParams, 'providerName');

  const restored = useMemo(() => getStoredSession(), []);
  const { balance, setBalance, setDemoPlayBalance } = useBalance();
  const { isDemo } = useAuth();

  const [launchURL, setLaunchURL] = useState(() => {
    const r = getStoredSession();
    if (!r?.launchURL || typeof window === 'undefined') return r?.launchURL ?? null;
    const params = new URLSearchParams(window.location.search);
    const gc = params.get('gameCode');
    const pc = params.get('providerCode');
    if (gc && pc && storedSessionMatchesUrl(r, gc, pc)) return r.launchURL;
    if (!gc || !pc) return r.launchURL;
    return null;
  });
  const [, setGameName] = useState(() => {
    const r = getStoredSession();
    if (typeof window === 'undefined') return stateGameName ?? r?.gameName ?? '';
    const params = new URLSearchParams(window.location.search);
    const gc = params.get('gameCode');
    const pc = params.get('providerCode');
    if (gc && pc && r && storedSessionMatchesUrl(r, gc, pc)) return r.gameName || stateGameName || '';
    return stateGameName ?? r?.gameName ?? '';
  });
  const [, setGameCode] = useState(() => stateGameCode ?? getStoredSession()?.gameCode ?? null);
  const [providerCode, setProviderCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const pc = new URLSearchParams(window.location.search).get('providerCode');
      if (pc) return pc;
    }
    return getStoredSession()?.providerCode ?? stateProviderCode ?? null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasStateOrRestored = !!(stateGameCode && stateProviderCode) || !!restored;

  const launchCalledRef = useRef(false);
  const bestGamesSliderWrapperRef = useRef(null);
  const trendingSliderWrapperRef = useRef(null);
  /** Same ref — avoids ReferenceError if a stale dev HMR chunk still uses this name. */
  const topSlotsSliderWrapperRef = trendingSliderWrapperRef;
  const gameplayIframeWrapRef = useRef(null);
  const sliderDragRef = useRef({ isDragging: false, startX: 0, startScrollLeft: 0, wrapperEl: null });
  const justDraggedRef = useRef(false);

  const [featuredGames, setFeaturedGames] = useState([]);
  const [trendingGames, setTrendingGames] = useState([]);
  /** Alias for `trendingGames` — stale fast-refresh patches sometimes still reference this name. */
  const popularGames = trendingGames;
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

  const trendingDisplayItems = useMemo(() => {
    if (!trendingGames.length) return [{ viewAll: true, to: '/casino' }];
    return [
      ...trendingGames.map((g) => ({ ...g, viewAll: false })),
      { viewAll: true, to: '/casino' },
    ];
  }, [trendingGames]);

  const topSlotsDisplayItems = trendingDisplayItems;

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

    const parseTrending = (landingRes) => {
      const data =
        landingRes?.data && typeof landingRes.data === 'object' ? landingRes.data : landingRes || {};
      return Array.isArray(data.trending) ? data.trending : [];
    };

    if (providerForList) {
      Promise.all([
        AuthService.bettingGamesList(providerForList, 'all', 1, 20),
        AuthService.bettingGamesLanding(),
      ])
        .then(([page1Res, landingRes]) => {
          if (cancelled) return;
          setFeaturedGames(toList(page1Res));
          setTrendingGames(parseTrending(landingRes));
        })
        .catch(() => {
          if (!cancelled) {
            setFeaturedGames([]);
            setTrendingGames([]);
          }
        })
        .finally(() => {
          if (!cancelled) setGamesLoading(false);
        });
    } else {
      Promise.all([
        AuthService.bettingGamesFeatured(20),
        AuthService.bettingGamesLanding(),
      ])
        .then(([featuredRes, landingRes]) => {
          if (cancelled) return;
          setFeaturedGames(toList(featuredRes));
          setTrendingGames(parseTrending(landingRes));
        })
        .catch(() => {
          if (!cancelled) {
            setFeaturedGames([]);
            setTrendingGames([]);
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
    launchCalledRef.current = false;
  }, [stateGameCode, stateProviderCode]);

  useEffect(() => {
    if (!stateGameCode || !stateProviderCode) return;

    const session = getStoredSession();
    const canRestore = session?.launchURL && storedSessionMatchesUrl(session, stateGameCode, stateProviderCode);

    if (canRestore) {
      setLaunchURL(session.launchURL);
      setGameName(session.gameName || stateGameName || '');
      setGameCode(session.gameCode);
      setProviderCode(session.providerCode);
      setLoading(false);
      setError(null);
      if (isDemo) {
        setBalance(0);
        const dpb = session.demoPlayBalance ?? getLastDemoPlayBalance();
        if (dpb != null && Number.isFinite(Number(dpb))) setDemoPlayBalance(Number(dpb));
      } else {
        const initialBalance = getLastBalance() ?? session.balance ?? null;
        if (typeof initialBalance === 'number') {
          setBalance(initialBalance);
          saveSession({ ...session, balance: initialBalance });
        }
      }
      return;
    }

    if (session?.launchURL && !storedSessionMatchesUrl(session, stateGameCode, stateProviderCode)) {
      clearStoredSession();
      setLaunchURL(null);
    }

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
  }, [stateGameCode, stateProviderCode, stateGameName, stateProviderName, isDemo, setBalance, setDemoPlayBalance]);

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
                    <Link key={item.code || index} to={buildGameTileTo(item)} className="game_items_inner link_plain_block" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
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
            <h2 className="heading_h2">Trending games</h2>
            <div className="top_hd_right d-flex align-items-center gap-2">
              <Link to="/casino"><button type="button" className="slotbtn">View All</button></Link>
            </div>
          </div>
          {gamesLoading ? (
            <div className="game_items_slider_wrapper"><div className="game_items_slider mt-2 text-muted">Loading...</div></div>
          ) : (
            <div
              ref={trendingSliderWrapperRef}
              className="game_items_slider_wrapper"
              onMouseDown={(e) => handleSliderMouseDown(e, trendingSliderWrapperRef)}
              onClickCapture={handleSliderClickCapture}
              style={{ cursor: 'grab' }}
            >
              <div className="game_items_slider mt-2">
                {trendingDisplayItems.map((item, index) =>
                  item.viewAll ? (
                    <Link key="view-all-trending" to={item.to} className="game_items_inner slider_view_all_card link_plain_block" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                    <Link key={item.code || index} to={buildGameTileTo(item)} className="game_items_inner link_plain_block" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
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

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './gamePlay.css';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import AuthService from '../api/services/AuthService';
import { getLastBalance } from '../socket/balanceSocket';

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

  const launchCalledRef = React.useRef(false);

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
        <Header />
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
        <Header />
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
        <Header />
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
      <Header />
      <div className="gameplay_page_with_iframe">
        <div className="gameplay_iframe_header">
          <div className="gameplay_iframe_header_inner">
            <button type="button" className="gameplay_back_btn" onClick={handleBack} aria-label="Back to Casino">
              <i className="ri-arrow-left-s-line" /> Back
            </button>
            <span className="gameplay_game_title">{gameName || (providerCode && gameCode ? `${providerCode} - ${gameCode}` : 'Game')}</span>
            {balance != null && (
              <span className="gameplay_balance">Balance: ₹{Number(balance).toFixed(2)}</span>
            )}
          </div>
        </div>
        <div className="gameplay_iframe_wrap">
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
      <MobileMenu />
    </>
  );
}

export default GamePlay;

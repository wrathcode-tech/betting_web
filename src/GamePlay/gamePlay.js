import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './gamePlay.css';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import AuthService from '../api/services/AuthService';
import { alertErrorMessage } from '../customComponents/CustomAlertMessage';

function GamePlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const { gameCode, providerCode, gameName } = location.state || {};

  const [launchURL, setLaunchURL] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(!!(gameCode && providerCode));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameCode || !providerCode) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    AuthService.bettingGamesLaunch(gameCode, providerCode, 'desktop')
      .then((res) => {
        if (cancelled) return;
        if (res?.success && res?.data?.launchURL) {
          setLaunchURL(res.data.launchURL);
          setBalance(res.data.balance != null ? res.data.balance : null);
        } else {
          setError(res?.message || 'Could not launch game');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to launch game');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [gameCode, providerCode]);

  const handleBack = () => {
    navigate('/casino');
  };

  if (!gameCode || !providerCode) {
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
        <div className="dashboard_page gameplay_loading_wrap">
          <div className="gameplay_loading">
            <div className="gameplay_spinner" />
            <p>Loading game...</p>
          </div>
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
            <span className="gameplay_game_title">{gameName || `${providerCode} - ${gameCode}`}</span>
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

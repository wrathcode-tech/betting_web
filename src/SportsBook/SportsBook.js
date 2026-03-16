import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../api/services/AuthService';
import { useBalance } from '../context/BalanceContext';
import MobileMenu from '../customComponents/MobileMenu';
import '../GamePlay/GamePlay.css';

function SportsBook() {
  const navigate = useNavigate();
  const { setBalance } = useBalance();
  const [launchURL, setLaunchURL] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const calledRef = useRef(false);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (calledRef.current) return;
    calledRef.current = true;

    AuthService.gamesLaunchSportsbook()
      .then((res) => {
        if (res?.success && res?.data?.launchURL) {
          setLaunchURL(res.data.launchURL);
          if (res.data.balance != null) setBalance(res.data.balance);
        } else {
          setError(res?.message || 'Could not launch Sportsbook');
        }
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load Sportsbook');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate, setBalance]);

  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;
  if (!token) return null;

  if (error) {
    return (
      <>
        <div className="dashboard_page">
          <div className="gameplay_outer">
            <div className="container">
              <div className="gameplay_placeholder gameplay_error">
                <p>{error}</p>
                <button type="button" className="btn btn-primary mt-3" onClick={() => navigate('/')}>
                  Back to Home
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
      <div className="container-fluid">
        <div className="dashboard_page">
          <div className="gameplay_section_wrapper">
            <div className="gameplay_page_with_iframe">
              <div className="gameplay_iframe_wrap">
                {loading && !launchURL && (
                  <div className="gameplay_placeholder">
                    <p>Loading Sportsbook…</p>
                  </div>
                )}
                {launchURL && (
                  <iframe
                    title="Sportsbook"
                    src={launchURL}
                    className="gameplay_iframe"
                    allowFullScreen
                    allow="payment; fullscreen; autoplay"
                  />
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

export default SportsBook;

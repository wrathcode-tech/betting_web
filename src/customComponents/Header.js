import React, { useState, useEffect } from 'react'
import AuthHeader from './AuthHeader'
import UserHeader from './UserHeader'

/**
 * Shows AuthHeader (Login/Sign Up) when user is not logged in,
 * and UserHeader (profile, balance, etc.) when logged in.
 * Login state is read from sessionStorage token; updates on login/logout via loginStateChange event.
 */
export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!sessionStorage.getItem('token'));

  useEffect(() => {
    const handleLoginStateChange = () => {
      setIsLoggedIn(!!sessionStorage.getItem('token'));
    };
    window.addEventListener('loginStateChange', handleLoginStateChange);
    return () => window.removeEventListener('loginStateChange', handleLoginStateChange);
  }, []);

  return isLoggedIn ? <UserHeader /> : <AuthHeader />;
}

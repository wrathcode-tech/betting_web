import React, { useState, useEffect } from 'react'
import AuthHeader from './AuthHeader'
import UserHeader from './UserHeader'
import { getToken } from '../utils/authStorage'

/**
 * Shows AuthHeader (Login/Sign Up) when user is not logged in,
 * and UserHeader (profile, balance, etc.) when logged in.
 * Login state is read from localStoragetoken; updates on login/logout via loginStateChange event.
 */
export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getToken());

  useEffect(() => {
    const handleLoginStateChange = () => {
      setIsLoggedIn(!!getToken());
    };
    window.addEventListener('loginStateChange', handleLoginStateChange);
    return () => window.removeEventListener('loginStateChange', handleLoginStateChange);
  }, []);

  return isLoggedIn ? <UserHeader /> : <AuthHeader />;
}

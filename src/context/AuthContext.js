/**
 * Auth context: token + user (including isDemo for view-only mode).
 * - user stored in localStoragewhen logged in (key: 'user').
 * - isDemo === true → view only: allow view matches/odds/dashboard/wallet; block place bet, deposit, withdraw, etc.
 * - Demo expiry: if user.expiresAt is past, logout and redirect to login.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AuthService from '../api/services/AuthService';
import { alertErrorMessage } from '../customComponents/CustomAlertMessage';
import { clearAuth, getStoredUser, getToken, setStoredUser } from '../utils/authStorage';

const AuthContext = createContext({
  user: null,
  isDemo: false,
  setUser: () => {},
  clearUser: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getStoredUser());

  const setUser = useCallback((nextUser) => {
    setUserState(nextUser);
    setStoredUser(nextUser);
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
    setStoredUser(null);
  }, []);

  useEffect(() => {
    const onLoginChange = () => {
      const token = getToken();
      if (!token) {
        clearUser();
        return;
      }
      const stored = getStoredUser();
      if (stored) setUserState(stored);
    };
    window.addEventListener('loginStateChange', onLoginChange);
    return () => window.removeEventListener('loginStateChange', onLoginChange);
  }, [clearUser]);

  // When token exists but no user (e.g. normal login), fetch getMe and set user (isDemo: false)
  const token = typeof window !== 'undefined' ? getToken() : null;
  useEffect(() => {
    if (!token || user != null) return;
    let cancelled = false;
    AuthService.bettingGetMe()
      .then((res) => {
        if (cancelled) return;
        const raw = res?.data ?? res;
        const u = raw?.user ?? raw;
        if (u && typeof u === 'object') {
          const profile = {
            id: u.id ?? u._id,
            username: u.username ?? u.mobile ?? u.fullName ?? u.full_name ?? 'User',
            balance: u.balance ?? 0,
            currency: u.currency ?? 'INR',
            isDemo: false,
            ...u,
          };
          setUserState(profile);
          setStoredUser(profile);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, user]);

  const isDemo = user?.isDemo === true;

  // Demo expiry: if user.expiresAt is past, logout and redirect
  const expiryCheckIntervalRef = useRef(null);
  useEffect(() => {
    if (!user?.expiresAt) return;
    const expiresAt = user.expiresAt;
    const expiresMs = typeof expiresAt === 'number' ? expiresAt : new Date(expiresAt).getTime();
    if (!Number.isFinite(expiresMs)) return;

    const check = () => {
      if (Date.now() >= expiresMs) {
        if (expiryCheckIntervalRef.current) clearInterval(expiryCheckIntervalRef.current);
        alertErrorMessage('Demo session expired. Please login again.');
        clearAuth();
        setUserState(null);
        window.dispatchEvent(new CustomEvent('loginStateChange'));
        window.location.href = '/login';
      }
    };
    check();
    expiryCheckIntervalRef.current = setInterval(check, 60000); // every 1 min
    return () => {
      if (expiryCheckIntervalRef.current) clearInterval(expiryCheckIntervalRef.current);
    };
  }, [user?.expiresAt]);

  return (
    <AuthContext.Provider value={{ user, isDemo, setUser, clearUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      isDemo: false,
      setUser: () => {},
      clearUser: () => {},
    };
  }
  return ctx;
}

export { isDemoUser } from '../utils/authUtils';

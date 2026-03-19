/**
 * Centralized auth storage: token, refreshToken, user.
 * Writes to both sessionStorage and localStorage so login state
 * is available regardless of which storage the app reads from.
 * Use getToken() / setToken() / clearAuth() everywhere instead of direct storage.
 */

const TOKEN_KEY = 'token';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

function safeGet(storage, key) {
  try {
    return storage && storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    if (storage) {
      if (value == null) storage.removeItem(key);
      else storage.setItem(key, value);
    }
  } catch (_) {}
}

export function getToken() {
  if (typeof sessionStorage === 'undefined' && typeof localStorage === 'undefined') return null;
  return safeGet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, TOKEN_KEY)
    || safeGet(typeof localStorage !== 'undefined' ? localStorage : null, TOKEN_KEY);
}

export function setToken(token) {
  if (token == null) return;
  const s = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  const l = typeof localStorage !== 'undefined' ? localStorage : null;
  if (s) safeSet(s, TOKEN_KEY, token);
  if (l) safeSet(l, TOKEN_KEY, token);
}

export function getRefreshToken() {
  if (typeof sessionStorage === 'undefined' && typeof localStorage === 'undefined') return null;
  return safeGet(typeof sessionStorage !== 'undefined' ? sessionStorage : null, REFRESH_KEY)
    || safeGet(typeof localStorage !== 'undefined' ? localStorage : null, REFRESH_KEY);
}

export function setRefreshToken(value) {
  if (value == null) return;
  const s = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  const l = typeof localStorage !== 'undefined' ? localStorage : null;
  if (s) safeSet(s, REFRESH_KEY, value);
  if (l) safeSet(l, REFRESH_KEY, value);
}

export function getStoredUser() {
  try {
    const s = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    const raw = s ? s.getItem(USER_KEY) : null;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    const s = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    if (!s) return;
    if (user == null) s.removeItem(USER_KEY);
    else s.setItem(USER_KEY, JSON.stringify(user));
  } catch (_) {}
}

/** Clear token, refreshToken, user from both storages. Call on logout and 401. */
export function clearAuth() {
  const s = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  const l = typeof localStorage !== 'undefined' ? localStorage : null;
  [TOKEN_KEY, REFRESH_KEY, USER_KEY].forEach((key) => {
    if (s) safeSet(s, key, null);
    if (l) safeSet(l, key, null);
  });
}

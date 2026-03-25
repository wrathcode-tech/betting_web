/**
 * Default namespace socket – wallet balance updates (per backend doc).
 *
 * URL: io(BASE_URL, { auth: { token: 'Bearer '+accessToken } }).
 * Listen: 'balance' → { balance: number, userId }.
 *
 * This is a separate connection from /sportsbook; use both when logged in.
 */
import { io } from 'socket.io-client';

const getBaseUrl = () => {
  const url = process.env.REACT_APP_BETTING_API_URL || process.env.VITE_API_URL || 'https://gamingbackend.wrathcode.com';
  return url.replace(/\/$/, '');
};

const SOCKET_CONFIG = {
  path: '/socket.io',
  transports: ['websocket'],
  upgrade: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
};

let socket = null;
let lastBalance = null;
/** Last demo casino play balance (demo users only). */
let lastDemoPlayBalance = null;
const balanceListeners = new Set();

function ensureHandlers() {
  if (!socket) return;
  socket.off('balance');
  socket.off('disconnect');
  socket.off('connect_error');

  socket.on('balance', (payload) => {
    if (payload?.balance != null) lastBalance = payload.balance;
    const dpb = payload?.demoPlayBalance ?? payload?.demo_play_balance;
    if (dpb != null) lastDemoPlayBalance = Number(dpb);
    balanceListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('balanceSocket balance listener error:', e);
      }
    });
  });

  socket.on('disconnect', () => {
    lastBalance = null;
    lastDemoPlayBalance = null;
  });

  socket.on('connect_error', (err) => {
    console.error('Balance socket error:', err?.message);
  });
}

export function connectBalanceSocket(token) {
  if (!token) {
    disconnectBalanceSocket();
    return null;
  }

  const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  const baseUrl = getBaseUrl();

  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token: authToken };
    socket.connect();
    ensureHandlers();
    return socket;
  }

  socket = io(baseUrl, {
    ...SOCKET_CONFIG,
    auth: { token: authToken },
  });

  ensureHandlers();
  return socket;
}

export function disconnectBalanceSocket() {
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }
  lastBalance = null;
  balanceListeners.clear();
}

export function getLastBalance() {
  return lastBalance;
}

export function getLastDemoPlayBalance() {
  return lastDemoPlayBalance;
}

export function getBalanceSocket() {
  return socket;
}

export function addBalanceListener(fn) {
  if (typeof fn === 'function') balanceListeners.add(fn);
}

export function removeBalanceListener(fn) {
  balanceListeners.delete(fn);
}

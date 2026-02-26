/**
 * Balance Socket (Socket.IO) – single connection, real-time wallet balance after login.
 * Connect after login; receive balance on connect and on every Debit/Credit webhook.
 * Reconnects automatically when connection is lost.
 */
import { io } from 'socket.io-client';

const getBackendUrl = () =>
  // process.env.REACT_APP_BETTING_API_URL || 'http://localhost:5008';
  // 'http://localhost:5008';
  'https://gamingbackend.wrathcode.com';
/** Socket.IO client options (rejectUnauthorized is Node-only; no effect in browser) */
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
/** Single callback – updated on each connectBalanceSocket(token, onBalance) call */
let balanceCallback = null;

function ensureHandlers() {
  if (!socket) return;

  socket.off('connect');
  socket.off('balance');
  socket.off('disconnect');
  socket.off('connect_error');
  socket.off('reconnect');

  socket.on('connect', () => {
    console.log('Balance socket connected');
  });

  socket.on('balance', (payload) => {
    const balance = payload?.balance;
    if (typeof balance === 'number') {
      lastBalance = balance;
      if (typeof balanceCallback === 'function') {
        balanceCallback(balance, payload?.userId);
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Balance socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('Balance socket error:', err?.message);
  });

  socket.on('reconnect', () => {
    console.log('Balance socket reconnected');
  });
}

export function connectBalanceSocket(token, onBalance) {
  if (!token) {
    disconnectBalanceSocket();
    return null;
  }

  balanceCallback = typeof onBalance === 'function' ? onBalance : null;
  const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  // Reuse existing connected socket – only update callback
  if (socket?.connected) {
    if (balanceCallback != null && lastBalance != null) {
      balanceCallback(lastBalance, null);
    }
    return socket;
  }

  // Reuse existing socket instance but reconnect (e.g. after network drop)
  if (socket) {
    socket.auth = { token: authToken };
    socket.connect();
    ensureHandlers();
    return socket;
  }

  // Create single new connection
  socket = io(getBackendUrl(), {
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
  balanceCallback = null;
  lastBalance = null;
}

export function getBalanceSocket() {
  return socket;
}

/** Last balance received from socket (for initial display on Game page etc.) */
export function getLastBalance() {
  return lastBalance;
}

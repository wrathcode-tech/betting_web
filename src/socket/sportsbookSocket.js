/**
 * Sportsbook Socket – per backend API doc.
 *
 * Base: wss://YOUR_API_HOST/sportsbook (namespace). Auth: JWT access token
 * via auth: { token: accessToken } or query: { token: accessToken }.
 *
 * EMIT (client → server):
 *   subscribe:matches   { sport: 'cricket' | 'soccer' | 'tennis' }  – open match list
 *   unsubscribe:matches { sport }                                   – leave list
 *   subscribe:odds      { gameId: string }                          – open match (live odds)
 *   unsubscribe:odds    { gameId }                                  – leave match (recommended)
 *
 * LISTEN (server → client):
 *   matches   { sport, data: Match[], timestamp }  – snapshot + ~every 2s
 *   odds      { gameId, data: { matchOdds?, bookMakerOdds?, fancyOdds?, ..., liveScore }, timestamp }  – ~500ms. Use payload.data.liveScore only for live score.
 *   betUpdate { betId, status: 'open'|'settled'|'cancelled'|'cashed_out', balanceAfter?, bet?, profitLoss?, cashoutAmount?, ... }
 *   balance   { balance: number, userId }  – after place/cancel/cashout/settle/void; refresh wallet in UI
 */
import { io } from 'socket.io-client';

const getSportsbookBaseUrl = () =>
  process.env.REACT_APP_BETTING_API_URL || 'https://gamingbackend.wrathcode.com';

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
const matchesListeners = new Set();
const oddsListeners = new Set();
const betUpdateListeners = new Set();
const balanceListeners = new Set();
const subscribedSports = new Set();
const subscribedGameIds = new Set();

function reemitSubscriptions() {
  if (!socket?.connected) return;
  subscribedSports.forEach((sport) => {
    socket.emit('subscribe:matches', { sport });
  });
  subscribedGameIds.forEach((gameId) => {
    socket.emit('subscribe:odds', { gameId: String(gameId) });
  });
}

function ensureHandlers() {
  if (!socket) return;

  socket.off('matches');
  socket.off('odds');
  socket.off('betUpdate');
  socket.off('balance');
  socket.off('connect');
  socket.off('disconnect');
  socket.off('connect_error');
  socket.off('reconnect');

  socket.on('matches', (payload) => {
    matchesListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('sportsbookSocket matches listener error:', e);
      }
    });
  });

  socket.on('odds', (payload) => {
    oddsListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('sportsbookSocket odds listener error:', e);
      }
    });
  });

  socket.on('betUpdate', (payload) => {
    betUpdateListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('sportsbookSocket betUpdate listener error:', e);
      }
    });
  });

  socket.on('balance', (payload) => {
    balanceListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('sportsbookSocket balance listener error:', e);
      }
    });
  });

  socket.on('connect', () => {
    console.log('Sportsbook socket connected');
    reemitSubscriptions();
  });

  socket.on('disconnect', (reason) => {
    console.log('Sportsbook socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('Sportsbook socket error:', err?.message);
  });

  socket.on('reconnect', () => {
    console.log('Sportsbook socket reconnected');
    reemitSubscriptions();
  });
}

export function connectSportsbookSocket(token) {
  if (!token) {
    disconnectSportsbookSocket();
    return null;
  }

  const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  const baseUrl = getSportsbookBaseUrl().replace(/\/$/, '');
  const namespaceUrl = `${baseUrl}/sportsbook`;

  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token: authToken };
    socket.connect();
    ensureHandlers();
    return socket;
  }

  // Auth: same JWT as REST. Backend accepts auth: { token } or query: { token }.
  socket = io(namespaceUrl, {
    ...SOCKET_CONFIG,
    auth: { token: authToken },
    // query: { token: authToken },  // alternative if server expects query
  });

  ensureHandlers();
  return socket;
}

export function disconnectSportsbookSocket() {
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }
  subscribedSports.clear();
  subscribedGameIds.clear();
  matchesListeners.clear();
  oddsListeners.clear();
  betUpdateListeners.clear();
  balanceListeners.clear();
}

export function getSportsbookSocket() {
  return socket;
}

export function subscribeMatches(sport) {
  if (!sport) return;
  subscribedSports.add(sport);
  if (socket?.connected) {
    socket.emit('subscribe:matches', { sport });
  }
}

export function unsubscribeMatches(sport) {
  if (!sport) return;
  subscribedSports.delete(sport);
  if (socket?.connected) {
    socket.emit('unsubscribe:matches', { sport });
  }
}

export function subscribeOdds(gameId) {
  if (!gameId) return;
  const id = String(gameId);
  subscribedGameIds.add(id);
  if (socket?.connected) {
    socket.emit('subscribe:odds', { gameId: id });
  }
}

export function unsubscribeOdds(gameId) {
  if (!gameId) return;
  const id = String(gameId);
  subscribedGameIds.delete(id);
  if (socket?.connected) {
    socket.emit('unsubscribe:odds', { gameId: id });
  }
}

export function addMatchesListener(fn) {
  if (typeof fn === 'function') matchesListeners.add(fn);
}

export function removeMatchesListener(fn) {
  matchesListeners.delete(fn);
}

export function addOddsListener(fn) {
  if (typeof fn === 'function') oddsListeners.add(fn);
}

export function removeOddsListener(fn) {
  oddsListeners.delete(fn);
}

export function addBetUpdateListener(fn) {
  if (typeof fn === 'function') betUpdateListeners.add(fn);
}

export function removeBetUpdateListener(fn) {
  betUpdateListeners.delete(fn);
}

export function addBalanceListener(fn) {
  if (typeof fn === 'function') balanceListeners.add(fn);
}

export function removeBalanceListener(fn) {
  balanceListeners.delete(fn);
}

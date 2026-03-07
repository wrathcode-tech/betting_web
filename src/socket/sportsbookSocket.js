/**
 * Sportsbook Socket – single source of truth per backend doc.
 *
 * Base: Socket URL = API base + /sportsbook (namespace). Auth: JWT access token
 * (auth: { token } or query: { token }). Connection rejected without valid token.
 *
 * EMIT (client → server):
 *   subscribe:matches   { sport: 'cricket' | 'soccer' | 'tennis' }  – when user opens sport's match list
 *   unsubscribe:matches { sport }                                   – when leaving that list
 *   subscribe:odds      { gameId: string }                          – when user opens match page
 *   unsubscribe:odds    { gameId }                                 – when leaving match page
 *
 * LISTEN (server → client):
 *   matches   { sport, data: Array<Match>, timestamp }  – snapshot then ~every 2s
 *   odds      { gameId, data: { matchOdds?, bookMakerOdds?, fancyOdds?, premiumFancy? }, timestamp }  – snapshot then ~500ms
 *   betUpdate { betId, status: 'settled'|'cancelled'|'cashed_out', profitLoss?, balanceAfter?, ... }
 *
 * REST only (no socket): place bet, cancel, cashout preview/execute, betfair result.
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

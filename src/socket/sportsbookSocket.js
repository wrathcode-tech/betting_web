/**
 * Sportsbook Socket – per backend API doc.
 *
 * Base: wss://YOUR_API_HOST/sportsbook (namespace). Auth: JWT access token
 * via auth: { token: accessToken } or query: { token: accessToken }.
 *
 * EMIT (client → server):
 *   subscribe:matches     { sport: 'cricket' | 'soccer' | 'tennis' }
 *   unsubscribe:matches   { sport }
 *   subscribe:odds        { gameId: string, sport?: string }  – pass sport for soccer/tennis so live score uses correct API
 *   unsubscribe:odds      { gameId }
 *   subscribe:scoreboard  { gameId: string, sport?: string }
 *   unsubscribe:scoreboard { gameId }
 *
 * LISTEN (server → client):
 *   matches    { sport, data: Match[], timestamp }
 *   odds       { gameId, data: { ...odds, liveScore? }, timestamp }
 *   scoreboard { gameId, data: { inPlay, ... }, timestamp }  – data.inPlay === false when not in-play
 *   betUpdate  { betId, status: 'open'|'settled'|'cancelled'|'cashed_out', balanceAfter?, bet?, ... }
 *   balance    { balance: number, userId }
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
const scoreboardListeners = new Set();
const betUpdateListeners = new Set();
const balanceListeners = new Set();
const errorListeners = new Set();
const subscribedSports = new Set();
/** gameId -> sport (cricket|tennis|soccer) for reemit and correct score API */
const subscribedOddsMap = new Map();
const subscribedScoreboardMap = new Map();

function reemitSubscriptions() {
  if (!socket?.connected) return;
  subscribedSports.forEach((sport) => {
    socket.emit('subscribe:matches', { sport });
  });
  subscribedOddsMap.forEach((sport, id) => {
    const s = sport || 'cricket';
    if (s === 'tennis') {
      socket.emit('subscribe:odds', { eventId: String(id), sport: s });
    } else {
      socket.emit('subscribe:odds', { gameId: String(id), sport: s });
    }
  });
  subscribedScoreboardMap.forEach((sport, id) => {
    const s = sport || 'cricket';
    if (s === 'tennis') {
      socket.emit('subscribe:scoreboard', { eventId: String(id), sport: s });
    } else {
      socket.emit('subscribe:scoreboard', { gameId: String(id), sport: s });
    }
  });
}

function ensureHandlers() {
  if (!socket) return;

  socket.off('matches');
  socket.off('odds');
  socket.off('scoreboard');
  socket.off('betUpdate');
  socket.off('balance');
  socket.off('connect');
  socket.off('disconnect');
  socket.off('connect_error');
  socket.off('reconnect');
  socket.off('error');

  socket.on('error', (err) => {
    errorListeners.forEach((fn) => {
      try {
        fn(err);
      } catch (e) {
        console.error('sportsbookSocket error listener error:', e);
      }
    });
  });

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

  socket.on('scoreboard', (payload) => {
    scoreboardListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('sportsbookSocket scoreboard listener error:', e);
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
    console.error('Sportsbook socket connect_error:', err?.message);
    errorListeners.forEach((fn) => {
      try {
        fn(err);
      } catch (e) {
        console.error('sportsbookSocket error listener error:', e);
      }
    });
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
  subscribedOddsMap.clear();
  subscribedScoreboardMap.clear();
  matchesListeners.clear();
  oddsListeners.clear();
  scoreboardListeners.clear();
  betUpdateListeners.clear();
  balanceListeners.clear();
  errorListeners.clear();
}

export function addErrorListener(fn) {
  if (typeof fn === 'function') errorListeners.add(fn);
}

export function removeErrorListener(fn) {
  errorListeners.delete(fn);
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

export function subscribeOdds(gameIdOrEventId, sport) {
  if (!gameIdOrEventId) return;
  const id = String(gameIdOrEventId);
  const s = sport || 'cricket';
  subscribedOddsMap.set(id, s);
  if (socket?.connected) {
    if (s === 'tennis') {
      socket.emit('subscribe:odds', { eventId: id, sport: s });
    } else {
      socket.emit('subscribe:odds', { gameId: id, sport: s });
    }
  }
}

export function unsubscribeOdds(gameIdOrEventId, sport) {
  if (!gameIdOrEventId) return;
  const id = String(gameIdOrEventId);
  const s = sport || 'cricket';
  subscribedOddsMap.delete(id);
  if (socket?.connected) {
    if (s === 'tennis') {
      socket.emit('unsubscribe:odds', { eventId: id });
    } else {
      socket.emit('unsubscribe:odds', { gameId: id });
    }
  }
}

export function subscribeScoreboard(gameIdOrEventId, sport) {
  if (!gameIdOrEventId) return;
  const id = String(gameIdOrEventId);
  const s = sport || 'cricket';
  subscribedScoreboardMap.set(id, s);
  if (socket?.connected) {
    if (s === 'tennis') {
      socket.emit('subscribe:scoreboard', { eventId: id, sport: s });
    } else {
      socket.emit('subscribe:scoreboard', { gameId: id, sport: s });
    }
  }
}

export function unsubscribeScoreboard(gameIdOrEventId, sport) {
  if (!gameIdOrEventId) return;
  const id = String(gameIdOrEventId);
  const s = sport || 'cricket';
  subscribedScoreboardMap.delete(id);
  if (socket?.connected) {
    if (s === 'tennis') {
      socket.emit('unsubscribe:scoreboard', { eventId: id });
    } else {
      socket.emit('unsubscribe:scoreboard', { gameId: id });
    }
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

export function addScoreboardListener(fn) {
  if (typeof fn === 'function') scoreboardListeners.add(fn);
}

export function removeScoreboardListener(fn) {
  scoreboardListeners.delete(fn);
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

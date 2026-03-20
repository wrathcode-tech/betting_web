/**
 * Sportsbook Socket — singleton manager (Socket.IO).
 *
 * - Single connection per app; auth change forces reconnect.
 * - Reference-counted subscriptions (React Strict Mode / duplicate mounts safe).
 * - Re-subscribes all active streams on connect/reconnect.
 * - Optional payload dedupe (timestamp or JSON) before fan-out to listeners.
 * - Exponential-style backoff via socket.io reconnectionDelay + reconnectionDelayMax.
 *
 * @see sportsbookRealtimeStore for normalized UI state
 */

import { io } from 'socket.io-client';

const getSportsbookBaseUrl = () =>
  process.env.REACT_APP_BETTING_API_URL || 'https://gamingbackend.wrathcode.com';

const SOCKET_CONFIG = {
  path: '/socket.io',
  transports: ['websocket'],
  upgrade: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  timeout: 20000,
  /** Exponential backoff capped by reconnectionDelayMax */
  randomizationFactor: 0.5,
};

let socket = null;

/** @type {Map<string, number>} sport -> refcount */
const matchRefCounts = new Map();
/** @type {Map<string, { count: number, sport: string }>} */
const oddsRefCounts = new Map();
/** @type {Map<string, { count: number, sport: string }>} */
const scoreboardRefCounts = new Map();

const matchesListeners = new Set();
const oddsListeners = new Set();
const scoreboardListeners = new Set();
const betUpdateListeners = new Set();
const balanceListeners = new Set();
const errorListeners = new Set();

const MAX_SUBSCRIPTIONS = 40;

/** Dedupe before notifying listeners (backend may throttle; identical payloads skipped). */
const lastMatchesSig = new Map();
const lastOddsSig = new Map();
const lastScoreboardSig = new Map();

function countActiveSubscriptionSlots() {
  let n = 0;
  matchRefCounts.forEach((c) => {
    if (c > 0) n += 1;
  });
  oddsRefCounts.forEach((v) => {
    if (v.count > 0) n += 1;
  });
  scoreboardRefCounts.forEach((v) => {
    if (v.count > 0) n += 1;
  });
  return n;
}

function payloadSignature(payload, dataKey = 'data') {
  const ts = payload?.timestamp;
  if (ts != null && ts !== '') return `t:${ts}`;
  const d = payload?.[dataKey] ?? payload;
  try {
    return `j:${JSON.stringify(d)}`;
  } catch {
    return `s:${String(d)}`;
  }
}

export function reemitSubscriptions() {
  if (!socket?.connected) return;
  matchRefCounts.forEach((count, sport) => {
    if (count > 0) socket.emit('subscribe:matches', { sport });
  });
  oddsRefCounts.forEach((v, id) => {
    if (v.count > 0) {
      const s = v.sport || 'cricket';
      socket.emit('subscribe:odds', { gameId: String(id), sport: s });
    }
  });
  scoreboardRefCounts.forEach((v, id) => {
    if (v.count > 0) {
      const s = v.sport || 'cricket';
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
    const msg = err?.message || (typeof err === 'string' ? err : '');
    const code = err?.code ?? err?.errorCode;
    if (code === 'RATE_LIMIT' || (msg && String(msg).toUpperCase().includes('RATE_LIMIT'))) {
      console.warn('Sportsbook socket: rate limit', err);
    }
    errorListeners.forEach((fn) => {
      try {
        fn(err);
      } catch (e) {
        console.error('sportsbookSocket error listener error:', e);
      }
    });
  });

  socket.on('matches', (payload) => {
    const sport = payload?.sport;
    if (!sport) return;
    const sig = payloadSignature(payload, 'data');
    if (lastMatchesSig.get(sport) === sig) return;
    lastMatchesSig.set(sport, sig);
    matchesListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('sportsbookSocket matches listener error:', e);
      }
    });
  });

  socket.on('odds', (payload) => {
    const key = payload?.eventId != null ? String(payload.eventId) : payload?.gameId != null ? String(payload.gameId) : null;
    if (!key || payload?.data === undefined) return;
    const sig = payloadSignature(payload, 'data');
    const dedupeKey = key;
    if (lastOddsSig.get(dedupeKey) === sig) return;
    lastOddsSig.set(dedupeKey, sig);
    oddsListeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('sportsbookSocket odds listener error:', e);
      }
    });
  });

  socket.on('scoreboard', (payload) => {
    const key = payload?.eventId != null ? String(payload.eventId) : payload?.gameId != null ? String(payload.gameId) : null;
    if (!key || payload?.data === undefined) return;
    const sig = payloadSignature(payload, 'data');
    if (lastScoreboardSig.get(key) === sig) return;
    lastScoreboardSig.set(key, sig);
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
  const baseUrl = getSportsbookBaseUrl().replace(/\/$/, '');
  const namespaceUrl = `${baseUrl}/sportsbook`;
  const authPayload = token
    ? { token: token.startsWith('Bearer ') ? token : `Bearer ${token}` }
    : {};

  if (socket?.connected) {
    const hadToken = !!socket.auth?.token;
    const hasToken = !!authPayload.token;
    if (hadToken === hasToken) {
      if (hasToken) socket.auth = authPayload;
      return socket;
    }
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }

  if (socket) {
    socket.auth = authPayload;
    socket.connect();
    ensureHandlers();
    return socket;
  }

  socket = io(namespaceUrl, {
    ...SOCKET_CONFIG,
    auth: authPayload,
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
  matchRefCounts.clear();
  oddsRefCounts.clear();
  scoreboardRefCounts.clear();
  lastMatchesSig.clear();
  lastOddsSig.clear();
  lastScoreboardSig.clear();
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
  const s = String(sport);
  const prev = matchRefCounts.get(s) || 0;
  if (prev === 0 && countActiveSubscriptionSlots() >= MAX_SUBSCRIPTIONS) {
    console.warn('[sportsbookSocket] MAX_SUBSCRIPTIONS reached; skip subscribe:matches', s);
    return;
  }
  matchRefCounts.set(s, prev + 1);
  if (prev === 0 && socket?.connected) {
    socket.emit('subscribe:matches', { sport: s });
  }
}

export function unsubscribeMatches(sport) {
  if (!sport) return;
  const s = String(sport);
  const prev = matchRefCounts.get(s) || 0;
  if (prev <= 0) return;
  const next = prev - 1;
  if (next <= 0) {
    matchRefCounts.delete(s);
    lastMatchesSig.delete(s);
    if (socket?.connected) socket.emit('unsubscribe:matches', { sport: s });
  } else {
    matchRefCounts.set(s, next);
  }
}

export function subscribeOdds(gameIdOrEventId, sport) {
  if (!gameIdOrEventId) return;
  const id = String(gameIdOrEventId);
  const sp = sport || 'cricket';
  const existing = oddsRefCounts.get(id);
  if (!existing) {
    if (countActiveSubscriptionSlots() >= MAX_SUBSCRIPTIONS) {
      console.warn('[sportsbookSocket] MAX_SUBSCRIPTIONS reached; skip subscribe:odds', id);
      return;
    }
    oddsRefCounts.set(id, { count: 1, sport: sp });
    if (socket?.connected) {
      socket.emit('subscribe:odds', { gameId: id, sport: sp });
    }
  } else {
    existing.count += 1;
    existing.sport = sp;
  }
}

export function unsubscribeOdds(gameIdOrEventId, _sportIgnored) {
  if (!gameIdOrEventId) return;
  const id = String(gameIdOrEventId);
  const existing = oddsRefCounts.get(id);
  if (!existing) return;
  existing.count -= 1;
  if (existing.count <= 0) {
    oddsRefCounts.delete(id);
    lastOddsSig.delete(id);
    if (socket?.connected) socket.emit('unsubscribe:odds', { gameId: id });
  }
}

export function subscribeScoreboard(gameIdOrEventId, sport) {
  if (!gameIdOrEventId) return;
  const id = String(gameIdOrEventId);
  const sp = sport || 'cricket';
  const existing = scoreboardRefCounts.get(id);
  if (!existing) {
    if (countActiveSubscriptionSlots() >= MAX_SUBSCRIPTIONS) {
      console.warn('[sportsbookSocket] MAX_SUBSCRIPTIONS reached; skip subscribe:scoreboard', id);
      return;
    }
    scoreboardRefCounts.set(id, { count: 1, sport: sp });
    if (socket?.connected) {
      socket.emit('subscribe:scoreboard', { gameId: id, sport: sp });
    }
  } else {
    existing.count += 1;
    existing.sport = sp;
  }
}

export function unsubscribeScoreboard(gameIdOrEventId, _sportIgnored) {
  if (!gameIdOrEventId) return;
  const id = String(gameIdOrEventId);
  const existing = scoreboardRefCounts.get(id);
  if (!existing) return;
  existing.count -= 1;
  if (existing.count <= 0) {
    scoreboardRefCounts.delete(id);
    lastScoreboardSig.delete(id);
    if (socket?.connected) socket.emit('unsubscribe:scoreboard', { gameId: id });
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

/** Introspection for debugging / UI caps */
export function getSportsbookSubscriptionStats() {
  return {
    matches: [...matchRefCounts.entries()].filter(([, c]) => c > 0),
    odds: [...oddsRefCounts.entries()].filter(([, v]) => v.count > 0),
    scoreboard: [...scoreboardRefCounts.entries()].filter(([, v]) => v.count > 0),
    totalSlots: countActiveSubscriptionSlots(),
    max: MAX_SUBSCRIPTIONS,
  };
}

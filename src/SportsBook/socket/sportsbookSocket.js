/**
 * Single Socket.IO client for `/sportsbook` namespace (one tab = one connection).
 *
 * IMPORTANT: Do not mount this alongside `src/socket/sportsbookSocket.js` — that would open two connections.
 */
import { io } from 'socket.io-client';

/** Set `REACT_APP_SPORTSBOOK_LEGACY_SOCKET_EMIT=true` if server still expects single-object emits. */
const LEGACY_SOCKET_EMIT =
  process.env.REACT_APP_SPORTSBOOK_LEGACY_SOCKET_EMIT === '1' ||
  process.env.REACT_APP_SPORTSBOOK_LEGACY_SOCKET_EMIT === 'true';

const getBaseUrl = () =>
  (process.env.REACT_APP_BETTING_API_URL || 'https://gamingbackend.wrathcode.com').replace(/\/$/, '');

const SOCKET_CONFIG = {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  upgrade: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  timeout: 20000,
  randomizationFactor: 0.5,
};

const MAX_SUBSCRIPTIONS = 40;

/** @type {import('socket.io-client').Socket | null} */
let socket = null;

const matchRefCounts = new Map();
const oddsRefCounts = new Map();
const scoreboardRefCounts = new Map();

const matchesListeners = new Set();
const oddsListeners = new Set();
const scoreboardListeners = new Set();

const lastMatchesSig = new Map();
const lastOddsSig = new Map();
const lastScoreboardSig = new Map();

const matchSubSentToServer = new Set();
const oddsSubSentToServer = new Set();
const scoreboardSubSentToServer = new Set();

function countActiveSlots() {
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
  if (!payload || typeof payload !== 'object') return 'e';
  const p = payload;
  const ts = p.timestamp;
  if (ts != null && ts !== '') return `t:${String(ts)}`;
  const d = p[dataKey] ?? payload;
  try {
    return `j:${JSON.stringify(d)}`;
  } catch {
    return `s:${String(d)}`;
  }
}

function emitSubscribeMatches(sports) {
  if (!socket?.connected || sports.length === 0) return;
  const pending = sports.filter((s) => !matchSubSentToServer.has(s));
  if (pending.length === 0) return;
  if (LEGACY_SOCKET_EMIT) {
    pending.forEach((s) => {
      socket.emit('subscribe:matches', { sport: s });
      matchSubSentToServer.add(s);
    });
  } else {
    socket.emit(
      'subscribe:matches',
      pending.map((s) => ({ sport: s }))
    );
    pending.forEach((s) => matchSubSentToServer.add(s));
  }
}

function emitSubscribeOdds(id, sport) {
  if (!socket?.connected) return;
  if (oddsSubSentToServer.has(id)) return;
  if (LEGACY_SOCKET_EMIT) {
    socket.emit('subscribe:odds', { gameId: id, sport });
  } else {
    socket.emit('subscribe:odds', [{ gameId: id, sport }]);
  }
  oddsSubSentToServer.add(id);
}

function emitUnsubscribeOdds(id) {
  if (!socket?.connected) return;
  if (!oddsSubSentToServer.has(id)) return;
  if (LEGACY_SOCKET_EMIT) {
    socket.emit('unsubscribe:odds', { gameId: id });
  } else {
    socket.emit('unsubscribe:odds', [{ gameId: id }]);
  }
  oddsSubSentToServer.delete(id);
}

function emitSubscribeScoreboard(id, sport) {
  if (!socket?.connected) return;
  if (scoreboardSubSentToServer.has(id)) return;
  if (LEGACY_SOCKET_EMIT) {
    socket.emit('subscribe:scoreboard', { gameId: id, sport });
  } else {
    socket.emit('subscribe:scoreboard', [{ gameId: id, sport }]);
  }
  scoreboardSubSentToServer.add(id);
}

function emitUnsubscribeScoreboard(id) {
  if (!socket?.connected) return;
  if (!scoreboardSubSentToServer.has(id)) return;
  if (LEGACY_SOCKET_EMIT) {
    socket.emit('unsubscribe:scoreboard', { gameId: id });
  } else {
    socket.emit('unsubscribe:scoreboard', [{ gameId: id }]);
  }
  scoreboardSubSentToServer.delete(id);
}

function reemitSubscriptions() {
  if (!socket?.connected) return;

  const activeSports = [];
  matchRefCounts.forEach((c, sport) => {
    if (c > 0) activeSports.push(sport);
  });
  emitSubscribeMatches(activeSports);

  oddsRefCounts.forEach((v, id) => {
    if (v.count > 0) {
      oddsSubSentToServer.delete(id);
      emitSubscribeOdds(id, v.sport);
    }
  });

  scoreboardRefCounts.forEach((v, id) => {
    if (v.count > 0) {
      scoreboardSubSentToServer.delete(id);
      emitSubscribeScoreboard(id, v.sport);
    }
  });
}

function asMatchesPayloadArray(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (typeof payload === 'object' && Array.isArray(payload.items)) return payload.items.filter(Boolean);
  return [payload];
}

function asOddsOrScoreboardPayloadArray(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (typeof payload === 'object' && Array.isArray(payload.items)) return payload.items.filter(Boolean);
  return [payload];
}

function ensureHandlers() {
  if (!socket) return;

  socket.off('matches');
  socket.off('odds');
  socket.off('scoreboard');
  socket.off('connect');
  socket.off('disconnect');
  socket.off('connect_error');

  socket.on('matches', (payload) => {
    const list = asMatchesPayloadArray(payload);
    for (const p of list) {
      const sport =
        p && typeof p === 'object' && 'sport' in p ? String(p.sport) : '';
      if (!sport) continue;
      const sig = payloadSignature(p, 'data');
      if (lastMatchesSig.get(sport) === sig) continue;
      lastMatchesSig.set(sport, sig);
      matchesListeners.forEach((fn) => {
        try {
          fn(p);
        } catch (e) {
          console.error('[sportsbookSocket] matches listener error', e);
        }
      });
    }
  });

  socket.on('odds', (payload) => {
    const list = asOddsOrScoreboardPayloadArray(payload);
    for (const item of list) {
      const key =
        item && typeof item === 'object'
          ? String(item.eventId ?? item.gameId ?? '')
          : '';
      if (!key || item.data === undefined) continue;
      const sig = payloadSignature(item, 'data');
      if (lastOddsSig.get(key) === sig) continue;
      lastOddsSig.set(key, sig);
      oddsListeners.forEach((fn) => {
        try {
          fn(item);
        } catch (e) {
          console.error('[sportsbookSocket] odds listener error', e);
        }
      });
    }
  });

  socket.on('scoreboard', (payload) => {
    const list = asOddsOrScoreboardPayloadArray(payload);
    for (const item of list) {
      const key =
        item && typeof item === 'object'
          ? String(item.eventId ?? item.gameId ?? '')
          : '';
      if (!key || item.data === undefined) continue;
      const sig = payloadSignature(item, 'data');
      if (lastScoreboardSig.get(key) === sig) continue;
      lastScoreboardSig.set(key, sig);
      scoreboardListeners.forEach((fn) => {
        try {
          fn(item);
        } catch (e) {
          console.error('[sportsbookSocket] scoreboard listener error', e);
        }
      });
    }
  });

  socket.on('connect', () => {
    console.log('[sportsbook] connected');
    reemitSubscriptions();
  });

  socket.on('disconnect', () => {
    matchSubSentToServer.clear();
    oddsSubSentToServer.clear();
    scoreboardSubSentToServer.clear();
  });

  socket.on('connect_error', (err) => {
    console.error('[sportsbook] connect_error', err?.message);
  });
}

export function connectSportsbookSocket(token) {
  const namespaceUrl = `${getBaseUrl()}/sportsbook`;
  const authPayload = token
    ? { token: token.startsWith('Bearer ') ? token : `Bearer ${token}` }
    : {};

  if (socket?.connected) {
    const had =
      !!socket.auth &&
      typeof socket.auth === 'object' &&
      'token' in socket.auth &&
      !!socket.auth.token;
    const has = !!authPayload.token;
    if (had === has) {
      if (has && socket.auth && typeof socket.auth === 'object') {
        socket.auth.token = authPayload.token;
      }
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
  matchSubSentToServer.clear();
  oddsSubSentToServer.clear();
  scoreboardSubSentToServer.clear();
  matchesListeners.clear();
  oddsListeners.clear();
  scoreboardListeners.clear();
}

export function getSportsbookSocket() {
  return socket;
}

export function subscribeMatches(sport) {
  const s = String(sport);
  const prev = matchRefCounts.get(s) ?? 0;
  if (prev === 0 && countActiveSlots() >= MAX_SUBSCRIPTIONS) {
    console.warn('[sportsbook] MAX_SUBSCRIPTIONS; skip subscribe:matches', s);
    return;
  }
  matchRefCounts.set(s, prev + 1);
  if (prev === 0 && socket?.connected) {
    emitSubscribeMatches([s]);
  }
}

export function unsubscribeMatches(sport) {
  const s = String(sport);
  const prev = matchRefCounts.get(s) ?? 0;
  if (prev <= 0) return;
  const next = prev - 1;
  if (next <= 0) {
    matchRefCounts.delete(s);
    lastMatchesSig.delete(s);
    if (socket?.connected && matchSubSentToServer.has(s)) {
      if (LEGACY_SOCKET_EMIT) {
        socket.emit('unsubscribe:matches', { sport: s });
      } else {
        socket.emit('unsubscribe:matches', [{ sport: s }]);
      }
      matchSubSentToServer.delete(s);
    }
  } else {
    matchRefCounts.set(s, next);
  }
}

export function subscribeOdds(gameId, sport) {
  const id = String(gameId);
  const existing = oddsRefCounts.get(id);
  if (!existing) {
    if (countActiveSlots() >= MAX_SUBSCRIPTIONS) {
      console.warn('[sportsbook] MAX_SUBSCRIPTIONS; skip subscribe:odds', id);
      return;
    }
    oddsRefCounts.set(id, { count: 1, sport });
    if (socket?.connected) emitSubscribeOdds(id, sport);
  } else {
    existing.count += 1;
    existing.sport = sport;
  }
}

export function unsubscribeOdds(gameId) {
  const id = String(gameId);
  const existing = oddsRefCounts.get(id);
  if (!existing) return;
  existing.count -= 1;
  if (existing.count <= 0) {
    oddsRefCounts.delete(id);
    lastOddsSig.delete(id);
    if (socket?.connected) emitUnsubscribeOdds(id);
  }
}

export function subscribeScoreboard(gameId, sport) {
  const id = String(gameId);
  const existing = scoreboardRefCounts.get(id);
  if (!existing) {
    if (countActiveSlots() >= MAX_SUBSCRIPTIONS) {
      console.warn('[sportsbook] MAX_SUBSCRIPTIONS; skip subscribe:scoreboard', id);
      return;
    }
    scoreboardRefCounts.set(id, { count: 1, sport });
    if (socket?.connected) emitSubscribeScoreboard(id, sport);
  } else {
    existing.count += 1;
    existing.sport = sport;
  }
}

export function unsubscribeScoreboard(gameId) {
  const id = String(gameId);
  const existing = scoreboardRefCounts.get(id);
  if (!existing) return;
  existing.count -= 1;
  if (existing.count <= 0) {
    scoreboardRefCounts.delete(id);
    lastScoreboardSig.delete(id);
    if (socket?.connected) emitUnsubscribeScoreboard(id);
  }
}

export function addMatchesListener(fn) {
  matchesListeners.add(fn);
}

export function removeMatchesListener(fn) {
  matchesListeners.delete(fn);
}

export function addOddsListener(fn) {
  oddsListeners.add(fn);
}

export function removeOddsListener(fn) {
  oddsListeners.delete(fn);
}

export function addScoreboardListener(fn) {
  scoreboardListeners.add(fn);
}

export function removeScoreboardListener(fn) {
  scoreboardListeners.delete(fn);
}

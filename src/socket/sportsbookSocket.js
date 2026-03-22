/**
 * Sportsbook Socket — singleton manager (Socket.IO).
 *
 * - Single connection per app; auth change forces reconnect.
 * - Reference-counted subscriptions; match list emits deduped per connection (matchSubSentToServer).
 * - Re-subscribes all active streams on connect/reconnect.
 * - Optional payload dedupe (timestamp or JSON) before fan-out to listeners.
 * - Exponential-style backoff via socket.io reconnectionDelay + reconnectionDelayMax.
 *
 * @see sportsbookRealtimeStore for normalized UI state
 */

import { io } from 'socket.io-client';

const getSportsbookBaseUrl = () =>
  process.env.REACT_APP_BETTING_API_URL || 'https://gamingbackend.wrathcode.com';

/**
 * Subscription emits use an array payload (Socket.IO first argument = Array of objects).
 * Set `REACT_APP_SPORTSBOOK_LEGACY_SOCKET_EMIT=true` to restore per-item single-object emits (old backend).
 */
const LEGACY_SOCKET_EMIT =
  process.env.REACT_APP_SPORTSBOOK_LEGACY_SOCKET_EMIT === '1' ||
  process.env.REACT_APP_SPORTSBOOK_LEGACY_SOCKET_EMIT === 'true';

const SOCKET_CONFIG = {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  upgrade: true,
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

/**
 * Sports we already sent subscribe:matches for on this TCP connection.
 * Prevents duplicate subscribe (e.g. connect reemit + component subscribe both firing).
 * Cleared on disconnect; reemit repopulates after reconnect.
 */
const matchSubSentToServer = new Set();

/** gameIds sent to server via subscribe:odds on this connection (cleared on disconnect). */
const oddsSubSentToServer = new Set();
/** Pending batched subscribe:odds — id -> last sport hint (authoritative sport on oddsRefCounts). */
const pendingOddsSubscribe = new Map();
const pendingOddsUnsubscribe = new Set();
let oddsBatchFlushScheduled = false;

function scheduleOddsBatchFlush() {
  if (oddsBatchFlushScheduled) return;
  oddsBatchFlushScheduled = true;
  queueMicrotask(() => {
    oddsBatchFlushScheduled = false;
    flushOddsBatchesToServer();
  });
}

/** Flush pending odds sub/unsub — array payloads unless LEGACY_SOCKET_EMIT. */
function flushOddsBatchesToServer() {
  if (!socket?.connected) return;

  if (pendingOddsUnsubscribe.size > 0) {
    const gameIds = [...pendingOddsUnsubscribe];
    pendingOddsUnsubscribe.clear();
    if (LEGACY_SOCKET_EMIT) {
      gameIds.forEach((gid) => socket.emit('unsubscribe:odds', { gameId: gid }));
    } else {
      socket.emit(
        'unsubscribe:odds',
        gameIds.map((gid) => ({ gameId: String(gid) }))
      );
    }
    gameIds.forEach((gid) => oddsSubSentToServer.delete(String(gid)));
  }

  const items = [];
  const keys = [...pendingOddsSubscribe.keys()];
  for (const id of keys) {
    pendingOddsSubscribe.delete(id);
    const v = oddsRefCounts.get(id);
    if (v && v.count > 0 && !oddsSubSentToServer.has(id)) {
      items.push({ gameId: String(id), sport: v.sport || 'cricket' });
    }
  }
  if (items.length === 0) return;
  if (LEGACY_SOCKET_EMIT) {
    items.forEach((x) => {
      socket.emit('subscribe:odds', { gameId: x.gameId, sport: x.sport });
      oddsSubSentToServer.add(String(x.gameId));
    });
  } else {
    socket.emit('subscribe:odds', items);
    items.forEach((x) => oddsSubSentToServer.add(String(x.gameId)));
  }
}

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

/** `subscribe:matches` — array of `{ sport }` (or legacy one emit per sport). */
function emitSubscribeMatchesToServer(sports) {
  if (!socket?.connected || !sports?.length) return;
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

function emitUnsubscribeMatchesToServer(sports) {
  if (!socket?.connected || !sports?.length) return;
  if (LEGACY_SOCKET_EMIT) {
    sports.forEach((s) => {
      socket.emit('unsubscribe:matches', { sport: s });
    });
  } else {
    socket.emit(
      'unsubscribe:matches',
      sports.map((s) => ({ sport: s }))
    );
  }
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

/** Backend may send one message or `items: []` or a top-level array — normalize to array of objects. */
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

export function reemitSubscriptions() {
  if (!socket?.connected) return;
  const activeMatchSports = [];
  matchRefCounts.forEach((count, sport) => {
    if (count > 0) activeMatchSports.push(sport);
  });
  emitSubscribeMatchesToServer(activeMatchSports);
  pendingOddsSubscribe.clear();
  pendingOddsUnsubscribe.clear();
  const oddsItems = [];
  oddsRefCounts.forEach((v, id) => {
    const sid = String(id);
    if (v.count > 0 && !oddsSubSentToServer.has(sid)) {
      oddsItems.push({ gameId: sid, sport: v.sport || 'cricket' });
    }
  });
  if (oddsItems.length > 0) {
    if (LEGACY_SOCKET_EMIT) {
      oddsItems.forEach((x) => {
        socket.emit('subscribe:odds', { gameId: String(x.gameId), sport: x.sport });
        oddsSubSentToServer.add(String(x.gameId));
      });
    } else {
      const normalized = oddsItems.map((x) => ({
        gameId: String(x.gameId),
        sport: x.sport,
      }));
      socket.emit('subscribe:odds', normalized);
      normalized.forEach((x) => oddsSubSentToServer.add(String(x.gameId)));
    }
  }
  const scoreboardItems = [];
  scoreboardRefCounts.forEach((v, id) => {
    if (v.count > 0) {
      scoreboardItems.push({ gameId: String(id), sport: v.sport || 'cricket' });
    }
  });
  if (scoreboardItems.length > 0) {
    if (LEGACY_SOCKET_EMIT) {
      scoreboardItems.forEach((x) =>
        socket.emit('subscribe:scoreboard', { gameId: x.gameId, sport: x.sport })
      );
    } else {
      socket.emit('subscribe:scoreboard', scoreboardItems);
    }
  }
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
    const list = asMatchesPayloadArray(payload);
    for (const p of list) {
      const sport = p?.sport;
      if (!sport) continue;
      const sig = payloadSignature(p, 'data');
      if (lastMatchesSig.get(sport) === sig) continue;
      lastMatchesSig.set(sport, sig);
      matchesListeners.forEach((fn) => {
        try {
          fn(p);
        } catch (e) {
          console.error('sportsbookSocket matches listener error:', e);
        }
      });
    }
  });

  socket.on('odds', (payload) => {
    const list = asOddsOrScoreboardPayloadArray(payload);
    for (const item of list) {
      const key =
        item?.eventId != null ? String(item.eventId) : item?.gameId != null ? String(item.gameId) : null;
      if (!key || item?.data === undefined) continue;
      const sig = payloadSignature(item, 'data');
      if (lastOddsSig.get(key) === sig) continue;
      lastOddsSig.set(key, sig);
      oddsListeners.forEach((fn) => {
        try {
          fn(item);
        } catch (e) {
          console.error('sportsbookSocket odds listener error:', e);
        }
      });
    }
  });

  socket.on('scoreboard', (payload) => {
    const list = asOddsOrScoreboardPayloadArray(payload);
    for (const item of list) {
      const key =
        item?.eventId != null ? String(item.eventId) : item?.gameId != null ? String(item.gameId) : null;
      if (!key || item?.data === undefined) continue;
      const sig = payloadSignature(item, 'data');
      if (lastScoreboardSig.get(key) === sig) continue;
      lastScoreboardSig.set(key, sig);
      scoreboardListeners.forEach((fn) => {
        try {
          fn(item);
        } catch (e) {
          console.error('sportsbookSocket scoreboard listener error:', e);
        }
      });
    }
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
    matchSubSentToServer.clear();
    oddsSubSentToServer.clear();
    pendingOddsSubscribe.clear();
    pendingOddsUnsubscribe.clear();
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
  matchSubSentToServer.clear();
  oddsSubSentToServer.clear();
  pendingOddsSubscribe.clear();
  pendingOddsUnsubscribe.clear();
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

/**
 * Subscribe to several sports; sends `subscribe:matches` as an array of `{ sport }` (unless legacy env).
 */
export function subscribeMatchesMany(sports) {
  if (!Array.isArray(sports) || !sports.length) return;
  const uniq = [...new Set(sports.map(String).filter(Boolean))];
  const firstActivated = [];
  for (const s of uniq) {
    const prev = matchRefCounts.get(s) || 0;
    if (prev === 0 && countActiveSubscriptionSlots() >= MAX_SUBSCRIPTIONS) {
      console.warn('[sportsbookSocket] MAX_SUBSCRIPTIONS reached; skip subscribe:matches', s);
      continue;
    }
    matchRefCounts.set(s, prev + 1);
    if (prev === 0) firstActivated.push(s);
  }
  emitSubscribeMatchesToServer(firstActivated);
}

export function subscribeMatches(sport) {
  if (!sport) return;
  subscribeMatchesMany([sport]);
}

export function unsubscribeMatchesMany(sports) {
  if (!Array.isArray(sports) || !sports.length) return;
  const uniq = [...new Set(sports.map(String).filter(Boolean))];
  const removedFromServer = [];
  for (const s of uniq) {
    const prev = matchRefCounts.get(s) || 0;
    if (prev <= 0) continue;
    const next = prev - 1;
    if (next <= 0) {
      matchRefCounts.delete(s);
      lastMatchesSig.delete(s);
      if (socket?.connected && matchSubSentToServer.has(s)) {
        removedFromServer.push(s);
        matchSubSentToServer.delete(s);
      }
    } else {
      matchRefCounts.set(s, next);
    }
  }
  emitUnsubscribeMatchesToServer(removedFromServer);
}

export function unsubscribeMatches(sport) {
  if (!sport) return;
  unsubscribeMatchesMany([sport]);
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
      pendingOddsSubscribe.set(id, sp);
      pendingOddsUnsubscribe.delete(id);
      scheduleOddsBatchFlush();
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
    pendingOddsSubscribe.delete(id);
    if (socket?.connected && oddsSubSentToServer.has(id)) {
      pendingOddsUnsubscribe.add(id);
      scheduleOddsBatchFlush();
    }
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
      if (LEGACY_SOCKET_EMIT) {
        socket.emit('subscribe:scoreboard', { gameId: id, sport: sp });
      } else {
        socket.emit('subscribe:scoreboard', [{ gameId: id, sport: sp }]);
      }
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
    if (socket?.connected) {
      if (LEGACY_SOCKET_EMIT) {
        socket.emit('unsubscribe:scoreboard', { gameId: id });
      } else {
        socket.emit('unsubscribe:scoreboard', [{ gameId: id }]);
      }
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

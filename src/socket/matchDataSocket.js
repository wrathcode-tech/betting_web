/**
 * `/matchdata` — public namespace (aligns with server: Redis `matches:{sport}`).
 * Client: io(`${API_BASE}/matchdata`, { path: '/socket.io', transports: ['websocket'] })
 *
 * Landing: `matchData:subscribeAll` / `matchData:unsubscribeAll` (no payload). Server joins
 * `matchData:all`, sends `matchData:update` with `{ sportName: 'all', sports: { cricket, soccer, tennis } }`
 * (each value is `{ sportName, matches }` from Redis). We fan that out to per-sport listeners.
 *
 * Per-sport subscribe: `matchData:subscribe` / `matchData:unsubscribe` with `{ sportName }`.
 * Server sends `matchData:update` as `{ sportName: 'cricket'|'soccer'|'tennis', matches: MatchRow[] }`.
 *
 * Match detail (odds): `matchData:subscribeMatch` / `matchData:unsubscribeMatch` with `{ sportName, gameId }`.
 * Server pushes `matchData:matchUpdate` with `{ sportName, gameId, match }` (match includes matchOdds, etc.).
 */

import { io } from 'socket.io-client';

const listeners = new Set();
/** @type {import('socket.io-client').Socket | null} */
let socket = null;
/** sportName -> refcount (Landing + /sports tab) */
const sportRefCounts = new Map();

/** `${sportName}:${gameId}` -> refcount for `matchData:subscribeMatch` */
const matchDetailSubRefCounts = new Map();
const matchDetailListeners = new Set();

const NAMESPACE_SUFFIX = '/matchdata';

/** True while landing uses matchData:subscribeAll (re-emitted on reconnect). */
let landingAllActive = false;

/** Landing home: all three sports in one logical subscription (same refcount rules per sport). */
export const LANDING_MATCH_DATA_SPORTS = ['cricket', 'tennis', 'soccer'];

/** If false, keep one WebSocket when nothing is subscribed (avoids reconnect / duplicate WS in DevTools). */
const DISCONNECT_MATCH_DATA_WHEN_IDLE = false;

/** API base URL (no trailing slash) — same role as `API_BASE` in your server snippet. */
export function getMatchDataSocketOrigin() {
  const raw =
    process.env.REACT_APP_MATCH_DATA_SOCKET_URL ||
    process.env.REACT_APP_BETTING_API_URL ||
    'http://localhost:5000';
  return String(raw).trim().replace(/\s+/g, '').replace(/\/$/, '');
}

function emitMatchDetailResubscribe() {
  if (!socket?.connected) return;
  matchDetailSubRefCounts.forEach((count, key) => {
    if (count <= 0) return;
    const colon = key.indexOf(':');
    if (colon <= 0) return;
    const sportName = key.slice(0, colon);
    const gameId = key.slice(colon + 1);
    if (sportName && gameId) {
      socket.emit('matchData:subscribeMatch', { sportName, gameId });
    }
  });
}

function onMatchDetailSocketPayload(payload) {
  matchDetailListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.error('matchData:matchUpdate listener', e);
    }
  });
}

function attachHandlers() {
  if (!socket) return;
  socket.off('connect', onConnect);
  socket.off('matchData:update', onUpdate);
  socket.off('matchData:matchUpdate', onMatchDetailSocketPayload);
  socket.off('matchData:error', onError);
  socket.on('connect', onConnect);
  socket.on('matchData:update', onUpdate);
  socket.on('matchData:matchUpdate', onMatchDetailSocketPayload);
  socket.on('matchData:error', onError);
}

function onConnect() {
  if (!socket) return;
  if (landingAllActive) {
    socket.emit('matchData:subscribeAll');
    emitMatchDetailResubscribe();
    return;
  }
  for (const [sportName, count] of sportRefCounts.entries()) {
    if (count > 0) socket.emit('matchData:subscribe', { sportName });
  }
  emitMatchDetailResubscribe();
}

function onUpdate(payload) {
  // Backend "all" snapshot:
  // { sportName: "all", sports: { cricket: {matches:[]}, soccer:..., tennis:... }, timestamp }
  // Fan-out into per-sport updates so UI can keep using sportName === 'cricket'/'tennis'/'soccer'
  // and `matches` directly.
  const isAllSnapshot = payload?.sportName === 'all' && payload?.sports && typeof payload.sports === 'object';
  if (isAllSnapshot) {
    const ts = typeof payload.timestamp === 'number' ? payload.timestamp : null;
    for (const [sportName, sportObj] of Object.entries(payload.sports)) {
      const matches = Array.isArray(sportObj?.matches) ? sportObj.matches : [];
      listeners.forEach((fn) => {
        try {
          fn('update', { sportName, timestamp: ts, matches });
        } catch (e) {
          console.error('matchData:update listener', e);
        }
      });
    }
    return;
  }

  listeners.forEach((fn) => {
    try {
      fn('update', payload);
    } catch (e) {
      console.error('matchData:update listener', e);
    }
  });
}

function onError(payload) {
  listeners.forEach((fn) => {
    try {
      fn('error', payload);
    } catch (e) {
      console.error('matchData:error listener', e);
    }
  });
}

function ensureSocket() {
  if (socket?.connected) return socket;
  if (socket) {
    socket.connect();
    return socket;
  }
  const apiBase = getMatchDataSocketOrigin();
  socket = io(`${apiBase}${NAMESPACE_SUFFIX}`, {
    path: '/socket.io',
    transports: ['websocket'],
    autoConnect: true,
  });
  attachHandlers();
  return socket;
}

/**
 * @param {string} sportName cricket | soccer | tennis
 */
export function subscribeMatchDataLanding(sportName) {
  const s = String(sportName).toLowerCase();
  ensureSocket();
  landingAllActive = false;
  const next = (sportRefCounts.get(s) || 0) + 1;
  sportRefCounts.set(s, next);
  if (socket.connected) {
    socket.emit('matchData:subscribe', { sportName: s });
  }
}

/**
 * Landing page: subscribe cricket + tennis + soccer in one call (one effect).
 * Emits happen back-to-back; refcount matches three individual subscribe calls.
 */
export function subscribeMatchDataLandingAll() {
  ensureSocket();
  landingAllActive = true
  // Keep local bookkeeping for unsubscribe / UI lifecycle.
  sportRefCounts.clear()
  for (const sport of LANDING_MATCH_DATA_SPORTS) {
    const s = String(sport).toLowerCase()
    sportRefCounts.set(s, 1)
  }
  if (socket?.connected) {
    socket.emit('matchData:subscribeAll');
  }
}

// Aliases (requested by UI flow).
export function subscribeAll() {
  subscribeMatchDataLandingAll();
}

/**
 * Landing page cleanup: unsubscribe all three sports (pair of `subscribeMatchDataLandingAll`).
 */
export function unsubscribeMatchDataLandingAll() {
  landingAllActive = false
  sportRefCounts.clear()
  if (socket?.connected) {
    socket.emit('matchData:unsubscribeAll');
  }
  // Note: we intentionally do not call per-sport unsubscribe to keep this "single emit".
}

// Aliases (requested by UI flow).
export function unsubscribeAll() {
  unsubscribeMatchDataLandingAll();
}

/**
 * @param {string} sportName
 */
export function unsubscribeMatchDataLanding(sportName) {
  const s = String(sportName).toLowerCase();
  const prev = sportRefCounts.get(s) || 0;
  if (prev <= 1) {
    sportRefCounts.delete(s);
    if (socket?.connected) socket.emit('matchData:unsubscribe', { sportName: s });
  } else {
    sportRefCounts.set(s, prev - 1);
  }
  let total = 0;
  sportRefCounts.forEach((c) => {
    total += c;
  });
  if (total === 0 && socket && DISCONNECT_MATCH_DATA_WHEN_IDLE) {
    socket.off('connect', onConnect);
    socket.off('matchData:update', onUpdate);
    socket.off('matchData:error', onError);
    socket.disconnect();
    socket = null;
  }
}

/**
 * @param {(kind: 'update'|'error', payload: unknown) => void} fn
 * @returns {() => void} removeListener
 */
export function addMatchDataListener(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Subscribe to full match/odds updates for one event (ref-counted).
 * Emits `matchData:subscribeMatch` { sportName, gameId } on first refcount; re-emits on reconnect.
 * @param {string} sportName cricket | soccer | tennis
 * @param {string|number} gameId
 */
export function subscribeMatchDataDetail(sportName, gameId) {
  const s = String(sportName || '')
    .trim()
    .toLowerCase();
  const id = gameId != null && String(gameId).trim() !== '' ? String(gameId).trim() : '';
  if (!s || !id) return;
  const key = `${s}:${id}`;
  const prev = matchDetailSubRefCounts.get(key) || 0;
  matchDetailSubRefCounts.set(key, prev + 1);
  ensureSocket();
  if (prev === 0 && socket?.connected) {
    socket.emit('matchData:subscribeMatch', { sportName: s, gameId: id });
  }
}

/**
 * Pair of `subscribeMatchDataDetail` when leaving the match page or switching gameId.
 */
export function unsubscribeMatchDataDetail(sportName, gameId) {
  const s = String(sportName || '')
    .trim()
    .toLowerCase();
  const id = gameId != null && String(gameId).trim() !== '' ? String(gameId).trim() : '';
  if (!s || !id) return;
  const key = `${s}:${id}`;
  const prev = matchDetailSubRefCounts.get(key) || 0;
  const next = Math.max(0, prev - 1);
  if (next === 0) {
    matchDetailSubRefCounts.delete(key);
    if (socket?.connected) {
      socket.emit('matchData:unsubscribeMatch', { sportName: s, gameId: id });
    }
  } else {
    matchDetailSubRefCounts.set(key, next);
  }
}

/**
 * @param {(payload: { sportName?: string, gameId?: string, match?: Record<string, unknown> }) => void} fn
 */
export function addMatchDataDetailListener(fn) {
  if (typeof fn === 'function') matchDetailListeners.add(fn);
}

export function removeMatchDataDetailListener(fn) {
  matchDetailListeners.delete(fn);
}

/**
 * @param {unknown} payload
 * @returns {{ sportName: string|null, timestamp: number|null, matches: any[] }}
 */
export function normalizeMatchDataUpdatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { sportName: null, timestamp: null, matches: [] };
  }
  const p = payload;
  if (p.sportName === 'all') {
    return { sportName: 'all', timestamp: null, matches: [] };
  }
  const sportRaw = p.sportName != null ? String(p.sportName) : null;
  const sportName = sportRaw ? sportRaw.toLowerCase() : null;
  const matches = Array.isArray(p.matches) ? p.matches : [];
  const timestamp =
    typeof p.timestamp === 'number'
      ? p.timestamp
      : p.timestamp != null
        ? Number(p.timestamp)
        : null;
  return { sportName, timestamp, matches };
}

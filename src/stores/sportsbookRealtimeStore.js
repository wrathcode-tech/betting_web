/**
 * Normalized sportsbook realtime state (no Zustand dependency).
 * Updates preserve unchanged branch references so useSyncExternalStore
 * subscribers only re-render when their slice changes.
 */

const EMPTY_MATCH_LIST = Object.freeze([]);

/** @type {{ matchesBySport: Record<string, any[]>, oddsByGameId: Record<string, any>, scoreboardByGameId: Record<string, any>, _oddSigs: Record<string, string>, _matchSigs: Record<string, string>, _scoreboardSigs: Record<string, string> }} */
let state = {
  matchesBySport: Object.freeze({ cricket: EMPTY_MATCH_LIST, tennis: EMPTY_MATCH_LIST, soccer: EMPTY_MATCH_LIST }),
  oddsByGameId: Object.freeze({}),
  scoreboardByGameId: Object.freeze({}),
  _oddSigs: Object.freeze({}),
  _matchSigs: Object.freeze({}),
  _scoreboardSigs: Object.freeze({}),
};

const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('sportsbookRealtimeStore listener error:', e);
    }
  });
}

export function subscribeSportsbookStore(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSportsbookStoreSnapshot() {
  return state;
}

/**
 * @param {string} sport
 * @returns {readonly any[]}
 */
export function getMatchesSnapshot(sport) {
  const key = String(sport || 'cricket').toLowerCase();
  return state.matchesBySport[key] ?? EMPTY_MATCH_LIST;
}

/**
 * @param {string} gameId
 */
export function getOddsSnapshot(gameId) {
  if (!gameId) return null;
  return state.oddsByGameId[String(gameId)] ?? null;
}

/**
 * @param {string} gameId
 */
export function getScoreboardSnapshot(gameId) {
  if (!gameId) return null;
  return state.scoreboardByGameId[String(gameId)] ?? null;
}

function stableStringifyForSig(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

/**
 * Replace matches for a sport (REST initial load). Always emits.
 * @param {string} sport
 * @param {any[]} list
 */
export function setMatchesForSport(sport, list) {
  const key = String(sport || 'cricket').toLowerCase();
  const nextList = Array.isArray(list) ? list : [];
  const prevList = state.matchesBySport[key];
  if (prevList === nextList) return;
  state = {
    ...state,
    matchesBySport: Object.freeze({ ...state.matchesBySport, [key]: nextList }),
  };
  emit();
}

/**
 * Merge socket matches if signature changed (timestamp preferred).
 * @param {string} sport
 * @param {any[]} list
 * @param {string|number|null|undefined} signature
 */
export function mergeMatchesForSportIfChanged(sport, list, signature) {
  const key = String(sport || 'cricket').toLowerCase();
  const sig =
    signature != null && signature !== ''
      ? String(signature)
      : stableStringifyForSig(list?.slice?.(0, 3) ?? list);
  if (state._matchSigs[key] === sig) return;
  const nextList = Array.isArray(list) ? list : [];
  state = {
    ...state,
    matchesBySport: Object.freeze({ ...state.matchesBySport, [key]: nextList }),
    _matchSigs: Object.freeze({ ...state._matchSigs, [key]: sig }),
  };
  emit();
}

/**
 * Patch odds for one gameId; shallow skip if payload unchanged.
 * @param {string} gameId
 * @param {object} data
 * @param {string|number|null|undefined} signature
 */
export function patchOddsIfChanged(gameId, data, signature) {
  if (!gameId || data == null || typeof data !== 'object') return;
  const id = String(gameId);
  const sig =
    signature != null && signature !== ''
      ? String(signature)
      : stableStringifyForSig(data);
  if (state._oddSigs[id] === sig) return;
  const prev = state.oddsByGameId[id];
  if (prev && stableStringifyForSig(prev) === stableStringifyForSig(data)) {
    state = {
      ...state,
      _oddSigs: Object.freeze({ ...state._oddSigs, [id]: sig }),
    };
    return;
  }
  const nextOdds = { ...state.oddsByGameId, [id]: data };
  state = {
    ...state,
    oddsByGameId: Object.freeze(nextOdds),
    _oddSigs: Object.freeze({ ...state._oddSigs, [id]: sig }),
  };
  emit();
}

/**
 * @param {string} gameId
 * @param {object} data
 * @param {string|number|null|undefined} signature
 */
export function patchScoreboardIfChanged(gameId, data, signature) {
  if (!gameId || data == null || typeof data !== 'object') return;
  const id = String(gameId);
  const sig =
    signature != null && signature !== ''
      ? String(signature)
      : stableStringifyForSig(data);
  const key = `_sc_${id}`;
  if (state._matchSigs[key] === sig) return;
  const nextSb = { ...state.scoreboardByGameId, [id]: data };
  state = {
    ...state,
    scoreboardByGameId: Object.freeze(nextSb),
    _matchSigs: Object.freeze({ ...state._matchSigs, [key]: sig }),
  };
  emit();
}

/** Reset odds/scoreboard for a game (e.g. navigation). */
export function clearGameStreams(gameId) {
  if (!gameId) return;
  const id = String(gameId);
  if (!state.oddsByGameId[id] && !state.scoreboardByGameId[id]) return;
  const { [id]: _o, ...restOdds } = state.oddsByGameId;
  const { [id]: _s, ...restSb } = state.scoreboardByGameId;
  const { [id]: _os, ...restOddSig } = state._oddSigs;
  const { [id]: _ss, ...restScSig } = state._scoreboardSigs;
  state = {
    ...state,
    oddsByGameId: Object.freeze(restOdds),
    scoreboardByGameId: Object.freeze(restSb),
    _oddSigs: Object.freeze(restOddSig),
    _scoreboardSigs: Object.freeze(restScSig),
  };
  emit();
}

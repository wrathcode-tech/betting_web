/**
 * Sportsbook realtime — WebSocket disabled (no connection to `/sportsbook`).
 * API surface preserved so UI and BalanceContext compile; listeners are never invoked.
 */

const matchesListeners = new Set();
const oddsListeners = new Set();
const scoreboardListeners = new Set();
const betUpdateListeners = new Set();
const balanceListeners = new Set();
const errorListeners = new Set();

export function reemitSubscriptions() {}

export function connectSportsbookSocket(_token) {}

export function disconnectSportsbookSocket() {
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
  return null;
}

export function subscribeMatchesMany(_sports) {}

export function subscribeMatches(_sport) {}

export function unsubscribeMatchesMany(_sports) {}

export function unsubscribeMatches(_sport) {}

export function subscribeOdds(_gameIdOrEventId, _sport) {}

export function unsubscribeOdds(_gameIdOrEventId, _sportIgnored) {}

export function subscribeScoreboard(_gameIdOrEventId, _sport) {}

export function unsubscribeScoreboard(_gameIdOrEventId, _sportIgnored) {}

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

export function getSportsbookSubscriptionStats() {
  return {
    matches: [],
    odds: [],
    scoreboard: [],
    totalSlots: 0,
    max: 40,
  };
}

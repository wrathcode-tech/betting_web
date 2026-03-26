/**
 * Sportsbook API client – frontend integration for /api/v1/sportsbook.
 * All methods delegate to AuthService. Use this module for a single API layer.
 *
 * PUBLIC:
 *   - getMatches(sportName, options?)
 *   - getOdds(sportName, gameId)
 *   - getScore(eventId)
 *
 * PROTECTED (Bearer token):
 *   - placeBet(body)
 *   - getOpenBets(params?)
 *   - getBetHistory(params?)
 *   - getBetSummary()
 *   - cashout(betId)
 */

import AuthService from './AuthService';

const supportedSports = ['cricket', 'soccer', 'tennis'];

/** Same (sport, gameId) ke parallel callers → ek hi HTTP request */
const inflightOddsByKey = new Map();

/**
 * GET /api/v1/sportsbook/:sportName/matches
 * @param {string} sportName - cricket | soccer | tennis
 * @param {{ fresh?: boolean }} [options] - optional fresh=1
 * @returns {Promise<{ success: boolean, data: Array<{ gameId, eventId, eventName, eventDate }> }>}
 */
export async function getMatches(sportName, options = {}) {
  const sport = normalizeSport(sportName);
  const res = await AuthService.sportsbookMatches(sport, { fresh: options.fresh ? 1 : undefined });
  return normalizeResponse(res);
}

/**
 * GET /api/v1/sportsbook/:sportName/odds?gameId=<id> (or eventId for tennis)
 * @param {string} sportName - cricket | soccer | tennis
 * @param {string} gameIdOrEventId - use gameId from matches API (eventId for tennis)
 * @returns {Promise<{ success: boolean, data: { matchOdds, bookMakerOdds, fancyOdds, liveScore } }>}
 */
export async function getOdds(sportName, gameIdOrEventId) {
  const sport = normalizeSport(sportName);
  const id = gameIdOrEventId != null && gameIdOrEventId !== '' ? String(gameIdOrEventId) : '';
  if (!id) {
    return { success: false, data: null, message: 'Missing gameId' };
  }
  const key = `${sport}:${id}`;
  const existing = inflightOddsByKey.get(key);
  if (existing) return existing;

  const promise = AuthService.sportsbookOdds(sport, id)
    .then((res) => normalizeResponse(res))
    .finally(() => {
      inflightOddsByKey.delete(key);
    });
  inflightOddsByKey.set(key, promise);
  return promise;
}

/** Same eventId / gameId ke parallel callers → ek hi HTTP request */
const inflightEventConfigByKey = new Map();

/**
 * GET /api/v1/sportsbook/event/config?eventId=...
 * @param {string|number} eventIdOrGameId
 * @returns {Promise<unknown>}
 */
export async function getEventStakeConfig(eventIdOrGameId) {
  const id = eventIdOrGameId != null && eventIdOrGameId !== '' ? String(eventIdOrGameId) : '';
  if (!id) {
    return null;
  }
  const existing = inflightEventConfigByKey.get(id);
  if (existing) return existing;
  const promise = AuthService.sportsbookEventConfig(id).finally(() => {
    inflightEventConfigByKey.delete(id);
  });
  inflightEventConfigByKey.set(id, promise);
  return promise;
}

/**
 * GET /api/v1/sportsbook/score?eventId=<id>
 * @param {string} eventId
 * @returns {Promise<{ liveScore }>}
 */
export async function getScore(eventId) {
  const res = await AuthService.sportsbookScore(eventId);
  return res?.liveScore != null ? { liveScore: res.liveScore } : { liveScore: null };
}

/**
 * POST /api/v1/sportsbook/place-bet
 * @param {object} body - { sport, gameId, eventName, seriesName?, eventTime?, marketType, marketId, marketName?, selectionId, selectionName, betType, odds, stake, isLive?, requestId? } — user from Authorization Bearer
 * @param {string} body.sport - cricket | soccer | tennis
 * @param {string} body.betType - back | lay
 * @param {string} body.marketType - match_odds | bookmaker | fancy
 * @returns {Promise<{ success, message?, data?: { data?: object } }>}
 */
export async function placeBet(body) {
  const res = await AuthService.sportsbookPlaceBet(body);
  return normalizeResponse(res);
}

/** Response: `{ success, message, data: { data: bet } }` — unwrap bet + balanceAfter for UI. */
export function unwrapPlaceBetResponse(res) {
  if (!res || typeof res !== 'object') {
    return { ok: false, bet: null, message: '', balanceAfter: null };
  }
  const msg = String(res.message || '');
  if (res.success === false) {
    return { ok: false, bet: null, message: msg || 'Request failed', balanceAfter: null };
  }
  if (msg.toLowerCase().includes('fail')) {
    return { ok: false, bet: null, message: msg, balanceAfter: null };
  }
  const wrap = res.data;
  const inner = wrap && typeof wrap === 'object' ? wrap : {};
  const bet =
    inner.data ??
    inner.bet ??
    (inner._id || inner.gameId ? inner : null);
  const balanceAfter = bet?.balanceAfter ?? inner.balanceAfter ?? res.balanceAfter;
  return { ok: true, bet, message: msg || inner.message, balanceAfter };
}

/**
 * GET /api/v1/sportsbook/bet/open
 * @param {{ gameId?: string, marketType?: string, sport?: string, page?: number, limit?: number }} [params]
 * @returns {Promise<{ data: { bets?: any[] } }>}
 */
export async function getOpenBets(params = {}) {
  const res = await AuthService.sportsbookOpenBets(params);
  return normalizeResponse(res);
}

/**
 * GET /api/v1/sportsbook/bet/history
 * @param {{ page?: number, limit?: number, sport?: string, from?: string, to?: string, result?: string }} [params] - result: won | lost | void
 * @returns {Promise<{ data: { bets?: any[], pagination?: object } }>}
 */
export async function getBetHistory(params = {}) {
  const res = await AuthService.sportsbookBetHistory(params);
  return normalizeResponse(res);
}

/**
 * GET /api/v1/sportsbook/bet/summary
 * @returns {Promise<{ openBetsCount?, totalExposure?, todayPnl? }>}
 */
export async function getBetSummary() {
  const res = await AuthService.sportsbookBetSummary();
  return normalizeResponse(res);
}

/**
 * POST /api/v1/sportsbook/bet/:betId/cashout
 * @param {string} betId
 * @returns {Promise<{ success, message?, balanceAfter? }>}
 */
export async function cashout(betId) {
  const res = await AuthService.sportsbookCashout(betId);
  return normalizeResponse(res);
}

function normalizeSport(sportName) {
  const s = String(sportName || '').toLowerCase();
  return supportedSports.includes(s) ? s : 'cricket';
}

function normalizeResponse(res) {
  if (res && typeof res === 'object') return res;
  return { success: false, data: null, message: 'Invalid response' };
}

export const sportsbookApi = {
  getMatches,
  getOdds,
  getEventStakeConfig,
  getScore,
  placeBet,
  unwrapPlaceBetResponse,
  getOpenBets,
  getBetHistory,
  getBetSummary,
  cashout,
};

export default sportsbookApi;

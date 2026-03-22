/**
 * Normalizes socket `matches` events per docs/FRONTEND_SPORTSBOOK.md (listSummary vs legacy).
 * @module sportsbookMatchesPayload
 */

/**
 * Server may send one object, `{ items: [...] }`, or a top-level array for `matches` / `odds` / `scoreboard`.
 * Expands to an array of message objects so UI listeners match home (`/`) behaviour.
 * @param {unknown} payload
 * @returns {object[]}
 */
/**
 * Extract match rows from GET /sportsbook/:sport/matches (response shapes vary by backend).
 * @param {unknown} apiRes - parsed JSON body from ApiCallGet / AuthService.sportsbookMatches
 * @returns {any[]}
 */
export function normalizeRestMatchesList(apiRes) {
  if (!apiRes || typeof apiRes !== 'object') return []
  const d = apiRes.data
  if (Array.isArray(d)) return d
  if (d && typeof d === 'object') {
    if (Array.isArray(d.data)) return d.data
    if (Array.isArray(d.matches)) return d.matches
    if (Array.isArray(d.rows)) return d.rows
    if (Array.isArray(d.games)) return d.games
  }
  if (Array.isArray(apiRes.matches)) return apiRes.matches
  return []
}

export function expandSocketBatchPayload(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) {
    return payload.filter((x) => x != null && typeof x === 'object');
  }
  if (typeof payload === 'object' && Array.isArray(payload.items)) {
    return payload.items.filter((x) => x != null && typeof x === 'object');
  }
  if (typeof payload === 'object') return [payload];
  return [];
}

/**
 * Map one listSummary row to a legacy-shaped match object for existing list UIs.
 * Preserves `selections` / `markets` for future ladder rendering.
 * @param {object} row
 * @returns {object|null}
 */
export function listSummaryRowToLegacyMatch(row) {
  if (!row || typeof row !== 'object') return null
  const gameId = row.gameId != null ? String(row.gameId) : null
  if (!gameId) return null
  const name = row.name != null ? String(row.name) : ''
  const eventId = row.eventId != null ? String(row.eventId) : gameId
  return {
    gameId,
    game_id: gameId,
    eventId,
    event_id: eventId,
    eventName: name,
    event_name: name,
    name,
    inPlay: !!row.inPlay,
    in_play: !!row.inPlay,
    sport: row.sport,
    marketClosed: !!row.marketClosed,
    seriesName: row.seriesName ?? row.series_name ?? '',
    series_name: row.seriesName ?? row.series_name ?? '',
    eventTime: row.eventTime ?? row.event_time,
    event_time: row.eventTime ?? row.event_time,
    marketBadges: Array.isArray(row.markets)
      ? row.markets.map((m) => (typeof m === 'string' ? m : m?.code ?? m?.name)).filter(Boolean)
      : undefined,
    selections: row.selections,
    markets: row.markets,
    __listSummary: true,
  }
}

/**
 * @param {object} payload - raw socket `matches` payload
 * @returns {{
 *   sport: string|null,
 *   rows: any[],
 *   schema: string|null,
 *   error: boolean,
 *   message?: string
 * }}
 */
export function getMatchRowsFromSocketPayload(payload) {
  const sport = payload?.sport != null ? String(payload.sport) : null

  if (payload?.error) {
    return {
      sport,
      rows: [],
      schema: payload?.schema ?? null,
      error: true,
      message: payload?.message,
    }
  }

  if (!sport) {
    return { sport: null, rows: [], schema: null, error: false }
  }

  if (payload?.schema === 'listSummary' && Array.isArray(payload.data)) {
    return {
      sport,
      schema: 'listSummary',
      rows: payload.data.map(listSummaryRowToLegacyMatch).filter(Boolean),
      error: false,
    }
  }

  if (payload?.schema && payload.schema !== 'listSummary') {
    // eslint-disable-next-line no-console
    console.warn(
      '[sportsbook] matches: expected schema listSummary, got',
      payload.schema,
      'for sport',
      sport,
      '— do not assume legacy raw array in data'
    )
  }

  const raw = payload?.data ?? payload?.matches
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
  return {
    sport,
    schema: payload?.schema ?? 'legacy',
    rows: list,
    error: false,
  }
}

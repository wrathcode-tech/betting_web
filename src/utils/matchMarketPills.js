/**
 * Market feature pills (MC, BM, P, D, F) — only what API/socket provides.
 * Priority: explicit list on match → derive from full odds payload.
 */

function nonEmptyArray(v) {
  return Array.isArray(v) && v.length > 0
}

/**
 * @param {Record<string, unknown>|null|undefined} raw
 * @returns {string[]|null}
 */
export function parseExplicitMarketPills(raw) {
  if (!raw || typeof raw !== 'object') return null
  const v =
    raw.marketBadges ??
    raw.market_badges ??
    raw.marketPills ??
    raw.market_pills ??
    raw.badges ??
    raw.marketTags ??
    raw.market_tags
  if (v == null) return null
  if (Array.isArray(v)) {
    const out = v
      .map((x) => {
        if (typeof x === 'string') return x.trim()
        if (x && typeof x === 'object') {
          return String(x.code ?? x.label ?? x.name ?? x.id ?? '').trim()
        }
        return ''
      })
      .filter(Boolean)
    return out.length ? out : null
  }
  if (typeof v === 'string') {
    const out = v
      .split(/[,|;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    return out.length ? out : null
  }
  return null
}

/**
 * @param {Record<string, unknown>|null|undefined} odds
 * @returns {string[]}
 */
export function getMarketPillsFromOddsPayload(odds) {
  if (!odds || typeof odds !== 'object') return []
  const mo = odds.matchOdds ?? odds.match_odds
  const bm = odds.bookMakerOdds ?? odds.book_maker_odds
  const fancy = odds.fancyOdds ?? odds.fancy_odds
  const prem = odds.premiumFancy ?? odds.premium_fancy
  const other = odds.otherMarketOdds ?? odds.other_market_odds
  const oe = odds.oddEvenOdds ?? odds.odd_even_odds
  const pills = []
  if (nonEmptyArray(mo)) pills.push('MC')
  if (nonEmptyArray(bm)) pills.push('BM')
  if (nonEmptyArray(prem)) pills.push('P')
  if (nonEmptyArray(other) || nonEmptyArray(oe)) pills.push('D')
  if (nonEmptyArray(fancy)) pills.push('F')
  return pills
}

/**
 * @param {Record<string, unknown>|null|undefined} rawMatch
 * @param {Record<string, unknown>|null|undefined} oddsPayload
 * @returns {string[]}
 */
export function getMarketPillsFromSources(rawMatch, oddsPayload) {
  const explicit = parseExplicitMarketPills(rawMatch)
  if (explicit && explicit.length) return [...new Set(explicit)]
  return getMarketPillsFromOddsPayload(oddsPayload)
}

/**
 * Show stream / TV icon only when API indicates stream is available.
 * @param {Record<string, unknown>|null|undefined} raw
 */
export function getMatchStreamVisible(raw) {
  if (!raw || typeof raw !== 'object') return false
  const url = raw.tvUrl ?? raw.tv_url
  const hasUrl = typeof url === 'string' && url.trim().length > 0
  const flag = raw.IsTv ?? raw.isTv ?? raw.hasTv ?? raw.has_tv
  const truthy =
    flag === true ||
    flag === 1 ||
    (typeof flag === 'string' && ['true', '1', 'yes'].includes(flag.toLowerCase()))
  return hasUrl || truthy
}

/**
 * @param {'cricket'|'tennis'|'soccer'} activeTab
 * @param {Record<string, unknown>} match
 */
export function getOddsStorageKeyForMatch(activeTab, match) {
  if (activeTab === 'tennis') return match?.eventId ?? match?.event_id ?? match?.gameId ?? match?.game_id
  return match?.gameId ?? match?.game_id ?? match?.eventId ?? match?.event_id
}

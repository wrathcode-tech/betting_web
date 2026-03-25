/**
 * Market feature pills (MO, BM, F, P, D) — explicit `pills` on match and/or derived from `matchOdds[]`
 * (each market row has `mname` / `market` / `gtype`).
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
    raw.pills ??
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

/** Preferred display order for pill codes. */
const PILL_SORT_ORDER = ['MO', 'BM', 'F', 'P', 'D', 'OM', 'MC']

function normalizePillToken(c) {
  let s = String(c).trim().toUpperCase()
  if (s === 'MC') s = 'MO'
  return s
}

function sortPillCodes(codes) {
  const uniq = [...new Set(codes.map(normalizePillToken).filter(Boolean))]
  return uniq.sort((a, b) => {
    const ia = PILL_SORT_ORDER.indexOf(a)
    const ib = PILL_SORT_ORDER.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b)
  })
}

/** Dedupe + sort pill codes (MO, BM, …) from multiple sources. */
export function mergeAndSortPillCodes(...lists) {
  return sortPillCodes(lists.flat().filter((x) => x != null && x !== ''))
}

/**
 * Map one market object from `matchOdds[]` to a pill code (MO/BM/F/P/D).
 * @param {Record<string, unknown>} m
 * @returns {string|null}
 */
function pillCodeFromMatchOddsRow(m) {
  if (!m || typeof m !== 'object') return null
  const mn = String(m.mname ?? m.mName ?? '')
    .toUpperCase()
    .replace(/\s+/g, '_')
  const market = String(m.market ?? '').toUpperCase()
  const gtype = String(m.gtype ?? '').toUpperCase()

  const direct = String(m.mname ?? m.mName ?? '')
    .trim()
    .toUpperCase()
  if (['MO', 'BM', 'F', 'P', 'D', 'OM'].includes(direct)) return direct
  if (direct === 'MC') return 'MO'

  if (mn === 'BM' || mn === 'BOOKMAKER' || mn === 'BOOK_MAKER') return 'BM'
  if (mn === 'FANCY' && !mn.includes('PREMIUM')) return 'F'

  if (mn === 'MATCH_ODDS' || mn.includes('MATCH_ODDS') || (market.includes('MATCH') && market.includes('ODD'))) {
    return 'MO'
  }
  if (mn.includes('BOOKMAKER') || mn.includes('BOOK_MAKER') || market.includes('BOOK MAKER') || market.includes('BOOKMAKER')) {
    return 'BM'
  }
  if (mn.includes('PREMIUM_FANCY') || (mn.includes('PREMIUM') && mn.includes('FANCY')) || gtype.includes('PREMIUM')) {
    return 'P'
  }
  if (mn.includes('FANCY') || gtype === 'FANCY') {
    return 'F'
  }
  if (mn.includes('ODD_EVEN') || mn.includes('ODD-EVEN') || market.includes('ODD EVEN')) {
    return 'D'
  }
  return null
}

/**
 * Walk `matchOdds[]` — each entry is a separate market (MO, BM, FANCY, …).
 * @param {unknown} matchOddsArr
 * @returns {string[]}
 */
export function deriveMarketPillsFromMatchOddsArray(matchOddsArr) {
  if (!Array.isArray(matchOddsArr) || matchOddsArr.length === 0) return []
  const out = []
  for (const row of matchOddsArr) {
    const code = pillCodeFromMatchOddsRow(row)
    if (code) out.push(code)
  }
  return sortPillCodes(out)
}

/**
 * @param {Record<string, unknown>|null|undefined} odds
 * @returns {string[]}
 */
export function getMarketPillsFromOddsPayload(odds) {
  if (!odds || typeof odds !== 'object') return []
  const mo = odds.matchOdds ?? odds.match_odds
  if (Array.isArray(mo) && mo.length > 0) {
    const fromRows = deriveMarketPillsFromMatchOddsArray(mo)
    if (fromRows.length > 0) return fromRows
    return ['MO']
  }
  const bm = odds.bookMakerOdds ?? odds.book_maker_odds
  const fancy = odds.fancyOdds ?? odds.fancy_odds
  const prem = odds.premiumFancy ?? odds.premium_fancy
  const other = odds.otherMarketOdds ?? odds.other_market_odds
  const oe = odds.oddEvenOdds ?? odds.odd_even_odds
  const pills = []
  if (nonEmptyArray(mo)) pills.push('MO')
  if (nonEmptyArray(bm)) pills.push('BM')
  if (nonEmptyArray(prem)) pills.push('P')
  if (nonEmptyArray(other) || nonEmptyArray(oe)) pills.push('D')
  if (nonEmptyArray(fancy)) pills.push('F')
  return sortPillCodes(pills)
}

/**
 * @param {Record<string, unknown>|null|undefined} rawMatch
 * @param {Record<string, unknown>|null|undefined} oddsPayload
 * @returns {string[]}
 */
export function getMarketPillsFromSources(rawMatch, oddsPayload) {
  const explicit = parseExplicitMarketPills(rawMatch)
  const fromOdds = getMarketPillsFromOddsPayload(oddsPayload)
  const fromExplicit = explicit?.length ? explicit : []
  return sortPillCodes([...fromExplicit, ...fromOdds])
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

/**
 * Socket may index odds by gameId while payload used eventId (or vice versa). Try primary id then alternate.
 * @param {Record<string, unknown>} oddsByGameId
 * @param {'cricket'|'tennis'|'soccer'} activeTab
 * @param {Record<string, unknown>|null|undefined} match
 */
export function resolveOddsPayloadFromMap(oddsByGameId, activeTab, match) {
  if (!oddsByGameId || typeof oddsByGameId !== 'object' || !match || typeof match !== 'object') return null
  const primary = getOddsStorageKeyForMatch(activeTab, match)
  const gid = match.gameId ?? match.game_id
  const eid = match.eventId ?? match.event_id
  const tryKeys = []
  if (primary != null && primary !== '') tryKeys.push(String(primary))
  if (activeTab === 'tennis') {
    if (gid != null && String(gid) !== String(primary ?? '')) tryKeys.push(String(gid))
  } else {
    if (eid != null && String(eid) !== String(primary ?? '')) tryKeys.push(String(eid))
  }
  for (const k of tryKeys) {
    const payload = oddsByGameId[k]
    if (payload && typeof payload === 'object') return payload
  }
  return null
}

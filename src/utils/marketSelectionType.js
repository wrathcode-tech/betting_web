/**
 * Standardized market/selection `type` for sportsbook odds (frontend enrichment until backend sends `type`).
 * Used in normalized odds data and place-bet payload.
 */

export const MARKET_SELECTION_TYPES = {
  MATCH_ODDS: 'MATCH_ODDS',
  BOOKMAKER: 'BOOKMAKER',
  FANCY: 'FANCY',
  ODD_EVEN: 'ODD_EVEN',
  DECIMAL: 'DECIMAL',
  OVER_SESSION: 'OVER_SESSION',
  PLAYER_PROP: 'PLAYER_PROP',
  WICKET_SESSION: 'WICKET_SESSION',
  LINE: 'LINE',
}

/**
 * Market-level type from API fields (Match Odds / Bookmaker).
 */
export function inferMarketTypeFromFields(market) {
  if (!market || typeof market !== 'object') return null
  const name = String(market.marketName ?? market.market ?? '').trim()
  if (name.toLowerCase() === 'match odds') return MARKET_SELECTION_TYPES.MATCH_ODDS
  const mname = String(market.mname ?? '')
  const gtype = String(market.gtype ?? '')
  if (gtype === 'Bookmaker' || mname.toUpperCase().includes('BOOKMAKER')) {
    return MARKET_SELECTION_TYPES.BOOKMAKER
  }
  return null
}

/**
 * Fancy oddDatas row: classify using rname + b1 (order matters).
 */
export function inferFancySelectionType(odd) {
  if (!odd || typeof odd !== 'object') return MARKET_SELECTION_TYPES.LINE
  const rname = String(odd.rname ?? odd.selectionName ?? '')
  const r = rname.toLowerCase()

  if (r.includes('odd even')) return MARKET_SELECTION_TYPES.ODD_EVEN

  const b1n = parseFloat(String(odd.b1 ?? '').trim())
  if (!Number.isNaN(b1n) && b1n < 10) return MARKET_SELECTION_TYPES.DECIMAL

  if (r.includes('over runs') || r.includes('over run')) return MARKET_SELECTION_TYPES.OVER_SESSION

  if (r.includes('fall of')) return MARKET_SELECTION_TYPES.WICKET_SESSION

  if (
    r.includes('boundaries') ||
    r.includes('boundary') ||
    r.includes('balls') ||
    r.includes('ball ') ||
    /\brun\b/.test(rname)
  ) {
    return MARKET_SELECTION_TYPES.PLAYER_PROP
  }

  return MARKET_SELECTION_TYPES.LINE
}

function enrichOddDatas(oddDatas, marketType) {
  if (oddDatas == null) return oddDatas
  const mapOne = (o) => {
    if (!o || typeof o !== 'object') return o
    if (o.type != null && String(o.type).trim() !== '') {
      return { ...o, type: String(o.type) }
    }
    const mt = marketType
    const type =
      mt === MARKET_SELECTION_TYPES.MATCH_ODDS || mt === MARKET_SELECTION_TYPES.BOOKMAKER
        ? mt
        : inferFancySelectionType(o)
    return { ...o, type }
  }
  if (Array.isArray(oddDatas)) return oddDatas.map(mapOne)
  if (typeof oddDatas === 'object') {
    const out = {}
    Object.keys(oddDatas).forEach((k) => {
      const v = oddDatas[k]
      out[k] = v && typeof v === 'object' ? mapOne(v) : v
    })
    return out
  }
  return oddDatas
}

function enrichSingleMarket(market, fallbackMarketType) {
  if (!market || typeof market !== 'object') return market
  const inferred = inferMarketTypeFromFields(market)
  const mt =
    market.type != null && String(market.type).trim() !== ''
      ? String(market.type)
      : inferred ?? fallbackMarketType ?? MARKET_SELECTION_TYPES.FANCY
  const oddDatas = enrichOddDatas(market.oddDatas, mt)
  return { ...market, type: mt, oddDatas }
}

/**
 * Add `type` on every market and every oddDatas row in normalized odds payload.
 * Does not remove or rename existing fields.
 */
export function enrichNormalizedOddsData(data) {
  if (!data || typeof data !== 'object') return data
  const out = { ...data }

  const mapArr = (arr, fallback) =>
    Array.isArray(arr) ? arr.map((m) => enrichSingleMarket(m, fallback)) : arr

  out.matchOdds = mapArr(out.matchOdds, MARKET_SELECTION_TYPES.MATCH_ODDS)
  out.bookMakerOdds = mapArr(out.bookMakerOdds, MARKET_SELECTION_TYPES.BOOKMAKER)
  out.miniBookMakerOdds = mapArr(out.miniBookMakerOdds, null)
  out.fancyOdds = mapArr(out.fancyOdds, MARKET_SELECTION_TYPES.FANCY)
  out.fancyOddsSessions = mapArr(out.fancyOddsSessions, MARKET_SELECTION_TYPES.FANCY)
  out.otherMarketOdds = mapArr(out.otherMarketOdds, MARKET_SELECTION_TYPES.FANCY)
  out.premiumFancy = mapArr(out.premiumFancy, MARKET_SELECTION_TYPES.FANCY)
  out.oddEvenOdds = mapArr(out.oddEvenOdds, MARKET_SELECTION_TYPES.FANCY)

  return out
}

/**
 * Resolve selection `type` for place payload when odd may lack `type` (legacy / race).
 */
export function resolveSelectionTypeForPayload(placePayload, oddRow) {
  const pp = placePayload || {}
  const mt = String(pp.marketType || '').toLowerCase()
  if (oddRow && typeof oddRow === 'object' && oddRow.type) return String(oddRow.type)
  if (mt === 'match_odds') return MARKET_SELECTION_TYPES.MATCH_ODDS
  if (mt === 'bookmaker') return MARKET_SELECTION_TYPES.BOOKMAKER
  if (mt === 'fancy' && oddRow && typeof oddRow === 'object') {
    return inferFancySelectionType(oddRow)
  }
  return null
}

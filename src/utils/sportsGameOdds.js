/**
 * 1×2 back/lay strip for /sports — Match Odds from oddDatas/runners.
 * Per runner: back = best (highest) of b1–b3 with matching bs*; lay = best (lowest) of l1–l3 with matching ls*.
 */

function toOddDatasArray(oddDatas) {
  if (!oddDatas) return []
  if (Array.isArray(oddDatas)) return oddDatas
  if (typeof oddDatas === 'object') return Object.values(oddDatas).filter(Boolean)
  return []
}

/** Runner display name — oddDatas use `rname`. */
function runnerLabel(x) {
  if (!x || typeof x !== 'object') return ''
  return String(x.rname ?? x.selectionName ?? x.name ?? x.runnerName ?? x.selectionId ?? '').trim()
}

function normName(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
}

/** "Team A v Team B" → { left, right } */
function parseTeamsFromTitle(eventName) {
  if (!eventName || typeof eventName !== 'string') return null
  const m = eventName.match(/^(.+?)\s+(?:vs|v)\s+(.+)$/i)
  if (!m) return null
  const left = m[1].trim()
  const right = m[2].trim()
  if (!left || !right) return null
  return { left, right }
}

function teamMatchesRname(rname, teamFromTitle) {
  const a = normName(rname)
  const b = normName(teamFromTitle)
  if (a === b) return true
  if (a.length >= 2 && b.length >= 2) return a.includes(b) || b.includes(a)
  return false
}

/**
 * Order oddDatas into [ home, draw, away ] using event title + runner `rname`.
 * Falls back to null so caller can use legacy orderFor1x2.
 */
function orderRunnersByEventTitle(runners, eventName) {
  const vs = parseTeamsFromTitle(eventName)
  if (!vs || !Array.isArray(runners) || runners.length === 0) return null
  const { left, right } = vs
  const draws = []
  const others = []
  for (const r of runners) {
    const rn = runnerLabel(r)
    if (isDrawName(rn)) draws.push(r)
    else others.push(r)
  }
  const draw = draws[0] ?? null
  let home = null
  let away = null
  for (const r of others) {
    const rn = runnerLabel(r)
    if (!home && teamMatchesRname(rn, left)) home = r
    else if (!away && teamMatchesRname(rn, right)) away = r
  }
  const used = new Set([home, away, draw].filter(Boolean))
  for (const r of others) {
    if (used.has(r)) continue
    if (!home) home = r
    else if (!away) away = r
  }
  return [home, draw, away]
}

function label1x2(x) {
  return runnerLabel(x)
}

function isDrawName(name) {
  const n = String(name || '').toLowerCase()
  if (!n) return false
  if (n === 'draw' || n === 'tie' || n === 'the draw' || n === 'x') return true
  return n.includes('draw') && !n.includes('withdraw') && !n.includes('w/d')
}

/** [home, draw, away] */
function orderFor1x2(list, getLabel) {
  const items = Array.isArray(list) ? list.filter(Boolean) : []
  if (items.length === 0) return [null, null, null]
  if (items.length === 1) return [items[0], null, null]
  const drawIdx = items.findIndex((x) => isDrawName(getLabel(x)))
  if (items.length === 2) {
    if (drawIdx === 0) return [null, items[0], items[1]]
    if (drawIdx === 1) return [items[0], items[1], null]
    return [items[0], null, items[1]]
  }
  if (drawIdx >= 0) {
    const rest = items.filter((_, i) => i !== drawIdx)
    return [rest[0] ?? null, items[drawIdx], rest[1] ?? null]
  }
  return [items[0], items[1] ?? null, items[2] ?? null]
}

function emptyCell() {
  return { price: null, sizeFormatted: '—' }
}

function emptyPair() {
  return { back: emptyCell(), lay: emptyCell() }
}

function formatSize(size) {
  if (size == null || size === '') return '0.00'
  const n = Number(size)
  if (!Number.isFinite(n)) return String(size)
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 2)}K`
  return n % 1 === 0 ? String(n) : n.toFixed(2)
}

const BACK_KEYS = ['b1', 'b2', 'b3']
const BACK_SIZE_KEYS = ['bs1', 'bs2', 'bs3']
const LAY_KEYS = ['l1', 'l2', 'l3']
const LAY_SIZE_KEYS = ['ls1', 'ls2', 'ls3']

function numPrice(v) {
  if (v == null || v === '') return null
  const n = parseFloat(String(v).trim())
  return Number.isFinite(n) ? n : null
}

/** Highest back + lowest lay across three ladder rungs; sizes from the winning rung. */
function pairFromRunnerRow(runner, isOddsValid) {
  if (!runner || typeof runner !== 'object') return emptyPair()

  let bestBackRaw = null
  let bestBackNum = null
  let bestBackSize = null
  for (let i = 0; i < 3; i++) {
    const raw = runner[BACK_KEYS[i]]
    if (raw == null || !isOddsValid(raw)) continue
    const n = numPrice(raw)
    if (n == null) continue
    if (bestBackNum == null || n > bestBackNum) {
      bestBackNum = n
      bestBackRaw = raw
      bestBackSize = runner[BACK_SIZE_KEYS[i]]
    }
  }
  let bestLayRaw = null
  let bestLayNum = null
  let bestLaySize = null
  for (let i = 0; i < 3; i++) {
    const raw = runner[LAY_KEYS[i]]
    if (raw == null || !isOddsValid(raw)) continue
    const n = numPrice(raw)
    if (n == null) continue
    if (bestLayNum == null || n < bestLayNum) {
      bestLayNum = n
      bestLayRaw = raw
      bestLaySize = runner[LAY_SIZE_KEYS[i]]
    }
  }
  if (bestBackRaw == null && runner.back != null && isOddsValid(runner.back)) {
    bestBackRaw = runner.back
    bestBackSize = runner.bs1 ?? runner.size
  }
  if (bestLayRaw == null && runner.lay != null && isOddsValid(runner.lay)) {
    bestLayRaw = runner.lay
    bestLaySize = runner.ls1 ?? runner.size
  }

  return {
    back: {
      price: bestBackRaw,
      sizeFormatted: bestBackRaw != null ? formatSize(bestBackSize) : '—',
    },
    lay: {
      price: bestLayRaw,
      sizeFormatted: bestLayRaw != null ? formatSize(bestLaySize) : '—',
    },
  }
}

function pairFromSelection(sel, isOddsValid) {
  if (!sel || typeof sel !== 'object') return emptyPair()
  const br = Array.isArray(sel.back) ? sel.back[0] : null
  const lr = Array.isArray(sel.lay) ? sel.lay[0] : null
  if (br || lr) {
    const bp = br && br.open !== false && br.price != null && isOddsValid(br.price) ? br.price : null
    const lp = lr && lr.open !== false && lr.price != null && isOddsValid(lr.price) ? lr.price : null
    return {
      back: { price: bp, sizeFormatted: bp != null ? formatSize(br?.stack) : '—' },
      lay: { price: lp, sizeFormatted: lp != null ? formatSize(lr?.stack) : '—' },
    }
  }
  return pairFromRunnerRow(sel, isOddsValid)
}

/**
 * @param {object} match
 * @param {object|null} odds
 * @param {(v: unknown) => boolean} isOddsValid
 */
export function computeTop1x2Cells(match, odds, isOddsValid) {
  const eventTitle = match?.eventName ?? match?.teams ?? ''
  const mo =
    (odds && Array.isArray(odds.matchOdds) && odds.matchOdds) ||
    (odds && Array.isArray(odds.match_odds) && odds.match_odds) ||
    (match && Array.isArray(match.matchOdds) && match.matchOdds) ||
    null
  if (mo?.length) {
    const market = mo[0]
    const runners = Array.isArray(market.runners) && market.runners.length ? market.runners : toOddDatasArray(market.oddDatas)
    if (runners.length) {
      const byTitle = orderRunnersByEventTitle(runners, eventTitle)
      const ordered = byTitle ?? orderFor1x2(runners, label1x2)
      return ordered.map((node) => (node ? pairFromRunnerRow(node, isOddsValid) : emptyPair()))
    }
  }
  const selections = Array.isArray(match?.selections) ? match.selections : []
  if (selections.length) {
    const ordered = orderFor1x2(selections, label1x2)
    return ordered.map((node) => (node ? pairFromSelection(node, isOddsValid) : emptyPair()))
  }
  return [emptyPair(), emptyPair(), emptyPair()]
}

export { formatSize as formatOddsSize }

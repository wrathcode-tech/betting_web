/**
 * Stake limit label for sportsbook markets — uses backend string or numeric min/max fields.
 * @param {unknown} v
 * @returns {string}
 */
function formatStakeCompact(v) {
    if (v == null || v === '') return ''
    const n = Number(v)
    if (!Number.isFinite(n)) {
        const s = String(v).trim()
        return s || ''
    }
    const abs = Math.abs(n)
    if (abs >= 1000) {
        const k = n / 1000
        if (Number.isInteger(k)) return `${k}K`
        const t = k.toFixed(2).replace(/\.?0+$/, '')
        return `${t}K`
    }
    if (Number.isInteger(n)) return String(n)
    return String(n)
}

/**
 * First usable limit value: skips undefined / null / '' but keeps numeric 0.
 * (Empty string with `??` would block falling through to a real 0 in another key.)
 * @param {Record<string, unknown>} obj
 * @param {string[]} keys
 * @returns {unknown}
 */
function pickLimitField(obj, keys) {
    if (!obj || typeof obj !== 'object') return undefined
    for (const k of keys) {
        if (!(k in obj)) continue
        const v = obj[k]
        if (v === undefined || v === null || v === '') continue
        return v
    }
    return undefined
}

const MIN_KEYS = [
    'minbet',
    'minBet',
    'min_bet',
    'minimumBet',
    'minimum_bet',
    'minStake',
    'min_stake',
    'minStack',
    'min_stack',
    'stackMin',
    'stack_min',
    'stakeMin',
    'stake_min',
    'minAmount',
    'min_amount',
    'betMin',
    'bet_min',
    'min',
    'minLimit',
    'min_limit',
]

const MAX_KEYS = [
    'maxbet',
    'maxBet',
    'max_bet',
    'maximumBet',
    'maximum_bet',
    'maxStake',
    'max_stake',
    'maxStack',
    'max_stack',
    'stackMax',
    'stack_max',
    'stakeMax',
    'stake_max',
    'maxAmount',
    'max_amount',
    'betMax',
    'bet_max',
    'max',
    'maxLimit',
    'max_limit',
]

/**
 * Cricket/fancy APIs often send `min: 0, max: 0` on the market while real limits sit on each `oddDatas` row.
 * @param {unknown} minRaw
 * @param {unknown} maxRaw
 */
function isMeaninglessMarketLimits(minRaw, maxRaw) {
    const mn = minRaw === undefined || minRaw === null || minRaw === '' ? null : Number(minRaw)
    const mx = maxRaw === undefined || maxRaw === null || maxRaw === '' ? null : Number(maxRaw)
    if (mn === null && mx === null) return true
    if (mn === 0 && mx === 0) return true
    return false
}

/**
 * Aggregate min/max across runners (min stake = smallest positive min; max stake = largest positive max).
 * @param {unknown} arr
 * @returns {{ min: number|null, max: number|null }}
 */
function aggregateNumericLimitsFromOddDatas(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return { min: null, max: null }
    let minStake = null
    let maxStake = null
    for (const row of arr) {
        if (!row || typeof row !== 'object') continue
        const minR = pickLimitField(row, MIN_KEYS)
        const maxR = pickLimitField(row, MAX_KEYS)
        if (minR !== undefined && minR !== null && minR !== '') {
            const n = Number(minR)
            if (Number.isFinite(n) && n > 0) {
                minStake = minStake == null ? n : Math.min(minStake, n)
            }
        }
        if (maxR !== undefined && maxR !== null && maxR !== '') {
            const n = Number(maxR)
            if (Number.isFinite(n) && n > 0) {
                maxStake = maxStake == null ? n : Math.max(maxStake, n)
            }
        }
    }
    return { min: minStake, max: maxStake }
}

/**
 * @param {unknown} arr
 * @returns {string}
 */
function minMaxLabelFromOddDatas(arr) {
    const { min, max } = aggregateNumericLimitsFromOddDatas(arr)
    const minS = min != null ? formatStakeCompact(min) : ''
    const maxS = max != null ? formatStakeCompact(max) : ''
    if (minS !== '' && maxS !== '') return `MIN: ${minS} MAX: ${maxS}`
    if (minS !== '') return `MIN: ${minS}`
    if (maxS !== '') return `MAX: ${maxS}`
    return ''
}

/**
 * @param {Record<string, unknown>|null|undefined} obj
 * @returns {string}
 */
function minMaxFromObject(obj) {
    if (!obj || typeof obj !== 'object') return ''
    const pre =
        obj.minMax ??
        obj.min_max ??
        obj.limitsText ??
        obj.limits_text ??
        obj.stakeLimitsText ??
        obj.stake_limits_text
    if (typeof pre === 'string' && pre.trim()) return pre.trim()
    const minRaw = pickLimitField(obj, MIN_KEYS)
    const maxRaw = pickLimitField(obj, MAX_KEYS)
    const runners = obj.oddDatas ?? obj.runners ?? obj.odd_odds
    if (isMeaninglessMarketLimits(minRaw, maxRaw)) {
        const fromRunners = minMaxLabelFromOddDatas(runners)
        if (fromRunners) return fromRunners
        return ''
    }
    const minS = formatStakeCompact(minRaw)
    const maxS = formatStakeCompact(maxRaw)
    if (minS === '0' && maxS === '0') return ''
    if (minS !== '' && maxS !== '') return `MIN: ${minS} MAX: ${maxS}`
    if (minS !== '') return `MIN: ${minS}`
    if (maxS !== '') return `MAX: ${maxS}`
    if (Array.isArray(runners) && runners.length) {
        const fromRunners = minMaxLabelFromOddDatas(runners)
        if (fromRunners) return fromRunners
    }
    return ''
}

/**
 * Bookmaker payload: `[{ bm1: { min, max, oddDatas }, bm2: … }]` or flat markets.
 * @param {unknown} arr
 * @returns {string}
 */
function minMaxLabelFromBookMakerOdds(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return ''
    for (const item of arr) {
        if (!item || typeof item !== 'object') continue
        const bmKeys = Object.keys(item).filter((k) => /^bm\d+$/i.test(k))
        if (bmKeys.length > 0) {
            bmKeys.sort((a, b) => {
                const na = parseInt(a.replace(/\D/g, ''), 10) || 0
                const nb = parseInt(b.replace(/\D/g, ''), 10) || 0
                return na - nb
            })
            for (const k of bmKeys) {
                const sub = item[k]
                if (sub && typeof sub === 'object') {
                    const t = minMaxFromObject(sub)
                    if (t) return t
                }
            }
        } else {
            const t = minMaxFromObject(item)
            if (t) return t
        }
    }
    return ''
}

const PREFORMATTED_LIMIT_KEYS = [
    'minMax',
    'min_max',
    'limitsText',
    'limits_text',
    'stakeLimitsText',
    'stake_limits_text',
]

/**
 * Copy limit-related fields from an API/socket object onto a normalized odds shape
 * so {@link formatMinMaxLabel} can fall back to event-level or payload-root limits.
 * @param {Record<string, unknown>|null|undefined} obj
 * @returns {Record<string, unknown>}
 */
export function extractStakeLimitFields(obj) {
    if (!obj || typeof obj !== 'object') return {}
    const out = {}
    for (const k of PREFORMATTED_LIMIT_KEYS) {
        const v = obj[k]
        if (typeof v === 'string' && v.trim()) out[k] = v.trim()
    }
    for (const k of MIN_KEYS) {
        if (!(k in obj)) continue
        const v = obj[k]
        if (v === undefined || v === null || v === '') continue
        out[k] = v
    }
    for (const k of MAX_KEYS) {
        if (!(k in obj)) continue
        const v = obj[k]
        if (v === undefined || v === null || v === '') continue
        out[k] = v
    }
    return out
}

/**
 * Prefer market-level limits; optional odds payload root when market omits them.
 * @param {Record<string, unknown>|null|undefined} market
 * @param {Record<string, unknown>|null|undefined} [payloadFallback]
 * @returns {string}
 */
export function formatMinMaxLabel(market, payloadFallback) {
    const direct = minMaxFromObject(market)
    if (direct) return direct
    const root = minMaxFromObject(payloadFallback)
    if (root) return root
    if (!payloadFallback || typeof payloadFallback !== 'object') return ''
    const mo = payloadFallback.matchOdds ?? payloadFallback.match_odds
    if (Array.isArray(mo)) {
        for (const m of mo) {
            const t = minMaxFromObject(m)
            if (t) return t
        }
    }
    const bm = payloadFallback.bookMakerOdds ?? payloadFallback.book_maker_odds
    const fromBm = minMaxLabelFromBookMakerOdds(bm)
    if (fromBm) return fromBm
    const fo = payloadFallback.fancyOdds ?? payloadFallback.fancy_odds
    if (Array.isArray(fo)) {
        for (const m of fo) {
            const t = minMaxFromObject(m)
            if (t) return t
        }
    }
    return ''
}

function aggregateNumericFromBookMakerOdds(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return { min: null, max: null }
    for (const item of arr) {
        if (!item || typeof item !== 'object') continue
        const bmKeys = Object.keys(item).filter((k) => /^bm\d+$/i.test(k))
        if (bmKeys.length > 0) {
            bmKeys.sort((a, b) => {
                const na = parseInt(a.replace(/\D/g, ''), 10) || 0
                const nb = parseInt(b.replace(/\D/g, ''), 10) || 0
                return na - nb
            })
            for (const k of bmKeys) {
                const sub = item[k]
                if (sub && typeof sub === 'object') {
                    const t = getNumericStakeLimitsFromObjectOnly(sub)
                    if (t.min != null || t.max != null) return t
                }
            }
        } else {
            const t = getNumericStakeLimitsFromObjectOnly(item)
            if (t.min != null || t.max != null) return t
        }
    }
    return { min: null, max: null }
}

function getNumericStakeLimitsFromObjectOnly(obj) {
    if (!obj || typeof obj !== 'object') return { min: null, max: null }
    const minRaw = pickLimitField(obj, MIN_KEYS)
    const maxRaw = pickLimitField(obj, MAX_KEYS)
    let min = null
    let max = null
    if (minRaw !== undefined) {
        const n = Number(minRaw)
        if (Number.isFinite(n) && n >= 0) min = n
    }
    if (maxRaw !== undefined) {
        const n = Number(maxRaw)
        if (Number.isFinite(n) && n >= 0) max = n
    }
    const runners = obj.oddDatas ?? obj.runners ?? obj.odd_odds
    if (isMeaninglessMarketLimits(minRaw, maxRaw) && Array.isArray(runners) && runners.length) {
        const agg = aggregateNumericLimitsFromOddDatas(runners)
        if (agg.min != null) min = agg.min
        if (agg.max != null) max = agg.max
    }
    if (min === 0 && max === 0) {
        return { min: null, max: null }
    }
    return { min, max }
}

/**
 * Socket/API odds root ya event config se numeric min/max stake (place-bet validation).
 * Root `match` payload often has `min: 0, max: 0` while real limits live on `matchOdds[]` / `oddDatas` / bookmaker.
 * @param {Record<string, unknown>|null|undefined} obj
 * @returns {{ min: number|null, max: number|null }}
 */
export function getNumericStakeLimitsFromPayload(obj) {
    if (!obj || typeof obj !== 'object') {
        return { min: null, max: null }
    }
    let { min, max } = getNumericStakeLimitsFromObjectOnly(obj)
    if (min != null || max != null) {
        if (min === 0 && max === 0) {
            min = null
            max = null
        }
        if (min != null || max != null) return { min, max }
    }
    const mo = obj.matchOdds ?? obj.match_odds
    if (Array.isArray(mo)) {
        for (const m of mo) {
            const t = getNumericStakeLimitsFromObjectOnly(m)
            if (t.min != null || t.max != null) {
                if (t.min === 0 && t.max === 0) continue
                return t
            }
        }
    }
    const bm = obj.bookMakerOdds ?? obj.book_maker_odds
    const fromBm = aggregateNumericFromBookMakerOdds(bm)
    if (fromBm.min != null || fromBm.max != null) return fromBm
    const fo = obj.fancyOdds ?? obj.fancy_odds
    if (Array.isArray(fo)) {
        for (const m of fo) {
            const t = getNumericStakeLimitsFromObjectOnly(m)
            if (t.min != null || t.max != null) {
                if (t.min === 0 && t.max === 0) continue
                return t
            }
        }
    }
    return { min: null, max: null }
}

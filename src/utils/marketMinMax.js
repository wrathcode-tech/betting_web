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
    const minS = formatStakeCompact(minRaw)
    const maxS = formatStakeCompact(maxRaw)
    if (minS !== '' && maxS !== '') return `MIN: ${minS} MAX: ${maxS}`
    if (minS !== '') return `MIN: ${minS}`
    if (maxS !== '') return `MAX: ${maxS}`
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
    return minMaxFromObject(market) || minMaxFromObject(payloadFallback) || ''
}

/**
 * Socket/API odds root ya event config se numeric min/max stake (place-bet validation).
 * @param {Record<string, unknown>|null|undefined} obj
 * @returns {{ min: number|null, max: number|null }}
 */
export function getNumericStakeLimitsFromPayload(obj) {
    if (!obj || typeof obj !== 'object') {
        return { min: null, max: null }
    }
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
    return { min, max }
}

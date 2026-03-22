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
    const minRaw =
        obj.minBet ??
        obj.min_bet ??
        obj.minimumBet ??
        obj.minimum_bet ??
        obj.minStake ??
        obj.min_stake ??
        obj.stakeMin ??
        obj.stake_min ??
        obj.min ??
        obj.minLimit ??
        obj.min_limit
    const maxRaw =
        obj.maxBet ??
        obj.max_bet ??
        obj.maximumBet ??
        obj.maximum_bet ??
        obj.maxStake ??
        obj.max_stake ??
        obj.stakeMax ??
        obj.stake_max ??
        obj.max ??
        obj.maxLimit ??
        obj.max_limit
    const minS = formatStakeCompact(minRaw)
    const maxS = formatStakeCompact(maxRaw)
    if (minS && maxS) return `MIN: ${minS} MAX: ${maxS}`
    if (minS) return `MIN: ${minS}`
    if (maxS) return `MAX: ${maxS}`
    return ''
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

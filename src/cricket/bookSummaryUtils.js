/**
 * Book / P&L helpers — bookmaker-style (user vs house).
 * Back win: profit (odds-1)*stake; back lose: loss stake.
 * Lay: inverted vs that selection winning.
 */

export function normMarketType(t) {
    return String(t || '')
        .toLowerCase()
        .replace(/[\s_-]+/g, '')
}

function normSel(s) {
    return String(s || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
}

/**
 * Merge open bets for this section + pending slip lines for same marketId & marketType.
 * @param {{
 *   openBetsInSection?: object[],
 *   selectedBets?: object[],
 *   slipStake?: number,
 *   marketId?: string|number,
 *   marketTypeApi?: string,
 * }} p
 * @returns {{ selection: string, odds: number, stake: number, betType: string }[]}
 */
export function collectBookBetsFromOpenAndSlip({
    openBetsInSection = [],
    selectedBets = [],
    slipStake,
    marketId,
    marketTypeApi,
}) {
    const mt = normMarketType(marketTypeApi)
    const mid = marketId != null && marketId !== '' ? String(marketId) : ''

    const fromOpen = (openBetsInSection || [])
        .map((b) => ({
            selection: String(b.selectionName ?? b.selection_name ?? '').trim(),
            odds: Number(b.odds ?? b.executedOdds ?? 0),
            stake: Number(b.stake) || 0,
            betType: String(b.betType ?? b.bet_type ?? 'back').toLowerCase(),
        }))
        .filter((x) => x.stake > 0 && x.odds >= 1.01)

    const fromSlip = []
    for (const b of selectedBets || []) {
        const p = b.placePayload
        if (!p || !mid || String(p.marketId) !== mid) continue
        if (normMarketType(p.marketType) !== mt) continue
        const st = Number(slipStake) || 0
        const o = Number(p.odds ?? b.odds) || 0
        if (st <= 0 || o < 1.01) continue
        fromSlip.push({
            selection: String(p.selectionName ?? b.betName ?? '').trim(),
            odds: o,
            stake: st,
            betType: String(p.betType ?? 'back').toLowerCase(),
        })
    }
    return [...fromOpen, ...fromSlip]
}

/**
 * Aggregate totals (naive: sum of per-bet upside if each won vs house, and full stake at risk).
 * @param {{ selection: string, odds: number, stake: number, betType?: string }[]} bets
 */
export function computeBookmakerTotals(bets) {
    let totalStake = 0
    let possibleProfitSum = 0
    for (const bet of bets || []) {
        const s = Number(bet.stake) || 0
        const o = Number(bet.odds) || 0
        if (s <= 0 || o < 1.01) continue
        totalStake += s
        const bt = String(bet.betType || 'back').toLowerCase()
        if (bt === 'lay') {
            possibleProfitSum += s
        } else {
            possibleProfitSum += (o - 1) * s
        }
    }
    return {
        totalStake,
        possibleProfit: possibleProfitSum,
        possibleLoss: -totalStake,
    }
}

/**
 * Mutually exclusive outcomes: P/L if that selection wins (others lose).
 * @param {{ selection: string, odds: number, stake: number, betType?: string }[]} bets
 * @returns {{ outcome: string, pl: number }[]}
 */
export function computeOutcomePlTable(bets) {
    if (!bets?.length) return []
    const keys = [...new Set(bets.map((b) => normSel(b.selection)))].filter(Boolean)
    return keys.map((winningNorm) => {
        let pl = 0
        const displayLabel =
            bets.find((b) => normSel(b.selection) === winningNorm)?.selection || winningNorm
        for (const bet of bets) {
            const bsel = normSel(bet.selection)
            const s = Number(bet.stake) || 0
            const o = Number(bet.odds) || 0
            if (s <= 0 || o < 1.01) continue
            const bt = String(bet.betType || 'back').toLowerCase()
            if (bt === 'back') {
                if (bsel === winningNorm) pl += s * (o - 1)
                else pl -= s
            } else {
                if (bsel === winningNorm) pl -= s * (o - 1)
                else pl += s
            }
        }
        return { outcome: displayLabel, pl }
    })
}

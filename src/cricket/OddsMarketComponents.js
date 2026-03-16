import React from 'react'

/**
 * Show Back price or lock. Use when runner.b1 != null and valid (not 0) to show price; else lock.
 */
export const BackPriceCell = React.memo(function BackPriceCell({
    odds,
    size,
    locked,
    disabled,
    selected,
    onClick,
    formatSize,
}) {
    if (locked) {
        return (
            <td className="odds_section_cell odds_section_cell_back">
                <span className="odds_section_locked"><i className="ri-lock-line" aria-hidden /></span>
            </td>
        )
    }
    return (
        <td className="odds_section_cell odds_section_cell_back">
            <button
                type="button"
                disabled={disabled}
                className={`odds_section_btn odds_section_back ${selected ? 'selected' : ''}`}
                onClick={onClick}
            >
                <span className="odds_val">{odds}</span>
                <span className="odds_size">{formatSize ? formatSize(size) : size ?? ''}</span>
            </button>
        </td>
    )
})

/**
 * Show Lay price or lock. Use when runner.l1 != null and valid (not 0) to show price; else lock.
 */
export const LayPriceCell = React.memo(function LayPriceCell({
    odds,
    size,
    locked,
    disabled,
    selected,
    onClick,
    formatSize,
}) {
    if (locked) {
        return (
            <td className="odds_section_cell odds_section_cell_lay">
                <span className="odds_section_locked"><i className="ri-lock-line" aria-hidden /></span>
            </td>
        )
    }
    return (
        <td className="odds_section_cell odds_section_cell_lay">
            <button
                type="button"
                disabled={disabled}
                className={`odds_section_btn odds_section_lay ${selected ? 'selected' : ''}`}
                onClick={onClick}
            >
                <span className="odds_val">{odds}</span>
                <span className="odds_size">{formatSize ? formatSize(size) : size ?? ''}</span>
            </button>
        </td>
    )
})

/**
 * Single runner row: market name + optional indicator + back cells + lay cells.
 * Renders one <tr>. Used with market.runners (or oddDatas).
 */
export const OddsRunner = React.memo(function OddsRunner({
    runner,
    runnerIndex,
    sectionKey,
    marketName,
    marketId,
    marketTypeApi,
    isOpen,
    isOddsLocked,
    formatOddsSize,
    gameId,
    eventName,
    sportName,
    onBetClick,
    isBetSelected,
    backCells,
    layCells,
    indicatorContent,
}) {
    const name = runner.rname ?? runner.selectionName ?? runner.name ?? ''
    const selId = runner.selectionId ?? runner.sid

    return (
        <tr>
            <td className="odds_section_market_name">{name}</td>
            <td className="odds_section_indicator_cell">{indicatorContent}</td>
            {backCells.map((cell, cIdx) => {
                const locked = isOddsLocked(cell.odds)
                const oddsStr = String(cell.odds ?? '')
                const placePayload = !locked && isOpen && gameId && eventName && marketId && (selId != null)
                    ? { sport: sportName, gameId, eventName, marketType: marketTypeApi, marketId: String(marketId), selectionId: String(selId), selectionName: name, betType: 'back', odds: parseFloat(oddsStr) || 0 }
                    : null
                return (
                    <BackPriceCell
                        key={cIdx}
                        odds={cell.odds}
                        size={cell.size}
                        locked={locked}
                        disabled={!isOpen}
                        selected={isBetSelected(name, marketName, oddsStr, `odds-${sectionKey}-${runnerIndex}-back-${cIdx}`)}
                        onClick={() => placePayload && onBetClick(name, marketName, oddsStr, `odds-${sectionKey}-${runnerIndex}-back-${cIdx}`, placePayload)}
                        formatSize={formatOddsSize}
                    />
                )
            })}
            {layCells.map((cell, cIdx) => {
                const locked = isOddsLocked(cell.odds)
                const oddsStr = String(cell.odds ?? '')
                const placePayload = !locked && isOpen && gameId && eventName && marketId && (selId != null)
                    ? { sport: sportName, gameId, eventName, marketType: marketTypeApi, marketId: String(marketId), selectionId: String(selId), selectionName: name, betType: 'lay', odds: parseFloat(oddsStr) || 0 }
                    : null
                return (
                    <LayPriceCell
                        key={cIdx}
                        odds={cell.odds}
                        size={cell.size}
                        locked={locked}
                        disabled={!isOpen}
                        selected={isBetSelected(name, marketName, oddsStr, `odds-${sectionKey}-${runnerIndex}-lay-${cIdx}`)}
                        onClick={() => placePayload && onBetClick(name, marketName, oddsStr, `odds-${sectionKey}-${runnerIndex}-lay-${cIdx}`, placePayload)}
                        formatSize={formatOddsSize}
                    />
                )
            })}
        </tr>
    )
})

/**
 * Wrapper for an odds section: header + table with thead (Market, Back, Lay).
 * Children should be tbody content (e.g. OddsRunner rows).
 */
export function OddsMarket({ title, icon, minMax, headerRight, children, className = '' }) {
    return (
        <div className={`odds_section_block ${className}`}>
            <div className="odds_section_header">
                <span className="odds_section_title"><i className={icon} aria-hidden /> {title}</span>
                <div className="odds_section_header_right d-flex align-items-center gap-2 flex-wrap">
                    <span className="odds_section_limits">{minMax}</span>
                    {headerRight}
                </div>
            </div>
            <div className="odds_section_table_wrap">
                <table className="odds_section_table">
                    <thead>
                        <tr>
                            <th>Market</th>
                            <th className="odds_section_indicator_th" aria-label="Spread / Value" />
                            <th colSpan={3}>Back</th>
                            <th colSpan={3}>Lay</th>
                        </tr>
                    </thead>
                    <tbody>{children}</tbody>
                </table>
            </div>
        </div>
    )
}

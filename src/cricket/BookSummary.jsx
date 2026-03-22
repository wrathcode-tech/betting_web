import React, { useMemo, useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { computeBookmakerTotals, computeOutcomePlTable } from './bookSummaryUtils'
import './BookSummary.css'

function formatRupee(n) {
    const x = Number(n)
    if (!Number.isFinite(x)) return '₹0'
    const sign = x > 0 ? '+' : ''
    return `${sign}₹${Math.abs(x).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

const POPOVER_MIN_W = 260
const POPOVER_MAX_W = 320
const GAP = 8

function clampPopoverPosition(left, top, popoverWidth, popoverHeightEstimate = 200) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 400
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    let l = left
    let t = top
    l = Math.max(GAP, Math.min(l, vw - popoverWidth - GAP))
    t = Math.max(GAP, Math.min(t, vh - popoverHeightEstimate - GAP))
    return { left: l, top: t }
}

/**
 * Bookmaker-style book: stake, possible profit / loss, optional per-outcome P/L.
 * Popover renders via portal (fixed) so parent overflow:hidden does not clip it.
 */
export default function BookSummary({
    marketTitle,
    bets = [],
    showOutcomeBreakdown = true,
    buttonClassName = '',
    wrapClassName = '',
}) {
    const [open, setOpen] = useState(false)
    const wrapRef = useRef(null)
    const popoverRef = useRef(null)
    const [popoverStyle, setPopoverStyle] = useState({ top: 0, left: 0, width: POPOVER_MIN_W })

    const positionPopover = useCallback(() => {
        const el = wrapRef.current
        if (!el || typeof window === 'undefined') return
        const r = el.getBoundingClientRect()
        const popoverWidth = Math.min(POPOVER_MAX_W, Math.max(POPOVER_MIN_W, r.width + 120))
        let left = r.right - popoverWidth
        const top = r.bottom + GAP
        const { left: L, top: T } = clampPopoverPosition(left, top, popoverWidth)
        setPopoverStyle({ top: T, left: L, width: popoverWidth })
    }, [])

    useLayoutEffect(() => {
        if (!open) return
        positionPopover()
    }, [open, positionPopover])

    useEffect(() => {
        if (!open) return undefined
        const onScrollResize = () => positionPopover()
        window.addEventListener('scroll', onScrollResize, true)
        window.addEventListener('resize', onScrollResize)
        return () => {
            window.removeEventListener('scroll', onScrollResize, true)
            window.removeEventListener('resize', onScrollResize)
        }
    }, [open, positionPopover])

    useEffect(() => {
        if (!open) return undefined

        const onDoc = (e) => {
            const t = e.target
            if (wrapRef.current?.contains(t) || popoverRef.current?.contains(t)) return
            setOpen(false)
        }

        const id = window.setTimeout(() => {
            document.addEventListener('mousedown', onDoc)
        }, 0)

        return () => {
            clearTimeout(id)
            document.removeEventListener('mousedown', onDoc)
        }
    }, [open])

    const totals = useMemo(() => computeBookmakerTotals(bets), [bets])
    const outcomeRows = useMemo(
        () => (showOutcomeBreakdown ? computeOutcomePlTable(bets) : []),
        [bets, showOutcomeBreakdown]
    )

    const btnClass = ['book_summary_btn', buttonClassName].filter(Boolean).join(' ')
    const wrapClass = ['book_summary_wrap', wrapClassName].filter(Boolean).join(' ')

    const popoverContent = open && (
        <div
            ref={popoverRef}
            className="book_summary_popover book_summary_popover--portal"
            style={{
                position: 'fixed',
                top: popoverStyle.top,
                left: popoverStyle.left,
                width: popoverStyle.width,
                zIndex: 10060,
            }}
            role="dialog"
            aria-label={`Book — ${marketTitle}`}
            onClick={(e) => e.stopPropagation()}
        >
            <h4 className="book_summary_popover_title">Market: {marketTitle}</h4>
            {bets.length === 0 ? (
                <p className="book_summary_empty">No bets placed</p>
            ) : (
                <>
                    <div className="book_summary_row">
                        <span className="book_summary_row_label">Total Stake</span>
                        <span className="book_summary_row_val">
                            ₹{totals.totalStake.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="book_summary_row">
                        <span className="book_summary_row_label">Possible Profit</span>
                        <span className="book_summary_row_val book_summary_row_val--profit">
                            {formatRupee(totals.possibleProfit)}
                        </span>
                    </div>
                    <div className="book_summary_row">
                        <span className="book_summary_row_label">Possible Loss</span>
                        <span className="book_summary_row_val book_summary_row_val--loss">
                            {formatRupee(totals.possibleLoss)}
                        </span>
                    </div>
                    {showOutcomeBreakdown && outcomeRows.length > 0 && (
                        <table className="book_summary_table">
                            <thead>
                                <tr>
                                    <th>Outcome</th>
                                    <th>P/L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outcomeRows.map((row) => (
                                    <tr key={row.outcome}>
                                        <td>{row.outcome}</td>
                                        <td
                                            className={
                                                row.pl >= 0
                                                    ? 'book_summary_row_val--profit'
                                                    : 'book_summary_row_val--loss'
                                            }
                                        >
                                            {formatRupee(row.pl)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    )

    return (
        <>
            <div className={wrapClass} ref={wrapRef}>
                <button
                    type="button"
                    className={btnClass}
                    onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setOpen((v) => !v)
                    }}
                    aria-expanded={open}
                >
                    Book
                </button>
            </div>
            {typeof document !== 'undefined' && popoverContent ? createPortal(popoverContent, document.body) : null}
        </>
    )
}

import React, { useCallback, useRef, useEffect } from 'react'
import './DateFilter.css'

/**
 * Reusable date range filter: From Date | To Date | Apply
 *
 * - Parent keeps fromDate, toDate state and applied dates; filtering/fetch runs only on Apply.
 * - Validation: From Date cannot be greater than To Date (Apply is disabled or shows error).
 * - onApply(fromDate, toDate) is called with current input values when Apply is clicked.
 * - Refs synced from props (useEffect) and on change (onChange) so Apply always gets latest dates.
 */
export default function DateFilter({
  fromDate = '',
  toDate = '',
  onFromDateChange,
  onToDateChange,
  onApply,
  applyButtonLabel = 'Apply',
  loading = false,
  showWrapper = true,
  className = '',
  fromInputId,
  toInputId,
}) {
  const fromRef = useRef(fromDate)
  const toRef = useRef(toDate)
  const onApplyRef = useRef(onApply)
  onApplyRef.current = onApply

  useEffect(() => { fromRef.current = fromDate }, [fromDate])
  useEffect(() => { toRef.current = toDate }, [toDate])

  const handleFromChange = useCallback(
    (e) => {
      const v = e.target.value
      fromRef.current = v
      onFromDateChange?.(v)
    },
    [onFromDateChange]
  )

  const handleToChange = useCallback(
    (e) => {
      const v = e.target.value
      toRef.current = v
      onToDateChange?.(v)
    },
    [onToDateChange]
  )

  const handleApply = useCallback(() => {
    const from = fromRef.current ?? ''
    const to = toRef.current ?? ''
    if (from && to && from > to) return
    onApplyRef.current?.(from, to)
  }, [])

  const from = fromRef.current || ''
  const to = toRef.current || ''
  const invalidRange = from && to && from > to

  return (
    <div className={`date_filter_root ${className}`.trim()}>
      <div className="date_range_picker">
        {showWrapper ? (
          <>
            <div className="date_input_wrapper">
              <input
                type="date"
                className="date_input"
                value={fromDate}
                onChange={handleFromChange}
                max={toDate || undefined}
                aria-label="From date"
                id={fromInputId}
              />
              <i className="ri-arrow-down-s-line date_arrow" aria-hidden />
            </div>
            <span className="date_separator">to</span>
            <div className="date_input_wrapper">
              <input
                type="date"
                className="date_input"
                value={toDate}
                onChange={handleToChange}
                min={fromDate || undefined}
                aria-label="To date"
                id={toInputId}
              />
              <i className="ri-arrow-down-s-line date_arrow" aria-hidden />
            </div>
          </>
        ) : (
          <>
            <input
              type="date"
              className="date_input"
              value={fromDate}
              onChange={handleFromChange}
              max={toDate || undefined}
              aria-label="From date"
              id={fromInputId}
            />
            <span className="date_separator">to</span>
            <input
              type="date"
              className="date_input"
              value={toDate}
              onChange={handleToChange}
              min={fromDate || undefined}
              aria-label="To date"
              id={toInputId}
            />
          </>
        )}
      </div>
      {invalidRange && (
        <span className="date_filter_validation" role="alert">
          From date cannot be after To date
        </span>
      )}
      <button
        type="button"
        className="deposit_btn_style btn_apply"
        onClick={handleApply}
        disabled={loading || invalidRange}
        aria-label="Apply date filter"
      >
        {loading ? 'Loading...' : applyButtonLabel}
      </button>
    </div>
  )
}

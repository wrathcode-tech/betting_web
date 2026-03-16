import React, { useCallback, useState } from 'react';
import './DateRangePicker.css';

/**
 * Date range picker: From date, To date, Apply button.
 * onApply(from, to) with YYYY-MM-DD strings; invalid range (from > to) disables Apply.
 */
export default function DateRangePicker({
  fromDate = '',
  toDate = '',
  onFromDateChange,
  onToDateChange,
  onApply,
  applyLabel = 'Apply',
  loading = false,
  className = '',
}) {
  const [from, setFrom] = useState(fromDate);
  const [to, setTo] = useState(toDate);
  React.useEffect(function () {
    setFrom(fromDate);
    setTo(toDate);
  }, [fromDate, toDate]);

  const handleFromChange = useCallback(
    (e) => {
      const v = e.target.value;
      setFrom(v);
      onFromDateChange?.(v);
    },
    [onFromDateChange]
  );

  const handleToChange = useCallback(
    (e) => {
      const v = e.target.value;
      setTo(v);
      onToDateChange?.(v);
    },
    [onToDateChange]
  );

  const invalidRange = from && to && from > to;

  const handleApply = useCallback(() => {
    if (invalidRange) return;
    onApply?.(from || '', to || '');
  }, [from, to, invalidRange, onApply]);

  return (
    <div className={'history_date_range_picker ' + (className || '')}>
      <input
        type="date"
        className="history_date_input"
        value={from}
        onChange={handleFromChange}
        max={to || undefined}
        aria-label="From date"
      />
      <span className="history_date_sep">to</span>
      <input
        type="date"
        className="history_date_input"
        value={to}
        onChange={handleToChange}
        min={from || undefined}
        aria-label="To date"
      />
      <button
        type="button"
        className="history_btn_apply"
        onClick={handleApply}
        disabled={loading || invalidRange}
        aria-label="Apply date filter"
      >
        {loading ? '...' : applyLabel}
      </button>
      {invalidRange && (
        <span className="history_date_error" role="alert">
          From cannot be after To
        </span>
      )}
    </div>
  );
}

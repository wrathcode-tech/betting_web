import React from 'react';
import './FilterBar.css';

export default function FilterBar({
  filters = [],
  filterValues = {},
  onFilterChange,
  sortOptions = [],
  sortValue = '',
  onSortChange,
  className = '',
}) {
  return (
    <div className={'history_filter_bar ' + (className || '')}>
      {filters.map(function (f) {
        return (
          <label key={f.key} className="history_filter_label">
            <span className="history_filter_label_text">{f.label}</span>
            <select
              className="history_filter_select"
              value={filterValues[f.key] ?? ''}
              onChange={function (e) { if (onFilterChange) onFilterChange(f.key, e.target.value); }}
              aria-label={f.label}
            >
              <option value="">All</option>
              {(f.options || []).map(function (opt) {
                return <option key={opt.value} value={opt.value}>{opt.label}</option>;
              })}
            </select>
          </label>
        );
      })}
      {sortOptions.length > 0 && (
        <label className="history_filter_label">
          <span className="history_filter_label_text">Sort</span>
          <select
            className="history_filter_select"
            value={sortValue}
            onChange={function (e) { if (onSortChange) onSortChange(e.target.value); }}
            aria-label="Sort by"
          >
            {sortOptions.map(function (opt) {
              return <option key={opt.value} value={opt.value}>{opt.label}</option>;
            })}
          </select>
        </label>
      )}
    </div>
  );
}

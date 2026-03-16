import React from 'react';
import './HistoryTable.css';

export default function HistoryTable({ columns = [], data = [], loading = false, emptyMessage = 'No history found.', className = '' }) {
  if (loading) {
    return (
      <div className={'history_table_wrap ' + (className || '')}>
        <div className="history_table_loading">
          <span className="history_spinner" aria-hidden />
          <span>Loading...</span>
        </div>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className={'history_table_wrap ' + (className || '')}>
        <div className="history_table_empty">{emptyMessage}</div>
      </div>
    );
  }
  return (
    <div className={'history_table_wrap ' + (className || '')}>
      <div className="history_table_scroll">
        <table className="history_table" role="grid">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.id ?? row._id ?? idx}>
                {columns.map((col) => {
                  const value = row[col.key];
                  const cell = col.render ? col.render(value, row) : (value != null ? String(value) : '—');
                  return <td key={col.key}>{cell}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React from 'react'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import '../ProfileTransactions/profileTransactions.css'

export default function StatementPage({ title, columns, data, emptyMessage = 'No data to display.' }) {
  return (
    <>
      <Header />
      <div className="dashboard_page">
        <div className="container">
          <div className="profile_transactions_section">
            <div className="transactions_header">
              <h1>{title}</h1>
              <div className="transactions_header_right">
                <div className="date_range_picker">
                  <div className="date_input_wrapper">
                    <input type="date" className="date_input" defaultValue="2025-05-30" />
                    <i className="ri-arrow-down-s-line date_arrow" />
                  </div>
                  <div className="date_input_wrapper">
                    <input type="date" className="date_input" defaultValue="2025-06-13" />
                    <i className="ri-arrow-down-s-line date_arrow" />
                  </div>
                </div>
                <select className="transactions_filter_select deposit_btn_style">
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            {data.length === 0 ? (
              <p className="text-white-50">{emptyMessage}</p>
            ) : (
              <>
                <div className="transactions_table_wrapper">
                  <table className="transactions_table">
                    <thead>
                      <tr>
                        {columns.map((col) => (
                          <th key={col.key}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row) => (
                        <tr key={row.id}>
                          {columns.map((col) => {
                            const val = row[col.key]
                            const isStatus = col.type === 'status'
                            const isAmount = col.type === 'amount'
                            return (
                              <td key={col.key}>
                                {isStatus && row.statusRaw != null ? (
                                  <span className={`status_badge status_${String(row.statusRaw).toLowerCase()}`}>
                                    {val}
                                  </span>
                                ) : isAmount ? (
                                  <span className="transaction_value amount_value">{val}</span>
                                ) : (
                                  val
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="transactions_cards_wrapper">
                  {data.map((row) => (
                    <div key={row.id} className="transaction_card">
                      <div className="transaction_card_header">
                        <div className="transaction_card_title">
                          <h3>{row.cardTitle != null ? row.cardTitle : row[columns[0]?.key]}</h3>
                          {row.statusRaw != null && (
                            <span className={`status_badge status_${String(row.statusRaw).toLowerCase()}`}>
                              {row[columns.find((c) => c.type === 'status')?.key]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="transaction_card_body">
                        {columns.map((col) => (
                          <div key={col.key} className="transaction_card_row">
                            <span className="transaction_label">{col.label}</span>
                            <span className={col.type === 'amount' ? 'transaction_value amount_value' : 'transaction_value'}>
                              {row[col.key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="transactions_pagination">
                  <button type="button" className="pagination_btn" disabled>Previous</button>
                  <span className="pagination_info">Page 1 of 1 ({data.length} total)</span>
                  <button type="button" className="pagination_btn" disabled>Next</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  )
}

import React, { useState, useEffect, useCallback } from 'react'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import '../ProfileTransactions/ProfileTransactions.css'

const COLUMNS = [
  { key: 'time', label: 'Time' },
  { key: 'betId', label: 'Bet ID' },
  { key: 'event', label: 'Event' },
  { key: 'market', label: 'Market' },
  { key: 'selection', label: 'Selection' },
  { key: 'odds', label: 'Odds' },
  { key: 'stake', label: 'Stake' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'result', label: 'Result', type: 'status' },
  { key: 'profitLoss', label: 'P&L', type: 'amount' },
]

function formatDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function mapBetToRow(b) {
  const status = (b.status || '').toLowerCase()
  const result = (b.result || 'pending').toLowerCase()
  const pl = b.profitLoss != null ? Number(b.profitLoss) : null
  const plStr = pl != null ? (pl >= 0 ? `₹${pl.toLocaleString()}` : `−₹${Math.abs(pl).toLocaleString()}`) : '—'
  return {
    id: b._id,
    betId: b._id?.slice(-8) || '—',
    time: formatDate(b.createdAt),
    createdAt: b.createdAt,
    event: b.eventName || '—',
    market: b.marketType || '—',
    selection: b.selectionName || '—',
    odds: b.odds != null ? Number(b.odds) : '—',
    stake: b.stake != null ? `₹${Number(b.stake).toLocaleString()}` : '—',
    status: b.status || '—',
    statusRaw: status,
    result: b.result || '—',
    resultRaw: result,
    profitLoss: plStr,
    cardTitle: b.eventName || b._id,
  }
}

export default function BetHistory() {
  const [bets, setBets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sport, setSport] = useState('')
  const [result, setResult] = useState('')

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (sport) params.sport = sport
      if (result) params.result = result
      const res = await AuthService.sportsbookBetHistory(params)
      const data = res?.data ?? res
      const list = data?.bets ?? []
      setBets(list.map(mapBetToRow))
      setPagination(data?.pagination ?? { page: 1, limit: 20, total: list.length, totalPages: 1 })
    } catch {
      setBets([])
    } finally {
      setLoading(false)
    }
  }, [sport, result])

  useEffect(() => {
    fetchHistory(1)
  }, [fetchHistory])

  const searchLower = (search || '').trim().toLowerCase()
  const data = searchLower
    ? bets.filter((row) => {
        const event = (row.event || '').toLowerCase()
        const betId = (row.betId || '').toLowerCase()
        const market = (row.market || '').toLowerCase()
        const selection = (row.selection || '').toLowerCase()
        return event.includes(searchLower) || betId.includes(searchLower) || market.includes(searchLower) || selection.includes(searchLower)
      })
    : bets

  return (
    <>
      <Header />
      <div className="dashboard_page">
        <div className="container-fluid">
          <div className="profile_transactions_section">
            <div className="transactions_header">
              <h1>Bet History</h1>
              <div className="transactions_header_right">
                <input
                  type="text"
                  placeholder="Search event, bet ID, market..."
                  className="transactions_search_input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search"
                />
                <select
                  className="transactions_filter_select deposit_btn_style"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                >
                  <option value="">All Sports</option>
                  <option value="cricket">Cricket</option>
                  <option value="soccer">Football</option>
                  <option value="tennis">Tennis</option>
                </select>
                <select
                  className="transactions_filter_select deposit_btn_style"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                >
                  <option value="">All Results</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="void">Void</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p className="empty_state_message">Loading...</p>
            ) : data.length === 0 ? (
              <p className="empty_state_message">No bet history.</p>
            ) : (
              <>
                <div className="transactions_table_wrapper">
                  <table className="transactions_table">
                    <thead>
                      <tr>
                        {COLUMNS.map((col) => (
                          <th key={col.key}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row) => (
                        <tr key={row.id}>
                          {COLUMNS.map((col) => {
                            const val = col.key === 'result' ? row.result : row[col.key]
                            const raw = col.key === 'result' ? row.resultRaw : row.statusRaw
                            const isStatus = col.type === 'status'
                            const isAmount = col.type === 'amount'
                            return (
                              <td key={col.key}>
                                {isStatus && raw != null ? (
                                  <span className={`status_badge status_${String(raw).toLowerCase()}`}>
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
                          <h3>{row.cardTitle}</h3>
                          <span className={`status_badge status_${String(row.resultRaw || row.statusRaw).toLowerCase()}`}>
                            {row.result || row.status}
                          </span>
                        </div>
                      </div>
                      <div className="transaction_card_body">
                        {COLUMNS.map((col) => (
                          <div key={col.key} className="transaction_card_row">
                            <span className="transaction_label">{col.label}</span>
                            <span className={col.type === 'amount' ? 'transaction_value amount_value' : 'transaction_value'}>
                              {col.key === 'result' ? row.result : row[col.key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="transactions_pagination">
                  <button
                    type="button"
                    className="pagination_btn"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchHistory(pagination.page - 1)}
                  >
                    Previous
                  </button>
                  <span className="pagination_info">
                    Page {pagination.page} of {pagination.totalPages || 1} ({pagination.total ?? data.length} total)
                  </span>
                  <button
                    type="button"
                    className="pagination_btn"
                    disabled={pagination.page >= (pagination.totalPages || 1)}
                    onClick={() => fetchHistory(pagination.page + 1)}
                  >
                    Next
                  </button>
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

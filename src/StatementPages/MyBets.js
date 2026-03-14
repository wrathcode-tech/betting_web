import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import LossCutIndicator from '../customComponents/LossCutIndicator'
import '../ProfileTransactions/profileTransactions.css'
import './MyBets.css'
import { alertErrorMessage, alertSuccessMessage } from '../customComponents/CustomAlertMessage'

const COLUMNS = [
  { key: 'time', label: 'Time' },
  { key: 'betId', label: 'Bet ID' },
  { key: 'event', label: 'Event' },
  { key: 'market', label: 'Market' },
  { key: 'selection', label: 'Selection' },
  { key: 'betType', label: 'Type' },
  { key: 'odds', label: 'Odds' },
  { key: 'stake', label: 'Stake' },
  { key: 'liability', label: 'Liability', type: 'amount' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'potentialWin', label: 'Potential Win', type: 'amount' },
  { key: 'actions', label: 'Actions' },
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
  const betId = b._id ?? b.id
  const statusRaw = (b.status || 'open').toLowerCase()
  return {
    id: betId,
    betId: (betId && String(betId).slice(-8)) || '—',
    time: formatDate(b.createdAt),
    event: b.eventName || '—',
    market: b.marketName || b.marketType || '—',
    selection: b.selectionName || '—',
    betType: b.betType || '—',
    odds: b.odds != null ? Number(b.odds) : (b.executedOdds != null ? Number(b.executedOdds) : '—'),
    stake: b.stake != null ? `₹${Number(b.stake).toLocaleString()}` : '—',
    liability: b.liability != null ? `₹${Number(b.liability).toLocaleString()}` : '—',
    status: b.status || 'open',
    statusRaw,
    potentialWin: b.potentialProfit != null ? `₹${Number(b.potentialProfit).toLocaleString()}` : '—',
    cardTitle: b.eventName || betId,
    _raw: { ...b, _id: betId },
  }
}

export default function MyBets() {
  const navigate = useNavigate()
  const [bets, setBets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [exposure, setExposure] = useState(null)
  const [currentLoss, setCurrentLoss] = useState(null)
  const [lossLimit, setLossLimit] = useState(null)
  const [cancelId, setCancelId] = useState(null)

  const goToOpenBets = () => navigate('/cricket', { state: { activeTab: 'open-bets' } })

  const fetchOpen = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await AuthService.sportsbookOpenBets({ page, limit: 20 })
      const data = res?.data ?? res
      const list = data?.bets ?? []
      setBets(list.map(mapBetToRow))
      setPagination(data?.pagination ?? { page: 1, limit: 20, total: list.length, totalPages: 1 })
    } catch {
      setBets([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchExposure = useCallback(async () => {
    try {
      const res = await AuthService.sportsbookExposure()
      const data = res?.data ?? res
      setExposure(data?.totalExposure ?? null)
      setCurrentLoss(data?.current_loss ?? data?.currentLoss ?? data?.totalExposure ?? null)
    } catch {
      setExposure(null)
      setCurrentLoss(null)
    }
  }, [])

  const fetchLossLimit = useCallback(async () => {
    try {
      const res = await AuthService.sportsbookGetLossLimit()
      const data = res?.data ?? res
      setLossLimit(data?.dailyLossLimit ?? null)
    } catch {
      setLossLimit(null)
    }
  }, [])

  useEffect(() => {
    fetchOpen(1)
    fetchExposure()
    fetchLossLimit()
  }, [fetchOpen, fetchExposure, fetchLossLimit])

  const handleCancel = async (betId) => {
    if (!betId) return
    setCancelId(betId)
    try {
      const res = await AuthService.sportsbookCancelBet(betId)
      const ok = res?.success === true || (res && res.success !== false && !res?.message)
      if (ok) {
        await fetchOpen(pagination.page)
        fetchExposure()
        fetchLossLimit()
        const successMsg = res?.data?.message ?? res?.message
        if (successMsg) alertSuccessMessage(successMsg)
      } else {
        const errMsg = res?.data?.message ?? res?.message
        if (errMsg) alertErrorMessage(errMsg)
      }
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message
      if (msg) alertErrorMessage(msg)
    } finally {
      setCancelId(null)
    }
  }

  const searchLower = (search || '').trim().toLowerCase()
  const filteredBets = searchLower
    ? bets.filter((row) => {
        const event = String(row.event || '').toLowerCase()
        const betId = String(row.betId || '').toLowerCase()
        const market = String(row.market || '').toLowerCase()
        const selection = String(row.selection || '').toLowerCase()
        const betType = String(row.betType || '').toLowerCase()
        return (
          event.includes(searchLower) ||
          betId.includes(searchLower) ||
          market.includes(searchLower) ||
          selection.includes(searchLower) ||
          betType.includes(searchLower)
        )
      })
    : bets

  const data = filteredBets.map((row) => ({
    ...row,
    actions: row.statusRaw === 'open' && row.id ? (
      <button
        type="button"
        className="mybets_cancel_btn"
        onClick={() => handleCancel(row.id)}
        disabled={cancelId === row.id}
      >
        {cancelId === row.id ? 'Cancelling...' : 'Cancel'}
      </button>
    ) : <span className="mybets_bet_closed">BET CLOSED</span>,
  }))

  return (
    <>
      <Header />
      <div className="dashboard_page">
        <div className="container-fluid">
          <div className="profile_transactions_section">
            <div className="transactions_header">
              <h1>My Bets (Open)</h1>
              <div className="transactions_header_right">
                <input
                  type="text"
                  placeholder="Search event, bet ID, market..."
                  className="transactions_search_input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search"
                />
                {exposure != null && (
                  <span className="transaction_value amount_value" style={{ marginRight: 12 }}>
                    Exposure: ₹{Number(exposure).toLocaleString()}
                  </span>
                )}
                <button type="button" className="mybets_cashout_btn" onClick={goToOpenBets}>
                  Cash Out
                </button>
              </div>
            </div>

            {(currentLoss != null || lossLimit != null || exposure != null) && (
              <LossCutIndicator
                currentLoss={currentLoss ?? exposure ?? 0}
                lossLimit={lossLimit}
                onSetLimit={async (amount) => {
                  const res = await AuthService.sportsbookSetLossLimit(amount)
                  const ok = res?.success === true || (res && res.success !== false && !res?.message)
                  if (ok) {
                    await fetchLossLimit()
                    const msg = res?.data?.message ?? res?.message
                    if (msg) alertSuccessMessage(msg)
                  } else {
                    const errMsg = res?.data?.message ?? res?.message
                    if (errMsg) alertErrorMessage(errMsg)
                  }
                }}
              />
            )}

            {loading ? (
              <p className="text-white-50">Loading...</p>
            ) : bets.length === 0 ? (
              <p className="text-white-50">No open bets.</p>
            ) : data.length === 0 ? (
              <p className="text-white-50">No matches for your search.</p>
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
                            const val = row[col.key]
                            const isStatus = col.type === 'status'
                            const isAmount = col.type === 'amount'
                            return (
                              <td key={col.key}>
                                {col.key === 'actions' ? (
                                  row.statusRaw === 'open' ? (
                                    <div className="mybets_actions_cell">
                                      <button type="button" className="mybets_cashout_btn_sm" onClick={goToOpenBets}>
                                        Cash Out
                                      </button>
                                      <button
                                        type="button"
                                        className="mybets_cancel_btn"
                                        onClick={() => handleCancel(row.id)}
                                        disabled={cancelId === row.id}
                                      >
                                        {cancelId === row.id ? 'Cancelling...' : 'Cancel'}
                                      </button>
                                    </div>
                                  ) : (
                                    '—'
                                  )
                                ) : isStatus && row.statusRaw != null ? (
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
                          <h3>{row.cardTitle}</h3>
                          <span className={`status_badge status_${String(row.statusRaw).toLowerCase()}`}>
                            {row.status}
                          </span>
                        </div>
                      </div>
                      <div className="transaction_card_body">
                        {COLUMNS.filter((c) => c.key !== 'actions').map((col) => (
                          <div key={col.key} className="transaction_card_row">
                            <span className="transaction_label">{col.label}</span>
                            <span className={col.type === 'amount' ? 'transaction_value amount_value' : 'transaction_value'}>
                              {row[col.key]}
                            </span>
                          </div>
                        ))}
                        {row.statusRaw === 'open' && row.id && (
                          <div className="transaction_card_row transaction_card_actions">
                            <span className="transaction_label">Actions</span>
                            <div className="transaction_card_actions_btns">
                              <button type="button" className="mybets_cashout_btn_sm" onClick={goToOpenBets}>
                                Cash Out
                              </button>
                              <button
                                type="button"
                                className="mybets_cancel_btn"
                                onClick={() => handleCancel(row.id)}
                                disabled={cancelId === row.id}
                              >
                                {cancelId === row.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="transactions_pagination">
                  <button
                    type="button"
                    className="pagination_btn"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchOpen(pagination.page - 1)}
                  >
                    Previous
                  </button>
                  <span className="pagination_info">
                    Page {pagination.page} of {pagination.totalPages || 1} ({search ? `${data.length} of ${bets.length}` : (pagination.total ?? bets.length)} total)
                  </span>
                  <button
                    type="button"
                    className="pagination_btn"
                    disabled={pagination.page >= (pagination.totalPages || 1)}
                    onClick={() => fetchOpen(pagination.page + 1)}
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

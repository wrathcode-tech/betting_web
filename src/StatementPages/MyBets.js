import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import '../ProfileTransactions/ProfileTransactions.css'
import './MyBets.css'

const COLUMNS = [
  { key: 'time', label: 'Time' },
  { key: 'betId', label: 'Bet ID' },
  { key: 'sport', label: 'Sport' },
  { key: 'event', label: 'Event' },
  { key: 'market', label: 'Market' },
  { key: 'selection', label: 'Selection' },
  { key: 'betType', label: 'Type' },
  { key: 'odds', label: 'Odds' },
  { key: 'stake', label: 'Stake', type: 'amount' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'result', label: 'Result' },
  { key: 'profitLoss', label: 'P/L', type: 'amount' },
  { key: 'potentialWin', label: 'Potential Win', type: 'amount' },
  // { key: 'actions', label: 'Actions' },
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

function formatInrAmount(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return '—'
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** GET open-bets — backend shapes (same idea as CricketDetail parseOpenBetsFromResponse). */
function parseOpenBetsList(res) {
  const raw = res?.data ?? res
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.bets)) return raw.bets
  if (Array.isArray(raw?.data)) return raw.data
  if (Array.isArray(raw?.openBets)) return raw.openBets
  if (Array.isArray(raw?.records)) return raw.records
  return []
}

function pickBetId(b) {
  if (!b || typeof b !== 'object') return null
  const v = b._id ?? b.id ?? b.betId ?? b.bet_id
  if (v == null || v === '') return null
  return String(v)
}

/** POST cancel — kai backends 200 par sirf { message } bhejte hain, bina success: true. */
function normalizeCancelBetResponse(res) {
  if (!res || typeof res !== 'object') {
    return { ok: false, message: 'Invalid response' }
  }
  if (res.success === false) {
    return { ok: false, message: res.message || res.msg || res.error || 'Failed to cancel bet' }
  }
  if (res.success === true) {
    return { ok: true, message: res.message || res.msg || 'Bet cancelled' }
  }
  const inner = res.data
  if (inner && typeof inner === 'object') {
    if (inner.success === false) {
      return { ok: false, message: inner.message || inner.msg || res.message || 'Failed to cancel bet' }
    }
    if (inner.success === true) {
      return { ok: true, message: inner.message || inner.msg || res.message || 'Bet cancelled' }
    }
  }
  const st = String(res.status ?? '').toLowerCase()
  if (st === 'success' || st === 'ok') {
    return { ok: true, message: res.message || res.msg || 'Bet cancelled' }
  }
  if (res.error || res.errorCode) {
    return { ok: false, message: res.message || res.msg || 'Failed to cancel bet' }
  }
  const msg = res.message || res.msg
  if (msg && typeof msg === 'string') {
    if (/\b(cannot|fail|invalid|denied|error|unable|not allowed)\b/i.test(msg) && res.success !== true) {
      return { ok: false, message: msg }
    }
    return { ok: true, message: msg }
  }
  return { ok: true, message: 'Bet cancelled' }
}

/** Cancel tab sirf in statuses par (open + matched/pending jo kuch APIs deti hain). */
function isBetCancellableStatus(statusRaw) {
  const s = String(statusRaw || '').toLowerCase().trim()
  return s === 'open' || s === 'matched' || s === 'pending' || s === 'active'
}

function mapBetToRow(b) {
  const betId = pickBetId(b)
  const statusRaw = String(b.status || 'open').toLowerCase()
  const marketName = b.marketName != null && String(b.marketName).trim() !== '' ? String(b.marketName).trim() : ''
  const marketType = b.marketType != null && String(b.marketType).trim() !== '' ? String(b.marketType).trim() : ''
  const market =
    marketName && marketType ? `${marketName} (${marketType})` : marketName || marketType || '—'
  const oddsNum =
    b.odds != null
      ? Number(b.odds)
      : b.executedOdds != null
        ? Number(b.executedOdds)
        : b.requestedOdds != null
          ? Number(b.requestedOdds)
          : NaN
  const oddsDisplay = Number.isFinite(oddsNum) ? oddsNum.toFixed(2) : '—'
  const potential =
    b.potentialProfit != null
      ? b.potentialProfit
      : b.profitIfWin != null
        ? b.profitIfWin
        : b.returnIfWin != null && b.stake != null
          ? Number(b.returnIfWin) - Number(b.stake)
          : null

  return {
    id: betId,
    betId: (betId && String(betId).slice(-8)) || '—',
    time: formatDate(b.createdAt ?? b.created_at),
    sport: b.sport != null ? String(b.sport) : '—',
    event: b.eventName || b.event_name || '—',
    market,
    selection: b.selectionName || b.selection_name || '—',
    betType: b.betType || b.bet_type || '—',
    odds: oddsDisplay,
    stake: formatInrAmount(b.stake),
    status: b.status || 'open',
    statusRaw,
    result: b.result != null && String(b.result).trim() !== '' ? String(b.result) : '—',
    resultRaw: String(b.result || '').toLowerCase(),
    profitLoss: formatInrAmount(b.profitLoss ?? b.profit_loss),
    potentialWin: formatInrAmount(potential),
    cardTitle: b.eventName || b.event_name || betId,
    _raw: { ...b, _id: betId },
  }
}

export default function MyBets() {
  const navigate = useNavigate()
  const [bets, setBets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  const goToOpenBets = () => navigate('/cricket', { state: { activeTab: 'open-bets' } })

  const fetchOpen = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await AuthService.sportsbookOpenBets({ page, limit: 20 })
      const list = parseOpenBetsList(res)
      const pag = res?.pagination ?? res?.data?.pagination ?? (res?.data && typeof res.data === 'object' ? res.data.pagination : null)
      setBets(list.map(mapBetToRow).filter((row) => row.id))
      setPagination({
        page: pag?.page ?? 1,
        limit: pag?.limit ?? 20,
        total: pag?.total ?? pag?.totalRecords ?? list.length,
        totalPages: pag?.totalPages ?? 1,
      })
    } catch {
      setBets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOpen(1)
  }, [fetchOpen])

  const handleCancelBet = useCallback(async (betId) => {
    const id = betId != null && betId !== '' ? String(betId) : ''
    if (!id) {
      toast.error('Missing bet id — refresh the page and try again.')
      return
    }
    setCancellingId(id)
    try {
      const res = await AuthService.sportsbookCancelBet(id)
      const { ok, message } = normalizeCancelBetResponse(res)
      if (ok) {
        toast.success(message)
        await fetchOpen(pagination.page)
      } else {
        toast.error(message || 'Failed to cancel bet')
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.msg ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to cancel bet'
      toast.error(msg)
    } finally {
      setCancellingId(null)
    }
  }, [fetchOpen, pagination.page])

  const searchLower = (search || '').trim().toLowerCase()
  const filteredBets = searchLower
    ? bets.filter((row) => {
        const event = String(row.event || '').toLowerCase()
        const betId = String(row.betId || '').toLowerCase()
        const market = String(row.market || '').toLowerCase()
        const selection = String(row.selection || '').toLowerCase()
        const betType = String(row.betType || '').toLowerCase()
        const sport = String(row.sport || '').toLowerCase()
        const result = String(row.result || '').toLowerCase()
        return (
          event.includes(searchLower) ||
          betId.includes(searchLower) ||
          market.includes(searchLower) ||
          selection.includes(searchLower) ||
          betType.includes(searchLower) ||
          sport.includes(searchLower) ||
          result.includes(searchLower)
        )
      })
    : bets

  const data = filteredBets.map((row) => ({
    ...row,
    actions: isBetCancellableStatus(row.statusRaw) ? (
      '—'
    ) : (
      <span className="mybets_bet_closed">BET CLOSED</span>
    ),
    // Temporarily disabled Cash Out + Cancel
    // actions: isBetCancellableStatus(row.statusRaw) ? (
    //   <div className="mybets_actions_wrap">
    //     <button type="button" className="mybets_cashout_btn_sm" onClick={goToOpenBets}>
    //       Cash Out
    //     </button>
    //     <button
    //       type="button"
    //       className="mybets_cancel_btn_sm"
    //       onClick={() => handleCancelBet(row.id)}
    //       disabled={cancellingId === String(row.id)}
    //     >
    //       {cancellingId === String(row.id) ? 'Cancelling...' : 'Cancel'}
    //     </button>
    //   </div>
    // ) : <span className="mybets_bet_closed">BET CLOSED</span>,
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
                {/* Temporarily disabled header Cash Out
                <button type="button" className="mybets_cashout_btn" onClick={goToOpenBets}>
                  Cash Out
                </button>
                */}
              </div>
            </div>

            {loading ? (
              <p className="empty_state_message">Loading...</p>
            ) : bets.length === 0 ? (
              <p className="text-white-50">No open bets.</p>
            ) : data.length === 0 ? (
              <p className="empty_state_message">No matches for your search.</p>
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
                                    /* Temporarily disabled Cash Out + Cancel — was buttons for cancellable rows */
                                    '—'
                                ) : col.key === 'result' && row.resultRaw ? (
                                  <span className={`status_badge status_${String(row.resultRaw).replace(/\s+/g, '_')}`}>
                                    {val}
                                  </span>
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
                        {/* Temporarily disabled Cash Out + Cancel on cards
                        {isBetCancellableStatus(row.statusRaw) && (
                          <div className="transaction_card_row transaction_card_actions">
                            <span className="transaction_label">Actions</span>
                            <div className="transaction_card_actions_btns">
                              <button type="button" className="mybets_cashout_btn_sm" onClick={goToOpenBets}>
                                Cash Out
                              </button>
                              <button
                                type="button"
                                className="mybets_cancel_btn_sm"
                                onClick={() => handleCancelBet(row.id)}
                                disabled={cancellingId === String(row.id)}
                              >
                                {cancellingId === String(row.id) ? 'Cancelling...' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        )}
                        */}
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

import React, { useState, useEffect, useCallback } from 'react'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import '../ProfileTransactions/profileTransactions.css'
import './BettingProfitLoss.css'

function getDefaultFromDate() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function getDefaultToDate() {
  return new Date().toISOString().slice(0, 10)
}

/** Normalize API response: res.data or res, snake_case -> camelCase */
function normalizePnLData(res) {
  if (!res) return null
  const raw = res.data ?? res
  const d = typeof raw === 'object' ? raw : null
  if (!d) return null
  return {
    totalProfitLoss: d.totalProfitLoss ?? d.total_profit_loss ?? d.netPnl ?? d.net_pnl ?? null,
    totalBets: d.totalBets ?? d.total_bets ?? null,
    totalStake: d.totalStake ?? d.total_stake ?? null,
    totalWon: d.totalWon ?? d.total_won ?? null,
    totalLost: d.totalLost ?? d.total_lost ?? null,
    grossProfit: d.grossProfit ?? d.gross_profit ?? null,
    grossLoss: d.grossLoss ?? d.gross_loss ?? null,
    currency: d.currency ?? 'INR',
  }
}

function BettingProfitLoss() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sport, setSport] = useState('')
  const [from, setFrom] = useState(() => getDefaultFromDate())
  const [to, setTo] = useState(() => getDefaultToDate())

  const fetchPnL = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (sport) params.sport = sport
      if (from) params.from = from
      if (to) params.to = to
      const res = await AuthService.sportsbookProfitLoss(params)
      const normalized = normalizePnLData(res)
      setData(normalized)
    } catch (err) {
      setError(err?.message || 'Failed to load P&L data.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [sport, from, to])

  useEffect(() => {
    fetchPnL()
  }, [fetchPnL])

  const formatAmount = (n) => {
    if (n == null || n === '') return '—'
    const num = Number(n)
    if (!Number.isFinite(num)) return '—'
    if (num >= 0) return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return `−₹${Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatCount = (n) => {
    if (n == null || n === '') return '—'
    const num = Number(n)
    return Number.isFinite(num) ? num.toLocaleString('en-IN') : '—'
  }

  return (
    <>
      <Header />
      <div className="dashboard_page betting_profit_loss_page">
        <div className="container-fluid">
          <div className="profile_transactions_section">
            <div className="transactions_header">
              <h1>Betting Profit &amp; Loss</h1>
              <div className="transactions_header_right betting_pl_filters">
                <div className="date_range_picker">
                  <input
                    type="date"
                    className="date_input"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    max={to || undefined}
                  />
                  <span className="date_separator">to</span>
                  <input
                    type="date"
                    className="date_input"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    min={from || undefined}
                  />
                </div>
                <select
                  className="transactions_filter_select deposit_btn_style"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                >
                  <option value="">All Sports</option>
                  <option value="cricket">Cricket</option>
                  <option value="soccer">Soccer</option>
                  <option value="tennis">Tennis</option>
                </select>
                <button type="button" className="deposit_btn_style btn_apply" onClick={fetchPnL} disabled={loading}>
                  {loading ? 'Loading...' : 'Apply'}
                </button>
              </div>
            </div>

            {error && (
              <div className="betting_pl_error">
                <p>{error}</p>
                <button type="button" className="deposit_btn_style" onClick={fetchPnL}>Retry</button>
              </div>
            )}

            {loading && !data ? (
              <div className="betting_pl_loading">
                <p>Loading P&L...</p>
              </div>
            ) : !data && !error ? (
              <div className="betting_pl_empty">
                <p>No P&L data for the selected period.</p>
                <p className="betting_pl_empty_hint">Place some bets and settle them to see profit &amp; loss here.</p>
              </div>
            ) : data ? (
              <div className="transactions_cards_wrapper betting_pl_cards">
                <div className="transaction_card betting_pl_card_main">
                  <div className="transaction_card_header">
                    <h3>Total P&L</h3>
                  </div>
                  <div className="transaction_card_body">
                    <div className="transaction_card_row">
                      <span className="transaction_label">Net Profit / Loss</span>
                      <span className={`transaction_value amount_value pnl_net ${Number(data.totalProfitLoss) >= 0 ? 'pnl_positive' : 'pnl_negative'}`}>
                        {formatAmount(data.totalProfitLoss)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="transaction_card betting_pl_card_summary">
                  <div className="transaction_card_header">
                    <h3>Summary</h3>
                  </div>
                  <div className="transaction_card_body">
                    <div className="transaction_card_row">
                      <span className="transaction_label">Total Bets</span>
                      <span className="transaction_value">{formatCount(data.totalBets)}</span>
                    </div>
                    <div className="transaction_card_row">
                      <span className="transaction_label">Total Stake</span>
                      <span className="transaction_value amount_value">{formatAmount(data.totalStake)}</span>
                    </div>
                    <div className="transaction_card_row">
                      <span className="transaction_label">Won</span>
                      <span className="transaction_value">{formatCount(data.totalWon)}</span>
                    </div>
                    <div className="transaction_card_row">
                      <span className="transaction_label">Lost</span>
                      <span className="transaction_value">{formatCount(data.totalLost)}</span>
                    </div>
                    <div className="transaction_card_row">
                      <span className="transaction_label">Gross Profit</span>
                      <span className="transaction_value amount_value pnl_positive">{formatAmount(data.grossProfit)}</span>
                    </div>
                    <div className="transaction_card_row">
                      <span className="transaction_label">Gross Loss</span>
                      <span className="transaction_value amount_value pnl_negative">{formatAmount(data.grossLoss)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  )
}

export default BettingProfitLoss

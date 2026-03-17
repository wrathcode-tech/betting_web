import React, { useState, useCallback, useEffect } from 'react'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import '../ProfileTransactions/ProfileTransactions.css'
import './BettingProfitLoss.css'

function BettingProfitLoss() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const fetchPnL = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      const sportVal = (search || '').trim().toLowerCase()
      if (sportVal) params.sport = sportVal
      const res = await AuthService.sportsbookProfitLoss(params)
      if (res == null) {
        setError('Could not load P&L. Please try again.')
        setData(null)
        return
      }
      if (res.success === false) {
        setError(res.message || 'Failed to load P&L data.')
        setData(null)
        return
      }
      // API: { success, message, data: { currency, totalBets, totalStake, totalProfitLoss, ... } }
      let raw = res.data ?? res.result ?? res
      if (raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object') raw = raw.data
      const normalized = raw && typeof raw === 'object' && !Array.isArray(raw)
        ? {
            totalProfitLoss: raw.totalProfitLoss ?? raw.total_profit_loss ?? null,
            totalBets: raw.totalBets ?? raw.total_bets ?? null,
            totalStake: raw.totalStake ?? raw.total_stake ?? null,
            totalWon: raw.totalWon ?? raw.total_won ?? null,
            totalLost: raw.totalLost ?? raw.total_lost ?? null,
            grossProfit: raw.grossProfit ?? raw.gross_profit ?? null,
            grossLoss: raw.grossLoss ?? raw.gross_loss ?? null,
            currency: raw.currency ?? 'INR',
          }
        : null
      setData(normalized)
      setError(normalized ? null : 'No P&L data in response.')
    } catch (err) {
      setError(err?.message || 'Failed to load P&L data.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchPnL()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
                <input
                  type="text"
                  placeholder="Search by sport (e.g. cricket, football)..."
                  className="transactions_search_input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPnL()}
                  aria-label="Search by sport"
                />
                <button type="button" className="deposit_btn_style btn_apply" onClick={fetchPnL} disabled={loading}>
                  {loading ? 'Loading...' : 'Search'}
                </button>
              </div>
            </div>

            {error && (
              <div className="betting_pl_error">
                <p>{error}</p>
                <button type="button" className="deposit_btn_style" onClick={fetchPnL}>Retry</button>
              </div>
            )}

            {loading && !data && (
              <div className="betting_pl_loading">
                <p>Loading P&L...</p>
              </div>
            )}

            {!loading && !error && !data && (
              <div className="betting_pl_empty">
                <p>No P&L data for the selected period.</p>
                <p className="betting_pl_empty_hint">Place some bets and settle them to see profit &amp; loss here.</p>
              </div>
            )}

            {!loading && data != null && (
              <div className="betting_pl_cards" key="pnl-cards">
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
            )}
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  )
}

export default BettingProfitLoss

import React, { useState, useEffect, useCallback } from 'react'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import '../ProfileTransactions/profileTransactions.css'

function BettingProfitLoss() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const fetchPnL = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (sport) params.sport = sport
      if (from) params.from = from
      if (to) params.to = to
      const res = await AuthService.sportsbookProfitLoss(params)
      const d = res?.data ?? res
      setData(d || null)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [sport, from, to])

  useEffect(() => {
    fetchPnL()
  }, [fetchPnL])

  const formatAmount = (n) => {
    if (n == null) return '—'
    const num = Number(n)
    const str = num >= 0 ? `₹${num.toLocaleString()}` : `−₹${Math.abs(num).toLocaleString()}`
    return str
  }

  return (
    <>
      <Header />
      <div className="dashboard_page">
        <div className="container-fluid">
          <div className="profile_transactions_section">
            <div className="transactions_header">
              <h1>Betting Profit & Loss</h1>
              <div className="transactions_header_right">
                <div className="date_range_picker">
                  <input
                    type="date"
                    className="date_input"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                  <input
                    type="date"
                    className="date_input"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
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
                <button type="button" className="deposit_btn_style" onClick={fetchPnL}>
                  Apply
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-white-50">Loading...</p>
            ) : !data ? (
              <p className="text-white-50">No P&L data.</p>
            ) : (
              <div className="transactions_cards_wrapper" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <div className="transaction_card" style={{ minWidth: 200 }}>
                  <div className="transaction_card_header">
                    <h3>Total P&L</h3>
                  </div>
                  <div className="transaction_card_body">
                    <div className="transaction_card_row">
                      <span className="transaction_label">Net Profit / Loss</span>
                      <span className={`transaction_value amount_value ${Number(data.totalProfitLoss) >= 0 ? '' : 'text-danger'}`}>
                        {formatAmount(data.totalProfitLoss)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="transaction_card" style={{ minWidth: 200 }}>
                  <div className="transaction_card_header">
                    <h3>Summary</h3>
                  </div>
                  <div className="transaction_card_body">
                    <div className="transaction_card_row">
                      <span className="transaction_label">Total Bets</span>
                      <span className="transaction_value">{data.totalBets ?? '—'}</span>
                    </div>
                    <div className="transaction_card_row">
                      <span className="transaction_label">Total Stake</span>
                      <span className="transaction_value amount_value">{formatAmount(data.totalStake)}</span>
                    </div>
                    <div className="transaction_card_row">
                      <span className="transaction_label">Won</span>
                      <span className="transaction_value">{data.totalWon ?? '—'}</span>
                    </div>
                    <div className="transaction_card_row">
                      <span className="transaction_label">Lost</span>
                      <span className="transaction_value">{data.totalLost ?? '—'}</span>
                    </div>
                    <div className="transaction_card_row">
                      <span className="transaction_label">Gross Profit</span>
                      <span className="transaction_value amount_value">{formatAmount(data.grossProfit)}</span>
                    </div>
                    <div className="transaction_card_row">
                      <span className="transaction_label">Gross Loss</span>
                      <span className="transaction_value amount_value">{formatAmount(data.grossLoss)}</span>
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

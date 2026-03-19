import React, { useState, useEffect, useCallback } from 'react'
import StatementPage from './StatementPage'
import { getAccountStatement } from '../api/historyApi'
import AuthService from '../api/services/AuthService'
import { getToken } from '../utils/authStorage'
import { alertErrorMessage } from '../customComponents/CustomAlertMessage'

const COLUMNS = [
  { key: 'time', label: 'Time' },
  { key: 'txnId', label: 'Transaction ID' },
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount', type: 'amount' },
  { key: 'balanceAfter', label: 'Balance After', type: 'amount' },
  { key: 'status', label: 'Status', type: 'status' },
]

function formatTime(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '—'
  }
}

function formatAmount(amount, currency = 'INR') {
  if (amount == null) return '—'
  const n = Number(amount)
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatStatus(s) {
  if (!s) return '—'
  return String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase()
}

function mapStatementToRow(item, index) {
  const id = item.id ?? index
  const statusRaw = (item.status || '').toLowerCase()
  const type = item.type ?? item.transactionType ?? '—'
  const amount = item.amount != null ? formatAmount(item.amount, item.currency) : '—'
  const balanceAfter = item.balanceAfter != null ? formatAmount(item.balanceAfter, item.currency) : '—'
  return {
    id: String(id),
    time: formatTime(item.createdAt ?? item.date ?? item.transactionDate),
    txnId: item.id ?? '—',
    type: String(type).charAt(0).toUpperCase() + String(type).slice(1).toLowerCase(),
    amount,
    balanceAfter,
    status: formatStatus(item.status),
    statusRaw,
    cardTitle: `Transaction #${item.id != null ? item.id : id}`,
  }
}

export default function MyWallet() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)

  const formatSummaryAmount = (val) => {
    if (val == null) return '—'
    const n = Number(val)
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const fetchStatement = useCallback(async (page = 1, limit = 100, from, to, type, sort) => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await getAccountStatement({ page, limit, from, to, type, sort })
      if (res?.success === false) {
        setData([])
        if (res?.message) alertErrorMessage(res.message)
        return
      }
      const raw = res?.data ?? res
      const list = Array.isArray(raw) ? raw : (raw?.statement ?? raw?.transactions ?? raw?.data ?? [])
      setData(Array.isArray(list) ? list.map(mapStatementToRow) : [])
    } catch (e) {
      setData([])
      if (e?.message) alertErrorMessage(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatement(1, 100)
  }, [fetchStatement])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    AuthService.bettingGetBalance()
      .then((res) => {
        const raw = res?.data ?? res
        const wallet = raw?.wallet ?? raw
        if (!wallet || typeof wallet !== 'object') return
        setSummary({
          balance: wallet.balance ?? 0,
          totalWinnings: wallet.totalWinnings ?? 0,
          currency: wallet.currency ?? 'INR',
        })
      })
      .catch(() => {})
  }, [])

  const title = 'My Wallet'

  const headerExtra = summary ? (
    <div className="wallet_summary">
      <div className="wallet_summary_item">
        <span className="wallet_summary_label">Main Balance</span>
        <span className="wallet_summary_value">{formatSummaryAmount(summary.balance)}</span>
      </div>
      <div className="wallet_summary_item">
        <span className="wallet_summary_label">Total Winnings</span>
        <span className="wallet_summary_value">{formatSummaryAmount(summary.totalWinnings)}</span>
      </div>
    </div>
  ) : null

  if (loading) {
    return (
      <>
        <StatementPage
          title={title}
          columns={COLUMNS}
          data={[]}
          emptyMessage="Loading..."
          filterColumnKey="type"
          dateColumnKey="time"
          headerExtra={headerExtra}
        />
      </>
    )
  }

  return (
    <StatementPage
      title={title}
      columns={COLUMNS}
      data={data}
      emptyMessage="No wallet transactions yet."
      filterColumnKey="type"
      dateColumnKey="time"
      headerExtra={headerExtra}
    />
  )
}

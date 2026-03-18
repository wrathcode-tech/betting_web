import React, { useState, useEffect, useCallback } from 'react'
import StatementPage from './StatementPage'
import { getAccountStatement } from '../api/historyApi'

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
  const id = item.id ?? item._id ?? index
  const statusRaw = (item.status || '').toLowerCase()
  const type = item.type ?? item.transactionType ?? '—'
  const amount = item.amount != null ? formatAmount(item.amount, item.currency) : '—'
  const balanceAfter = item.balanceAfter != null ? formatAmount(item.balanceAfter, item.currency) : '—'
  return {
    id: String(id),
    time: formatTime(item.createdAt ?? item.date ?? item.transactionDate),
    txnId: item.id ?? item.transactionId ?? item._id ?? '—',
    type: String(type).charAt(0).toUpperCase() + String(type).slice(1).toLowerCase(),
    amount,
    balanceAfter,
    status: formatStatus(item.status),
    statusRaw,
    cardTitle: item.id != null ? `Transaction #${item.id}` : (item.transactionId ?? item._id ?? String(id)),
  }
}

export default function MyWallet() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStatement = useCallback(async (page = 1, limit = 100, from, to, type, sort) => {
    const token = sessionStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await getAccountStatement({ page, limit, from, to, type, sort })
      const raw = res?.data
      const list = Array.isArray(raw) ? raw : (raw?.statement ?? raw?.transactions ?? raw?.data ?? [])
      if (!Array.isArray(list)) {
        setData([])
        return
      }
      setData(list.map(mapStatementToRow))
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatement(1, 100)
  }, [fetchStatement])

  if (loading) {
    return (
      <>
        <StatementPage
          title="My Wallet"
          columns={COLUMNS}
          data={[]}
          emptyMessage="Loading..."
          filterColumnKey="type"
          dateColumnKey="time"
        />
      </>
    )
  }

  return (
    <StatementPage
      title="My Wallet"
      columns={COLUMNS}
      data={data}
      emptyMessage="No wallet transactions yet."
      filterColumnKey="type"
      dateColumnKey="time"
    />
  )
}

import React, { useState, useEffect, useCallback } from 'react'
import StatementPage from './StatementPage'
import { getAccountStatementFromAccount } from '../api/historyApi'
import { alertErrorMessage } from '../customComponents/CustomAlertMessage'

/** Columns match backend keys only (GET account/statement items). */
const COLUMNS = [
  { key: 'createdAt', label: 'createdAt' },
  // { key: '_id', label: '_id' },
  // { key: 'userId', label: 'userId' },
  { key: 'type', label: 'type' },
  { key: 'amount', label: 'amount', type: 'amount' },
  { key: 'balanceBefore', label: 'balanceBefore', type: 'amount' },
  { key: 'balanceAfter', label: 'balanceAfter', type: 'amount' },
  { key: 'currency', label: 'currency' },
  // { key: 'referenceId', label: 'referenceId' },
  { key: 'referenceType', label: 'referenceType' },
  { key: 'updatedAt', label: 'updatedAt' },
  { key: 'description', label: 'description' },
  // { key: 'metadata', label: 'metadata' },
]

function formatDateTime(val) {
  if (!val) return '—'
  try {
    const d = new Date(val)
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  } catch {
    return String(val)
  }
}

function formatMoney(amount, currency = 'INR') {
  if (amount == null) return '—'
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const c = String(currency || 'INR').toUpperCase()
  return c === 'INR' ? `₹${abs}` : `${c} ${abs}`
}

function formatSignedAmount(amount, currency = 'INR') {
  if (amount == null) return '—'
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const c = String(currency || 'INR').toUpperCase()
  if (c === 'INR') {
    if (n > 0) return `+₹${abs}`
    if (n < 0) return `−₹${abs}`
    return `₹${abs}`
  }
  if (n > 0) return `+${c} ${abs}`
  if (n < 0) return `−${c} ${abs}`
  return `${c} ${abs}`
}

function formatMetadata(meta) {
  if (meta == null) return '—'
  if (typeof meta !== 'object' || Array.isArray(meta)) return String(meta)
  try {
    return JSON.stringify(meta)
  } catch {
    return '—'
  }
}

function parseStatementList(res) {
  const root = res?.data ?? res
  if (Array.isArray(root)) return root
  if (root && typeof root === 'object') {
    if (Array.isArray(root.data)) return root.data
    const list = root.statement ?? root.transactions ?? root.records ?? root.items
    if (Array.isArray(list)) return list
  }
  return []
}

function mapStatementToRow(item, index) {
  const rowId = item._id ?? item.id ?? index
  const cur = item.currency ?? 'INR'

  return {
    id: String(rowId),
    _id: item._id != null ? String(item._id) : '—',
    userId: item.userId != null ? String(item.userId) : '—',
    type: item.type != null ? String(item.type) : '—',
    amount: item.amount != null && item.amount !== '' ? formatSignedAmount(item.amount, cur) : '—',
    balanceBefore: item.balanceBefore != null ? formatMoney(item.balanceBefore, cur) : '—',
    balanceAfter: item.balanceAfter != null ? formatMoney(item.balanceAfter, cur) : '—',
    createdAt: formatDateTime(item.createdAt),
    currency: item.currency != null ? String(item.currency) : '—',
    description: item.description != null && String(item.description).trim() !== '' ? String(item.description) : '—',
    metadata: formatMetadata(item.metadata),
    referenceId: item.referenceId != null ? String(item.referenceId) : '—',
    referenceType: item.referenceType != null ? String(item.referenceType) : '—',
    updatedAt: formatDateTime(item.updatedAt),
    cardTitle: `${item.type ?? '—'} · ${formatDateTime(item.createdAt)}`,
  }
}

export default function AccountStatement() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStatement = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAccountStatementFromAccount({ page: 1, limit: 100 })
      if (res?.success === false) {
        setData([])
        if (res?.message) alertErrorMessage(res.message)
        return
      }
      const list = parseStatementList(res)
      setData(Array.isArray(list) ? list.map(mapStatementToRow) : [])
    } catch (e) {
      setData([])
      if (e?.message) alertErrorMessage(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatement()
  }, [fetchStatement])

  if (loading && data.length === 0) {
    return (
      <StatementPage
        title="Account Statement"
        columns={COLUMNS}
        data={[]}
        emptyMessage="Loading..."
        enableExport
        exportFileName="account-statement"
        headerRightClassName="account_statement_header_right"
      />
    )
  }

  return (
    <StatementPage
      title="Account Statement"
      columns={COLUMNS}
      data={data}
      emptyMessage="No account statement entries yet."
      enableExport
      exportFileName="account-statement"
      headerRightClassName="account_statement_header_right"
    />
  )
}

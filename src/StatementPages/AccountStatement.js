import React, { useState, useEffect, useCallback } from 'react'
import StatementPage from './StatementPage'
import { getAccountStatementFromAccount } from '../api/historyApi'
import { alertErrorMessage } from '../customComponents/CustomAlertMessage'

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'description', label: 'Description' },
  { key: 'credit', label: 'Credit', type: 'amount' },
  { key: 'debit', label: 'Debit', type: 'amount' },
  { key: 'balance', label: 'Balance', type: 'amount' },
]

function formatDate(val) {
  if (!val) return '—'
  try {
    const d = new Date(val)
    return d.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return String(val)
  }
}

function formatAmount(amount) {
  if (amount == null) return '—'
  const n = Number(amount)
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function mapStatementToRow(item, index) {
  const id = item._id ?? item.id ?? index
  const date = formatDate(item.date ?? item.createdAt ?? item.transactionDate)
  const description = item.description ?? item.remarks ?? item.reference ?? item.type ?? '—'
  const credit = item.credit != null ? formatAmount(item.credit) : (item.type === 'credit' && item.amount != null ? formatAmount(item.amount) : '—')
  const debit = item.debit != null ? formatAmount(item.debit) : (item.type === 'debit' && item.amount != null ? formatAmount(item.amount) : '—')
  const balance = item.balance != null ? formatAmount(item.balance) : (item.balanceAfter != null ? formatAmount(item.balanceAfter) : '—')
  return {
    id: String(id),
    date,
    description,
    credit,
    debit,
    balance,
    cardTitle: description,
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
      const raw = res?.data ?? res
      const list = Array.isArray(raw) ? raw : (raw?.statement ?? raw?.transactions ?? raw?.data ?? raw?.records ?? [])
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

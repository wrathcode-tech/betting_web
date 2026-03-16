import React from 'react'
import StatementPage from './StatementPage'

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'deposit', label: 'Deposit', type: 'amount' },
  { key: 'turnoverRequired', label: 'Turnover Required' },
  { key: 'turnoverDone', label: 'Turnover Done' },
  { key: 'status', label: 'Status', type: 'status' },
]

export default function DepositTurnover() {
  return (
    <StatementPage
      title="Deposit Turnover"
      columns={COLUMNS}
      data={[]}
      emptyMessage="No deposit turnover data yet."
    />
  )
}

import React from 'react'
import StatementPage from './StatementPage'

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'bonusType', label: 'Bonus Type' },
  { key: 'amount', label: 'Amount', type: 'amount' },
  { key: 'wagering', label: 'Wagering' },
  { key: 'status', label: 'Status', type: 'status' },
]

export default function BonusStatement() {
  return (
    <StatementPage
      title="Bonus Statement"
      columns={COLUMNS}
      data={[]}
      emptyMessage="No bonus statement yet."
    />
  )
}

import React from 'react'
import StatementPage from './StatementPage'

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'product', label: 'Product' },
  { key: 'turnover', label: 'Turnover', type: 'amount' },
  { key: 'contribution', label: 'Contribution' },
]

export default function TurnoverHistory() {
  return (
    <StatementPage
      title="Turnover History"
      columns={COLUMNS}
      data={[]}
      emptyMessage="No turnover history yet."
      filterColumnKey="product"
    />
  )
}

import React from 'react'
import StatementPage from './StatementPage'

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'product', label: 'Product' },
  { key: 'turnover', label: 'Turnover', type: 'amount' },
  { key: 'contribution', label: 'Contribution' },
]

const DUMMY_DATA = [
  { id: '1', date: '12/06/2025', product: 'Sports', turnover: '₹12,500.00', contribution: '100%', cardTitle: 'Sports' },
  { id: '2', date: '11/06/2025', product: 'Casino', turnover: '₹8,200.00', contribution: '85%', cardTitle: 'Casino' },
  { id: '3', date: '10/06/2025', product: 'Sports', turnover: '₹15,000.00', contribution: '100%', cardTitle: 'Sports' },
  { id: '4', date: '09/06/2025', product: 'Live Casino', turnover: '₹5,400.00', contribution: '70%', cardTitle: 'Live Casino' },
  { id: '5', date: '08/06/2025', product: 'Sports', turnover: '₹22,100.00', contribution: '100%', cardTitle: 'Sports' },
]

export default function TurnoverHistory() {
  return (
    <StatementPage
      title="Turnover History"
      columns={COLUMNS}
      data={DUMMY_DATA}
      emptyMessage="No turnover history yet."
      filterColumnKey="product"
    />
  )
}

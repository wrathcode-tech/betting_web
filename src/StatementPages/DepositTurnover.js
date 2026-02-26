import React from 'react'
import StatementPage from './StatementPage'

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'deposit', label: 'Deposit', type: 'amount' },
  { key: 'turnoverRequired', label: 'Turnover Required' },
  { key: 'turnoverDone', label: 'Turnover Done' },
  { key: 'status', label: 'Status', type: 'status' },
]

const DUMMY_DATA = [
  { id: '1', date: '12/06/2025', deposit: '₹5,000.00', turnoverRequired: '₹25,000', turnoverDone: '₹12,500', status: 'In Progress', statusRaw: 'pending', cardTitle: 'Deposit 12/06' },
  { id: '2', date: '10/06/2025', deposit: '₹2,000.00', turnoverRequired: '₹10,000', turnoverDone: '₹10,000', status: 'Completed', statusRaw: 'completed', cardTitle: 'Deposit 10/06' },
  { id: '3', date: '08/06/2025', deposit: '₹10,000.00', turnoverRequired: '₹50,000', turnoverDone: '₹28,400', status: 'In Progress', statusRaw: 'pending', cardTitle: 'Deposit 08/06' },
  { id: '4', date: '05/06/2025', deposit: '₹3,500.00', turnoverRequired: '₹17,500', turnoverDone: '₹17,500', status: 'Completed', statusRaw: 'completed', cardTitle: 'Deposit 05/06' },
  { id: '5', date: '01/06/2025', deposit: '₹1,000.00', turnoverRequired: '₹5,000', turnoverDone: '₹0', status: 'Pending', statusRaw: 'pending', cardTitle: 'Deposit 01/06' },
]

export default function DepositTurnover() {
  return (
    <StatementPage
      title="Deposit Turnover"
      columns={COLUMNS}
      data={DUMMY_DATA}
      emptyMessage="No deposit turnover data yet."
    />
  )
}

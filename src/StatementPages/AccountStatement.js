import React from 'react'
import StatementPage from './StatementPage'

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'description', label: 'Description' },
  { key: 'credit', label: 'Credit', type: 'amount' },
  { key: 'debit', label: 'Debit', type: 'amount' },
  { key: 'balance', label: 'Balance', type: 'amount' },
]

const DUMMY_DATA = [
  { id: '1', date: '12/06/2025', description: 'Deposit - UPI', credit: '₹5,000.00', debit: '—', balance: '₹15,250.00', cardTitle: 'Deposit - UPI' },
  { id: '2', date: '11/06/2025', description: 'Withdrawal - Bank', credit: '—', debit: '₹2,500.00', balance: '₹10,250.00', cardTitle: 'Withdrawal - Bank' },
  { id: '3', date: '10/06/2025', description: 'Bet settlement - Won', credit: '₹875.00', debit: '—', balance: '₹12,750.00', cardTitle: 'Bet settlement' },
  { id: '4', date: '09/06/2025', description: 'Bonus credit', credit: '₹1,000.00', debit: '—', balance: '₹11,875.00', cardTitle: 'Bonus credit' },
  { id: '5', date: '08/06/2025', description: 'Bet placement', credit: '—', debit: '₹500.00', balance: '₹10,875.00', cardTitle: 'Bet placement' },
]

export default function AccountStatement() {
  return (
    <StatementPage
      title="Account Statement"
      columns={COLUMNS}
      data={DUMMY_DATA}
      emptyMessage="No account statement entries yet."
    />
  )
}

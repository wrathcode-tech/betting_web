import React from 'react'
import StatementPage from './StatementPage'

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'bonusType', label: 'Bonus Type' },
  { key: 'amount', label: 'Amount', type: 'amount' },
  { key: 'wagering', label: 'Wagering' },
  { key: 'status', label: 'Status', type: 'status' },
]

const DUMMY_DATA = [
  { id: '1', date: '12/06/2025', bonusType: 'Welcome Bonus', amount: '₹1,000.00', wagering: '5x', status: 'Active', statusRaw: 'active', cardTitle: 'Welcome Bonus' },
  { id: '2', date: '10/06/2025', bonusType: 'Reload Bonus', amount: '₹500.00', wagering: '3x', status: 'Completed', statusRaw: 'completed', cardTitle: 'Reload Bonus' },
  { id: '3', date: '08/06/2025', bonusType: 'Free Bet', amount: '₹250.00', wagering: '1x', status: 'Used', statusRaw: 'completed', cardTitle: 'Free Bet' },
  { id: '4', date: '05/06/2025', bonusType: 'Cashback', amount: '₹200.00', wagering: '—', status: 'Completed', statusRaw: 'completed', cardTitle: 'Cashback' },
  { id: '5', date: '01/06/2025', bonusType: 'Referral Bonus', amount: '₹150.00', wagering: '2x', status: 'Expired', statusRaw: 'expired', cardTitle: 'Referral Bonus' },
]

export default function BonusStatement() {
  return (
    <StatementPage
      title="Bonus Statement"
      columns={COLUMNS}
      data={DUMMY_DATA}
      emptyMessage="No bonus statement yet."
    />
  )
}

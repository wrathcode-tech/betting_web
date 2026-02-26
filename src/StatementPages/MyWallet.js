import React from 'react'
import StatementPage from './StatementPage'

const COLUMNS = [
  { key: 'time', label: 'Time' },
  { key: 'txnId', label: 'Transaction ID' },
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount', type: 'amount' },
  { key: 'balanceAfter', label: 'Balance After', type: 'amount' },
  { key: 'status', label: 'Status', type: 'status' },
]

const DUMMY_DATA = [
  { id: '1', time: '12/06/2025, 10:30 AM', txnId: 'WLT20250612001', type: 'Deposit', amount: '₹5,000.00', balanceAfter: '₹15,250.00', status: 'Completed', statusRaw: 'completed', cardTitle: 'Deposit' },
  { id: '2', time: '11/06/2025, 02:00 PM', txnId: 'WLT20250611002', type: 'Withdrawal', amount: '₹2,500.00', balanceAfter: '₹10,250.00', status: 'Completed', statusRaw: 'completed', cardTitle: 'Withdrawal' },
  { id: '3', time: '10/06/2025, 09:15 AM', txnId: 'WLT20250610003', type: 'Bet Placed', amount: '₹500.00', balanceAfter: '₹12,750.00', status: 'Completed', statusRaw: 'completed', cardTitle: 'Bet Placed' },
  { id: '4', time: '09/06/2025, 06:45 PM', txnId: 'WLT20250609004', type: 'Bonus', amount: '₹1,000.00', balanceAfter: '₹13,250.00', status: 'Completed', statusRaw: 'completed', cardTitle: 'Bonus' },
  { id: '5', time: '08/06/2025, 11:20 AM', txnId: 'WLT20250608005', type: 'Withdrawal', amount: '₹3,000.00', balanceAfter: '₹12,250.00', status: 'Pending', statusRaw: 'pending', cardTitle: 'Withdrawal' },
]

export default function MyWallet() {
  return (
    <StatementPage
      title="My Wallet"
      columns={COLUMNS}
      data={DUMMY_DATA}
      emptyMessage="No wallet transactions yet."
    />
  )
}

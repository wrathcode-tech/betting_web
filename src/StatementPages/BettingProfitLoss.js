import React from 'react'
import StatementPage from './StatementPage'

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'event', label: 'Event' },
  { key: 'market', label: 'Market' },
  { key: 'stake', label: 'Stake', type: 'amount' },
  { key: 'pnl', label: 'P&L', type: 'amount' },
  { key: 'status', label: 'Status', type: 'status' },
]

const DUMMY_DATA = [
  { id: '1', date: '12/06/2025', event: 'RCB vs DC', market: 'Match Winner', stake: '₹500', pnl: '₹375', status: 'Won', statusRaw: 'won', cardTitle: 'RCB vs DC' },
  { id: '2', date: '11/06/2025', event: 'India vs Australia', market: 'Top Batsman', stake: '₹1,000', pnl: '₹0', status: 'Lost', statusRaw: 'lost', cardTitle: 'India vs Australia' },
  { id: '3', date: '10/06/2025', event: 'Mumbai vs Chennai', market: 'Total Runs', stake: '₹250', pnl: '−₹250', status: 'Lost', statusRaw: 'lost', cardTitle: 'Mumbai vs Chennai' },
  { id: '4', date: '09/06/2025', event: 'IPL Final', market: 'Match Winner', stake: '₹2,000', pnl: '₹1,700', status: 'Won', statusRaw: 'won', cardTitle: 'IPL Final' },
  { id: '5', date: '08/06/2025', event: 'England vs SA', market: '1st Innings', stake: '₹750', pnl: '—', status: 'Pending', statusRaw: 'pending', cardTitle: 'England vs SA' },
]

export default function BettingProfitLoss() {
  return (
    <StatementPage
      title="Betting Profit and Loss"
      columns={COLUMNS}
      data={DUMMY_DATA}
      emptyMessage="No betting P&L data yet."
    />
  )
}

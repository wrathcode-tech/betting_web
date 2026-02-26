import React from 'react'
import StatementPage from './StatementPage'

const COLUMNS = [
  { key: 'time', label: 'Time' },
  { key: 'betId', label: 'Bet ID' },
  { key: 'event', label: 'Event' },
  { key: 'market', label: 'Market' },
  { key: 'selection', label: 'Selection' },
  { key: 'odds', label: 'Odds' },
  { key: 'stake', label: 'Stake' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'potentialWin', label: 'Potential Win', type: 'amount' },
]

const DUMMY_DATA = [
  { id: '1', time: '12/06/2025, 10:30 AM', betId: 'BET001', event: 'RCB vs DC', market: 'Match Winner', selection: 'RCB', odds: '1.75', stake: '₹500', status: 'Won', statusRaw: 'won', potentialWin: '₹875', cardTitle: 'Bet BET001' },
  { id: '2', time: '11/06/2025, 02:15 PM', betId: 'BET002', event: 'India vs Australia', market: 'Top Batsman', selection: 'Kohli', odds: '2.10', stake: '₹1,000', status: 'Pending', statusRaw: 'pending', potentialWin: '₹2,100', cardTitle: 'Bet BET002' },
  { id: '3', time: '10/06/2025, 06:45 PM', betId: 'BET003', event: 'Mumbai vs Chennai', market: 'Total Runs', selection: 'Over 340.5', odds: '1.90', stake: '₹250', status: 'Lost', statusRaw: 'lost', potentialWin: '₹0', cardTitle: 'Bet BET003' },
  { id: '4', time: '09/06/2025, 09:00 AM', betId: 'BET004', event: 'IPL Final', market: 'Match Winner', selection: 'KKR', odds: '1.85', stake: '₹2,000', status: 'Won', statusRaw: 'won', potentialWin: '₹3,700', cardTitle: 'Bet BET004' },
  { id: '5', time: '08/06/2025, 04:30 PM', betId: 'BET005', event: 'England vs South Africa', market: '1st Innings', selection: 'England', odds: '1.65', stake: '₹750', status: 'Pending', statusRaw: 'pending', potentialWin: '₹1,237.50', cardTitle: 'Bet BET005' },
]

export default function MyBets() {
  return (
    <StatementPage
      title="My Bets"
      columns={COLUMNS}
      data={DUMMY_DATA}
      emptyMessage="No bets placed yet."
    />
  )
}

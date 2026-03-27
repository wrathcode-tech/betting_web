import React, { useState, useEffect, useCallback } from 'react'
import StatementPage from './StatementPage'
import { getAccountStatement } from '../api/historyApi'
import AuthService from '../api/services/AuthService'

const COLUMNS = [
  { key: 'time', label: 'Time' },
  // { key: 'txnId', label: 'Transaction ID' },
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount', type: 'amount' },
  { key: 'balanceAfter', label: 'Balance After', type: 'amount' },
  // { key: 'status', label: 'Status', type: 'status' },
]

function formatTime(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '—'
  }
}

function formatAmount(amount, currency = 'INR') {
  if (amount == null) return '—'
  const n = Number(amount)
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatStatus(s) {
  if (!s) return '—'
  return String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase()
}

/** Unwrap GET /wallet/balance: { data: { balance, ... } } | { wallet: {...} } | flat object */
function extractWalletFromBalanceResponse(res) {
  const root = res?.data ?? res
  if (!root || typeof root !== 'object') return null
  if (root.wallet && typeof root.wallet === 'object') return root.wallet
  if (root.data != null && typeof root.data === 'object' && !Array.isArray(root.data)) {
    const inner = root.data
    if ('balance' in inner || 'currency' in inner) return inner
  }
  if ('balance' in root || 'currency' in root) return root
  return null
}

function formatMoney(amount, currency = 'INR') {
  if (amount == null) return '—'
  const n = Number(amount)
  const formatted = n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const c = String(currency || 'INR').toUpperCase()
  if (c === 'INR') return `₹${formatted}`
  return `${formatted} ${c}`
}

function WalletOverview({ wallet }) {
  if (!wallet) return null
  const currency = wallet.currency ?? 'INR'
  const canW = wallet.canWithdraw
  return (
    <div className="my_wallet_overview">
      <div className="my_wallet_overview_grid">
        <div className="my_wallet_overview_item my_wallet_overview_highlight">
          <span className="my_wallet_overview_label">Main balance</span>
          <span className="my_wallet_overview_value">{formatMoney(wallet.balance, currency)}</span>
        </div>
        <div className="my_wallet_overview_item">
          <span className="my_wallet_overview_label">Bonus balance</span>
          <span className="my_wallet_overview_value">{formatMoney(wallet.bonusBalance, currency)}</span>
        </div>
        <div className="my_wallet_overview_item">
          <span className="my_wallet_overview_label">Currency</span>
          <span className="my_wallet_overview_value">{currency || '—'}</span>
        </div>
        <div className="my_wallet_overview_item">
          <span className="my_wallet_overview_label">Total deposited</span>
          <span className="my_wallet_overview_value">{formatMoney(wallet.totalDeposited, currency)}</span>
        </div>
        <div className="my_wallet_overview_item">
          <span className="my_wallet_overview_label">Total withdrawn</span>
          <span className="my_wallet_overview_value">{formatMoney(wallet.totalWithdrawn, currency)}</span>
        </div>
        <div className="my_wallet_overview_item">
          <span className="my_wallet_overview_label">Total wager</span>
          <span className="my_wallet_overview_value">{formatMoney(wallet.totalWager, currency)}</span>
        </div>
        <div className="my_wallet_overview_item">
          <span className="my_wallet_overview_label">Total winnings</span>
          <span className="my_wallet_overview_value">{formatMoney(wallet.totalWinnings, currency)}</span>
        </div>
        <div className="my_wallet_overview_item">
          <span className="my_wallet_overview_label">Min wager for withdrawal</span>
          <span className="my_wallet_overview_value">
            {wallet.minWagerForWithdrawal != null ? formatMoney(wallet.minWagerForWithdrawal, currency) : '—'}
          </span>
        </div>
        <div className="my_wallet_overview_item">
          <span className="my_wallet_overview_label">Can withdraw</span>
          <span className="my_wallet_overview_value">
            {typeof canW === 'boolean' ? (
              <span className={`my_wallet_withdraw_badge ${canW ? 'wallet_withdraw_yes' : 'wallet_withdraw_no'}`}>
                {canW ? 'Yes' : 'No'}
              </span>
            ) : (
              '—'
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

function mapStatementToRow(item, index) {
  const id = item.id ?? index
  const statusRaw = (item.status || '').toLowerCase()
  const type = item.type ?? item.transactionType ?? '—'
  const amount = item.amount != null ? formatAmount(item.amount, item.currency) : '—'
  const balanceAfter = item.balanceAfter != null ? formatAmount(item.balanceAfter, item.currency) : '—'
  return {
    id: String(id),
    time: formatTime(item.createdAt ?? item.date ?? item.transactionDate),
    txnId: item.id ?? '—',
    type: String(type).charAt(0).toUpperCase() + String(type).slice(1).toLowerCase(),
    amount,
    balanceAfter,
    status: formatStatus(item.status),
    statusRaw,
    cardTitle: `Transaction #${item.id != null ? item.id : id}`,
  }
}

export default function MyWallet() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [walletOverview, setWalletOverview] = useState(null)

  const fetchStatement = useCallback(async (page = 1, limit = 100, from, to, type, sort) => {
    const token = sessionStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await getAccountStatement({ page, limit, from, to, type, sort })
      const raw = res?.data
      const list = Array.isArray(raw) ? raw : (raw?.statement ?? raw?.transactions ?? raw?.data ?? [])
      if (!Array.isArray(list)) {
        setData([])
        return
      }
      setData(list.map(mapStatementToRow))
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatement(1, 100)
  }, [fetchStatement])

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    if (!token) return
    AuthService.bettingGetBalance()
      .then((res) => {
        const wallet = extractWalletFromBalanceResponse(res)
        if (wallet && typeof wallet === 'object') setWalletOverview(wallet)
      })
      .catch(() => { })
  }, [])

  const title = 'My Wallet'

  const topBanner = <WalletOverview wallet={walletOverview} />

  if (loading) {
    return (
      <>
        <StatementPage
          title={title}
          columns={COLUMNS}
          data={[]}
          emptyMessage="Loading..."
          filterColumnKey="type"
          dateColumnKey="time"
          topBanner={topBanner}
          headerRightClassName="my_wallet_header_right"
        />
      </>
    )
  }

  return (
    <StatementPage
      title={title}
      columns={COLUMNS}
      data={data}
      emptyMessage="No wallet transactions yet."
      filterColumnKey="type"
      dateColumnKey="time"
      topBanner={topBanner}
      headerRightClassName="my_wallet_header_right"
    />
  )
}

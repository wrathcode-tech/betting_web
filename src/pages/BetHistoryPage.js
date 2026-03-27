import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-toastify'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import HistoryTable from '../components/HistoryTable'
import Pagination from '../components/Pagination'
import FilterBar from '../components/FilterBar'
import { getBetHistory } from '../api/historyApi'
import '../ProfileTransactions/ProfileTransactions.css'

const LIMIT = 20
const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'settledAt:desc', label: 'Newest' },
  { value: 'settledAt:asc', label: 'Oldest' },
]
const RESULT_OPTIONS = [
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'void', label: 'Void' },
]
const SPORT_OPTIONS = [
  { value: 'cricket', label: 'Cricket' },
  { value: 'soccer', label: 'Football' },
  { value: 'tennis', label: 'Tennis' },
]

function formatDate(val) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return String(val)
  return d.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatAmount(amount) {
  if (amount == null || amount === '') return '—'
  const n = Number(amount)
  if (Number.isNaN(n)) return '—'
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatProfitLoss(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return '—'
  const abs = `₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (n > 0) return `+${abs}`
  if (n < 0) return `−${abs}`
  return '₹0.00'
}

/** API: { data: [...] } | { success, data: [...] } | { data: { bets, pagination } } */
function parseBetHistoryResponse(res) {
  if (!res || typeof res !== 'object') return { list: [], pagination: {} }
  if (res.success === false) return { list: [], pagination: {} }
  const inner = res.data
  if (Array.isArray(inner)) return { list: inner, pagination: res.pagination || {} }
  if (inner && typeof inner === 'object') {
    if (Array.isArray(inner.bets)) return { list: inner.bets, pagination: inner.pagination || res.pagination || {} }
    if (Array.isArray(inner.data)) return { list: inner.data, pagination: inner.pagination || res.pagination || {} }
  }
  if (Array.isArray(res.bets)) return { list: res.bets, pagination: res.pagination || {} }
  return { list: [], pagination: {} }
}

function normalizeBetHistoryRow(b, idx) {
  const id = b._id ?? b.id ?? `row-${idx}`
  const marketName = b.marketName != null && String(b.marketName).trim() !== '' ? String(b.marketName).trim() : ''
  const marketDisplay =
    marketName ? `${marketName}` : marketName || '—'
  const oddsNum =
    b.odds != null
      ? Number(b.odds)
      : b.executedOdds != null
        ? Number(b.executedOdds)
        : b.requestedOdds != null
          ? Number(b.requestedOdds)
          : NaN
  const oddsDisplay = Number.isFinite(oddsNum) ? oddsNum.toFixed(2) : '—'
  const statusRaw = String(b.status || '').toLowerCase()
  const resultRaw = String(b.result || '').toLowerCase()

  let cashoutSummary = '—'
  if (b.cashoutAmount != null && b.cashoutAmount !== '') {
    cashoutSummary = formatAmount(Number(b.cashoutAmount))
    if (b.cashoutOdds != null && b.cashoutOdds !== '') {
      cashoutSummary += ` @ ${Number(b.cashoutOdds).toFixed(2)}`
    }
  }

  return {
    id,
    _id: id,
    time: b.createdAt,
    betIdShort: String(id).slice(-8),
    sport: b.sport || '—',
    eventName: b.eventName || '—',
    marketName: marketDisplay,
    selectionName: b.selectionName || '—',
    betType: b.betType || '—',
    odds: oddsDisplay,
    stake: b.stake,
    status: b.status || '—',
    statusRaw,
    result: b.result || '—',
    resultRaw,
    profitLoss: b.profitLoss,
    settledAt: b.settledAt || b.cashedOutAt,
    cashoutSummary,
  }
}

const COLUMNS = [
  { key: 'time', label: 'Time', render: (v) => formatDate(v) },
  { key: 'betIdShort', label: 'Bet ID' },
  { key: 'sport', label: 'Sport' },
  { key: 'eventName', label: 'Event' },
  { key: 'marketName', label: 'Market' },
  { key: 'selectionName', label: 'Selection' },
  { key: 'betType', label: 'Type' },
  { key: 'odds', label: 'Odds' },
  { key: 'stake', label: 'Stake', render: (v) => formatAmount(v) },
  {
    key: 'status',
    label: 'Status',
    render: (v, row) => (
      <span className={`status_badge status_${String(row.statusRaw || '').toLowerCase()}`}>{v}</span>
    ),
  },
  {
    key: 'result',
    label: 'Result',
    render: (v, row) => (
      <span className={`status_badge status_${String(row.resultRaw || '').toLowerCase()}`}>{v}</span>
    ),
  },
  { key: 'profitLoss', label: 'P/L', render: (v) => formatProfitLoss(v) },
  { key: 'cashoutSummary', label: 'Cashout' },
  { key: 'settledAt', label: 'Settled', render: (v) => formatDate(v) },
]

export default function BetHistoryPage() {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [sport, setSport] = useState('')
  const [result, setResult] = useState('')
  const [sort, setSort] = useState('')

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = {
      page,
      limit: LIMIT,
      sport: sport || undefined,
      result: result || undefined,
      sort: sort || undefined,
    }
    getBetHistory(params)
      .then((res) => {
        const { list, pagination: pag } = parseBetHistoryResponse(res)
        setData(list.map(normalizeBetHistoryRow))
        setPagination({
          page: pag.page ?? page,
          limit: pag.limit ?? LIMIT,
          totalPages: Math.max(1, pag.totalPages ?? 1),
          total: pag.total ?? pag.totalRecords ?? list.length,
        })
      })
      .catch(() => {
        setData([])
        toast.error('Failed to load history')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [page, sport, result, sort])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = useCallback((key, value) => {
    if (key === 'sport') setSport(value)
    if (key === 'result') setResult(value)
    setPage(1)
  }, [])

  const handleSortChange = useCallback((value) => {
    setSort(value)
    setPage(1)
  }, [])

  return (
    <>
      <Header />
      <div className="dashboard_page">
        <div className="container-fluid">
          <div className="profile_transactions_section">
            <h1>Bet History</h1>
            <FilterBar
              filters={[
                { key: 'sport', label: 'Sport', options: SPORT_OPTIONS },
                { key: 'result', label: 'Result', options: RESULT_OPTIONS },
              ]}
              filterValues={{ sport, result }}
              onFilterChange={handleFilterChange}
              sortOptions={SORT_OPTIONS}
              sortValue={sort}
              onSortChange={handleSortChange}
            />
            <HistoryTable columns={COLUMNS} data={data} loading={loading} emptyMessage="No history found." />
            <Pagination
              currentPage={pagination.page || 1}
              totalPages={Math.max(1, pagination.totalPages || 1)}
              onPageChange={setPage}
              loading={loading}
            />
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  )
}

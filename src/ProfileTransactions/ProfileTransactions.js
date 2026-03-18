import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AuthService from '../api/services/AuthService'
import { ApiConfig } from '../api/apiConfig/apiConfig'
import MobileMenu from '../customComponents/MobileMenu'
import Header from '../customComponents/Header'
import './ProfileTransactions.css'

function getPaymentProofFullUrl(url) {
  if (!url || typeof url !== 'string') return null
  if (url.startsWith('http')) return url
  const base = ApiConfig.baseBettingUrl || ''
  return base ? `${base.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}` : url
}

const PAGE_SIZE = 10

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
]

function formatTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatAmount(amount, currency = 'INR') {
  if (amount == null) return '—'
  const n = Number(amount)
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatPaymentMethod(pm) {
  if (!pm) return '—'
  const s = String(pm).toUpperCase()
  if (s === 'BANK' || s === 'BANK_TRANSFER') return 'Bank Transfer'
  return s
}

function formatStatus(s) {
  if (!s) return '—'
  return String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase()
}

function ProfileTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1, hasMore: false })

  const fetchTransactions = useCallback(
    async (page = 1, typeParam = null) => {
      const token = sessionStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }
      setLoading(true)
      const effectiveType = typeParam != null ? typeParam : typeFilter
      const res = await AuthService.walletTransactions(page, PAGE_SIZE, effectiveType)
      setLoading(false)
      const raw = res?.data
      const list = Array.isArray(raw) ? raw : (raw?.transactions || [])
      const pag = res?.pagination ?? raw?.pagination ?? {}
      if (list.length >= 0) {
        setTransactions(list)
        setPagination({
          page: pag.page ?? page,
          limit: pag.limit ?? PAGE_SIZE,
          total: pag.total ?? pag.totalRecords ?? list.length,
          totalPages: Math.max(1, pag.totalPages ?? 1),
          hasMore: (pag.page ?? page) < (pag.totalPages ?? 1),
        })
      } else {
        setTransactions([])
        setPagination((prev) => ({ ...prev, total: 0, totalPages: 1, hasMore: false }))
      }
    },
    [typeFilter]
  )

  useEffect(() => {
    fetchTransactions(1, typeFilter)
  }, [typeFilter, fetchTransactions])

  const handlePrev = useCallback(() => {
    setPagination((prev) => {
      if (prev.page <= 1) return prev
      fetchTransactions(prev.page - 1)
      return prev
    })
  }, [fetchTransactions])

  const handleNext = useCallback(() => {
    setPagination((prev) => {
      if (!prev.hasMore) return prev
      fetchTransactions(prev.page + 1)
      return prev
    })
  }, [fetchTransactions])

  const handleFilterChange = useCallback((e) => {
    setTypeFilter(e.target.value)
  }, [])

  const handleStatusFilterChange = useCallback((e) => {
    setStatusFilter(e.target.value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const list = useMemo(() => {
    const statusFiltered =
      statusFilter === 'all'
        ? transactions
        : transactions.filter((t) => String(t.status || '').toLowerCase() === statusFilter)
    const searchLower = (search || '').trim().toLowerCase()
    const searchFiltered = searchLower
      ? statusFiltered.filter((t) => {
        const time = formatTime(t.createdAt) || ''
        const id = (t.id || '') + ''
        const type = (t.type || '') + ''
        const amount = formatAmount(t.amount, t.currency) || ''
        const status = formatStatus(t.status) || ''
        const method = formatPaymentMethod(t.type === 'deposit' ? (t.depositToDetail?.type ?? t.paymentMethod) : t.type === 'withdrawal' ? (t.withdrawalToDetail?.type ?? t.paymentMethod) : t.paymentMethod) || ''
        const notes = (t.adminRemarks || t.remarks || '') + ''
        return [time, id, type, amount, status, method, notes].some((s) => String(s).toLowerCase().includes(searchLower))
      })
      : statusFiltered
    return searchFiltered.map((t, idx) => {
      const rowId = t.id ?? idx
      return {
        id: rowId != null ? String(rowId) : `row-${idx}`,
        time: formatTime(t.createdAt),
        transactionId: t.id,
        type: t.type === 'deposit' ? 'Deposit' : t.type === 'withdrawal' ? 'Withdrawal' : (t.type || '—'),
        amount: formatAmount(t.amount, t.currency),
        approvedAmount: t.status === 'approved' || t.status === 'completed' ? formatAmount(t.amount, t.currency) : '—',
        status: formatStatus(t.status),
        statusRaw: t.status,
        notes: t.adminRemarks || t.remarks || '—',
        balanceBefore: t.balanceBefore != null ? formatAmount(t.balanceBefore, t.currency) : '—',
        balanceAfter: t.balanceAfter != null ? formatAmount(t.balanceAfter, t.currency) : '—',
        paymentMethod: formatPaymentMethod(
          t.type === 'deposit' ? (t.depositToDetail?.type ?? t.paymentMethod) : t.type === 'withdrawal' ? (t.withdrawalToDetail?.type ?? t.paymentMethod) : t.paymentMethod
        ),
        paymentProofUrl: t.type === 'deposit' ? getPaymentProofFullUrl(t.paymentProofUrl) : null,
      }
    })
  }, [transactions, statusFilter, search])

  const effectiveTotalPages = pagination.totalPages
  const effectiveHasMore = pagination.hasMore
  const effectiveTotal = pagination.total

  return (
    <>
      <Header />
      <div className='dashboard_page'>
        <div className='container-fluid'>
          <div className='profile_transactions_section'>
            <div className='transactions_header'>
              <h1>My Transactions</h1>
              <div className='transactions_header_right mytransactions_header_bl'>
                <input
                  type="text"
                  placeholder="Search ID, type, amount..."
                  className="transactions_search_input"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                  aria-label="Search"
                />
                <div className='transactions_filter_select_wrapper d-flex gap-3'>
                <select
                  id="txn-type-filter"
                  className='transactions_filter_select deposit_btn_style'
                  value={typeFilter}
                  onChange={handleFilterChange}
                >
                  {TYPE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  id="txn-status-filter"
                  className='transactions_filter_select deposit_btn_style'
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                </div>
              </div>
            </div>

            {loading ? (
              <p className="text-white-50">Loading...</p>
            ) : list.length === 0 ? (
              <p className="text-white-50">No deposit or withdrawal transactions yet.</p>
            ) : (
              <>
                <div className='transactions_table_wrapper'>
                  <table className='transactions_table'>
                    <thead>
                      <tr>
                        <th>Transaction Time</th>
                        <th>Transaction ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Balance Before</th>
                        <th>Balance After</th>
                        <th>Status</th>
                        <th>Payment Method</th>
                        <th>Admin / Notes</th>
                        <th>Payment Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.time}</td>
                          <td>Transaction #{tx.id}</td>
                          <td>{tx.type}</td>
                          <td>{tx.amount}</td>
                          <td>{tx.balanceBefore}</td>
                          <td>{tx.balanceAfter}</td>
                          <td>
                            <span className={`status_badge status_${(tx.statusRaw || '').toLowerCase()}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td>{tx.paymentMethod}</td>
                          <td>{tx.notes}</td>
                          <td>
                            {tx.paymentProofUrl ? (
                              <a href={tx.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="transaction_payment_proof_link" aria-label="View payment proof">
                                <img src={tx.paymentProofUrl} alt="Payment proof" className="transaction_payment_proof_thumb" />
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className='transactions_cards_wrapper'>
                  {list.map((tx) => (
                    <div key={tx.id} className='transaction_card'>
                      <div className='transaction_card_header'>
                        <div className='transaction_card_title'>
                          <h3>{tx.type}</h3>
                          <span className={`status_badge status_${(tx.statusRaw || '').toLowerCase()}`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                      <div className='transaction_card_body'>
                        <div className='transaction_card_row'>
                          <span className='transaction_label'>Transaction Time</span>
                          <span className='transaction_value'>{tx.time}</span>
                        </div>
                        <div className='transaction_card_row'>
                          <span className='transaction_label'>Transaction ID</span>
                          <span className='transaction_value'>Transaction #{tx.id}</span>
                        </div>
                        <div className='transaction_card_row'>
                          <span className='transaction_label'>Amount</span>
                          <span className='transaction_value amount_value'>{tx.amount}</span>
                        </div>
                        <div className='transaction_card_row'>
                          <span className='transaction_label'>Balance Before</span>
                          <span className='transaction_value amount_value'>{tx.balanceBefore}</span>
                        </div>
                        <div className='transaction_card_row'>
                          <span className='transaction_label'>Balance After</span>
                          <span className='transaction_value amount_value'>{tx.balanceAfter}</span>
                        </div>
                        <div className='transaction_card_row'>
                          <span className='transaction_label'>Approved Amount</span>
                          <span className='transaction_value'>{tx.approvedAmount}</span>
                        </div>
                        <div className='transaction_card_row'>
                          <span className='transaction_label'>Payment Method</span>
                          <span className='transaction_value'>{tx.paymentMethod}</span>
                        </div>
                        <div className='transaction_card_row'>
                          <span className='transaction_label'>Admin / Notes</span>
                          <span className='transaction_value'>{tx.notes}</span>
                        </div>
                        {tx.paymentProofUrl && (
                          <details className='transaction_payment_proof_dropdown'>
                            <summary className='transaction_payment_proof_summary'>
                              <span className='transaction_label'>Payment Proof</span>
                              {/* <span className='transaction_proof_toggle' aria-hidden>View</span> */}
                            </summary>
                            <div className='transaction_payment_proof_content'>
                              <a href={tx.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="transaction_payment_proof_link" aria-label="View payment proof">
                                <img src={tx.paymentProofUrl} alt="Payment proof" className="transaction_payment_proof_thumb" />
                              </a>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className='transactions_pagination'>
                  <button
                    type="button"
                    className='pagination_btn'
                    onClick={handlePrev}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </button>
                  <span className='pagination_info'>
                    Page {pagination.page} of {effectiveTotalPages} ({effectiveTotal} total)
                  </span>
                  <button
                    type="button"
                    className='pagination_btn'
                    onClick={handleNext}
                    disabled={!effectiveHasMore}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  )
}

export default ProfileTransactions

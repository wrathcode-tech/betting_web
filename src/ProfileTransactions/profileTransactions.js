import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AuthService from '../api/services/AuthService'
import { ApiConfig } from '../api/apiConfig/apiConfig'
import MobileMenu from '../customComponents/MobileMenu'
import Header from '../customComponents/Header'
import './profileTransactions.css'

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
  const [typeFilter, setTypeFilter] = useState('all')
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

      if (effectiveType === 'withdrawal') {
        const res = await AuthService.walletWithdrawalTransactions(page, PAGE_SIZE)
        setLoading(false)
        if (res?.success && res?.data) {
          const list = res.data.transactions || []
          setTransactions(list)
          setPagination({
            page: res.data.pagination?.page ?? page,
            limit: res.data.pagination?.limit ?? PAGE_SIZE,
            total: res.data.pagination?.total ?? 0,
            totalPages: res.data.pagination?.totalPages ?? 1,
            hasMore: res.data.pagination?.hasMore ?? false,
          })
        }
        return
      }

      if (effectiveType === 'all') {
        const [depRes, wdrRes] = await Promise.all([
          AuthService.walletDepositTransactions(1, 50),
          AuthService.walletWithdrawalTransactions(1, 50),
        ])
        setLoading(false)
        const deposits = depRes?.success && depRes?.data ? depRes.data.transactions || [] : []
        const withdrawals = wdrRes?.success && wdrRes?.data ? wdrRes.data.transactions || [] : []
        const merged = [...deposits, ...withdrawals].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        )
        const total = merged.length
        setTransactions(merged)
        setPagination({
          page: 1,
          limit: PAGE_SIZE,
          total,
          totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
          hasMore: total > PAGE_SIZE,
        })
        return
      }

      const res = await AuthService.walletDepositTransactions(page, PAGE_SIZE)
      setLoading(false)
      if (res?.success && res?.data) {
        const list = res.data.transactions || []
        setTransactions(list)
        setPagination({
          page: res.data.pagination?.page ?? page,
          limit: res.data.pagination?.limit ?? PAGE_SIZE,
          total: res.data.pagination?.total ?? 0,
          totalPages: res.data.pagination?.totalPages ?? 1,
          hasMore: res.data.pagination?.hasMore ?? false,
        })
      }
    },
    [typeFilter]
  )

  useEffect(() => {
    fetchTransactions(1, typeFilter)
  }, [typeFilter, fetchTransactions])

  const handlePrev = useCallback(() => {
    if (typeFilter === 'all') {
      setPagination((prev) => {
        if (prev.page <= 1) return prev
        const nextPage = prev.page - 1
        return { ...prev, page: nextPage, hasMore: nextPage < prev.totalPages }
      })
      return
    }
    setPagination((prev) => {
      if (prev.page <= 1) return prev
      fetchTransactions(prev.page - 1)
      return prev
    })
  }, [fetchTransactions, typeFilter])

  const handleNext = useCallback(() => {
    if (typeFilter === 'all') {
      setPagination((prev) => {
        if (!prev.hasMore) return prev
        const nextPage = prev.page + 1
        return { ...prev, page: nextPage, hasMore: nextPage < prev.totalPages }
      })
      return
    }
    setPagination((prev) => {
      if (!prev.hasMore) return prev
      fetchTransactions(prev.page + 1)
      return prev
    })
  }, [fetchTransactions, typeFilter])

  const handleFilterChange = useCallback((e) => {
    setTypeFilter(e.target.value)
  }, [])

  const list = useMemo(() => {
    const source = typeFilter === 'all'
      ? transactions.slice((pagination.page - 1) * PAGE_SIZE, pagination.page * PAGE_SIZE)
      : transactions
    return source.map((t) => ({
      id: t._id,
      time: formatTime(t.createdAt),
      transactionId: t.transactionId || t._id,
      type: t.type === 'deposit' ? 'Deposit' : t.type === 'withdrawal' ? 'Withdrawal' : t.type,
      amount: formatAmount(t.amount, t.currency),
      approvedAmount: t.status === 'approved' || t.status === 'completed' ? formatAmount(t.amount, t.currency) : '—',
      status: formatStatus(t.status),
      statusRaw: t.status,
      notes: t.adminRemarks || t.remarks || '—',
      paymentMethod: formatPaymentMethod(t.paymentMethod),
      paymentProofUrl: t.type === 'deposit' ? getPaymentProofFullUrl(t.paymentProofUrl) : null,
    }))
  }, [transactions, typeFilter, pagination.page])

  return (
    <>
      <Header />
      <div className='dashboard_page'>
        <div className='container-fluid'>
          <div className='profile_transactions_section'>
            <div className='transactions_header'>
              <h1>My Transactions</h1>
              <div className='transactions_header_right'>
                <div className='date_range_picker'>
                  <div className='date_input_wrapper'>
                    <input type="date" className='date_input' defaultValue="2025-05-30" />
                    <i className="ri-arrow-down-s-line date_arrow"></i>
                  </div>
                  <div className='date_input_wrapper'>
                    <input type="date" className='date_input' defaultValue="2025-06-13" />
                    <i className="ri-arrow-down-s-line date_arrow"></i>
                  </div>
                </div>
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
              </div>
            </div>

            {list.length === 0 ? (
              <p className="text-white-50">No deposit or withdrawal transactions yet.</p>
            ) : (
              <>
                <div className='transactions_table_wrapper'>
                  <table className='transactions_table'>
                    <thead>
                      <tr>
                        <th>Transaction Time</th>
                        <th>Transaction ID</th>
                        <th>Transaction Type</th>
                        <th>Amount</th>
                        <th>Transaction Status</th>
                        <th>Payment Method</th>
                        <th>Payment Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.time}</td>
                          <td>{tx.transactionId}</td>
                          <td>{tx.type}</td>
                          <td>{tx.amount}</td>
                          <td>
                            <span className={`status_badge status_${(tx.statusRaw || '').toLowerCase()}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td>{tx.paymentMethod}</td>
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
                          <span className='transaction_value'>{tx.transactionId}</span>
                        </div>
                        <div className='transaction_card_row'>
                          <span className='transaction_label'>Amount</span>
                          <span className='transaction_value amount_value'>{tx.amount}</span>
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
                          <span className='transaction_label'>Notes</span>
                          <span className='transaction_value'>{tx.notes}</span>
                        </div>
                        {tx.paymentProofUrl && (
                          <div className='transaction_card_row transaction_card_row_proof'>
                            <span className='transaction_label'>Payment Proof</span>
                            <span className='transaction_value'>
                              <a href={tx.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="transaction_payment_proof_link" aria-label="View payment proof">
                                <img src={tx.paymentProofUrl} alt="Payment proof" className="transaction_payment_proof_thumb" />
                              </a>
                            </span>
                          </div>
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
                    Page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total)
                  </span>
                  <button
                    type="button"
                    className='pagination_btn'
                    onClick={handleNext}
                    disabled={!pagination.hasMore}
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

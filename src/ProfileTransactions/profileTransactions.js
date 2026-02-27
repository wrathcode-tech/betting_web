import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AuthService from '../api/services/AuthService'
import MobileMenu from '../customComponents/MobileMenu'
import Header from '../customComponents/Header'
import './profileTransactions.css'

const PAGE_SIZE = 10

// Dummy data when no transactions from API (same shape as API response)
const DUMMY_TRANSACTIONS = [
  { _id: 'dummy-1', createdAt: '2025-06-12T10:30:00.000Z', transactionId: 'TXN20250612001', type: 'deposit', amount: 5000, currency: 'INR', status: 'approved', paymentMethod: 'UPI', adminRemarks: 'Deposit via Google Pay' },
  { _id: 'dummy-2', createdAt: '2025-06-11T14:22:00.000Z', transactionId: 'TXN20250611002', type: 'withdrawal', amount: 2500, currency: 'INR', status: 'completed', paymentMethod: 'BANK_TRANSFER', adminRemarks: 'Processed to bank account' },
  { _id: 'dummy-3', createdAt: '2025-06-10T09:15:00.000Z', transactionId: 'TXN20250610003', type: 'deposit', amount: 10000, currency: 'INR', status: 'approved', paymentMethod: 'BANK', adminRemarks: '—' },
  { _id: 'dummy-4', createdAt: '2025-06-09T16:45:00.000Z', transactionId: 'TXN20250609004', type: 'withdrawal', amount: 3000, currency: 'INR', status: 'pending', paymentMethod: 'UPI', adminRemarks: 'Under review' },
  { _id: 'dummy-5', createdAt: '2025-06-08T11:00:00.000Z', transactionId: 'TXN20250608005', type: 'deposit', amount: 7500, currency: 'INR', status: 'approved', paymentMethod: 'UPI', adminRemarks: 'Bonus credited' },
  { _id: 'dummy-6', createdAt: '2025-06-07T08:30:00.000Z', transactionId: 'TXN20250607006', type: 'deposit', amount: 2000, currency: 'INR', status: 'rejected', paymentMethod: 'BANK', adminRemarks: 'Invalid details' },
  { _id: 'dummy-7', createdAt: '2025-06-06T13:20:00.000Z', transactionId: 'TXN20250606007', type: 'withdrawal', amount: 4500, currency: 'INR', status: 'completed', paymentMethod: 'BANK_TRANSFER', adminRemarks: '—' },
  { _id: 'dummy-8', createdAt: '2025-06-05T17:55:00.000Z', transactionId: 'TXN20250605008', type: 'deposit', amount: 15000, currency: 'INR', status: 'approved', paymentMethod: 'BANK', adminRemarks: 'Welcome bonus' },
]

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
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }
      setLoading(true)
      const type = typeParam != null ? typeParam : (typeFilter === 'deposit' ? 'deposit' : typeFilter === 'withdrawal' ? 'withdrawal' : 'deposit,withdrawal')
      const res = await AuthService.bettingGetTransactions(page, PAGE_SIZE, type)
      setLoading(false)
      if (res?.success && res?.data) {
        setTransactions(res.data.transactions || [])
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
    const type = typeFilter === 'deposit' ? 'deposit' : typeFilter === 'withdrawal' ? 'withdrawal' : 'deposit,withdrawal'
    fetchTransactions(1, type)
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

  const useDummy = !loading && transactions.length === 0
  const rawList = useDummy ? DUMMY_TRANSACTIONS : transactions
  const filteredRaw =
    useDummy && typeFilter !== 'all'
      ? rawList.filter((t) => t.type === typeFilter)
      : rawList
  const list = useMemo(
    () =>
      filteredRaw.map((t) => ({
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
      })),
    [filteredRaw]
  )

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
                        <th>Approved Amount</th>
                        <th>Transaction Status</th>
                        <th>Notes</th>
                        <th>Payment Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.time}</td>
                          <td>{tx.transactionId}</td>
                          <td>{tx.type}</td>
                          <td>{tx.amount}</td>
                          <td>{tx.approvedAmount}</td>
                          <td>
                            <span className={`status_badge status_${(tx.statusRaw || '').toLowerCase()}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td>{tx.notes}</td>
                          <td>{tx.paymentMethod}</td>
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
                    Page {pagination.page} of {pagination.totalPages || 1} ({useDummy ? list.length : pagination.total} total)
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

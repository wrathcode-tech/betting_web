import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import HistoryTable from '../components/HistoryTable';
import Pagination from '../components/Pagination';
import FilterBar from '../components/FilterBar';
import { getReferralRewards } from '../api/historyApi';
import '../ProfileTransactions/ProfileTransactions.css';

const LIMIT = 20;
const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'createdAt:asc', label: 'Oldest' },
];
const TYPE_OPTIONS = [
  { value: 'signup', label: 'Signup' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'commission', label: 'Commission' },
];
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}
function formatAmount(amount) {
  if (amount == null) return '—';
  const n = Number(amount);
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatStatus(s) {
  if (!s) return '—';
  return String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase();
}

const COLUMNS = [
  { key: 'referredUser', label: 'Referred User' },
  { key: 'rewardType', label: 'Reward Type' },
  { key: 'amount', label: 'Amount', render: function (v) { return formatAmount(v); } },
  { key: 'status', label: 'Status', render: function (v) { return formatStatus(v); } },
  { key: 'createdAt', label: 'Date', render: function (v) { return formatDate(v); } },
];

export default function ReferralRewards() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('');

  const fetchData = useCallback(function () {
    setLoading(true);
    const params = { page, limit: LIMIT, type: type || undefined, status: status || undefined, sort: sort || undefined };
    getReferralRewards(params)
      .then(function (res) {
        if (!res) {
          setData([]);
          setPagination({ page: 1, limit: LIMIT, totalPages: 1 });
          return;
        }
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : (raw?.rewards ?? raw?.history ?? raw?.data ?? []);
        const arr = Array.isArray(list) ? list : [];
        setData(arr);
        const pag = res.pagination ?? raw?.pagination ?? {};
        setPagination({
          page: pag.page ?? 1,
          limit: pag.limit ?? LIMIT,
          totalPages: Math.max(1, pag.totalPages ?? (pag.totalRecords != null ? Math.ceil((pag.totalRecords || 0) / LIMIT) : 1)),
        });
      })
      .catch(function () {
        setData([]);
        setPagination({ page: 1, limit: LIMIT, totalPages: 1 });
        toast.error('Failed to load history');
      })
      .finally(function () {
        setLoading(false);
      });
  }, [page, type, status, sort]);

  useEffect(function () {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback(function (key, value) {
    if (key === 'type') setType(value);
    if (key === 'status') setStatus(value);
    setPage(1);
  }, []);

  return (
    <>
      <Header />
      <div className="dashboard_page">
        <div className="container-fluid">
          <div className="profile_transactions_section">
            <h1>Referral Rewards History</h1>
            <FilterBar
              filters={[
                { key: 'type', label: 'Type', options: TYPE_OPTIONS },
                { key: 'status', label: 'Status', options: STATUS_OPTIONS },
              ]}
              filterValues={{ type, status }}
              onFilterChange={handleFilterChange}
              sortOptions={SORT_OPTIONS}
              sortValue={sort}
              onSortChange={function (v) { setSort(v); setPage(1); }}
            />
            <HistoryTable columns={COLUMNS} data={data} loading={loading} emptyMessage="No history found." />
            <Pagination currentPage={pagination.page || 1} totalPages={Math.max(1, pagination.totalPages || 1)} onPageChange={setPage} loading={loading} />
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  );
}

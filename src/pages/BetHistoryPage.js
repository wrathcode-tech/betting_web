import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import HistoryTable from '../components/HistoryTable';
import Pagination from '../components/Pagination';
import FilterBar from '../components/FilterBar';
import { getBetHistory } from '../api/historyApi';
import '../ProfileTransactions/ProfileTransactions.css';

const LIMIT = 20;
const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'settledAt:desc', label: 'Newest' },
  { value: 'settledAt:asc', label: 'Oldest' },
];
const RESULT_OPTIONS = [
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'void', label: 'Void' },
];
const SPORT_OPTIONS = [
  { value: 'cricket', label: 'Cricket' },
  { value: 'soccer', label: 'Football' },
  { value: 'tennis', label: 'Tennis' },
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
  { key: 'eventName', label: 'Event' },
  { key: 'marketName', label: 'Market' },
  { key: 'stake', label: 'Stake', render: function (v) { return formatAmount(v); } },
  { key: 'odds', label: 'Odds' },
  { key: 'result', label: 'Result' },
  { key: 'profitLoss', label: 'Profit/Loss', render: function (v) { return formatAmount(v); } },
  { key: 'settledAt', label: 'Settled Date', render: function (v) { return formatDate(v); } },
];

export default function BetHistoryPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sport, setSport] = useState('');
  const [result, setResult] = useState('');
  const [sort, setSort] = useState('');

  const fetchData = useCallback(function () {
    setLoading(true);
    const params = {
      page,
      limit: LIMIT,
      sport: sport || undefined,
      result: result || undefined,
      sort: sort || undefined,
    };
    getBetHistory(params)
      .then(function (res) {
        if (res && res.success && Array.isArray(res.data)) {
          setData(res.data);
          setPagination(res.pagination || { page: 1, limit: LIMIT, totalPages: 1 });
        } else {
          setData([]);
          setPagination({ page: 1, limit: LIMIT, totalPages: 1 });
        }
      })
      .catch(function () {
        setData([]);
        toast.error('Failed to load history');
      })
      .finally(function () {
        setLoading(false);
      });
  }, [page, sport, result, sort]);

  useEffect(function () {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback(function (key, value) {
    if (key === 'sport') setSport(value);
    if (key === 'result') setResult(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback(function (value) {
    setSort(value);
    setPage(1);
  }, []);

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
            <Pagination currentPage={pagination.page || 1} totalPages={Math.max(1, pagination.totalPages || 1)} onPageChange={setPage} loading={loading} />
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  );
}

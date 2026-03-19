import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import HistoryTable from '../components/HistoryTable';
import Pagination from '../components/Pagination';
import FilterBar from '../components/FilterBar';
import { getOpenBets } from '../api/historyApi';
import '../ProfileTransactions/ProfileTransactions.css';

const LIMIT = 20;
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

const COLUMNS = [
  { key: 'eventName', label: 'Event' },
  { key: 'marketName', label: 'Market' },
  { key: 'stake', label: 'Stake', render: function (v) { return formatAmount(v); } },
  { key: 'odds', label: 'Odds' },
  { key: 'createdAt', label: 'Date', render: function (v) { return formatDate(v); } },
];

export default function OpenBets() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sport, setSport] = useState('');
  const [marketType, setMarketType] = useState('');

  const fetchData = useCallback(function () {
    setLoading(true);
    const params = { page, limit: 20, sport: sport || undefined, marketType: marketType || undefined };
    getOpenBets(params)
      .then(function (res) {
        if (res && res.success && Array.isArray(res.data)) {
          setData(res.data);
          const pag = res.pagination || {};
          const total = pag.total ?? pag.totalRecords ?? 0;
          const limit = 20;
          setPagination({
            page: pag.page ?? page,
            limit: pag.limit ?? limit,
            totalPages: pag.totalPages ?? (limit && total ? Math.ceil(total / limit) : 1),
          });
        } else {
          setData([]);
          setPagination({ page: 1, limit: 20, totalPages: 1 });
          if (res?.success === false && res?.message) toast.error(res.message);
        }
      })
      .catch(function (err) {
        setData([]);
        toast.error(err?.message || 'Failed to load history');
      })
      .finally(function () {
        setLoading(false);
      });
  }, [page, sport, marketType]);

  useEffect(function () {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback(function (key, value) {
    if (key === 'sport') setSport(value);
    if (key === 'marketType') setMarketType(value);
    setPage(1);
  }, []);

  return (
    <>
      <Header />
      <div className="dashboard_page">
        <div className="container-fluid">
          <div className="profile_transactions_section">
            <h1>Open Bets</h1>
            <FilterBar
              filters={[
                { key: 'sport', label: 'Sport', options: SPORT_OPTIONS },
              ]}
              filterValues={{ sport }}
              onFilterChange={handleFilterChange}
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

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import AuthService from '../api/services/AuthService';
import '../ProfileTransactions/profileTransactions.css';
import './gameHistory.css';

const PAGE_SIZE = 20;

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Win: +₹amount, Loss: -₹amount */
function formatAmount(amount) {
  if (amount == null) return '—';
  const n = Number(amount);
  const prefix = n >= 0 ? '+' : '-';
  return `${prefix}₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** DD/MM/YYYY HH:mm:ss for modal */
function formatModalDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${h}:${min}:${sec}`;
}

/** Map API status (win/loss) to existing status badge class (won/lost) */
function statusClass(status) {
  if (!status) return '';
  const s = String(status).toLowerCase();
  if (s === 'win') return 'won';
  if (s === 'loss') return 'lost';
  return s;
}

const FILTER_CASINO = 'casino';
const FILTER_SPORTSBOOK = 'sportsbook';

function GameHistory() {
  const [filter, setFilter] = useState(FILTER_CASINO);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchTransactions = useCallback(async (page = 1) => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res =
      filter === FILTER_CASINO
        ? await AuthService.gamesTransactions(page, PAGE_SIZE)
        : await AuthService.gamesSportsbookTransactions(page, PAGE_SIZE);
    setLoading(false);
    const ok = res?.success || res?.status === 'success';
    if (ok && res?.data) {
      setTransactions(res.data.transactions || []);
      const p = res.data.pagination || {};
      setPagination({
        page: p.page ?? page,
        limit: p.limit ?? PAGE_SIZE,
        total: p.total ?? 0,
        totalPages: p.totalPages ?? 1,
        hasMore: (p.page ?? page) < (p.totalPages ?? 1),
      });
    }
  }, [filter]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const handlePrev = useCallback(() => {
    if (pagination.page <= 1) return;
    fetchTransactions(pagination.page - 1);
  }, [fetchTransactions, pagination.page]);

  const handleNext = useCallback(() => {
    if (!pagination.hasMore) return;
    fetchTransactions(pagination.page + 1);
  }, [fetchTransactions, pagination.hasMore, pagination.page]);

  return (
    <>
      <Header />
      <div className="dashboard_page game_history_page">
        <div className="container-fluid">
          <div className="profile_transactions_section">
            <div className="transactions_header">
              <h1>Game History</h1>
              <div className="game_history_filter_wrapper">
                <label htmlFor="game-history-type-filter" className="game_history_filter_label">Type</label>
                <select
                  id="game-history-type-filter"
                  className="game_history_filter_select deposit_btn_style"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setSelectedTransaction(null);
                  }}
                  aria-label="Filter by Casino or SportsBook"
                >
                  <option value={FILTER_CASINO}>Casino</option>
                  <option value={FILTER_SPORTSBOOK}>SportsBook</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p className="text-white-50">Loading game history...</p>
            ) : transactions.length === 0 ? (
              <p className="text-white-50">
                {filter === FILTER_CASINO ? 'No casino transactions yet.' : 'No sportsbook transactions yet.'}
              </p>
            ) : (
              <>
                <div className="transactions_table_wrapper">
                  <table className="transactions_table game_history_table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Game</th>
                        {/* <th>Provider</th> */}
                        <th>Bet Amount</th>
                        <th>Result</th>
                        <th>Amount Won/Lost</th>
                        <th>Balance (Before)</th>
                        <th>Balance (After)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => (
                        <tr
                          key={tx.providerRoundId || tx.sessionId || idx}
                          className="game_history_row_clickable"
                          onClick={() => setSelectedTransaction(tx)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedTransaction(tx)}
                        >
                          <td>{formatDateTime(tx.dateTime)}</td>
                          <td>{tx.gameName || tx.gameCode || '—'}</td>
                          {/* <td>{tx.providerCode || '—'}</td> */}
                          <td>₹{Number(tx.betAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td>
                            <span className={`status_badge status_${statusClass(tx.status)}`}>
                              {tx.status ? String(tx.status).charAt(0).toUpperCase() + String(tx.status).slice(1).toLowerCase() : '—'}
                            </span>
                          </td>
                          <td className={tx.status && String(tx.status).toLowerCase() === 'win' ? 'amount_positive' : 'amount_negative'}>
                            {formatAmount(tx.amountWonOrLost)}
                          </td>
                          <td>₹{Number(tx.balanceAtBet ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td>₹{Number(tx.balanceAfter ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="game_history_cards_wrapper">
                  {transactions.map((tx, idx) => (
                    <div
                      key={tx.providerRoundId || tx.sessionId || idx}
                      className="transaction_card game_history_card game_history_card_clickable"
                      onClick={() => setSelectedTransaction(tx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedTransaction(tx)}
                    >
                      <div className="transaction_card_header">
                        <div className="transaction_card_title">
                          <h3>{tx.gameName || tx.gameCode || 'Game'}</h3>
                          <span className={`status_badge status_${statusClass(tx.status)}`}>
                            {tx.status ? String(tx.status).charAt(0).toUpperCase() + String(tx.status).slice(1).toLowerCase() : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="transaction_card_body">
                        <div className="transaction_card_row">
                          <span className="transaction_label">Date & Time</span>
                          <span className="transaction_value">{formatDateTime(tx.dateTime)}</span>
                        </div>
                        <div className="transaction_card_row">
                          <span className="transaction_label">Provider</span>
                          <span className="transaction_value">{tx.providerCode || '—'}</span>
                        </div>
                        <div className="transaction_card_row">
                          <span className="transaction_label">Bet Amount</span>
                          <span className="transaction_value amount_value">₹{Number(tx.betAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="transaction_card_row">
                          <span className="transaction_label">Amount Won/Lost</span>
                          <span className={`transaction_value ${tx.status && String(tx.status).toLowerCase() === 'win' ? 'amount_positive' : 'amount_negative'}`}>
                            {formatAmount(tx.amountWonOrLost)}
                          </span>
                        </div>
                        <div className="transaction_card_row">
                          <span className="transaction_label">Balance (Before → After)</span>
                          <span className="transaction_value">
                            ₹{Number(tx.balanceAtBet ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} → ₹{Number(tx.balanceAfter ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="transactions_pagination">
                  <button
                    type="button"
                    className="pagination_btn"
                    onClick={handlePrev}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </button>
                  <span className="pagination_info">
                    Page {pagination.page} of {pagination.totalPages || 1} ({pagination.total} total)
                  </span>
                  <button
                    type="button"
                    className="pagination_btn"
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

      {/* BET HISTORY modal */}
      {selectedTransaction && (
        <div
          className="game_history_modal_overlay"
          onClick={() => setSelectedTransaction(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bet_history_title"
        >
          <div className="game_history_modal" onClick={(e) => e.stopPropagation()}>
            <div className="game_history_modal_header">
              <h2 id="bet_history_title">BET HISTORY</h2>
              <button
                type="button"
                className="game_history_modal_close"
                onClick={() => setSelectedTransaction(null)}
                aria-label="Close"
              >
                <i className="ri-close-line" />
              </button>
            </div>
            <div className="game_history_modal_game_bar">
              {selectedTransaction.gameName || selectedTransaction.gameCode || 'Game'}
            </div>
            <div className="game_history_modal_section">
              <h3>{filter === FILTER_CASINO ? 'Casino' : 'SportsBook'} Transaction Details</h3>
              <div className="game_history_modal_details">
                <div className="game_history_modal_row">
                  <span className="game_history_modal_label">Round ID</span>
                  <span className="game_history_modal_value">{selectedTransaction.providerRoundId || '—'}</span>
                </div>
                <div className="game_history_modal_row">
                  <span className="game_history_modal_label">Side</span>
                  <span className={`game_history_modal_value ${selectedTransaction.status && String(selectedTransaction.status).toLowerCase() === 'win' ? 'amount_positive' : 'amount_negative'}`}>
                    {selectedTransaction.status ? String(selectedTransaction.status).charAt(0).toUpperCase() + String(selectedTransaction.status).slice(1).toLowerCase() : '—'}
                  </span>
                </div>
                <div className="game_history_modal_row">
                  <span className="game_history_modal_label">Game Code</span>
                  <span className="game_history_modal_value">{selectedTransaction.gameCode || '—'}</span>
                </div>
                <div className="game_history_modal_row">
                  <span className="game_history_modal_label">Amount</span>
                  <span className={`game_history_modal_value ${Number(selectedTransaction.amountWonOrLost) >= 0 ? 'amount_positive' : 'amount_negative'}`}>
                    {formatAmount(selectedTransaction.amountWonOrLost)}
                  </span>
                </div>
                <div className="game_history_modal_row">
                  <span className="game_history_modal_label">Placed Date</span>
                  <span className="game_history_modal_value">{formatModalDateTime(selectedTransaction.dateTime)}</span>
                </div>
                <div className="game_history_modal_row">
                  <span className="game_history_modal_label">Settled Time</span>
                  <span className="game_history_modal_value">{formatModalDateTime(selectedTransaction.dateTime)}</span>
                </div>
                <div className="game_history_modal_row">
                  <span className="game_history_modal_label">Bet Amount</span>
                  <span className="game_history_modal_value">₹{Number(selectedTransaction.betAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="game_history_modal_row">
                  <span className="game_history_modal_label">Balance (Before)</span>
                  <span className="game_history_modal_value">₹{Number(selectedTransaction.balanceAtBet ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="game_history_modal_row">
                  <span className="game_history_modal_label">Balance (After)</span>
                  <span className="game_history_modal_value">₹{Number(selectedTransaction.balanceAfter ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="game_history_modal_row">
                  <span className="game_history_modal_label">Provider</span>
                  <span className="game_history_modal_value">{selectedTransaction.providerCode || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileMenu />
    </>
  );
}

export default GameHistory;

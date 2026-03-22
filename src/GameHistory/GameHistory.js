import React, { useState, useEffect, useCallback } from 'react';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import AuthService from '../api/services/AuthService';
import '../ProfileTransactions/ProfileTransactions.css';
import './gameHistory.css';

const PAGE_SIZE = 20;
const VIEW_SESSIONS = 'sessions';
const VIEW_TRANSACTIONS = 'transactions';
const VIEW_LEDGER = 'ledger';

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
  const [casinoView, setCasinoView] = useState(VIEW_TRANSACTIONS);
  const [search, setSearch] = useState('');
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchTransactions = useCallback(async (page = 1) => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setTransactions([]);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 1, hasMore: false }));
      return;
    }
    setLoading(true);
    try {
      let res;
      if (filter === FILTER_CASINO) {
        if (casinoView === VIEW_SESSIONS) {
          res = await AuthService.gamesHistory({
            page,
            limit: PAGE_SIZE,
            from: dateFrom || undefined,
            to: dateTo || undefined,
          });
        } else if (casinoView === VIEW_LEDGER) {
          res = await AuthService.gamesTransactionHistory({
            page,
            limit: PAGE_SIZE,
            from: dateFrom || undefined,
            to: dateTo || undefined,
          });
        } else {
          res = await AuthService.gamesTransactions(page, PAGE_SIZE);
        }
      } else {
        res = await AuthService.gamesSportsbookTransactions(page, PAGE_SIZE);
      }
      const data = res?.data ?? res;
      let list;
      if (filter === FILTER_SPORTSBOOK) {
        list = data?.transactions ?? data?.sessions ?? data?.bets ?? [];
      } else if (casinoView === VIEW_SESSIONS) {
        list = data?.sessions ?? [];
      } else {
        list = data?.transactions ?? data?.sessions ?? [];
      }
      const p = data?.pagination ?? {};
      if (Array.isArray(list)) {
        setTransactions(list);
        setPagination({
          page: p.page ?? page,
          limit: p.limit ?? PAGE_SIZE,
          total: p.total ?? 0,
          totalPages: p.totalPages ?? 1,
          hasMore: (p.page ?? page) < (p.totalPages ?? 1),
        });
      } else {
        setTransactions([]);
        setPagination((prev) => ({ ...prev, total: 0, totalPages: 1, hasMore: false }));
      }
    } catch (err) {
      setTransactions([]);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 1, hasMore: false }));
    } finally {
      setLoading(false);
    }
  }, [filter, casinoView, dateFrom, dateTo]);

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

  const searchLower = (search || '').trim().toLowerCase();
  const filteredTransactions = searchLower
    ? transactions.filter((tx) => {
        if (filter === FILTER_CASINO && casinoView === VIEW_LEDGER) {
          const remark = (tx.remark || '').toLowerCase();
          const txId = (tx.id || tx.transactionId || '').toLowerCase();
          return remark.includes(searchLower) || txId.includes(searchLower);
        }
        if (filter === FILTER_CASINO && casinoView === VIEW_SESSIONS) {
          const game = (tx.gameCode || '').toLowerCase();
          const sessionId = (tx.sessionId || '').toLowerCase();
          const provider = (tx.providerCode || '').toLowerCase();
          return game.includes(searchLower) || sessionId.includes(searchLower) || provider.includes(searchLower);
        }
        const game = (tx.gameName || tx.gameCode || '').toLowerCase();
        const roundId = (tx.providerRoundId || tx.sessionId || '').toLowerCase();
        const provider = (tx.providerCode || '').toLowerCase();
        return game.includes(searchLower) || roundId.includes(searchLower) || provider.includes(searchLower);
      })
    : transactions;

  return (
    <>
      <Header />
      <div className="dashboard_page game_history_page">
        <div className="container-fluid">
          <div className="profile_transactions_section">
            <div className="transactions_header game_history_header">
              <h1>Game History</h1>
              <div className="transactions_header_right game_history_header_right d-flex flex-wrap align-items-end gap-2">
                <div className="game_history_filter_wrapper_row d-flex gap-3 flex-wrap align-items-end">
                  <div className="game_history_filter_wrapper">
                    <label htmlFor="game-history-type-filter" className="game_history_filter_label">Type</label>
                    <select
                      id="game-history-type-filter"
                      className="game_history_filter_select"
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
                  {filter === FILTER_CASINO && (
                    <div className="game_history_filter_wrapper">
                      <label htmlFor="game-history-casino-view" className="game_history_filter_label">View</label>
                      <select
                        id="game-history-casino-view"
                        className="game_history_filter_select"
                        value={casinoView}
                        onChange={(e) => {
                          setCasinoView(e.target.value);
                          setSelectedTransaction(null);
                        }}
                        aria-label="Casino view"
                      >
                        <option value={VIEW_SESSIONS}>Sessions</option>
                        <option value={VIEW_TRANSACTIONS}>Transactions</option>
                        <option value={VIEW_LEDGER}>Ledger</option>
                      </select>
                    </div>
                  )}
                </div>
                {filter === FILTER_CASINO && (casinoView === VIEW_SESSIONS || casinoView === VIEW_LEDGER) && (
                  <div className="game_history_date_group">
                    <input type="date" className="game_history_date_input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" title="From date" />
                    <input type="date" className="game_history_date_input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" title="To date" />
                    <button type="button" className="game_history_apply_btn" onClick={() => fetchTransactions(1)}>Apply</button>
                  </div>
                )}
                <input
                  type="text"
                  placeholder={filter === FILTER_SPORTSBOOK ? 'Search sportsbook…' : 'Search game, round ID…'}
                  className="game_history_search_input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search"
                />
               
              </div>
            </div>

            {loading ? (
              <p className="text-white-50">Loading game history...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-white-50">
                {search ? 'No matches for your search.' : (filter === FILTER_CASINO ? (casinoView === VIEW_SESSIONS ? 'No casino sessions yet.' : casinoView === VIEW_LEDGER ? 'No ledger entries yet.' : 'No casino transactions yet.') : 'No sportsbook transactions yet.')}
              </p>
            ) : (
              <>
                <div className="transactions_table_wrapper">
                  <table className="transactions_table game_history_table">
                    <thead>
                      <tr>
                        {filter === FILTER_CASINO && casinoView === VIEW_LEDGER ? (
                          <>
                            <th>Date</th>
                            <th>Credit</th>
                            <th>Debit</th>
                            <th>Balance</th>
                            <th>Transaction ID</th>
                            <th>Remark</th>
                          </>
                        ) : filter === FILTER_CASINO && casinoView === VIEW_SESSIONS ? (
                          <>
                            <th>Session ID</th>
                            <th>Game</th>
                            <th>Provider</th>
                            <th>Balance (Start)</th>
                            <th>Balance (End)</th>
                            <th>Total Bets</th>
                            <th>Total Stake</th>
                            <th>Total Winnings</th>
                            <th>Started</th>
                            <th>Ended</th>
                          </>
                        ) : (
                          <>
                            <th>Date & Time</th>
                            <th>Game</th>
                            <th>Bet Amount</th>
                            <th>Result</th>
                            <th>Amount Won/Lost</th>
                            <th>Balance (Before)</th>
                            <th>Balance (After)</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filter === FILTER_CASINO && casinoView === VIEW_LEDGER
                        ? filteredTransactions.map((tx, idx) => (
                            <tr key={tx.id || tx.transactionId || idx}>
                              <td>{formatDateTime(tx.date)}</td>
                              <td className="amount_positive">₹{Number(tx.credit ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="amount_negative">₹{Number(tx.debit ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td>₹{Number(tx.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td>{tx.id != null ? `Transaction #${tx.id}` : (tx.transactionId || '—')}</td>
                              <td>{tx.remark || '—'}</td>
                            </tr>
                          ))
                        : filter === FILTER_CASINO && casinoView === VIEW_SESSIONS
                          ? filteredTransactions.map((sess, idx) => (
                              <tr key={sess.sessionId || sess._id || idx}>
                                <td>{sess.sessionId || '—'}</td>
                                <td>{sess.gameCode || '—'}</td>
                                <td>{sess.providerCode || '—'}</td>
                                <td>₹{Number(sess.balanceAtStart ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td>₹{Number(sess.balanceAtEnd ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td>{Number(sess.totalBets ?? 0)}</td>
                                <td>₹{Number(sess.totalStake ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                <td className={Number(sess.totalWinnings ?? 0) >= 0 ? 'amount_positive' : 'amount_negative'}>
                                  {formatAmount(sess.totalWinnings)}
                                </td>
                                <td>{formatDateTime(sess.createdAt)}</td>
                                <td>{formatDateTime(sess.endedAt)}</td>
                              </tr>
                            ))
                          : filteredTransactions.map((tx, idx) => (
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

                {!(filter === FILTER_CASINO && (casinoView === VIEW_LEDGER || casinoView === VIEW_SESSIONS)) && (
                <div className="game_history_cards_wrapper">
                  {filteredTransactions.map((tx, idx) => (
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
                )}

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
      {selectedTransaction && !(filter === FILTER_CASINO && (casinoView === VIEW_LEDGER || casinoView === VIEW_SESSIONS)) && (
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

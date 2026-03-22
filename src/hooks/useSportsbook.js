/**
 * React hooks for Sportsbook API and real-time updates.
 * Use with Socket.IO for live odds/score/betUpdate/balance.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as sportsbookApi from '../api/services/sportsbookApi';
import {
  subscribeMatches,
  unsubscribeMatches,
  subscribeOdds,
  unsubscribeOdds,
  addMatchesListener,
  removeMatchesListener,
  addOddsListener,
  removeOddsListener,
  addBetUpdateListener,
  removeBetUpdateListener,
} from '../socket/sportsbookSocket';
import { getMatchRowsFromSocketPayload, expandSocketBatchPayload } from '../utils/sportsbookMatchesPayload';

const SPORTS = ['cricket', 'soccer', 'tennis'];

/**
 * Fetch matches for a sport. Optionally subscribe to socket for live list.
 * @param {string} sport - cricket | soccer | tennis
 * @param {{ fresh?: boolean, subscribeSocket?: boolean }} [options]
 */
export function useSportsbookMatches(sport, options = {}) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sportKey = SPORTS.includes(String(sport).toLowerCase()) ? String(sport).toLowerCase() : 'cricket';

  const refetch = useCallback(() => {
    setMatches([]);
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    if (!options.subscribeSocket) {
      setLoading(false);
      return undefined;
    }
    const onPayload = (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        if (payload?.sport !== sportKey) continue;
        if (payload?.error) {
          setError(payload?.message || 'Matches stream error');
          setLoading(false);
          continue;
        }
        const { rows, schema } = getMatchRowsFromSocketPayload(payload);
        setMatches((prev) => (rows.length > 0 ? rows : schema === 'listSummary' ? rows : prev));
        setLoading(false);
        setError(null);
      }
    };
    addMatchesListener(onPayload);
    subscribeMatches(sportKey);
    return () => {
      removeMatchesListener(onPayload);
      unsubscribeMatches(sportKey);
    };
  }, [sportKey, options.subscribeSocket]);

  return { matches, loading, error, refetch };
}

/**
 * Fetch odds for a match. Optionally subscribe to socket for live odds.
 * @param {string} sport - cricket | soccer | tennis
 * @param {string} gameIdOrEventId - gameId from matches (eventId for tennis)
 */
export function useSportsbookOdds(sport, gameIdOrEventId) {
  const [oddsData, setOddsData] = useState(null);
  const [loading, setLoading] = useState(!!gameIdOrEventId);
  const [error, setError] = useState(null);
  const sportKey = SPORTS.includes(String(sport).toLowerCase()) ? String(sport).toLowerCase() : 'cricket';

  useEffect(() => {
    if (!gameIdOrEventId) {
      setOddsData(null);
      setLoading(false);
      setError(null);
      return undefined;
    }
    setLoading(true);
    setError(null);
    const id = String(gameIdOrEventId);
    const onPayload = (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        const key = payload?.eventId != null ? String(payload.eventId) : payload?.gameId != null ? String(payload.gameId) : null;
        if (key !== id || payload?.data === undefined) continue;
        setOddsData((prev) => ({ ...(prev && typeof prev === 'object' ? prev : {}), ...payload.data }));
        setLoading(false);
        setError(null);
      }
    };
    addOddsListener(onPayload);
    subscribeOdds(id, sportKey);
    return () => {
      removeOddsListener(onPayload);
      unsubscribeOdds(id, sportKey);
    };
  }, [gameIdOrEventId, sportKey]);

  const refetch = useCallback(() => {
    /* socket-only */
  }, []);

  return { oddsData, loading, error, refetch };
}

/**
 * Open bets – GET /bet/open. Refetch on betUpdate event if onBetUpdate provided.
 */
export function useSportsbookOpenBets(params = {}, options = {}) {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsRef = useRef(params);

  const fetchOpen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sportsbookApi.getOpenBets(paramsRef.current);
      const data = res?.data ?? res;
      const list = Array.isArray(data?.bets) ? data.bets : Array.isArray(data) ? data : [];
      setBets(list);
    } catch (e) {
      setError(e?.message || 'Failed to load open bets');
      setBets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    fetchOpen();
  }, [fetchOpen, params.page, params.limit, params.sport]);

  useEffect(() => {
    if (!options.subscribeBetUpdate) return;
    const token = sessionStorage.getItem('token');
    if (!token) return;
    const onBetUpdate = () => fetchOpen();
    addBetUpdateListener(onBetUpdate);
    return () => removeBetUpdateListener(onBetUpdate);
  }, [options.subscribeBetUpdate, fetchOpen]);

  return { bets, loading, error, refetch: fetchOpen };
}

/**
 * Bet history – GET /bet/history with filters.
 */
export function useSportsbookBetHistory(params = {}) {
  const [bets, setBets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (page = 1, overrides = {}) => {
    setLoading(true);
    setError(null);
    try {
      const p = { ...params, page, limit: params.limit ?? 20, ...overrides };
      const res = await sportsbookApi.getBetHistory(p);
      const data = res?.data ?? res;
      const list = Array.isArray(data?.bets) ? data.bets : Array.isArray(data) ? data : [];
      setBets(list);
      setPagination(data?.pagination ?? { page: 1, limit: 20, total: list.length, totalPages: 1 });
    } catch (e) {
      setError(e?.message || 'Failed to load history');
      setBets([]);
    } finally {
      setLoading(false);
    }
  }, [params.sport, params.result, params.from, params.to, params.limit]);

  useEffect(() => {
    fetchHistory(params.page || 1);
  }, [fetchHistory, params.page]);

  return { bets, pagination, loading, error, refetch: fetchHistory };
}

/**
 * Bet summary – GET /bet/summary (open count, exposure, today P&L).
 */
export function useSportsbookBetSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sportsbookApi.getBetSummary();
      const data = res?.data ?? res;
      setSummary(data && typeof data === 'object' ? data : null);
    } catch (e) {
      setError(e?.message || 'Failed to load summary');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}

/**
 * Place a single bet. Returns { place, placing, error, result }.
 * Prevents duplicate submission; call placeBet(body) then handle result.
 */
export function usePlaceBet() {
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const submittingRef = useRef(false);

  const placeBet = useCallback(async (body) => {
    if (submittingRef.current) return { success: false, message: 'Already submitting' };
    submittingRef.current = true;
    setPlacing(true);
    setError(null);
    setResult(null);
    try {
      const res = await sportsbookApi.placeBet(body);
      const ok = res?.success !== false && !String(res?.message || '').toLowerCase().includes('fail');
      setResult(res);
      if (!ok) setError(res?.message || 'Bet failed');
      return res;
    } catch (e) {
      const msg = e?.message || 'Failed to place bet';
      setError(msg);
      setResult({ success: false, message: msg });
      return { success: false, message: msg };
    } finally {
      setPlacing(false);
      submittingRef.current = false;
    }
  }, []);

  return { placeBet, placing, error, result };
}

/**
 * Cashout – get value and execute. useSportsbookOpenBets refetch after cashout.
 */
export function useCashout(betId) {
  const [cashoutValue, setCashoutValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cashingOut, setCashingOut] = useState(false);
  const [error, setError] = useState(null);

  const fetchValue = useCallback(async () => {
    if (!betId) {
      setCashoutValue(null);
      return;
    }
    setLoading(true);
    try {
      const res = await sportsbookApi.getCashoutValue(betId);
      const val = res?.cashoutValue ?? res?.data?.cashoutValue ?? res?.value;
      setCashoutValue(val != null ? Number(val) : null);
    } catch {
      setCashoutValue(null);
    } finally {
      setLoading(false);
    }
  }, [betId]);

  useEffect(() => {
    fetchValue();
  }, [fetchValue]);

  const executeCashout = useCallback(async () => {
    if (!betId) return { success: false };
    setCashingOut(true);
    setError(null);
    try {
      const res = await sportsbookApi.cashout(betId);
      const ok = res?.success !== false;
      if (!ok) setError(res?.message || 'Cashout failed');
      return res;
    } catch (e) {
      setError(e?.message || 'Cashout failed');
      return { success: false, message: e?.message };
    } finally {
      setCashingOut(false);
    }
  }, [betId]);

  return { cashoutValue, loading, fetchValue, executeCashout, cashingOut, error };
}

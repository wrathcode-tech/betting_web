/**
 * Hybrid matches: REST first paint → socket incremental updates into normalized store.
 * Subscribes only subscribe:matches for this sport (no per-match odds here).
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import * as sportsbookApi from '../api/services/sportsbookApi';
import {
  subscribeMatches,
  unsubscribeMatches,
  addMatchesListener,
  removeMatchesListener,
} from '../socket/sportsbookSocket';
import {
  subscribeSportsbookStore,
  getMatchesSnapshot,
  setMatchesForSport,
  mergeMatchesForSportIfChanged,
} from '../stores/sportsbookRealtimeStore';

function parseMatchesList(res) {
  if (!res) return [];
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.matches)) return data.matches;
  return [];
}

function normalizeSport(s) {
  const k = String(s || 'cricket').toLowerCase();
  return ['cricket', 'tennis', 'soccer'].includes(k) ? k : 'cricket';
}

/**
 * @param {string} sport cricket | tennis | soccer
 * @param {{ enableSocket?: boolean }} [options]
 */
export function useMatchesStream(sport, options = {}) {
  const { enableSocket = true } = options;
  const key = normalizeSport(sport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const subscribeStore = useCallback((cb) => subscribeSportsbookStore(cb), []);
  const getSnap = useCallback(() => getMatchesSnapshot(key), [key]);
  const matches = useSyncExternalStore(subscribeStore, getSnap, getSnap);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    sportsbookApi
      .getMatches(key)
      .then((res) => {
        if (cancelled) return;
        const list = parseMatchesList(res);
        setMatchesForSport(key, list);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load matches');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!enableSocket) return;
    connectSportsbookSocket(getToken() || null);
    const onMatches = (payload) => {
      if (payload?.sport !== key) return;
      const raw = payload?.data ?? payload?.matches;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      if (list.length === 0) return;
      mergeMatchesForSportIfChanged(key, list, payload?.timestamp);
    };
    addMatchesListener(onMatches);
    subscribeMatches(key);
    return () => {
      removeMatchesListener(onMatches);
      unsubscribeMatches(key);
    };
  }, [key, enableSocket]);

  return { matches, loading, error };
}

export default useMatchesStream;

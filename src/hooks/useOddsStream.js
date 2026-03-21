/**
 * Hybrid odds: REST hydrate → socket incremental patches (deduped in store).
 * Optional scoreboard subscription + REST fallback if no socket payload for staleMs.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import * as sportsbookApi from '../api/services/sportsbookApi';
import {
  subscribeOdds,
  unsubscribeOdds,
  subscribeScoreboard,
  unsubscribeScoreboard,
  addOddsListener,
  removeOddsListener,
  addScoreboardListener,
  removeScoreboardListener,
} from '../socket/sportsbookSocket';
import {
  subscribeSportsbookStore,
  getOddsSnapshot,
  getScoreboardSnapshot,
  patchOddsIfChanged,
  patchScoreboardIfChanged,
} from '../stores/sportsbookRealtimeStore';

function normalizeSport(s) {
  const k = String(s || 'cricket').toLowerCase();
  return ['cricket', 'tennis', 'soccer'].includes(k) ? k : 'cricket';
}

function normalizeOddsPayload(data) {
  if (!data || typeof data !== 'object') return null;
  const matchOdds = Array.isArray(data.matchOdds)
    ? data.matchOdds
    : Array.isArray(data.match_odds)
      ? data.match_odds
      : [];
  return { ...data, matchOdds };
}

/**
 * @param {string|null|undefined} gameIdOrEventId
 * @param {string} sport
 * @param {{
 *   enableSocket?: boolean,
 *   enableScoreboard?: boolean,
 *   staleFallbackMs?: number,
 * }} [options]
 */
export function useOddsStream(gameIdOrEventId, sport, options = {}) {
  const {
    enableSocket = true,
    enableScoreboard = false,
    staleFallbackMs = 4500,
  } = options;
  const sportKey = normalizeSport(sport);
  const id = gameIdOrEventId != null && gameIdOrEventId !== '' ? String(gameIdOrEventId) : null;

  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);
  const lastSocketAtRef = useRef(0);

  const subscribeStore = useCallback((cb) => subscribeSportsbookStore(cb), []);
  const oddsSnap = useCallback(() => (id ? getOddsSnapshot(id) : null), [id]);
  const odds = useSyncExternalStore(subscribeStore, oddsSnap, oddsSnap);
  const sbSnap = useCallback(() => (id ? getScoreboardSnapshot(id) : null), [id]);
  const scoreboard = useSyncExternalStore(subscribeStore, sbSnap, sbSnap);

  const fetchRest = useCallback(async () => {
    if (!id) return;
    try {
      const res = await sportsbookApi.getOdds(sportKey, id);
      const raw = res?.data ?? res;
      const d = raw?.data ?? raw;
      const norm = normalizeOddsPayload(d);
      if (norm) patchOddsIfChanged(id, norm, res?.timestamp ?? `rest:${Date.now()}`);
      lastSocketAtRef.current = Date.now();
      setError(null);
    } catch (e) {
      setError(e?.message || 'Failed to load odds');
    } finally {
      setLoading(false);
    }
  }, [id, sportKey]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    fetchRest();
    return undefined;
  }, [id, fetchRest]);

  useEffect(() => {
    if (!id || !enableSocket) return undefined;

    const onOdds = (payload) => {
      const key = payload?.eventId != null ? String(payload.eventId) : payload?.gameId != null ? String(payload.gameId) : null;
      if (key !== id || payload?.data === undefined) return;
      lastSocketAtRef.current = Date.now();
      const norm = normalizeOddsPayload(payload.data);
      if (norm) patchOddsIfChanged(id, norm, payload?.timestamp);
    };
    addOddsListener(onOdds);
    subscribeOdds(id, sportKey);

    let onScoreboard = null;
    if (enableScoreboard) {
      onScoreboard = (payload) => {
        const key = payload?.eventId != null ? String(payload.eventId) : payload?.gameId != null ? String(payload.gameId) : null;
        if (key !== id || payload?.data === undefined) return;
        patchScoreboardIfChanged(id, payload.data, payload?.timestamp);
      };
      addScoreboardListener(onScoreboard);
      subscribeScoreboard(id, sportKey);
    }

    return () => {
      removeOddsListener(onOdds);
      unsubscribeOdds(id);
      if (onScoreboard) {
        removeScoreboardListener(onScoreboard);
        unsubscribeScoreboard(id);
      }
    };
  }, [id, sportKey, enableSocket, enableScoreboard]);

  useEffect(() => {
    if (!id || staleFallbackMs <= 0) return undefined;
    const t = setInterval(() => {
      if (Date.now() - lastSocketAtRef.current >= staleFallbackMs) {
        fetchRest();
      }
    }, Math.min(staleFallbackMs, 5000));
    return () => clearInterval(t);
  }, [id, staleFallbackMs, fetchRest]);

  return { odds, scoreboard, loading, error, refetch: fetchRest };
}

export default useOddsStream;

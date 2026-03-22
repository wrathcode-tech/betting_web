/**
 * Odds: socket only (no REST sportsbookOdds). Optional scoreboard subscription.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
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
import { expandSocketBatchPayload } from '../utils/sportsbookMatchesPayload';

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
 * @param {{ enableSocket?: boolean, enableScoreboard?: boolean }} [options]
 */
export function useOddsStream(gameIdOrEventId, sport, options = {}) {
  const { enableSocket = true, enableScoreboard = false } = options;
  const sportKey = normalizeSport(sport);
  const id = gameIdOrEventId != null && gameIdOrEventId !== '' ? String(gameIdOrEventId) : null;

  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);

  const subscribeStore = useCallback((cb) => subscribeSportsbookStore(cb), []);
  const oddsSnap = useCallback(() => (id ? getOddsSnapshot(id) : null), [id]);
  const odds = useSyncExternalStore(subscribeStore, oddsSnap, oddsSnap);
  const sbSnap = useCallback(() => (id ? getScoreboardSnapshot(id) : null), [id]);
  const scoreboard = useSyncExternalStore(subscribeStore, sbSnap, sbSnap);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(null);
      return undefined;
    }
    setLoading(true);
    setError(null);
    return undefined;
  }, [id]);

  useEffect(() => {
    if (!id || !enableSocket) return undefined;

    const onOdds = (payload) => {
      const key = payload?.eventId != null ? String(payload.eventId) : payload?.gameId != null ? String(payload.gameId) : null;
      if (key !== id || payload?.data === undefined) return;
      const norm = normalizeOddsPayload(payload.data);
      if (norm) patchOddsIfChanged(id, norm, payload?.timestamp);
      setLoading(false);
      setError(null);
    };
    addOddsListener(onOdds);
    subscribeOdds(id, sportKey);

    let onScoreboard = null;
    if (enableScoreboard) {
      onScoreboard = (raw) => {
        for (const payload of expandSocketBatchPayload(raw)) {
          const key = payload?.eventId != null ? String(payload.eventId) : payload?.gameId != null ? String(payload.gameId) : null;
          if (key !== id || payload?.data === undefined) continue;
          patchScoreboardIfChanged(id, payload.data, payload?.timestamp);
        }
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

  return {
    odds,
    scoreboard,
    loading,
    error,
    refetch: async () => {
      /* socket-only: no REST refetch */
    },
  };
}

export default useOddsStream;

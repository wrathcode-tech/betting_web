/**
 * Matches: socket only → normalized store (no REST sportsbookMatches).
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  connectSportsbookSocket,
  subscribeMatches,
  unsubscribeMatches,
  addMatchesListener,
  removeMatchesListener,
} from '../socket/sportsbookSocket';
import { getToken } from '../utils/authStorage';
import { getMatchRowsFromSocketPayload, expandSocketBatchPayload } from '../utils/sportsbookMatchesPayload';
import {
  subscribeSportsbookStore,
  getMatchesSnapshot,
  setMatchesForSport,
  mergeMatchesForSportIfChanged,
} from '../stores/sportsbookRealtimeStore';

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
    setMatchesForSport(key, []);
    setLoading(true);
    setError(null);
  }, [key]);

  useEffect(() => {
    if (!enableSocket) {
      setLoading(false);
      return undefined;
    }
    connectSportsbookSocket(getToken() || null);
    const onMatches = (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        if (payload?.sport !== key) continue;
        const { rows, error: sockErr, schema } = getMatchRowsFromSocketPayload(payload);
        if (sockErr) {
          setError(payload?.message || 'Matches stream error');
          setLoading(false);
          continue;
        }
        if (rows.length === 0 && schema !== 'listSummary') continue;
        mergeMatchesForSportIfChanged(key, rows, payload?.timestamp);
        setLoading(false);
        setError(null);
      }
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

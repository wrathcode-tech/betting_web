import { useCallback, useEffect, useState } from 'react';
import {
  addMatchesListener,
  removeMatchesListener,
  subscribeMatches,
  unsubscribeMatches,
} from '../socket/sportsbookSocket';
import { expandSocketBatchPayload } from '../../utils/sportsbookMatchesPayload';

function isListSummaryForSport(payload, sport) {
  if (!payload || typeof payload !== 'object') return false;
  const o = payload;
  if (o.sport !== sport) return false;
  if (o.schema !== 'listSummary') {
    if (o.schema != null) {
      console.warn('[useMatchesList] Expected schema listSummary, got', o.schema, 'sport', sport);
    }
    return false;
  }
  if (o.error === true) return false;
  return Array.isArray(o.data);
}

/**
 * Match list: subscribe:matches + matches event — only consumes schema === 'listSummary'.
 */
export function useMatchesList(sport, enabled = true) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const onMatches = useCallback(
    (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        if (!isListSummaryForSport(payload, sport)) continue;
        setRows(payload.data);
        setLastUpdated(typeof payload.timestamp === 'number' ? payload.timestamp : Date.now());
        setLoading(false);
        setError(null);
      }
    },
    [sport]
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError(null);
    subscribeMatches(sport);
    addMatchesListener(onMatches);
    return () => {
      removeMatchesListener(onMatches);
      unsubscribeMatches(sport);
    };
  }, [sport, enabled, onMatches]);

  return { rows, loading, error, lastUpdated };
}

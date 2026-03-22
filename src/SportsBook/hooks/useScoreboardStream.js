import { useCallback, useEffect, useState } from 'react';
import {
  addScoreboardListener,
  removeScoreboardListener,
  subscribeScoreboard,
  unsubscribeScoreboard,
} from '../socket/sportsbookSocket';
import { expandSocketBatchPayload } from '../../utils/sportsbookMatchesPayload';

function extractKey(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const o = payload;
  const id = o.eventId ?? o.gameId;
  return id != null && id !== '' ? String(id) : null;
}

/**
 * Optional live score — subscribe:scoreboard + scoreboard event.
 */
export function useScoreboardStream(gameId, sport, enabled = true) {
  const id = gameId != null && gameId !== '' ? String(gameId) : '';
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(!!id && enabled);

  const onScoreboard = useCallback(
    (raw) => {
      for (const msg of expandSocketBatchPayload(raw)) {
        const key = extractKey(msg);
        if (!key || key !== id) continue;
        setPayload(msg);
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id || !enabled) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    subscribeScoreboard(id, sport);
    addScoreboardListener(onScoreboard);
    return () => {
      removeScoreboardListener(onScoreboard);
      unsubscribeScoreboard(id);
    };
  }, [id, sport, enabled, onScoreboard]);

  return { payload, loading };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchOddsByGameId } from '../api/sportsbookApi';
import { addOddsListener, removeOddsListener, subscribeOdds, unsubscribeOdds } from '../socket/sportsbookSocket';
import { useOddsByGameIdStore } from '../stores/oddsByGameId';
import { expandSocketBatchPayload } from '../../utils/sportsbookMatchesPayload';

function extractGameKey(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const o = payload;
  const id = o.eventId ?? o.gameId;
  return id != null && id !== '' ? String(id) : null;
}

function extractOddsData(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const d = payload.data;
  if (!d || typeof d !== 'object') return null;
  return d;
}

/**
 * Detail: subscribe:odds { gameId, sport }, consume odds — full market depth.
 */
export function useMatchOdds(gameId, sport, options = {}) {
  const { restFallbackAfterMs = 6000, enabled = true } = options;
  const id = gameId != null && gameId !== '' ? String(gameId) : '';
  const setOdds = useOddsByGameIdStore((s) => s.setOdds);
  const odds = useOddsByGameIdStore((s) => (id ? s.byGameId[id] ?? null : null));

  const [loading, setLoading] = useState(!!id && enabled);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);
  const fallbackTimerRef = useRef(null);

  const onOdds = useCallback(
    (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        const key = extractGameKey(payload);
        if (!key || key !== id) continue;
        const data = extractOddsData(payload);
        if (!data) continue;
        setOdds(id, data);
        setLoading(false);
        setError(null);
        setSource('socket');
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
      }
    },
    [id, setOdds]
  );

  useEffect(() => {
    if (!id || !enabled) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError(null);
    setSource(null);
    subscribeOdds(id, sport);
    addOddsListener(onOdds);

    fallbackTimerRef.current = setTimeout(async () => {
      const current = useOddsByGameIdStore.getState().byGameId[id];
      if (current != null) return;
      const rest = await fetchOddsByGameId(sport, id);
      if (rest) {
        setOdds(id, rest);
        setSource('rest');
        setLoading(false);
      } else if (useOddsByGameIdStore.getState().byGameId[id] == null) {
        setLoading(false);
        setError('Odds unavailable');
      }
    }, restFallbackAfterMs);

    return () => {
      removeOddsListener(onOdds);
      unsubscribeOdds(id);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      setOdds(id, null);
    };
  }, [id, sport, enabled, onOdds, restFallbackAfterMs, setOdds]);

  return {
    odds: odds ?? null,
    loading,
    error,
    source,
  };
}

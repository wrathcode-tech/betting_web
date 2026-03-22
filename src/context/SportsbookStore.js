/**
 * Global sportsbook state – matches, odds, scoreboards, bet updates.
 * Updated by /sportsbook socket events. Use for instant UI updates without prop drilling.
 * Wallet balance stays in BalanceContext (updated by socket balance / betUpdate.balanceAfter).
 *
 * Connection: connectSportsbookSocket(token || null) on mount + loginStateChange.
 * Match streams: SportsbookRouteMatchStreams (pathname) — one subscribe set per route;
 * leaving a page unsubscribes that route’s sports. Odds: useSportsOddsSubscription / hooks.
 */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { expandSocketBatchPayload } from '../utils/sportsbookMatchesPayload';
import {
  connectSportsbookSocket,
  subscribeMatches,
  subscribeMatchesMany,
  unsubscribeMatches,
  unsubscribeMatchesMany,
  subscribeOdds,
  unsubscribeOdds,
  subscribeScoreboard,
  unsubscribeScoreboard,
  addMatchesListener,
  removeMatchesListener,
  addOddsListener,
  removeOddsListener,
  addScoreboardListener,
  removeScoreboardListener,
  addBetUpdateListener,
  removeBetUpdateListener,
  addErrorListener,
  removeErrorListener,
} from '../socket/sportsbookSocket';

const SportsbookStoreContext = createContext(null);

const SPORTS = ['cricket', 'soccer', 'tennis'];

function getRunnerKey(marketId, selectionId) {
  return `${marketId ?? 'mo'}-${selectionId ?? ''}`;
}

function runnersFromMarket(market) {
  if (Array.isArray(market.runners) && market.runners.length) return market.runners;
  const od = market.oddDatas;
  if (Array.isArray(od)) return od;
  if (od && typeof od === 'object') return Object.values(od).filter(Boolean);
  return [];
}

function compareOddsAndGetFlash(prevData, nextData) {
  const flash = {};
  if (!nextData || typeof nextData !== 'object') return flash;
  const markets = Array.isArray(nextData.matchOdds) ? nextData.matchOdds : [];
  const prevMarkets = (prevData && Array.isArray(prevData.matchOdds)) ? prevData.matchOdds : [];
  markets.forEach((market, mIdx) => {
    const marketId = market.marketId ?? market.mid ?? mIdx;
    const runners = runnersFromMarket(market);
    const prevMarket = prevMarkets[mIdx] || {};
    const prevRunners = runnersFromMarket(prevMarket);
    runners.forEach((runner, rIdx) => {
      const selId = runner.selectionId ?? runner.sid ?? rIdx;
      const key = getRunnerKey(marketId, selId);
      const prevRunner = prevRunners[rIdx] || {};
      const b1 = runner.b1 != null ? Number(runner.b1) : null;
      const l1 = runner.l1 != null ? Number(runner.l1) : null;
      const pB1 = prevRunner.b1 != null ? Number(prevRunner.b1) : null;
      const pL1 = prevRunner.l1 != null ? Number(prevRunner.l1) : null;
      if (b1 != null && pB1 != null && b1 !== pB1) flash[key] = b1 > pB1 ? 'up' : 'down';
      if (l1 != null && pL1 != null && l1 !== pL1) flash[`${key}-lay`] = l1 > pL1 ? 'up' : 'down';
    });
  });
  return flash;
}

/**
 * Single place for subscribe:matches by pathname — leaving a route unsubscribes previous sports.
 * - `/` and `/sports` → cricket, tennis, soccer (guest + logged-in)
 * - `/cricket` | `/tennis` | `/soccer` → that sport only when logged-in real user (not demo)
 */
function SportsbookRouteMatchStreams() {
  const { pathname } = useLocation();
  const { isDemo } = useAuth();
  const [hasToken, setHasToken] = useState(
    () => typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('token')
  );
  useEffect(() => {
    const sync = () => setHasToken(!!sessionStorage.getItem('token'));
    window.addEventListener('loginStateChange', sync);
    return () => window.removeEventListener('loginStateChange', sync);
  }, []);

  const sportsKey = useMemo(() => {
    const p = (pathname || '/').replace(/\/$/, '') || '/';
    if (p === '/' || p === '/sports') return 'cricket|tennis|soccer';
    if (!hasToken || isDemo) return '';
    if (p === '/cricket') return 'cricket';
    if (p === '/tennis') return 'tennis';
    if (p === '/soccer') return 'soccer';
    return '';
  }, [pathname, hasToken, isDemo]);

  useEffect(() => {
    if (!sportsKey) return undefined;
    const list = sportsKey.split('|');
    subscribeMatchesMany(list);
    return () => {
      unsubscribeMatchesMany(list);
    };
  }, [sportsKey]);

  return null;
}

export function SportsbookStoreProvider({ children }) {
  /** Single app-wide sportsbook socket – auth sync (guest JWT vs Bearer). */
  useEffect(() => {
    const sync = () => {
      const t = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;
      connectSportsbookSocket(t || null);
    };
    sync();
    window.addEventListener('loginStateChange', sync);
    return () => window.removeEventListener('loginStateChange', sync);
  }, []);

  const [matchesBySport, setMatchesBySport] = useState(() => ({
    cricket: [],
    soccer: [],
    tennis: [],
  }));
  const [oddsByGameId, setOddsByGameId] = useState({});
  const [scoreboardByGameId, setScoreboardByGameId] = useState({});
  const [lastBetUpdate, setLastBetUpdate] = useState(null);
  const [oddsFlash, setOddsFlash] = useState({});
  const [socketError, setSocketError] = useState(null);
  const prevOddsRef = useRef({});
  const flashTimeoutsRef = useRef([]);

  const setMatchesForSport = useCallback((sport, data) => {
    if (!SPORTS.includes(sport)) return;
    setMatchesBySport((prev) => ({
      ...prev,
      [sport]: Array.isArray(data) ? data : prev[sport] || [],
    }));
  }, []);

  const setOddsForGame = useCallback((gameId, data) => {
    const id = String(gameId);
    const prev = prevOddsRef.current[id];
    prevOddsRef.current[id] = data && typeof data === 'object' ? data : null;
    setOddsByGameId((prevState) => ({
      ...prevState,
      [id]: data && typeof data === 'object' ? data : prevState[id],
    }));
    const flash = compareOddsAndGetFlash(prev, data);
    if (Object.keys(flash).length === 0) return;
    setOddsFlash((prevFlash) => ({
      ...prevFlash,
      [id]: { ...(prevFlash[id] || {}), ...flash },
    }));
    flashTimeoutsRef.current = flashTimeoutsRef.current.filter(Boolean);
    Object.keys(flash).forEach((key) => {
      const t = setTimeout(() => {
        setOddsFlash((prevFlash) => {
          const next = { ...prevFlash };
          if (next[id]) {
            const nextGame = { ...next[id] };
            delete nextGame[key];
            if (Object.keys(nextGame).length === 0) delete next[id];
            else next[id] = nextGame;
          }
          return next;
        });
      }, 1000);
      flashTimeoutsRef.current.push(t);
    });
  }, []);

  const setScoreboardForGame = useCallback((gameId, payload) => {
    const id = String(gameId);
    setScoreboardByGameId((prev) => ({
      ...prev,
      [id]: payload != null ? payload : prev[id],
    }));
  }, []);

  const setBetUpdatePayload = useCallback((payload) => {
    setLastBetUpdate(payload);
  }, []);

  useEffect(() => {
    const onMatches = (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        const sport = payload?.sport;
        const data = payload?.data;
        if (sport && SPORTS.includes(sport)) setMatchesForSport(sport, Array.isArray(data) ? data : []);
      }
    };
    const onOdds = (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        const gameId = payload?.gameId ?? payload?.eventId;
        const data = payload?.data;
        if (gameId) setOddsForGame(gameId, data);
      }
    };
    const onScoreboard = (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        const gameId = payload?.gameId ?? payload?.eventId;
        if (gameId) setScoreboardForGame(gameId, payload);
      }
    };
    const onBetUpdate = (payload) => {
      setBetUpdatePayload(payload);
    };
    const onError = (err) => {
      setSocketError(err?.message ?? err);
    };

    addMatchesListener(onMatches);
    addOddsListener(onOdds);
    addScoreboardListener(onScoreboard);
    addBetUpdateListener(onBetUpdate);
    addErrorListener(onError);

    return () => {
      removeMatchesListener(onMatches);
      removeOddsListener(onOdds);
      removeScoreboardListener(onScoreboard);
      removeBetUpdateListener(onBetUpdate);
      removeErrorListener(onError);
      flashTimeoutsRef.current.forEach(clearTimeout);
      flashTimeoutsRef.current = [];
    };
  }, [setMatchesForSport, setOddsForGame, setScoreboardForGame, setBetUpdatePayload]);

  const value = {
    matchesBySport,
    oddsByGameId,
    scoreboardByGameId,
    lastBetUpdate,
    oddsFlash,
    socketError,
    setMatchesForSport,
    setOddsForGame,
    setScoreboardForGame,
    setBetUpdatePayload,
    subscribeMatches,
    unsubscribeMatches,
    subscribeOdds,
    unsubscribeOdds,
    subscribeScoreboard,
    unsubscribeScoreboard,
  };

  return (
    <SportsbookStoreContext.Provider value={value}>
      <SportsbookRouteMatchStreams />
      {children}
    </SportsbookStoreContext.Provider>
  );
}

export function useSportsbookStore() {
  const ctx = useContext(SportsbookStoreContext);
  return ctx || {};
}

export function useMatches(sport) {
  const { matchesBySport } = useSportsbookStore();
  return Array.isArray(matchesBySport?.[sport]) ? matchesBySport[sport] : [];
}

export function useOdds(gameId) {
  const { oddsByGameId } = useSportsbookStore();
  return gameId ? (oddsByGameId[String(gameId)] ?? null) : null;
}

export function useScoreboard(gameId) {
  const { scoreboardByGameId } = useSportsbookStore();
  return gameId ? (scoreboardByGameId[String(gameId)] ?? null) : null;
}

export function useLastBetUpdate() {
  const { lastBetUpdate } = useSportsbookStore();
  return lastBetUpdate;
}

/**
 * Flash state for odds cells: { [runnerKey]: 'up'|'down' }. RunnerKey = `${marketId}-${selectionId}` or `${marketId}-${selectionId}-lay`.
 * Apply CSS class: odds_flash_up (green) or odds_flash_down (red). Import components/OddsFlash.css where odds are rendered.
 */
export function useOddsFlash(gameId) {
  const { oddsFlash } = useSportsbookStore();
  return gameId ? (oddsFlash[String(gameId)] ?? {}) : {};
}

export function useSportsbookSocketError() {
  const { socketError } = useSportsbookStore();
  return socketError;
}

/** Dedupe dependency for sport string arrays (order-independent). */
function sportsListDedupeKey(sports) {
  if (!Array.isArray(sports) || sports.length === 0) return '';
  return [...new Set(sports.map((s) => String(s)))].filter(Boolean).sort().join('|');
}

/**
 * Ref-counted match streams (advanced). Home/sports/detail match lists are driven by
 * `SportsbookRouteMatchStreams` — avoid duplicating the same sports here on those routes.
 */
export function useSportsMatchesSubscription(sports) {
  const key = useMemo(
    () => sportsListDedupeKey(Array.isArray(sports) ? sports : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- compare by contents
    [JSON.stringify(Array.isArray(sports) ? sports : [])]
  );
  useEffect(() => {
    if (!key) return undefined;
    const list = key.split('|');
    subscribeMatchesMany(list);
    return () => {
      unsubscribeMatchesMany(list);
    };
  }, [key]);
}

/**
 * While mounted and enabled, subscribes to live odds for one match/event (ref-counted).
 */
export function useSportsOddsSubscription(gameIdOrEventId, sport, enabled = true) {
  const id =
    gameIdOrEventId != null && gameIdOrEventId !== '' ? String(gameIdOrEventId) : '';
  const sp = sport || 'cricket';
  useEffect(() => {
    if (!enabled || !id) return undefined;
    subscribeOdds(id, sp);
    return () => unsubscribeOdds(id, sp);
  }, [id, sp, enabled]);
}

/**
 * While mounted and enabled, subscribes to scoreboard stream for one match/event (ref-counted).
 */
export function useSportsScoreboardSubscription(gameIdOrEventId, sport, enabled = true) {
  const id =
    gameIdOrEventId != null && gameIdOrEventId !== '' ? String(gameIdOrEventId) : '';
  const sp = sport || 'cricket';
  useEffect(() => {
    if (!enabled || !id) return undefined;
    subscribeScoreboard(id, sp);
    return () => unsubscribeScoreboard(id, sp);
  }, [id, sp, enabled]);
}

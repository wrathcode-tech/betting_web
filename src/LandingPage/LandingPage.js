import React, { useState, useEffect, useRef, lazy, Suspense, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthService from '../api/services/AuthService'
import { usePlatformConfig } from '../context/PlatformConfigContext'
import { getToken } from '../utils/authStorage'
import { alertErrorMessage } from '../customComponents/CustomAlertMessage'
import {
  subscribeOdds,
  unsubscribeOdds,
  addMatchesListener,
  removeMatchesListener,
  addOddsListener,
  removeOddsListener,
} from '../socket/sportsbookSocket'
import { getMatchRowsFromSocketPayload, expandSocketBatchPayload, normalizeRestMatchesList } from '../utils/sportsbookMatchesPayload'
import { getMatches } from '../api/services/sportsbookApi'
import {
  getMarketPillsFromSources,
  getMatchStreamVisible,
} from '../utils/matchMarketPills'
import '../customComponents/Footer.css'
import '../sports/sportsGame.css'

const Footer = lazy(() => import('../customComponents/Footer'));
const MobileMenu = lazy(() => import('../customComponents/MobileMenu'));

// TOP Sports: navigation config (Cricket -> /sports, rest -> /sportsbook)
const topSportsItems = [
  { id: 1, title: 'Cricket', icon: 'menu-icon19.svg', to: '/sports' },
  { id: 2, title: 'Football', iconClass: 'ri-football-line', to: '/sportsbook' },
  { id: 3, title: 'Basketball', iconClass: 'ri-basketball-line', to: '/sportsbook' },
  { id: 4, title: 'Baseball', iconClass: 'ri-baseball-line', to: '/sportsbook' },
  { id: 5, title: 'Ice Hockey', iconClass: 'ri-flashlight-line', to: '/sportsbook' },
  { id: 6, title: 'Tennis', iconClass: 'ri-circle-line', to: '/sportsbook' },
  { id: 7, title: 'American Football', iconClass: 'ri-football-line', to: '/sportsbook' },
  { id: 8, title: 'Aussie Rules', iconClass: 'ri-record-circle-line', to: '/sportsbook' },
  { id: 9, title: 'Beach Volley', iconClass: 'ri-circle-line', to: '/sportsbook' },
  { id: 10, title: 'Darts', iconClass: 'ri-focus-3-line', to: '/sportsbook' },
  { id: 11, title: 'ESport Counter-Strike', iconClass: 'ri-gamepad-line', to: '/sportsbook' },
  { id: 12, title: 'ESport Dota', iconClass: 'ri-sword-line', to: '/sportsbook' },
  { id: 13, title: 'ESport League of Legends', iconClass: 'ri-gamepad-line', to: '/sportsbook' },
  { id: 14, title: 'Futsal', iconClass: 'ri-football-line', to: '/sportsbook' },
  { id: 15, title: 'Handball', iconClass: 'ri-hand-coin-line', to: '/sportsbook' },
]

/** Cap subscribe:odds on home (each row = one WS message — lower = faster first paint). */
const LANDING_HOME_ODDS_ROW_CAP = 8

function formatMatchTime(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return isoStr
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    const dateStr = isToday ? 'Today' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${dateStr} ${timeStr}`
  } catch {
    return isoStr
  }
}

function getDayGroup(isoStr) {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return ''
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return d.toLocaleDateString('en-IN', { weekday: 'long' })
  } catch {
    return ''
  }
}

/** Start time from match object — tennis/soccer APIs often use openDate / commence_time etc. */
function pickMatchEventTime(m) {
  if (!m || typeof m !== 'object') return undefined
  const ev = m.event && typeof m.event === 'object' ? m.event : null
  const candidates = [
    m.eventTime,
    m.event_time,
    m.startTime,
    m.start_time,
    m.openDate,
    m.open_date,
    m.eventOpenDate,
    m.event_open_date,
    m.scheduledStart,
    m.scheduled_start,
    m.commenceTime,
    m.commence_time,
    m.matchTime,
    m.match_time,
    m.kickOff,
    m.kick_off,
    m.kickoffTime,
    m.kickoff_time,
    m.marketStartTime,
    m.market_start_time,
    ev?.openDate,
    ev?.open_date,
    ev?.startTime,
    ev?.start_time,
    ev?.eventTime,
    ev?.scheduledStart,
  ]
  for (const v of candidates) {
    if (v == null || v === '') continue
    if (typeof v === 'number' && Number.isFinite(v)) {
      const ms = v < 1e12 ? v * 1000 : v
      const d = new Date(ms)
      if (!isNaN(d.getTime())) return d.toISOString()
    }
    if (typeof v === 'string') {
      const d = new Date(v)
      if (!isNaN(d.getTime())) return v
      const n = Number(v)
      if (Number.isFinite(n)) {
        const ms = n < 1e12 ? n * 1000 : n
        const dd = new Date(ms)
        if (!isNaN(dd.getTime())) return dd.toISOString()
      }
    }
  }
  return undefined
}

/** Pass-through from sportsbook match list API / socket for TV + market badges */
function pickMatchListMediaFields(m) {
  if (!m || typeof m !== 'object') return {}
  return {
    tvUrl: m.tv_url ?? m.tvUrl,
    isTv: !!(m.IsTv ?? m.isTv),
    marketBadges: m.marketBadges ?? m.market_badges ?? m.marketPills ?? m.market_pills,
  }
}

/** Map REST / raw match rows to landing card shape (same as socket mapRowsToLanding). */
function mapRestRowsToLandingDisplay(rows, defaults) {
  if (!Array.isArray(rows) || rows.length === 0) return []
  return rows
    .filter((m) => m.gameId ?? m.game_id ?? m.eventId ?? m.event_id)
    .map((m) => {
      const et = m.eventTime ?? m.event_time ?? pickMatchEventTime(m)
      const id = m.gameId ?? m.game_id ?? m.eventId ?? m.event_id
      return {
        id,
        gameId: m.gameId ?? m.game_id ?? id,
        eventId: m.eventId ?? m.event_id ?? id,
        tournament: m.seriesName ?? m.series_name ?? defaults.tournament,
        teams: m.eventName ?? m.event_name ?? m.name ?? '—',
        time: formatMatchTime(et),
        eventTime: et,
        inPlay: m.inPlay ?? m.in_play ?? false,
        selections: m.selections,
        markets: m.markets,
        ...pickMatchListMediaFields(m),
      }
    })
    .sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0))
}

/** Landing/API game item – image can be in thumb, thumbnail, image, icon, logo */
function getLandingGameImage(item) {
  return item?.thumb || item?.thumbnail || item?.image || item?.icon || item?.logo || `${process.env.PUBLIC_URL || ''}/images/game_itemslider.png`
}

function formatOddsSize(size) {
  if (size == null || size === '') return '0.00'
  const n = Number(size)
  if (!Number.isFinite(n)) return String(size)
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 2)}K`
  return n % 1 === 0 ? String(n) : n.toFixed(2)
}

function toOddDatasArray(oddDatas) {
  if (!oddDatas) return []
  if (Array.isArray(oddDatas)) return oddDatas
  if (typeof oddDatas === 'object') return Object.values(oddDatas).filter(Boolean)
  return []
}

function getMarketOddList(market) {
  if (!market) return []
  const fromOddDatas = toOddDatasArray(market.oddDatas)
  if (fromOddDatas.length > 0) return fromOddDatas
  const runners = Array.isArray(market.runners) ? market.runners : []
  return runners.map((r) => ({
    ...r,
    b1: r.b1 ?? r.back,
    l1: r.l1 ?? r.lay,
    bs1: r.bs1 ?? r.size,
    ls1: r.ls1 ?? r.size,
  }))
}

/** listSummary ladder fallback when socket `odds` not received yet. */
function getLandingThreeColumnOddsFromMatch(match) {
  const sels = match?.selections
  if (!Array.isArray(sels) || !sels[0]) return [null, null, null]
  const sel = sels[0]
  const backs = Array.isArray(sel.back) ? sel.back : []
  const lays = Array.isArray(sel.lay) ? sel.lay : []
  return [0, 1, 2].map((i) => {
    const br = backs[i]
    const lr = lays[i]
    const bOk = br && br.open !== false && br.price != null && Number.isFinite(Number(br.price))
    const lOk = lr && lr.open !== false && lr.price != null && Number.isFinite(Number(lr.price))
    if (!bOk && !lOk) return null
    return {
      back: bOk ? String(br.price) : '—',
      lay: lOk ? String(lr.price) : '—',
      sizeFormatted: formatOddsSize(bOk ? br.stack : lOk ? lr.stack : 0),
    }
  })
}

/** Prefer `odds` event payload; else listSummary selections. */
function getLandingCardOddsTriples(match, oddsPayload) {
  const matchOdds = oddsPayload?.matchOdds ?? []
  const market = matchOdds[0]
  if (market) {
    const oddList = getMarketOddList(market)
    if (oddList.length > 0) {
      return [0, 1, 2].map((i) => {
        const o = oddList[i]
        if (!o) return null
        return {
          back: o.b1 ?? o.back ?? '—',
          lay: o.l1 ?? o.lay ?? '—',
          sizeFormatted: formatOddsSize(o.bs1 ?? o.ls1 ?? o.size),
        }
      })
    }
  }
  return getLandingThreeColumnOddsFromMatch(match)
}

function splitTeamNamesForDesktop(teams) {
  const raw = (teams || '').trim()
  if (!raw) return ['—']
  const parts = raw.split(/\s+(?:v|vs)\s+/i).map((t) => t.trim()).filter(Boolean)
  return parts.length ? parts : [raw]
}

function getOddsScrollKey(sport, match, day, idx) {
  return `${sport}-${match.eventId ?? match.gameId ?? `${day}-${idx}`}`
}

/** Landing desktop row – left block matches exchange-style layout (time, teams, market tools). */
function DesktopTopMatchBlock({ match, oddsPayload = null }) {
  const teamLines = splitTeamNamesForDesktop(match.teams)
  const marketPills = getMarketPillsFromSources(match, oddsPayload)
  const showStream = getMatchStreamVisible(match)
  const clockLabel = match.timeOnly || match.time || ''
  return (
    <div className="sports_grid_desktop_match">
      <div className="sports_grid_desktop_time_block">
        <div className="sports_grid_desktop_time_row">
          <div className="sports_grid_desktop_time_stack">
            {match.dayGroup ? <span className="sports_grid_desktop_day">{match.dayGroup}</span> : null}
            {clockLabel ? <span className="sports_grid_desktop_clock">{clockLabel}</span> : null}
          </div>
          {match.inPlay ? <span className="sports_grid_desktop_live_badge">LIVE</span> : null}
        </div>
      </div>

<div className="sports_grid_desktop_match_info">

      <div className="sports_grid_desktop_match_mid">
        {/* {match.tournament ? <div className="sports_grid_desktop_series">{match.tournament}</div> : null} */}
        <div className="sports_grid_desktop_teamnames">
          {teamLines.map((name, i) => (
            <span key={i} className="sports_grid_desktop_teamline">{name}</span>
          ))}
        </div>
      </div>
      <div className="sports_grid_desktop_match_tools">
        {showStream ? <i className="ri-play-circle-line sports_grid_desktop_tool_icon" aria-hidden /> : null}
        {marketPills.length > 0 ? (
          <div className="sports_grid_desktop_pills">
            {marketPills.map((icon, pillIdx) => (
              <span key={`${icon}-${pillIdx}`} className="sports_grid_desktop_pill">{icon}</span>
            ))}
          </div>
        ) : null}
      </div>

      </div>
      
    </div>
  )
}

function LandingPage() {
  // Auth token – sync with localStorageso button updates instantly after login (no refresh)
  const [token, setToken] = useState(() => getToken());
  const { config: platformConfig } = usePlatformConfig();
  useEffect(() => {
    const onLoginChange = () => setToken(getToken());
    window.addEventListener('loginStateChange', onLoginChange);
    return () => window.removeEventListener('loginStateChange', onLoginChange);
  }, []);

  // TOP SLOTS slider state
  const topSportsSliderRef = useRef(null);

  const [topSportsIndex, setTopSportsIndex] = useState(0);

  // TOP Matches from API (cricket, tennis, soccer) + socket for live updates
  const [topMatchesFromApi, setTopMatchesFromApi] = useState([]);
  const [topMatchesLoading, setTopMatchesLoading] = useState(true);

  const [topTennisMatchesFromApi, setTopTennisMatchesFromApi] = useState([]);
  const [topTennisMatchesLoading, setTopTennisMatchesLoading] = useState(true);

  const [topSoccerMatchesFromApi, setTopSoccerMatchesFromApi] = useState([]);
  const [topSoccerMatchesLoading, setTopSoccerMatchesLoading] = useState(true);

  const [topMatchesOddsByGameId, setTopMatchesOddsByGameId] = useState({});
  const topMatchesOddsSubscribedRef = useRef(new Set());
  const [topTennisMatchesOddsByGameId, setTopTennisMatchesOddsByGameId] = useState({});
  const topTennisMatchesOddsSubscribedRef = useRef(new Set());
  const [topSoccerMatchesOddsByGameId, setTopSoccerMatchesOddsByGameId] = useState({});
  const topSoccerMatchesOddsSubscribedRef = useRef(new Set());
  const topMatchesSubscribedIdToSportRef = useRef(new Map());

  const landingOddsScrollRefs = useRef(new Map());
  const isSyncingLandingOddsScrollRef = useRef(false);

  // Landing API games (liveCasino, slots, trending, roulette, cardGames)
  const [landingGames, setLandingGames] = useState({
    liveCasino: [], slots: [], trending: [], roulette: [], cardGames: [],
  });
  const landingLiveCasinoRef = useRef(null);
  const landingSlotsRef = useRef(null);
  const landingTrendingRef = useRef(null);
  const trendingTopRef = useRef(null);
  const landingRouletteRef = useRef(null);
  const landingCardGamesRef = useRef(null);
  const lobbySliderRef = useRef(null);
  const [landingLiveCasinoIndex, setLandingLiveCasinoIndex] = useState(0);
  const [landingSlotsIndex, setLandingSlotsIndex] = useState(0);
  const [landingTrendingIndex, setLandingTrendingIndex] = useState(0);
  const [trendingTopIndex, setTrendingTopIndex] = useState(0);
  const [landingRouletteIndex, setLandingRouletteIndex] = useState(0);
  const [landingCardGamesIndex, setLandingCardGamesIndex] = useState(0);
  const [lobbySliderIndex, setLobbySliderIndex] = useState(0);

  // Casino Lobby: top 50 games from API (providerCode=EZ)
  const [casinoLobbyGames, setCasinoLobbyGames] = useState([]);
  const [casinoLobbyLoading, setCasinoLobbyLoading] = useState(true);

  // Document title when on landing page
  useEffect(() => {
    const prev = document.title;
    document.title = 'Your Ultimate Casino & Sports Gaming Hub';
    return () => { document.title = prev; };
  }, []);

  const trendingSectionRef = useRef(null);
  const [showTrendingVideos, setShowTrendingVideos] = useState(false);

  useEffect(() => {
    const el = trendingSectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setShowTrendingVideos(true); },
      { rootMargin: '200px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Fetch landing games (no auth). API returns { data: { liveCasino, slots, trending, roulette, cardGames } } or same keys at top level
  useEffect(() => {
    let cancelled = false;
    AuthService.bettingGamesLanding()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data && typeof res.data === 'object' ? res.data : res || {};
        const arr = (v) => (Array.isArray(v) ? v : []);
        setLandingGames({
          liveCasino: arr(data.liveCasino),
          slots: arr(data.slots),
          trending: arr(data.trending),
          roulette: arr(data.roulette),
          cardGames: arr(data.cardGames),
        });
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  // Fetch Casino Lobby games: GET /api/v1/games?providerCode=EZ&page=1&limit=50
  useEffect(() => {
    let cancelled = false;
    setCasinoLobbyLoading(true);
    AuthService.bettingGamesList('EZ', 'all', 1, 50)
      .then((res) => {
        if (cancelled) return;
        const raw = res?.data ?? res;
        const list = Array.isArray(raw?.games) ? raw.games : (Array.isArray(raw) ? raw : []);
        setCasinoLobbyGames(list.slice(0, 50));
      })
      .catch(() => { if (!cancelled) setCasinoLobbyGames([]); })
      .finally(() => { if (!cancelled) setCasinoLobbyLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const TOP_MATCH_LOAD_MAX_WAIT_MS = 10000;

  useEffect(() => {
    const t = window.setTimeout(() => {
      setTopMatchesLoading(false);
      setTopTennisMatchesLoading(false);
      setTopSoccerMatchesLoading(false);
    }, TOP_MATCH_LOAD_MAX_WAIT_MS);
    return () => window.clearTimeout(t);
  }, []);

  // TOP matches: fast REST hydrate + socket updates (no long wait for WS only).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cr, tn, sc] = await Promise.all([
          getMatches('cricket').catch(() => null),
          getMatches('tennis').catch(() => null),
          getMatches('soccer').catch(() => null),
        ]);
        if (cancelled) return;
        const crRows = normalizeRestMatchesList(cr);
        if (crRows.length > 0) {
          const mapped = mapRestRowsToLandingDisplay(crRows, { tournament: 'Cricket' });
          if (mapped.length > 0) setTopMatchesFromApi(mapped);
          setTopMatchesLoading(false);
        }
        const tnRows = normalizeRestMatchesList(tn);
        if (tnRows.length > 0) {
          const mapped = mapRestRowsToLandingDisplay(tnRows, { tournament: 'Tennis' });
          if (mapped.length > 0) setTopTennisMatchesFromApi(mapped);
          setTopTennisMatchesLoading(false);
        }
        const scRows = normalizeRestMatchesList(sc);
        if (scRows.length > 0) {
          const mapped = mapRestRowsToLandingDisplay(scRows, { tournament: 'Football' });
          if (mapped.length > 0) setTopSoccerMatchesFromApi(mapped);
          setTopSoccerMatchesLoading(false);
        }
      } catch {
        if (!cancelled) {
          setTopMatchesLoading(false);
          setTopTennisMatchesLoading(false);
          setTopSoccerMatchesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // TOP matches: subscribe:matches (route) + subscribe:odds for first N rows so home odds render (backend list often has no ladder).

  useEffect(() => {
    const cricketOddsSubscribed = topMatchesOddsSubscribedRef.current;
    const tennisOddsSubscribed = topTennisMatchesOddsSubscribedRef.current;
    const soccerOddsSubscribed = topSoccerMatchesOddsSubscribedRef.current;
    const subscribedIdToSport = topMatchesSubscribedIdToSportRef.current;

    const mapRowsToLanding = (rows, defaults) =>
      rows
        .filter((m) => m.gameId ?? m.game_id ?? m.eventId ?? m.event_id)
        .map((m) => {
          const et = m.eventTime ?? m.event_time ?? pickMatchEventTime(m);
          const id = m.gameId ?? m.game_id ?? m.eventId ?? m.event_id;
          return {
            id,
            gameId: m.gameId ?? m.game_id ?? id,
            eventId: m.eventId ?? m.event_id ?? id,
            tournament: m.seriesName ?? m.series_name ?? defaults.tournament,
            teams: m.eventName ?? m.event_name ?? m.name ?? '—',
            time: formatMatchTime(et),
            eventTime: et,
            inPlay: m.inPlay ?? m.in_play ?? false,
            selections: m.selections,
            markets: m.markets,
            ...pickMatchListMediaFields(m),
          };
        })
        .sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0));

    const onMatches = (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        if (payload?.sport !== 'cricket') continue;
        const { rows, error } = getMatchRowsFromSocketPayload(payload);
        if (error) {
          setTopMatchesLoading(false);
          continue;
        }
        if (rows.length === 0 && payload?.schema !== 'listSummary') continue;
        const mapped = mapRowsToLanding(rows, { tournament: 'Cricket' });
        setTopMatchesFromApi((prev) => (mapped.length > 0 ? mapped : prev));
        setTopMatchesLoading(false);
      }
    };
    const onTennisMatches = (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        if (payload?.sport !== 'tennis') continue;
        const { rows, error } = getMatchRowsFromSocketPayload(payload);
        if (error) {
          setTopTennisMatchesLoading(false);
          continue;
        }
        if (rows.length === 0 && payload?.schema !== 'listSummary') continue;
        const mapped = mapRowsToLanding(rows, { tournament: 'Tennis' });
        if (mapped.length > 0) setTopTennisMatchesFromApi(mapped);
        setTopTennisMatchesLoading(false);
      }
    };
    const onSoccerMatches = (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        if (payload?.sport !== 'soccer') continue;
        const { rows, error } = getMatchRowsFromSocketPayload(payload);
        if (error) {
          setTopSoccerMatchesLoading(false);
          continue;
        }
        if (rows.length === 0 && payload?.schema !== 'listSummary') continue;
        const mapped = mapRowsToLanding(rows, { tournament: 'Football' });
        if (mapped.length > 0) setTopSoccerMatchesFromApi(mapped);
        setTopSoccerMatchesLoading(false);
      }
    };
    addMatchesListener(onMatches);
    addMatchesListener(onTennisMatches);
    addMatchesListener(onSoccerMatches);
    return () => {
      removeMatchesListener(onMatches);
      removeMatchesListener(onTennisMatches);
      removeMatchesListener(onSoccerMatches);
      cricketOddsSubscribed.forEach((gid) => unsubscribeOdds(gid, 'cricket'));
      cricketOddsSubscribed.clear();
      tennisOddsSubscribed.forEach((id) => unsubscribeOdds(id, 'tennis'));
      tennisOddsSubscribed.clear();
      soccerOddsSubscribed.forEach((gid) => unsubscribeOdds(gid, 'soccer'));
      soccerOddsSubscribed.clear();
      subscribedIdToSport.clear();
    };
  }, []);

  useEffect(() => {
    const onOdds = (raw) => {
      for (const payload of expandSocketBatchPayload(raw)) {
        const id = payload?.gameId ?? payload?.eventId;
        if (!id || payload?.data === undefined) continue;
        const incoming = payload.data && typeof payload.data === 'object' ? payload.data : {};
        const matchOdds = Array.isArray(incoming.matchOdds) ? incoming.matchOdds : [];
        const sport = topMatchesSubscribedIdToSportRef.current.get(String(id));
        if (!sport) continue;
        const mergeOddsEntry = (prevEntry) => ({
          ...(prevEntry && typeof prevEntry === 'object' ? prevEntry : {}),
          ...incoming,
          matchOdds: matchOdds.length ? matchOdds : (prevEntry?.matchOdds ?? []),
        });
        if (sport === 'tennis') {
          setTopTennisMatchesOddsByGameId((prev) => ({ ...prev, [id]: mergeOddsEntry(prev[id]) }));
        } else if (sport === 'soccer') {
          setTopSoccerMatchesOddsByGameId((prev) => ({ ...prev, [id]: mergeOddsEntry(prev[id]) }));
        } else if (sport === 'cricket') {
          setTopMatchesOddsByGameId((prev) => ({ ...prev, [id]: mergeOddsEntry(prev[id]) }));
        }
      }
    };
    addOddsListener(onOdds);
    return () => removeOddsListener(onOdds);
  }, []);

  useEffect(() => {
    const refMap = topMatchesSubscribedIdToSportRef.current;
    const reconcile = (wantedIds, prevSet, sport) => {
      wantedIds.forEach((wid) => {
        if (!prevSet.has(wid)) {
          subscribeOdds(wid, sport);
          refMap.set(String(wid), sport);
          prevSet.add(wid);
        }
      });
      [...prevSet].forEach((wid) => {
        if (!wantedIds.includes(wid)) {
          unsubscribeOdds(wid, sport);
          refMap.delete(String(wid));
          prevSet.delete(wid);
        }
      });
    };
    const cricketIds = topMatchesFromApi.slice(0, LANDING_HOME_ODDS_ROW_CAP).map((m) => m.gameId).filter(Boolean);
    const tennisIds = topTennisMatchesFromApi.slice(0, LANDING_HOME_ODDS_ROW_CAP).map((m) => m.gameId ?? m.eventId).filter(Boolean);
    const soccerIds = topSoccerMatchesFromApi.slice(0, LANDING_HOME_ODDS_ROW_CAP).map((m) => m.gameId).filter(Boolean);
    reconcile(cricketIds, topMatchesOddsSubscribedRef.current, 'cricket');
    reconcile(tennisIds, topTennisMatchesOddsSubscribedRef.current, 'tennis');
    reconcile(soccerIds, topSoccerMatchesOddsSubscribedRef.current, 'soccer');
  }, [topMatchesFromApi, topTennisMatchesFromApi, topSoccerMatchesFromApi]);

  // Hero 3D slider – 7 items, 5 visible at a time, infinite repeat
  const [hero3dIndex, setHero3dIndex] = useState(0);
  const hero3dSlides = [
    { id: 1, src: 'images/home_bnr.png', alt: 'game', heading: 'All Mini Games', subContent: 'Play More. Win Faster. Endless Fun Awaits.', to: '/casino' },
    { id: 2, src: 'images/home_bnr2.png', alt: 'game', heading: 'Sports & Betting', subContent: 'Play Smart. Bet Big. Win with the Best Odds.', to: '/sportsbook' },
    { id: 3, src: 'images/home_bnr3.png', alt: 'game', heading: 'Casino', subContent: 'Play Live. Bet Bold. Win Real Rewards.', to: '/casino' },
    { id: 4, src: 'images/home_bnr4.png', alt: 'game', heading: 'Dragon Tiger', subContent: 'Choose Your Side. Bet Fast. Win Instantly.', to: '/casino?category=Dragon+Tiger' },
    { id: 5, src: 'images/home_bnr5.png', alt: 'game', heading: 'Aviator', subContent: 'Take Off Early. Cash Out Big. Win Smart.', to: '/casino?gameName=Aviator' },
    { id: 6, src: 'images/home_bnr6.png', alt: 'game', heading: 'Cricket', subContent: 'Level up and unlock exclusive perks.', to: '/sports' },
    { id: 7, src: 'images/home_bnr7.png', alt: 'game', heading: 'Casino & Sports Hub', subContent: 'Bet Every Ball. Play Every Moment. Win Bigger.', to: '/casino' },
  ];
  const hero3dTotal = hero3dSlides.length;
  const hero3dOffsets = [-2, -1, 0, 1, 2];
  const getHero3dIndex = (offset) => (hero3dIndex + offset + hero3dTotal * 10) % hero3dTotal;

  const hero3dSwipeRef = useRef({ startX: 0, didSwipe: false });
  const handleHero3dPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    hero3dSwipeRef.current = { startX: e.clientX, didSwipe: false };
  };
  const handleHero3dPointerUp = (e) => {
    const { startX } = hero3dSwipeRef.current;
    const deltaX = e.clientX - startX;
    const THRESHOLD = 50;
    if (deltaX < -THRESHOLD) {
      setHero3dIndex((prev) => (prev + 1) % hero3dTotal);
      hero3dSwipeRef.current.didSwipe = true;
    } else if (deltaX > THRESHOLD) {
      setHero3dIndex((prev) => (prev === 0 ? hero3dTotal - 1 : prev - 1));
      hero3dSwipeRef.current.didSwipe = true;
    }
  };
  const handleHero3dCardClick = (e, slide) => {
    if (hero3dSwipeRef.current.didSwipe) return;
    e.preventDefault();
    e.stopPropagation();
    navigate(slide.to || '/casino');
  };

  useEffect(() => {
    const t = setInterval(() => {
      setHero3dIndex((prev) => (prev + 1) % hero3dTotal);
    }, 5000);
    return () => clearInterval(t);
  }, [hero3dTotal]);

  // Mouse drag-to-scroll state (shared for all sliders)
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startTranslate: 0,
    lastTranslate: 0,
    sliderEl: null,
    getItemWidth: null,
    itemsPerSet: null,
    setIndex: null,
  });
  const justDraggedRef = useRef(false);

  const topSportsDisplayItems = useMemo(() => [...topSportsItems, { viewAll: true, to: '/sportsbook' }], [])

  // TOP Matches: grouped by day (Live, Today, Tomorrow, …) for table view
  const groupMatchesByDay = (matches) => {
    const list = matches.map((m) => {
      const et = m.eventTime ?? pickMatchEventTime(m);
      let timeOnly = '';
      if (et) {
        try {
          const d = new Date(et);
          if (!isNaN(d.getTime())) timeOnly = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch { }
      }
      return { ...m, eventTime: et, dayGroup: getDayGroup(et), timeOnly };
    });
    const sorted = [...list].sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0));
    const liveMatches = sorted.filter((m) => m.inPlay);
    const nonLive = sorted.filter((m) => !m.inPlay);
    const groups = {};
    nonLive.forEach((m) => {
      const day = m.dayGroup || 'Other';
      if (!groups[day]) groups[day] = [];
      groups[day].push(m);
    });
    const order = ['Today', 'Tomorrow'];
    const rest = Object.keys(groups).filter((d) => !order.includes(d));
    const daySections = [...order.filter((d) => groups[d]?.length), ...rest].map((day) => ({ day, matches: groups[day], isLiveSection: false }));
    if (liveMatches.length > 0) {
      return [{ day: 'Live', matches: liveMatches, isLiveSection: true }, ...daySections];
    }
    return daySections;
  };
  const topMatchesByDay = useMemo(() => groupMatchesByDay(topMatchesFromApi), [topMatchesFromApi]);
  const topTennisMatchesByDay = useMemo(() => groupMatchesByDay(topTennisMatchesFromApi.slice(0, 10)), [topTennisMatchesFromApi]);
  const topSoccerMatchesByDay = useMemo(() => groupMatchesByDay(topSoccerMatchesFromApi.slice(0, 10)), [topSoccerMatchesFromApi]);

  const navigate = useNavigate();
  const registerLandingOddsScrollRef = useCallback((key, node) => {
    if (node) landingOddsScrollRefs.current.set(key, node)
    else landingOddsScrollRefs.current.delete(key)
  }, [])

  const syncLandingOddsScroll = useCallback((sourceKey, scrollLeft) => {
    if (isSyncingLandingOddsScrollRef.current) return
    const sourceSection = sourceKey.split('-')[0]
    isSyncingLandingOddsScrollRef.current = true
    landingOddsScrollRefs.current.forEach((node, key) => {
      const section = key.split('-')[0]
      if (section !== sourceSection) return
      if (!node || key === sourceKey) return
      if (Math.abs(node.scrollLeft - scrollLeft) > 1) node.scrollLeft = scrollLeft
    })
    requestAnimationFrame(() => {
      isSyncingLandingOddsScrollRef.current = false
    })
  }, [])
  const handleTopMatchRowClick = (e, match) => {
    if (e.target.closest('button')) return;
    if (match?.gameId) navigate('/cricket', { state: { gameId: match.gameId, eventName: match.teams, sportName: 'cricket', inPlay: match.inPlay, seriesName: match.tournament } });
    else navigate('/sports');
  };
  const handleTopTennisMatchRowClick = (e, match) => {
    if (e.target.closest('button')) return;
    const id = match?.gameId ?? match?.eventId;
    if (id) navigate('/tennis', { state: { gameId: id, eventId: id, eventName: match.teams, sportName: 'tennis', inPlay: match.inPlay, seriesName: match.tournament } });
    else navigate('/sports');
  };
  const handleTopSoccerMatchRowClick = (e, match) => {
    if (e.target.closest('button')) return;
    if (match?.gameId) navigate('/soccer', { state: { gameId: match.gameId, eventName: match.teams, sportName: 'soccer', inPlay: match.inPlay, seriesName: match.tournament } });
    else navigate('/sports');
  };

  // Landing API sections: display items = games + View All card
  const landingSectionConfig = useMemo(() => ({
    liveCasino: { title: 'Live Casino', viewAllTo: '/casino?provider=EZ', games: landingGames.liveCasino },
    slots: { title: 'Slots', viewAllTo: '/casino?provider=all&category=Slots', games: landingGames.slots },
    trending: { title: 'Trending', viewAllTo: '/casino', games: landingGames.trending },
    roulette: { title: 'Roulette', viewAllTo: '/casino?provider=all&category=Roulette', games: landingGames.roulette },
    cardGames: { title: 'Card Games', viewAllTo: '/casino?provider=all&category=Teen+Patti', games: landingGames.cardGames },
  }), [landingGames]);

  // Static sections: always show games + View All (data format remains same)
  const landingLiveCasinoDisplayItems = useMemo(() => {
    const g = landingSectionConfig.liveCasino.games;
    return [...g.map((game) => ({ ...game, viewAll: false })), { viewAll: true, to: landingSectionConfig.liveCasino.viewAllTo }];
  }, [landingSectionConfig.liveCasino]);
  const landingSlotsDisplayItems = useMemo(() => {
    const g = landingSectionConfig.slots.games;
    return [...g.map((game) => ({ ...game, viewAll: false })), { viewAll: true, to: landingSectionConfig.slots.viewAllTo }];
  }, [landingSectionConfig.slots]);
  const landingTrendingDisplayItems = useMemo(() => {
    const g = landingSectionConfig.trending.games;
    return [...g.map((game) => ({ ...game, viewAll: false })), { viewAll: true, to: landingSectionConfig.trending.viewAllTo }];
  }, [landingSectionConfig.trending]);
  const landingRouletteDisplayItems = useMemo(() => {
    const g = landingSectionConfig.roulette.games;
    return [...g.map((game) => ({ ...game, viewAll: false })), { viewAll: true, to: landingSectionConfig.roulette.viewAllTo }];
  }, [landingSectionConfig.roulette]);
  const landingCardGamesDisplayItems = useMemo(() => {
    const g = landingSectionConfig.cardGames.games;
    return [...g.map((game) => ({ ...game, viewAll: false })), { viewAll: true, to: landingSectionConfig.cardGames.viewAllTo }];
  }, [landingSectionConfig.cardGames]);

  // Casino Lobby: two rows, 9 games + View All per row (same UI as before)
  const LOBBY_PER_ROW = 9;
  const lobbyRow1Items = useMemo(() => {
    const g = (casinoLobbyGames || []).slice(0, LOBBY_PER_ROW);
    return [...g.map((game) => ({ ...game, viewAll: false })), { viewAll: true, to: '/casino?provider=EZ' }];
  }, [casinoLobbyGames]);
  const lobbyRow2Items = useMemo(() => {
    const g = (casinoLobbyGames || []).slice(LOBBY_PER_ROW, LOBBY_PER_ROW * 2);
    return [...g.map((game) => ({ ...game, viewAll: false })), { viewAll: true, to: '/casino?provider=EZ' }];
  }, [casinoLobbyGames]);

  const topSportsItemsPerSet = topSportsDisplayItems.length;
  const landingItemWidth = 178 + 18;
  const landingLiveCasinoItemsPerSet = landingLiveCasinoDisplayItems.length;
  const landingSlotsItemsPerSet = landingSlotsDisplayItems.length;
  const landingTrendingItemsPerSet = landingTrendingDisplayItems.length;
  const landingRouletteItemsPerSet = landingRouletteDisplayItems.length;
  const landingCardGamesItemsPerSet = landingCardGamesDisplayItems.length;

  // Clamp translate so scroll stops at last item (no gap)
  const clampSliderTranslate = (el, translateX) => {
    if (!el?.parentElement) return translateX;
    const contentWidth = el.offsetWidth;
    const containerWidth = el.parentElement.clientWidth;
    const maxTranslate = contentWidth <= containerWidth ? 0 : -(contentWidth - containerWidth);
    return Math.max(maxTranslate, Math.min(0, translateX));
  };

  // TOP Sports slider – sync transform to index (clamped)
  useEffect(() => {
    const el = topSportsSliderRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -topSportsIndex * (178 + 8))}px)`;
  }, [topSportsIndex]);

  // Landing API sliders – sync transform to index (clamped so no gap at end)
  useEffect(() => {
    const el = landingLiveCasinoRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -landingLiveCasinoIndex * landingItemWidth)}px)`;
  }, [landingLiveCasinoIndex, landingItemWidth]);
  useEffect(() => {
    const el = landingSlotsRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -landingSlotsIndex * landingItemWidth)}px)`;
  }, [landingSlotsIndex, landingItemWidth]);
  useEffect(() => {
    const el = landingTrendingRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -landingTrendingIndex * landingItemWidth)}px)`;
  }, [landingTrendingIndex, landingItemWidth]);
  useEffect(() => {
    const el = trendingTopRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -trendingTopIndex * landingItemWidth)}px)`;
  }, [trendingTopIndex, landingItemWidth]);
  useEffect(() => {
    const el = landingRouletteRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -landingRouletteIndex * landingItemWidth)}px)`;
  }, [landingRouletteIndex, landingItemWidth]);
  useEffect(() => {
    const el = landingCardGamesRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -landingCardGamesIndex * landingItemWidth)}px)`;
  }, [landingCardGamesIndex, landingItemWidth]);
  const lobbySliderItemsPerSet = 10; /* 9 cards + View All per row */
  useEffect(() => {
    const el = lobbySliderRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -lobbySliderIndex * landingItemWidth)}px)`;
  }, [lobbySliderIndex, landingItemWidth]);

  // Sliders scroll only on mouse drag – no auto-slide

  // Prevent link click when user just finished dragging
  const handleSliderClickCapture = (e) => {
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      justDraggedRef.current = false;
    }
  };

  // Mouse drag-to-scroll: start drag (call from each wrapper's onMouseDown)
  const handleSliderMouseDown = (e, config) => {
    if (e.button !== 0 || !config.sliderRef?.current) return;
    e.preventDefault();
    const itemWidth = typeof config.getItemWidth === 'function' ? config.getItemWidth() : config.getItemWidth;
    const startTranslate = -config.currentIndex * itemWidth;
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startTranslate,
      lastTranslate: startTranslate,
      sliderEl: config.sliderRef.current,
      getItemWidth: config.getItemWidth,
      itemsPerSet: config.itemsPerSet,
      setIndex: config.setIndex,
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  // Window listeners for drag (mousemove + mouseup)
  useEffect(() => {
    const onMouseMove = (e) => {
      const d = dragStateRef.current;
      if (!d.isDragging || !d.sliderEl) return;
      const deltaX = e.clientX - d.startX;
      let newTranslate = d.startTranslate - deltaX;
      newTranslate = clampSliderTranslate(d.sliderEl, newTranslate);
      d.sliderEl.style.transition = 'none';
      d.sliderEl.style.transform = `translateX(${newTranslate}px)`;
      d.lastTranslate = newTranslate;
    };
    const onMouseUp = () => {
      const d = dragStateRef.current;
      if (!d.isDragging || !d.sliderEl) return;
      const moved = Math.abs(d.lastTranslate - d.startTranslate) > 5;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      d.isDragging = false;
      if (moved) justDraggedRef.current = true;
      const clampedTranslate = clampSliderTranslate(d.sliderEl, d.lastTranslate);
      d.sliderEl.style.transform = `translateX(${clampedTranslate}px)`;
      d.sliderEl.style.transition = '';
      const itemWidth = typeof d.getItemWidth === 'function' ? d.getItemWidth() : d.getItemWidth;
      let nearestIndex = Math.round(-clampedTranslate / itemWidth);
      if (nearestIndex < 0) nearestIndex = 0;
      if (nearestIndex >= d.itemsPerSet) nearestIndex = d.itemsPerSet - 1;
      d.setIndex(nearestIndex);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const isLoggedIn = !!token;

  return (
    <>
      <div className='casino_hero_s'>
        <div className='cricket_ball_effect'>
          <img src="images/cricket_vector.png" alt="game" decoding="async" width="120" height="120" />
        </div>
        <div className='football_ball_effect'>
          <img src="images/football_vector.png" alt="game" decoding="async" width="120" height="120" />
        </div>
        <div className='container'>
          <div className="heroslider_3d">
            <div
              className="slider3d_wrapper"
              onPointerDown={handleHero3dPointerDown}
              onPointerUp={handleHero3dPointerUp}
              onPointerCancel={handleHero3dPointerUp}
            >
              {hero3dOffsets.map((offset) => {
                const slideIndex = getHero3dIndex(offset);
                const slide = hero3dSlides[slideIndex];
                const isCenter = offset === 0;
                const positionClass =
                  offset === -2 ? 'slider3d_pos_left2' :
                    offset === -1 ? 'slider3d_pos_left1' :
                      offset === 0 ? 'slider3d_pos_center' :
                        offset === 1 ? 'slider3d_pos_right1' :
                          'slider3d_pos_right2';
                return (
                  <div
                    key={slideIndex}
                    className={`slider3d ${positionClass} ${isCenter ? 'slider3d_active' : ''} ${isCenter ? 'slider3d_has_overlay' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleHero3dCardClick(e, slide)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(slide.to || '/casino'); } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="slider3d_slide_link link_plain" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        decoding="async"
                        {...(isCenter ? { fetchPriority: 'high' } : { loading: 'lazy' })}
                      />
                      {isCenter && slide.heading != null && (
                        <div className="slider3d_card_overlay slider3d_card_overlay_animate">
                          <span className="slider3d_card_overlay_title">{slide.heading}</span>
                          <span className="slider3d_card_overlay_subtitle">{slide.subContent}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="slider3d_controls">
              <button
                type="button"
                className="slider3d_arrow slider3d_arrow_prev"
                onClick={() => setHero3dIndex((prev) => (prev === 0 ? hero3dTotal - 1 : prev - 1))}
                aria-label="Previous slide"
              >
                <i className="ri-arrow-left-s-line" aria-hidden="true" />
              </button>
              <div className="slider3d_dots">
                {hero3dSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`slider3d_dot ${i === hero3dIndex ? 'slider3d_dot_active' : ''}`}
                    onClick={() => setHero3dIndex(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === hero3dIndex ? 'true' : undefined}
                  />
                ))}
              </div>
              <button
                type="button"
                className="slider3d_arrow slider3d_arrow_next"
                onClick={() => setHero3dIndex((prev) => (prev === hero3dTotal - 1 ? 0 : prev + 1))}
                aria-label="Next slide"
              >
                <i className="ri-arrow-right-s-line" aria-hidden="true" />
              </button>
            </div>

            <div className="casino_hero_s_lft">
              <h1><span>Your Ultimate</span> Casino &amp; Sports Gaming Hub</h1>
              <span className='instant_text'><i class="ri-circle-fill"></i> Instant Deposit <i class="ri-circle-fill"></i> Instant Withdrawal</span>

              <div className="d-flex align-items-center gap-3 mt-4">
                {!isLoggedIn ? (
                  <button
                    type="button"
                    className="btnbnr"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("openLoginModal", { detail: "signup" })
                      )
                    }
                  >
                    Sign Up and Play
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btnbnr"
                    onClick={() => {
                      if (!platformConfig.depositServiceStatus) {
                        alertErrorMessage('Deposits are temporarily unavailable. Please try again later.');
                        return;
                      }
                      navigate('/deposit');
                    }}
                  >
                    Deposit Now
                  </button>
                )}
                <ul className="social_icons d-flex align-items-center gap-2 hero_activity_icons">
                  <li><Link to="/casino" className="social_icon_btn" title="Casino" aria-label="Casino"><i className="ri-poker-spades-fill" /></Link></li>
                  <li><Link to="/sports" className="social_icon_btn" title="Sports" aria-label="Sports"><i className="ri-basketball-fill" /></Link></li>
                  <li><Link to="/game" className="social_icon_btn" title="Slots" aria-label="Slots"><i className="ri-dice-5-fill" /></Link></li>
                  <li><Link to="/casino" className="social_icon_btn" title="Games" aria-label="Games"><i className="ri-focus-3-fill" /></Link></li>
                </ul>
              </div>
            </div>

            <div className='hero_vector_effect_bottom'>
              <img className='hero_left_vector' src="images/hero_left_vector.png" alt="game" decoding="async" width="120" height="80" />
              <img className='hero_cntr_vector' src="images/hero_cntr_vector.png" alt="game" decoding="async" width="90" height="60" />
              <img className='hero_right_vector' src="images/hero_right_vector.png" alt="game" decoding="async" width="100" height="80" />
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid mobileview">
        <div className="casino_sport_mobile_section">
          <div className="casinobox_item">
            <Link to="/casino" className="casino_lft link_plain">
              <div className="casino_lft_cnt">
                <h3>Casino <i className="ri-arrow-right-s-line"></i></h3>
                <p>Play Elite Casino Games with Bigger Rewards and Non-Stop Excitement.</p>
              </div>
              <div className="gameimg">
                <img src="images/casino_vector.svg" alt="game" width="120" height="120" decoding="async" />
              </div>
            </Link>
          </div>
          <div className="casinobox_item  sport_bg">
            <Link to="/sports" className="casino_lft link_plain" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="casino_lft_cnt">
                <h3>Sport <i className="ri-arrow-right-s-line"></i></h3>
                <p>Back Your Favorite Teams with the Best Odds and Ultimate Winning Experience.</p>
              </div>
              <div className="gameimg">
                <img src="images/sport_vector.svg" alt="game" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className='trending_games_section' ref={trendingSectionRef}>
       
        <div className='game_items_video'>
          {(() => {
            const trendingVideos = [
              'images/freepik_create-a-bold-and-highenergy-animated-promo-video-_minimax_768p_16-9_24fps_68689.mp4',
              'images/freepik_create-a-highintensity-animated-promo-video-using-_minimax_768p_16-9_24fps_68694.mp4',
              'images/freepik_create-a-fun-and-energetic-animated-promo-video-us_kling_1080p_16-9_24fps_68693.mp4',
              'images/freepik_create-a-glamorous-and-highend-animated-promo-vide_minimax_768p_16-9_24fps_68690.mp4',
              'images/freepik_create-a-vibrant-animated-promo-video-using-this-c_kling_1080p_16-9_24fps_68692.mp4',
              'images/freepik_create-a-stylish-and-engaging-animated-promo-video_kling_1080p_16-9_24fps_68691.mp4',
            ];
            const trendingCategories = ['Aviator', 'Dragon Tiger', 'Chicken Road', 'Baccarat', 'Roulette', 'Teen Patti'];
            const base = process.env.PUBLIC_URL || '';
            if (!showTrendingVideos) {
              return trendingVideos.map((_, i) => <div key={i} className='game_video_bl' aria-hidden="true" />);
            }
            return trendingVideos.map((src, i) => {
              const category = trendingCategories[i] ?? 'lobby';
              const to = `/casino?provider=all&category=${encodeURIComponent(category)}`;
              return (
                <Link key={i} to={to} className='game_video_bl' style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <video width="100%" height="auto" autoPlay muted loop playsInline loading="lazy">
                    <source src={`${base}/${src}`} type="video/mp4" />
                  </video>
                  <span className='game_video_bl_title'>{category}</span>
                </Link>
              );
            });
          })()}
        </div>
        <h2 className='heading_h2 mb-0'>Trending Games</h2>
        {landingTrendingDisplayItems.length > 0 && (
          <div
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, { sliderRef: trendingTopRef, getItemWidth: landingItemWidth, itemsPerSet: landingTrendingItemsPerSet, currentIndex: trendingTopIndex, setIndex: setTrendingTopIndex })}
            onClickCapture={handleSliderClickCapture}
            style={{ cursor: 'grab' }}
          >
            <div className="game_items_slider" ref={trendingTopRef}>
              {landingTrendingDisplayItems.map((item, index) =>
                item.viewAll ? (
                  <Link key="view-all-trending-top" to={item.to} className="game_items_inner slider_view_all_card link_plain">
                    <span className="slider_view_all_text">View All</span>
                  </Link>
                ) : (
                  <Link key={`trend-${item.code}-${index}`} to={`/casino?provider=${encodeURIComponent(item.providerCode || 'all')}&category=${encodeURIComponent(item.category?.[0]?.code || item.category?.[0]?.name || 'lobby')}&gameName=${encodeURIComponent(item.name || '')}`} className="game_items_inner link_plain">
                    <div className='playbtn'>
                      <img loading="lazy" src="images/playbtn.png" alt="game" />
                    </div>
                    {item.badge && <div className="top_ads">{item.badge}</div>}
                    <img loading="lazy" src={getLandingGameImage(item)} alt="game" />
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </div>

      <div className="landing_page_content">


        {/* Static landing sections – always visible, data format remains same */}
        <div className="top_slot_outer top_slot_outer_casino">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2"><img loading="lazy" src={`${process.env.PUBLIC_URL || ''}/images/live_icon.svg`} alt="game" width="24" height="24" /> {landingSectionConfig.liveCasino.title}</h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to={landingSectionConfig.liveCasino.viewAllTo}><button type="button" className="slotbtn">Go to {landingSectionConfig.liveCasino.title}</button></Link>
              </div>
            </div>
            <div
              className="game_items_slider_wrapper"
              onMouseDown={(e) => handleSliderMouseDown(e, { sliderRef: landingLiveCasinoRef, getItemWidth: landingItemWidth, itemsPerSet: landingLiveCasinoItemsPerSet, currentIndex: landingLiveCasinoIndex, setIndex: setLandingLiveCasinoIndex })}
              onClickCapture={handleSliderClickCapture}
              style={{ cursor: 'grab' }}
            >
              <div className="game_items_slider" ref={landingLiveCasinoRef}>
                {landingLiveCasinoDisplayItems.map((item, index) =>
                  item.viewAll ? (
                    <Link key="view-all-live-casino" to={item.to} className="game_items_inner slider_view_all_card link_plain">
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                    <Link key={`live-${item.code}-${index}`} to={`/casino?provider=${encodeURIComponent(item.providerCode || 'all')}&category=${encodeURIComponent(item.category?.[0]?.code || item.category?.[0]?.name || 'lobby')}&gameName=${encodeURIComponent(item.name || '')}`} className="game_items_inner link_plain">
                      <div className='playbtn'>
                        <img loading="lazy" src="images/playbtn.png" alt="game" />
                      </div>
                      {item.badge && (
                        <div className="top_ads">
                          {item.badge}
                        </div>
                      )}
                      <img loading="lazy" src={getLandingGameImage(item)} alt="game" />
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="top_slot_outer top_slot_outer_casino">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2"><img loading="lazy" src={`${process.env.PUBLIC_URL || ''}/images/live_icon.svg`} alt="game" width="24" height="24" /> {landingSectionConfig.slots.title}</h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to={landingSectionConfig.slots.viewAllTo}><button type="button" className="slotbtn">Go to {landingSectionConfig.slots.title}</button></Link>
              </div>
            </div>
            <div
              className="game_items_slider_wrapper"
              onMouseDown={(e) => handleSliderMouseDown(e, { sliderRef: landingSlotsRef, getItemWidth: landingItemWidth, itemsPerSet: landingSlotsItemsPerSet, currentIndex: landingSlotsIndex, setIndex: setLandingSlotsIndex })}
              onClickCapture={handleSliderClickCapture}
              style={{ cursor: 'grab' }}
            >
              <div className="game_items_slider" ref={landingSlotsRef}>
                {landingSlotsDisplayItems.map((item, index) =>
                  item.viewAll ? (
                    <Link key="view-all-slots-api" to={item.to} className="game_items_inner slider_view_all_card link_plain">
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                    <Link key={`slot-${item.code}-${index}`} to={`/casino?provider=${encodeURIComponent(item.providerCode || 'all')}&category=${encodeURIComponent(item.category?.[0]?.code || item.category?.[0]?.name || 'lobby')}&gameName=${encodeURIComponent(item.name || '')}`} className="game_items_inner link_plain">
                      <div className='playbtn'>
                        <img loading="lazy" src="images/playbtn.png" alt="game" />
                      </div>
                      {item.badge && (
                        <div className="top_ads">
                          {item.badge}
                        </div>
                      )}
                      <img loading="lazy" src={getLandingGameImage(item)} alt="game" />
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="top_slot_outer top_slot_outer_casino">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2"><img loading="lazy" src={`${process.env.PUBLIC_URL || ''}/images/live_icon.svg`} alt="game" width="24" height="24" /> {landingSectionConfig.trending.title}</h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to={landingSectionConfig.trending.viewAllTo}><button type="button" className="slotbtn">Go to Casino</button></Link>
              </div>
            </div>
            <div
              className="game_items_slider_wrapper"
              onMouseDown={(e) => handleSliderMouseDown(e, { sliderRef: landingTrendingRef, getItemWidth: landingItemWidth, itemsPerSet: landingTrendingItemsPerSet, currentIndex: landingTrendingIndex, setIndex: setLandingTrendingIndex })}
              onClickCapture={handleSliderClickCapture}
              style={{ cursor: 'grab' }}
            >
              <div className="game_items_slider" ref={landingTrendingRef}>
                {landingTrendingDisplayItems.map((item, index) =>
                  item.viewAll ? (
                    <Link key="view-all-trending" to={item.to} className="game_items_inner slider_view_all_card link_plain">
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                    <Link key={`trend-${item.code}-${index}`} to={`/casino?provider=${encodeURIComponent(item.providerCode || 'all')}&category=${encodeURIComponent(item.category?.[0]?.code || item.category?.[0]?.name || 'lobby')}&gameName=${encodeURIComponent(item.name || '')}`} className="game_items_inner link_plain">
                      <div className='playbtn'>
                        <img loading="lazy" src="images/playbtn.png" alt="game" />
                      </div>
                      {item.badge && (
                        <div className="top_ads">
                          {item.badge}
                        </div>
                      )}
                      <img loading="lazy" src={getLandingGameImage(item)} alt="game" />
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="top_slot_outer top_slot_outer_casino">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2"><img loading="lazy" src={`${process.env.PUBLIC_URL || ''}/images/live_icon.svg`} alt="game" width="24" height="24" /> {landingSectionConfig.roulette.title}</h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to={landingSectionConfig.roulette.viewAllTo}><button type="button" className="slotbtn">Go to {landingSectionConfig.roulette.title}</button></Link>
              </div>
            </div>
            <div
              className="game_items_slider_wrapper"
              onMouseDown={(e) => handleSliderMouseDown(e, { sliderRef: landingRouletteRef, getItemWidth: landingItemWidth, itemsPerSet: landingRouletteItemsPerSet, currentIndex: landingRouletteIndex, setIndex: setLandingRouletteIndex })}
              onClickCapture={handleSliderClickCapture}
              style={{ cursor: 'grab' }}
            >
              <div className="game_items_slider" ref={landingRouletteRef}>
                {landingRouletteDisplayItems.map((item, index) =>
                  item.viewAll ? (
                    <Link key="view-all-roulette" to={item.to} className="game_items_inner slider_view_all_card link_plain">
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                    <Link key={`roulette-${item.code}-${index}`} to={`/casino?provider=${encodeURIComponent(item.providerCode || 'all')}&category=${encodeURIComponent(item.category?.[0]?.code || item.category?.[0]?.name || 'lobby')}&gameName=${encodeURIComponent(item.name || '')}`} className="game_items_inner link_plain">
                      <div className='playbtn'>
                        <img loading="lazy" src="images/playbtn.png" alt="game" />
                      </div>
                      {item.badge && (
                        <div className="top_ads">
                          {item.badge}
                        </div>
                      )}
                      <img loading="lazy" src={getLandingGameImage(item)} alt="game" />
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="top_slot_outer top_slot_outer_casino">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2"><img loading="lazy" src={`${process.env.PUBLIC_URL || ''}/images/live_icon.svg`} alt="game" width="24" height="24" /> {landingSectionConfig.cardGames.title}</h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to={landingSectionConfig.cardGames.viewAllTo}><button type="button" className="slotbtn">Go to {landingSectionConfig.cardGames.title}</button></Link>
              </div>
            </div>
            <div
              className="game_items_slider_wrapper"
              onMouseDown={(e) => handleSliderMouseDown(e, { sliderRef: landingCardGamesRef, getItemWidth: landingItemWidth, itemsPerSet: landingCardGamesItemsPerSet, currentIndex: landingCardGamesIndex, setIndex: setLandingCardGamesIndex })}
              onClickCapture={handleSliderClickCapture}
              style={{ cursor: 'grab' }}
            >
              <div className="game_items_slider" ref={landingCardGamesRef}>
                {landingCardGamesDisplayItems.map((item, index) =>
                  item.viewAll ? (
                    <Link key="view-all-card-games" to={item.to} className="game_items_inner slider_view_all_card link_plain">
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                    <Link key={`card-${item.code}-${index}`} to={`/casino?provider=${encodeURIComponent(item.providerCode || 'all')}&category=${encodeURIComponent(item.category?.[0]?.code || item.category?.[0]?.name || 'lobby')}&gameName=${encodeURIComponent(item.name || '')}`} className="game_items_inner link_plain">
                      <div className='playbtn'>
                        <img loading="lazy" src="images/playbtn.png" alt="game" />
                      </div>
                      {item.badge && (
                        <div className="top_ads">
                          {item.badge}
                        </div>
                      )}
                      <img loading="lazy" src={getLandingGameImage(item)} alt="game" />
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="top_slot_outer top_slot_outer_casino">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2">
                <img src="/images/live_icon.svg" alt="game" width="24" height="24" /> Casino Lobby
              </h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to="/casino?provider=EZ"><button type="button" className="slotbtn">Go to Casino Lobby</button></Link>
              </div>
            </div>
            <div
              className="game_items_slider_wrapper lobbyslider"
              onMouseDown={(e) => handleSliderMouseDown(e, { sliderRef: lobbySliderRef, getItemWidth: landingItemWidth, itemsPerSet: lobbySliderItemsPerSet, currentIndex: lobbySliderIndex, setIndex: setLobbySliderIndex })}
              onClickCapture={handleSliderClickCapture}
              style={{ cursor: 'grab' }}
            >
              <div className="lobby_slider_track" ref={lobbySliderRef}>
                <div className="game_items_slider">
                  {casinoLobbyLoading ? (
                    <div className="d-flex align-items-center justify-content-center p-4" style={{ minWidth: '100%' }}><span>Loading games...</span></div>
                  ) : (
                    lobbyRow1Items.map((item, index) =>
                      item.viewAll ? (
                        <Link key="view-all-lobby-1" to={item.to} className="game_items_inner slider_view_all_card link_plain">
                          <span className="slider_view_all_text">View All</span>
                        </Link>
                      ) : (
                        <Link
                          key={`lobby-1-${item.code}-${index}`}
                          to={`/casino?provider=${encodeURIComponent(item.providerCode || 'EZ')}&category=${encodeURIComponent(item.category?.[0]?.code || item.category?.[0]?.name || 'lobby')}&gameName=${encodeURIComponent(item.name || '')}`}
                          className="game_items_inner link_plain"
                        >
                          <div className="playbtn">
                            <img src="/images/playbtn.png" alt="play" />
                          </div>
                          <img loading="lazy" src={getLandingGameImage(item)} alt={item.name || 'game'} />
                        </Link>
                      )
                    )
                  )}
                </div>
                <div className="game_items_slider">
                  {!casinoLobbyLoading && lobbyRow2Items.map((item, index) =>
                    item.viewAll ? (
                      <Link key="view-all-lobby-2" to={item.to} className="game_items_inner slider_view_all_card link_plain">
                        <span className="slider_view_all_text">View All</span>
                      </Link>
                    ) : (
                      <Link
                        key={`lobby-2-${item.code}-${index}`}
                        to={`/casino?provider=${encodeURIComponent(item.providerCode || 'EZ')}&category=${encodeURIComponent(item.category?.[0]?.code || item.category?.[0]?.name || 'lobby')}&gameName=${encodeURIComponent(item.name || '')}`}
                        className="game_items_inner link_plain"
                      >
                        <div className="playbtn">
                          <img src="/images/playbtn.png" alt="play" />
                        </div>
                        <img loading="lazy" src={getLandingGameImage(item)} alt={item.name || 'game'} />
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>



        <div className="top_match_section">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2">TOP Sports</h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to="/sportsbook"><button type="button" className="slotbtn">Go to Sportsbook</button></Link>
              </div>
            </div>
          </div>
          <div
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, {
              sliderRef: topSportsSliderRef,
              getItemWidth: 178 + 8,
              itemsPerSet: topSportsItemsPerSet,
              currentIndex: topSportsIndex,
              setIndex: setTopSportsIndex,
            })}
            onClickCapture={handleSliderClickCapture}
            style={{ cursor: 'grab' }}
          >
            <div className='match_slider_sports d-flex align-items-center gap-2' ref={topSportsSliderRef}>
              {topSportsDisplayItems.map((item, index) => (
                item.viewAll ? (
                  <Link key="view-all-sports" to={item.to} className="match_slider_sports_item slider_view_all_card sports_view_all link_plain">
                    <span className="slider_view_all_text">View All</span>
                  </Link>
                ) : (
                  <Link key={`topsports-${item.id}-${index}`} to={item.to} className="match_slider_sports_item link_plain" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {item.icon ? (
                      <img loading="lazy" src={`images/${item.icon}`} alt="" className="match_slider_sports_img sports_grid_icon" />
                    ) : (
                      <i className={`${item.iconClass} match_slider_sports_icon`} aria-hidden />
                    )}
                    <h3>{item.title}</h3>
                  </Link>
                )
              ))}
            </div>
          </div>
        </div>

        {/* <div className="casino_sport_section">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-6">
                <Link to="/casino" className="casino_sport_section_lft link_plain desktopview">
                  <div className="cntlft">
                    <h3>Casino</h3>
                    <p>Enjoy BetFury Originals and other casino games from top providers.</p>
                  </div>
                  <div className="gameimg">
                    <img loading="lazy" src="images/gold_img.png" alt="game" />
                  </div>
                </Link>
              </div>
              <div className="col-md-6">
                <Link to="/sports" className="casino_sport_section_lft sport_bg link_plain desktopview">
                  <div className="cntlft">
                    <h3>Sport</h3>
                    <p>Bet on popular sports events with high odds and other great features.</p>
                  </div>
                  <div className="gameimg">
                    <img loading="lazy" src="images/sports_img.png" alt="game" />
                  </div>
                </Link>
              </div>

            </div>
          </div>
        </div> */}



        {/* <div className='playearn_section'>
          <div className='container-fluid'>
            <div className='row'>
              <div className='col-md-8'>
                <div className='playearn_big_lft desktopview'>
                  <div className='playearn_big_lft_cnt'>
                    <h2>PLAY & EARN BIG</h2>
                    <p>Daily rewards, instant wins aur non-stop fun.</p>
                    <Link to="/game"><button type="button" className='playearn_btn'>Start Playing</button></Link>
                  </div>
                  <div className='playearn_big_rgt'>
                    <img loading="lazy" src="images/golden_treasure.png" alt="PLAY & EARN BIG" />
                  </div>
                </div>
              </div>
              <div className='col-md-4 desktopview'>
                <div className='gameright_s d-flex'>

                  <div className='gameright_s_item luckstarts'>
                    <div className='gameright_s_item_cnt'>
                      <h4>YOUR LUCK
                        STARTS HERE</h4>
                      <p>Exclusive games. Real rewards. Zero boredom.</p>
                    </div>
                    <div className='gameright_s_item_img'>
                      <img loading="lazy" src="images/luxury_casino.png" alt="YOUR LUCK STARTS HERE" />
                    </div>
                  </div>

                  <div className='gameright_s_item rewardsbg'>
                    <div className='gameright_s_item_cnt'>
                      <h4>TURN FUN INTO REWARDS</h4>
                      <p>Spin, play, and unlock exciting prizes every day.</p>
                    </div>
                    <div className='gameright_s_item_img'>
                      <img loading="lazy" src="images/3d_gift_box.png" alt="TURN FUN INTO REWARDS" />
                    </div>
                  </div>

                </div>
              </div>

              <div className='col-md-3 desktopview'>
                <Link to="/casino" className='gameright_s_item height0 casinozone_s link_plain_block'>
                  <div className='gameright_s_item_cnt'>
                    <h4>Casino Zone</h4>
                    <p>Slots, cards & instant win games</p>
                  </div>
                  <div className='gameright_s_item_img'>
                    <img loading="lazy" src="images/3d_casino_games.png" alt="Casino Zone" />
                  </div>
                </Link>

              </div>

              <div className='col-md-3 desktopview'>
                <Link to="/sports" className='gameright_s_item height0 sportsbg2 link_plain_block'>
                  <div className='gameright_s_item_cnt'>
                    <h4>Sports Arena</h4>
                    <p>Live matches & smart predictions</p>
                  </div>
                  <div className='gameright_s_item_img'>
                    <img loading="lazy" src="images/astronaut_spacesuit.png" alt="Sports Arena" />
                  </div>
                </Link>

              </div>

              <div className='col-md-3 desktopview'>
                <Link to="/rank" className='gameright_s_item height0 rewardsbg2 link_plain_block'>
                  <div className='gameright_s_item_cnt'>
                    <h4>Daily Rewards</h4>
                    <p>Log in daily and unlock exciting gifts.</p>
                  </div>
                  <div className='gameright_s_item_img'>
                    <img loading="lazy" src="images/3d_gift_box_isolated.png" alt="Daily Rewards" />
                  </div>
                </Link>

              </div>


              <div className='col-md-3 desktopview'>
                <Link to="/rank" className='gameright_s_item height0 battlebg link_plain_block'>
                  <div className='gameright_s_item_cnt'>
                    <h4>Battle Mode</h4>
                    <p>Compete with others and climb the leaderboard.</p>
                  </div>
                  <div className='gameright_s_item_img'>
                    <img loading="lazy" src="images/alien_head.png" alt="Battle Mode" />
                  </div>
                </Link>

              </div>

            </div>
          </div>
        </div> */}


        <div className="top_match_section sportsmatch_s cricket_matches_section">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <div className="sports_grid_title">
                <img src="images/menu-icon19.svg" alt="" className="sports_grid_icon" />
                <Link to="/sports" className="link_plain"><h2 className="heading_h2 link_plain">Cricket Matches</h2></Link>
              </div>

              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to="/sports"><button type="button" className="slotbtn">Go to Sports</button></Link>
              </div>
            </div>

            <div className="sports_grid_section sports_grid_section_landing">

              <div className="sports_grid_table_wrap desktop_view">
                <div className="sports_grid_desktop_layout">
                  {topMatchesLoading && topMatchesFromApi.length === 0 ? (
                    <div className="sports_grid_loading sports_grid_desktop_fullbleed">Loading cricket matches...</div>
                  ) : topMatchesByDay.length === 0 ? (
                    <div className="sports_grid_empty sports_grid_desktop_fullbleed">No matches at the moment.</div>
                  ) : (
                    topMatchesByDay.map(({ day, matches }) =>
                      matches.map((match, idx) => {
                        const oddsPayload = match.gameId ? topMatchesOddsByGameId[match.gameId] : null;
                        const cardOdds = getLandingCardOddsTriples(match, oddsPayload);
                        return (
                          <div
                            key={match.eventId ?? match.gameId ?? `${day}-${idx}`}
                            className="sports_grid_row sports_grid_desktop_row two_column_row"
                            role="row"
                            onClick={(e) => handleTopMatchRowClick(e, match)}
                          >
                            <div className="leftside_matchlist">
                              <DesktopTopMatchBlock match={match} oddsPayload={oddsPayload} />
                            </div>
                            <div
                              className="rightside_odds"
                              ref={(node) => registerLandingOddsScrollRef(getOddsScrollKey('cricket', match, day, idx), node)}
                              onScroll={(e) => syncLandingOddsScroll(getOddsScrollKey('cricket', match, day, idx), e.currentTarget.scrollLeft)}
                            >
                              <div className="sports_grid_odds_columns sports_grid_desktop_odds_strip">
                              {[0, 1, 2].map((i) => {
                                const pair = cardOdds[i];
                                const disabledClass = !pair ? 'sports_grid_odds_disabled' : '';
                                return (
                                  <div key={i} className="sports_grid_odds_column">
                                    <div className={`sports_grid_odds_cell sports_grid_back odds_col_back ${disabledClass}`}>
                                      {pair ? (
                                        <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); handleTopMatchRowClick(e, match); }}>
                                          <span className="sports_grid_odds_val">{pair.back}</span>
                                          <span className="sports_grid_odds_size">{pair.sizeFormatted}</span>
                                        </button>
                                      ) : (
                                        <span className="sports_grid_odds_dash sports_grid_desktop_odds_dash">-</span>
                                      )}
                                    </div>
                                    <div className={`sports_grid_odds_cell sports_grid_lay odds_col_lay ${disabledClass}`}>
                                      {pair ? (
                                        <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); handleTopMatchRowClick(e, match); }}>
                                          <span className="sports_grid_odds_val">{pair.lay}</span>
                                          <span className="sports_grid_odds_size">{pair.sizeFormatted}</span>
                                        </button>
                                      ) : (
                                        <span className="sports_grid_odds_dash sports_grid_desktop_odds_dash">-</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tennis Matches – same layout as Cricket */}
        <div className="top_match_section sportsmatch_s cricket_matches_section">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <div className="sports_grid_title">
                <img src="images/menu-icon20.svg" alt="" className="sports_grid_icon" />
                <Link to="/sports" className="link_plain"><h2 className="heading_h2 link_plain">Tennis Matches</h2></Link>
              </div>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to="/sports"><button type="button" className="slotbtn">Go to Sports</button></Link>
              </div>
            </div>
            <div className="sports_grid_section sports_grid_section_landing">
              <div className="sports_grid_table_wrap desktop_view">
                <div className="sports_grid_desktop_layout">
                  {topTennisMatchesLoading && topTennisMatchesFromApi.length === 0 ? (
                    <div className="sports_grid_loading sports_grid_desktop_fullbleed">Loading tennis matches...</div>
                  ) : topTennisMatchesByDay.length === 0 ? (
                    <div className="sports_grid_empty sports_grid_desktop_fullbleed">No matches at the moment.</div>
                  ) : (
                    topTennisMatchesByDay.map(({ day, matches }) =>
                      matches.map((match, idx) => {
                        const oddsId = match.gameId ?? match.eventId;
                        const oddsPayload = oddsId ? topTennisMatchesOddsByGameId[oddsId] : null;
                        const cardOdds = getLandingCardOddsTriples(match, oddsPayload);
                        return (
                          <div
                            key={match.eventId ?? match.gameId ?? `${day}-${idx}`}
                            className="sports_grid_row sports_grid_desktop_row two_column_row"
                            role="row"
                            onClick={(e) => handleTopTennisMatchRowClick(e, match)}
                          >
                            <div className="leftside_matchlist">
                              <DesktopTopMatchBlock match={match} oddsPayload={oddsPayload} />
                            </div>
                            <div
                              className="rightside_odds"
                              ref={(node) => registerLandingOddsScrollRef(getOddsScrollKey('tennis', match, day, idx), node)}
                              onScroll={(e) => syncLandingOddsScroll(getOddsScrollKey('tennis', match, day, idx), e.currentTarget.scrollLeft)}
                            >
                              <div className="sports_grid_odds_columns sports_grid_desktop_odds_strip">
                              {[0, 1, 2].map((i) => {
                                const pair = cardOdds[i];
                                const disabledClass = !pair ? 'sports_grid_odds_disabled' : '';
                                return (
                                  <div key={i} className="sports_grid_odds_column">
                                    <div className={`sports_grid_odds_cell sports_grid_back odds_col_back ${disabledClass}`}>
                                      {pair ? (
                                        <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); handleTopTennisMatchRowClick(e, match); }}>
                                          <span className="sports_grid_odds_val">{pair.back}</span>
                                          <span className="sports_grid_odds_size">{pair.sizeFormatted}</span>
                                        </button>
                                      ) : (
                                        <span className="sports_grid_odds_dash sports_grid_desktop_odds_dash">-</span>
                                      )}
                                    </div>
                                    <div className={`sports_grid_odds_cell sports_grid_lay odds_col_lay ${disabledClass}`}>
                                      {pair ? (
                                        <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); handleTopTennisMatchRowClick(e, match); }}>
                                          <span className="sports_grid_odds_val">{pair.lay}</span>
                                          <span className="sports_grid_odds_size">{pair.sizeFormatted}</span>
                                        </button>
                                      ) : (
                                        <span className="sports_grid_odds_dash sports_grid_desktop_odds_dash">-</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Football (Soccer) Matches – same layout as Cricket */}
        <div className="top_match_section sportsmatch_s cricket_matches_section">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <div className="sports_grid_title">
                <i className="ri-football-line sports_grid_icon" style={{ fontSize: '1.5rem' }} aria-hidden />
                <Link to="/sports" className="link_plain"><h2 className="heading_h2 link_plain">Football Matches</h2></Link>
              </div>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to="/sports"><button type="button" className="slotbtn">Go to Sports</button></Link>
              </div>
            </div>
            <div className="sports_grid_section sports_grid_section_landing">
              <div className="sports_grid_table_wrap desktop_view">
                <div className="sports_grid_desktop_layout">
                  {topSoccerMatchesLoading && topSoccerMatchesFromApi.length === 0 ? (
                    <div className="sports_grid_loading sports_grid_desktop_fullbleed">Loading football matches...</div>
                  ) : topSoccerMatchesByDay.length === 0 ? (
                    <div className="sports_grid_empty sports_grid_desktop_fullbleed">No matches at the moment.</div>
                  ) : (
                    topSoccerMatchesByDay.map(({ day, matches }) =>
                      matches.map((match, idx) => {
                        const oddsPayload = match.gameId ? topSoccerMatchesOddsByGameId[match.gameId] : null;
                        const cardOdds = getLandingCardOddsTriples(match, oddsPayload);
                        return (
                          <div
                            key={match.eventId ?? match.gameId ?? `${day}-${idx}`}
                            className="sports_grid_row sports_grid_desktop_row two_column_row"
                            role="row"
                            onClick={(e) => handleTopSoccerMatchRowClick(e, match)}
                          >
                            <div className="leftside_matchlist">
                              <DesktopTopMatchBlock match={match} oddsPayload={oddsPayload} />
                            </div>
                            <div
                              className="rightside_odds"
                              ref={(node) => registerLandingOddsScrollRef(getOddsScrollKey('soccer', match, day, idx), node)}
                              onScroll={(e) => syncLandingOddsScroll(getOddsScrollKey('soccer', match, day, idx), e.currentTarget.scrollLeft)}
                            >
                              <div className="sports_grid_odds_columns sports_grid_desktop_odds_strip">
                              {[0, 1, 2].map((i) => {
                                const pair = cardOdds[i];
                                const disabledClass = !pair ? 'sports_grid_odds_disabled' : '';
                                return (
                                  <div key={i} className="sports_grid_odds_column">
                                    <div className={`sports_grid_odds_cell sports_grid_back odds_col_back ${disabledClass}`}>
                                      {pair ? (
                                        <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); handleTopSoccerMatchRowClick(e, match); }}>
                                          <span className="sports_grid_odds_val">{pair.back}</span>
                                          <span className="sports_grid_odds_size">{pair.sizeFormatted}</span>
                                        </button>
                                      ) : (
                                        <span className="sports_grid_odds_dash sports_grid_desktop_odds_dash">-</span>
                                      )}
                                    </div>
                                    <div className={`sports_grid_odds_cell sports_grid_lay odds_col_lay ${disabledClass}`}>
                                      {pair ? (
                                        <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); handleTopSoccerMatchRowClick(e, match); }}>
                                          <span className="sports_grid_odds_val">{pair.lay}</span>
                                          <span className="sports_grid_odds_size">{pair.sizeFormatted}</span>
                                        </button>
                                      ) : (
                                        <span className="sports_grid_odds_dash sports_grid_desktop_odds_dash">-</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div className='container-fluid support_help_container'>
          <div className='support_help_card'>
            <i className='ri-customer-service-2-fill support_help_card_icon' aria-hidden="true" />
            <p className='support_help_card_text'>Need help? Our 24/7 support is here for you.</p>
          </div>
        </div> */}

        <div className="p_space_footer landing_footer_section desktopview">
          <div className="d-flex topfooter">
            <div className="secure_img">
              <img src="/images/secure.png" alt="game" width="80" height="40" decoding="async" loading="lazy" />
            </div>
            <div className="safe_cnt">
              <h5>Secure &amp; Private</h5>
              <p>Your data is protected with encryption. Bet and play with a secure, private connection.</p>
            </div>
          </div>
          {/* <div className="footer_description_container">
            <div
              className={`footer_description_content crownbet_content ${showMore ? 'footer_description_content_expanded' : ''}`}
            >
              <h2 className="crownbet_title">Sports Betting at CrownBet</h2>
              <p>CrownBet is a modern sports betting platform where you can wager on thousands of sports events across global markets. Live odds, pre-match options, fast payouts, and a seamless betting experience — that’s what you get here.</p>
              <p>Whether you follow cricket, football, basketball, or MMA, we cover it all. You can also explore esports tournaments happening around the clock. The platform operates 24/7, so there’s always something to bet on.</p>

              <h3 className="crownbet_heading">Why Choose CrownBet?</h3>
              <p>Online sports betting should be fast, secure, and easy to use. CrownBet is designed to deliver a smooth experience from deposit to withdrawal.</p>
              <ul className="crownbet_list crownbet_list_bullet">
                <li><strong>Fast Processing:</strong> Quick deposits and efficient withdrawals</li>
                <li><strong>Secure Platform:</strong> Advanced protection for user data and funds</li>
                <li><strong>Competitive Odds:</strong> Strong pricing across major sports markets</li>
                <li><strong>Wide Coverage:</strong> Thousands of events daily</li>
                <li><strong>Mobile Friendly:</strong> Fully optimized for all devices</li>
              </ul>
              <p>The platform keeps everything straightforward so you can focus on the game.</p>

              <h3 className="crownbet_heading">Sports You Can Bet On</h3>
              <p>CrownBet covers major international and regional competitions across multiple sports.</p>
              <p>Cricket fans can follow tournaments like the Indian Premier League and global events such as the ICC Cricket World Cup.</p>
              <p>Football bettors can explore top leagues including the Premier League, La Liga, and Serie A.</p>
              <p>American sports are also available, with coverage of the NBA, NFL, and more.</p>
              <p>Combat sports, tennis tournaments, and horse racing markets are also part of the lineup.</p>

              <h3 className="crownbet_heading">Esports Betting</h3>
              <p>Esports continues to grow worldwide, and CrownBet offers markets on major competitive gaming tournaments.</p>
              <ul className="crownbet_list crownbet_list_dash">
                <li><strong>Dota 2</strong> – International tournaments and pro circuits</li>
                <li><strong>Counter-Strike 2</strong> – Major championships and league events</li>
                <li><strong>League of Legends</strong> – Global and regional competitions</li>
                <li><strong>StarCraft II</strong> – International competitive events</li>
              </ul>
              <p>With tournaments happening across different regions, esports betting markets remain active throughout the day.</p>

              <h3 className="crownbet_heading">Virtual Sports Betting</h3>
              <p>Virtual sports provide fast-paced action when live matches aren’t available. These simulated events deliver quick results and run 24/7.</p>
              <p>Options include virtual football, basketball, and other popular formats designed for short-session entertainment.</p>

              <h3 className="crownbet_heading">Understanding Betting Markets</h3>
              <p>If you're new to sports betting, here’s how the main bet types work:</p>

              <div className="crownbet_table_wrap">
                <table className="crownbet_table">
                  <thead>
                    <tr>
                      <th>Market Type</th>
                      <th>What It Means</th>
                      <th>Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Match Winner</td><td>Pick who wins the match</td><td>Team A to beat Team B</td></tr>
                    <tr><td>Handicap</td><td>Adjusted margin betting</td><td>Team A -1.5</td></tr>
                    <tr><td>Over/Under</td><td>Total score above or below a line</td><td>Over 2.5 goals</td></tr>
                    <tr><td>1X2</td><td>Home win, draw, or away win</td><td>Common in football</td></tr>
                    <tr><td>Prop Bets</td><td>Specific in-game events</td><td>First goalscorer</td></tr>
                    <tr><td>Futures</td><td>Long-term outcomes</td><td>Tournament winner</td></tr>
                  </tbody>
                </table>
              </div>

              <p>Live betting allows you to place wagers while matches are in progress, with odds updating in real time.</p>

              <h3 className="crownbet_heading">How to Start Betting</h3>
              <ol className="crownbet_list crownbet_list_numbered">
                <li>Create an account</li>
                <li>Add funds to your balance</li>
                <li>Browse sports and select an event</li>
                <li>Add selections to your bet slip</li>
                <li>Enter your stake and confirm</li>
              </ol>
              <p>Single bets are simple and straightforward, while accumulator bets combine multiple selections for higher potential returns.</p>

              <h3 className="crownbet_heading">Bonuses and Promotions</h3>
              <p>CrownBet offers regular promotions to enhance your experience:</p>
              <ul className="crownbet_list crownbet_list_tick">
                <li>Welcome bonuses</li>
                <li>Reload offers</li>
                <li>Cashback promotions</li>
                <li>Special event boosts</li>
              </ul>
              <p>Check the promotions page regularly for the latest offers.</p>

              <h3 className="crownbet_heading">Smart Betting Tips</h3>
              <ul className="crownbet_list crownbet_list_tick">
                <li>Focus on sports you understand well</li>
                <li>Manage your bankroll carefully</li>
                <li>Start with smaller stakes</li>
                <li>Avoid emotional betting decisions</li>
                <li>Analyze live odds before placing in-play bets</li>
              </ul>

              <h3 className="crownbet_heading">Why CrownBet Stands Out</h3>
              <ul className="crownbet_list crownbet_list_tick">
                <li>Wide variety of sports and markets</li>
                <li>Fast and reliable payouts</li>
                <li>Secure and user-friendly interface</li>
                <li>24/7 customer support</li>
                <li>Optimized for desktop and mobile</li>
              </ul>

              <h3 className="crownbet_heading">Final Thoughts</h3>
              <p>CrownBet delivers a complete online sports betting experience with strong market coverage, competitive odds, and a smooth interface.</p>
              <p>From cricket and football to esports and virtual sports, the platform ensures continuous betting opportunities throughout the day. Always bet responsibly and make informed decisions.</p>
            </div>
            <button
              type="button"
              className="footer_show_more_btn"
              onClick={() => setShowMore((prev) => !prev)}
              aria-expanded={showMore}
            >
              {showMore ? 'Show Less' : 'Show More'}
              <i className={showMore ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
            </button>
          </div> */}
        </div>
      </div>

      <Suspense fallback={null}>
        <Footer />
        <MobileMenu />
      </Suspense>
    </>
  )
}

export default LandingPage;

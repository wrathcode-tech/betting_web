import React, { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthService from '../api/services/AuthService'
import {
  connectSportsbookSocket,
  subscribeMatches,
  unsubscribeMatches,
  subscribeOdds,
  unsubscribeOdds,
  addMatchesListener,
  removeMatchesListener,
  addOddsListener,
  removeOddsListener,
} from '../socket/sportsbookSocket'
import '../customComponents/Footer.css'
import '../sports/sportsGame.css'

const Footer = lazy(() => import('../customComponents/footer'));

const MAX_SLIDER_ITEMS = 15
const MAX_CONTENT_BEFORE_VIEW_ALL = MAX_SLIDER_ITEMS - 1

const gameItems = [
  { id: 1, badge: 'Top', image: 'images/game_itemslider.png' },
  { id: 2, badge: null, image: 'images/game_itemslider2.png' },
  { id: 3, badge: 'Top', image: 'images/game_itemslider3.png' },
  { id: 4, badge: null, image: 'images/game_itemslider4.png' },
  { id: 5, badge: 'Hot', image: 'images/game_itemslider5.png' },
  { id: 6, badge: null, image: 'images/game_itemslider6.png' },
  { id: 7, badge: null, image: 'images/game_itemslider7.png' },
  { id: 8, badge: null, image: 'images/game_itemslider4.png' },
]
const betCasinoItems = [
  { id: 1, badge: 'Top', image: 'images/betcasino_img.png' },
  { id: 2, badge: null, image: 'images/betcasino_img2.png' },
  { id: 3, badge: 'Top', image: 'images/betcasino_img3.png' },
  { id: 4, badge: null, image: 'images/betcasino_img4.png' },
  { id: 5, badge: 'Hot', image: 'images/betcasino_img5.png' },
  { id: 6, badge: null, image: 'images/betcasino_img6.png' },
  { id: 7, badge: null, image: 'images/betcasino_img7.png' },
  { id: 8, badge: null, image: 'images/betcasino_img3.png' },
]
const liveCasinoItems = [
  { id: 1, icon: 'worldicon', image: 'images/casino_gallery_img.png' },
  { id: 2, icon: null, image: 'images/casino_gallery_img2.png' },
  { id: 3, icon: 'worldicon', image: 'images/casino_gallery_img3.png' },
  { id: 4, icon: null, image: 'images/casino_gallery_img4.png' },
  { id: 5, icon: 'worldicon', image: 'images/casino_gallery_img5.png' },
  { id: 6, icon: null, image: 'images/casino_gallery_img6.png' },
  { id: 7, icon: null, image: 'images/casino_gallery_img7.png' },
  { id: 8, icon: null, image: 'images/casino_gallery_img3.png' },
]
const highrollerItems = [
  { id: 1, icon: 'worldicon', image: 'images/highroller_gallery_img.png' },
  { id: 2, icon: null, image: 'images/highroller_gallery_img2.png' },
  { id: 3, icon: 'worldicon', image: 'images/highroller_gallery_img3.png' },
  { id: 4, icon: null, image: 'images/highroller_gallery_img4.png' },
  { id: 5, icon: 'worldicon', image: 'images/highroller_gallery_img5.png' },
  { id: 6, icon: null, image: 'images/highroller_gallery_img6.png' },
  { id: 7, icon: null, image: 'images/highroller_gallery_img7.png' },
  { id: 8, icon: null, image: 'images/highroller_gallery_img2.png' },
]
// TOP Sports: 15 sports from design. Cricket first; Cricket -> /sports, rest -> /sportsbook. White outline icons.
const topSportsItems = [
  { id: 1, title: 'Cricket', icon: 'menu-icon19.svg', to: '/sports' },
  { id: 2, title: 'Soccer', iconClass: 'ri-football-line', to: '/sportsbook' },
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
function parseMatchesFromResponse(res) {
  if (!res) return []
  if (Array.isArray(res)) return res
  const raw = res.data ?? res
  const d = raw?.data ?? raw
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.data)) return d.data
  if (Array.isArray(d?.matches)) return d.matches
  if (Array.isArray(raw?.matches)) return raw.matches
  return []
}

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

const MARKET_ICONS = ['MC', 'BM', 'P', 'D', 'F']

function toOddDatasArray(oddDatas) {
  if (!oddDatas) return []
  if (Array.isArray(oddDatas)) return oddDatas
  if (typeof oddDatas === 'object') return Object.values(oddDatas).filter(Boolean)
  return []
}

function formatOddsSize(size) {
  if (size == null || size === '') return '0.00'
  const n = Number(size)
  if (!Number.isFinite(n)) return String(size)
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 2)}K`
  return n % 1 === 0 ? String(n) : n.toFixed(2)
}

function LandingPage() {
  // TOP SLOTS slider state
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);
  const betCasinoSliderRef = useRef(null);
  const liveCasinoSliderRef = useRef(null);
  const highrollerSliderRef = useRef(null);
  const topSportsSliderRef = useRef(null);

  const [betCasinoIndex, setBetCasinoIndex] = useState(0);
  const [liveCasinoIndex, setLiveCasinoIndex] = useState(0);
  const [highrollerIndex, setHighrollerIndex] = useState(0);
  const [topSportsIndex, setTopSportsIndex] = useState(0);

  // TOP Matches from API (cricket) + socket for live updates
  const [topMatchesFromApi, setTopMatchesFromApi] = useState([]);
  const [topMatchesLoading, setTopMatchesLoading] = useState(true);
  const [topMatchesOddsByGameId, setTopMatchesOddsByGameId] = useState({});
  const topMatchesOddsSubscribedRef = useRef(new Set());

  // Landing API games (liveCasino, slots, trending, roulette, cardGames)
  const [landingGames, setLandingGames] = useState({
    liveCasino: [], slots: [], trending: [], roulette: [], cardGames: [],
  });
  const [landingGamesLoading, setLandingGamesLoading] = useState(true);
  const landingLiveCasinoRef = useRef(null);
  const landingSlotsRef = useRef(null);
  const landingTrendingRef = useRef(null);
  const landingRouletteRef = useRef(null);
  const landingCardGamesRef = useRef(null);
  const lobbySliderRef = useRef(null);
  const [landingLiveCasinoIndex, setLandingLiveCasinoIndex] = useState(0);
  const [landingSlotsIndex, setLandingSlotsIndex] = useState(0);
  const [landingTrendingIndex, setLandingTrendingIndex] = useState(0);
  const [landingRouletteIndex, setLandingRouletteIndex] = useState(0);
  const [landingCardGamesIndex, setLandingCardGamesIndex] = useState(0);
  const [lobbySliderIndex, setLobbySliderIndex] = useState(0);

  // Casino Lobby: top 50 games from API (providerCode=EZ)
  const [casinoLobbyGames, setCasinoLobbyGames] = useState([]);
  const [casinoLobbyLoading, setCasinoLobbyLoading] = useState(true);

  const [showMore, setShowMore] = useState(false);

  // Document title when on landing page
  useEffect(() => {
    const prev = document.title;
    document.title = 'Your Ultimate Casino & Sports Gaming Hub';
    return () => { document.title = prev; };
  }, []);

  // Defer trending videos until section is in view (saves ~several MB on initial load, improves LCP)
  const [showTrendingVideos, setShowTrendingVideos] = useState(false);
  const trendingSectionRef = useRef(null);
  useEffect(() => {
    const el = trendingSectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setShowTrendingVideos(true);
      },
      { rootMargin: '200px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Fetch landing games (no auth). API returns { success, message, data: { liveCasino, slots, trending, roulette, cardGames } }
  useEffect(() => {
    let cancelled = false;
    AuthService.bettingGamesLanding()
      .then((res) => {
        if (cancelled || !res?.data) return;
        const data = res.data;
        setLandingGames({
          liveCasino: data.liveCasino || [],
          slots: data.slots || [],
          trending: data.trending || [],
          roulette: data.roulette || [],
          cardGames: data.cardGames || [],
        });
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLandingGamesLoading(false); });
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

  // Fetch TOP Matches (cricket) from API
  useEffect(() => {
    let cancelled = false;
    setTopMatchesLoading(true);
    AuthService.sportsbookMatches('cricket')
      .then((res) => {
        if (cancelled) return;
        const list = parseMatchesFromResponse(res);
        const eventTime = (m) => m.eventTime ?? m.event_time ?? m.startTime;
        const mapped = list
          .filter((m) => m.gameId ?? m.game_id)
          .map((m) => {
            const et = eventTime(m);
            return {
              id: m.gameId ?? m.game_id,
              gameId: m.gameId ?? m.game_id,
              eventId: m.eventId ?? m.event_id,
              tournament: m.seriesName ?? m.series_name ?? 'Cricket',
              teams: m.eventName ?? m.event_name ?? m.name ?? '—',
              time: formatMatchTime(et),
              eventTime: et,
              inPlay: m.inPlay ?? m.in_play ?? false,
            };
          })
          .sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0));
        setTopMatchesFromApi(mapped);
      })
      .catch(() => { if (!cancelled) setTopMatchesFromApi([]); })
      .finally(() => { if (!cancelled) setTopMatchesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Socket: live matches for TOP Matches (when user has token)
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    const eventTime = (m) => m.eventTime ?? m.event_time ?? m.startTime;
    connectSportsbookSocket(token);
    const onMatches = (payload) => {
      if (payload?.sport !== 'cricket') return;
      const raw = payload.data ?? payload.matches;
      if (raw === undefined) return;
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      const mapped = list
        .filter((m) => m.gameId ?? m.game_id)
        .map((m) => {
          const et = eventTime(m);
          return {
            id: m.gameId ?? m.game_id,
            gameId: m.gameId ?? m.game_id,
            eventId: m.eventId ?? m.event_id,
            tournament: m.seriesName ?? m.series_name ?? 'Cricket',
            teams: m.eventName ?? m.event_name ?? m.name ?? '—',
            time: formatMatchTime(et),
            eventTime: et,
            inPlay: m.inPlay ?? m.in_play ?? false,
          };
        })
        .sort((a, b) => (b.inPlay ? 1 : 0) - (a.inPlay ? 1 : 0));
      setTopMatchesFromApi((prev) => (mapped.length > 0 ? mapped : prev));
      setTopMatchesLoading(false);
    };
    addMatchesListener(onMatches);
    subscribeMatches('cricket');
    return () => {
      removeMatchesListener(onMatches);
      unsubscribeMatches('cricket');
      topMatchesOddsSubscribedRef.current.forEach((gid) => unsubscribeOdds(gid));
      topMatchesOddsSubscribedRef.current.clear();
    };
  }, []);

  // Socket: live odds for TOP Matches
  useEffect(() => {
    const onOdds = (payload) => {
      if (!payload?.gameId || payload?.data === undefined) return;
      const matchOdds = Array.isArray(payload.data?.matchOdds) ? payload.data.matchOdds : [];
      setTopMatchesOddsByGameId((prev) => ({ ...prev, [payload.gameId]: { matchOdds } }));
    };
    addOddsListener(onOdds);
    return () => removeOddsListener(onOdds);
  }, []);

  // Subscribe/unsubscribe odds for visible TOP Matches (first 15 gameIds)
  useEffect(() => {
    const gameIds = topMatchesFromApi.slice(0, 15).map((m) => m.gameId).filter(Boolean);
    const prev = topMatchesOddsSubscribedRef.current;
    gameIds.forEach((gameId) => {
      if (!prev.has(gameId)) {
        subscribeOdds(gameId);
        prev.add(gameId);
      }
    });
    prev.forEach((gameId) => {
      if (!gameIds.includes(gameId)) {
        unsubscribeOdds(gameId);
        prev.delete(gameId);
      }
    });
  }, [topMatchesFromApi]);

  // Fetch odds for first 8 TOP Matches (for back/lay display) – REST fallback when no socket
  useEffect(() => {
    const gameIds = topMatchesFromApi.slice(0, 8).map((m) => m.gameId).filter(Boolean);
    if (gameIds.length === 0) return;
    let cancelled = false;
    Promise.all(
      gameIds.map((gameId) =>
        AuthService.sportsbookOdds('cricket', gameId).then((res) => ({ gameId, res }))
      )
    ).then((results) => {
      if (cancelled) return;
      setTopMatchesOddsByGameId((prev) => {
        const next = { ...prev };
        results.forEach(({ gameId, res }) => {
          if (!res) return;
          const raw = res.data ?? res;
          const d = raw?.data ?? raw;
          const matchOdds = Array.isArray(d?.matchOdds) ? d.matchOdds : [];
          next[gameId] = { ...(next[gameId] || {}), matchOdds };
        });
        return next;
      });
    }).catch(() => { });
    return () => { cancelled = true; };
  }, [topMatchesFromApi]);

  // Hero 3D slider – 7 items, 5 visible at a time, infinite repeat
  const [hero3dIndex, setHero3dIndex] = useState(0);
  const hero3dSlides = [
    { id: 1, src: 'images/home_bnr.png', alt: 'game', heading: 'All Mini Games', subContent: 'Play More. Win Faster. Endless Fun Awaits.' },
    { id: 2, src: 'images/home_bnr2.png', alt: 'game', heading: 'Sports & Betting', subContent: 'Play Smart. Bet Big. Win with the Best Odds.' },
    { id: 3, src: 'images/home_bnr3.png', alt: 'game', heading: 'Casino', subContent: 'Play Live. Bet Bold. Win Real Rewards.' },
    { id: 4, src: 'images/home_bnr4.png', alt: 'game', heading: 'Dragon Tiger', subContent: 'Choose Your Side. Bet Fast. Win Instantly.' },
    { id: 5, src: 'images/home_bnr5.png', alt: 'game', heading: 'Aviator', subContent: 'Take Off Early. Cash Out Big. Win Smart.' },
    { id: 6, src: 'images/home_bnr6.png', alt: 'game', heading: 'Cricket', subContent: 'Level up and unlock exclusive perks.' },
    { id: 7, src: 'images/home_bnr7.png', alt: 'game', heading: 'Casino & Sports Hub', subContent: 'Bet Every Ball. Play Every Moment. Win Bigger.' },
  ];
  const hero3dTotal = hero3dSlides.length;
  const hero3dOffsets = [-2, -1, 0, 1, 2];
  const getHero3dIndex = (offset) => (hero3dIndex + offset + hero3dTotal * 10) % hero3dTotal;

  const hero3dSwipeRef = useRef({ startX: 0 });
  const handleHero3dPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const el = e.currentTarget;
    if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
    hero3dSwipeRef.current.startX = e.clientX;
  };
  const handleHero3dPointerUp = (e) => {
    const startX = hero3dSwipeRef.current.startX;
    const deltaX = e.clientX - startX;
    const THRESHOLD = 50;
    if (deltaX < -THRESHOLD) setHero3dIndex((prev) => (prev + 1) % hero3dTotal);
    else if (deltaX > THRESHOLD) setHero3dIndex((prev) => (prev === 0 ? hero3dTotal - 1 : prev - 1));
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

  const gameItems = [
    { id: 1, badge: 'Top', image: 'images/game_itemslider.png' },
    { id: 2, badge: null, image: 'images/game_itemslider2.png' },
    { id: 3, badge: 'Top', image: 'images/game_itemslider3.png' },
    { id: 4, badge: null, image: 'images/game_itemslider4.png' },
    { id: 5, badge: 'Hot', image: 'images/game_itemslider5.png' },
    { id: 6, badge: null, image: 'images/game_itemslider6.png' },
    { id: 7, badge: null, image: 'images/game_itemslider7.png' },
    { id: 8, badge: null, image: 'images/game_itemslider4.png' },
  ];

  // BetCasino Original items
  const betCasinoItems = [
    { id: 1, badge: 'Top', image: 'images/betcasino_img.png' },
    { id: 2, badge: null, image: 'images/betcasino_img2.png' },
    { id: 3, badge: 'Top', image: 'images/betcasino_img3.png' },
    { id: 4, badge: null, image: 'images/betcasino_img4.png' },
    { id: 5, badge: 'Hot', image: 'images/betcasino_img5.png' },
    { id: 6, badge: null, image: 'images/betcasino_img6.png' },
    { id: 7, badge: null, image: 'images/betcasino_img7.png' },
    { id: 8, badge: null, image: 'images/betcasino_img3.png' },
  ];

  // Trending section: 9 different videos (replace paths with your video files)
  const trendingVideos = [
    'images/freepik_create-a-bold-and-highenergy-animated-promo-video-_minimax_768p_16-9_24fps_68689.mp4',
    'images/freepik_create-a-highintensity-animated-promo-video-using-_minimax_768p_16-9_24fps_68694.mp4',
    'images/freepik_create-a-fun-and-energetic-animated-promo-video-us_kling_1080p_16-9_24fps_68693.mp4',
    'images/freepik_create-a-glamorous-and-highend-animated-promo-vide_minimax_768p_16-9_24fps_68690.mp4',
    'images/freepik_create-a-vibrant-animated-promo-video-using-this-c_kling_1080p_16-9_24fps_68692.mp4',
    'images/freepik_create-a-stylish-and-engaging-animated-promo-video_kling_1080p_16-9_24fps_68691.mp4',
  ];

  const topSlotsDisplayItems = useMemo(() => [...gameItems.slice(0, MAX_CONTENT_BEFORE_VIEW_ALL), { viewAll: true, to: '/casino' }], [])
  const betCasinoDisplayItems = useMemo(() => [...betCasinoItems.slice(0, MAX_CONTENT_BEFORE_VIEW_ALL), { viewAll: true, to: '/casino' }], [])
  const liveCasinoDisplayItems = useMemo(() => [...liveCasinoItems.slice(0, MAX_CONTENT_BEFORE_VIEW_ALL), { viewAll: true, to: '/casino' }], [])
  const highrollerDisplayItems = useMemo(() => [...highrollerItems.slice(0, MAX_CONTENT_BEFORE_VIEW_ALL), { viewAll: true, to: '/casino' }], [])
  const topSportsDisplayItems = useMemo(() => [...topSportsItems, { viewAll: true, to: '/sportsbook' }], [])

  // TOP Matches: grouped by day (Live, Today, Tomorrow, …) for table view
  const topMatchesByDay = useMemo(() => {
    const list = topMatchesFromApi.map((m) => {
      let timeOnly = '';
      if (m.eventTime) {
        try {
          const d = new Date(m.eventTime);
          if (!isNaN(d.getTime())) timeOnly = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {}
      }
      return { ...m, dayGroup: getDayGroup(m.eventTime), timeOnly };
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
  }, [topMatchesFromApi]);

  const navigate = useNavigate();
  const handleTopMatchRowClick = (e, match) => {
    if (e.target.closest('button')) return;
    if (match?.gameId) navigate('/cricket', { state: { gameId: match.gameId, eventName: match.teams, sportName: 'cricket', inPlay: match.inPlay } });
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

  const itemsPerSet = topSlotsDisplayItems.length;
  const betCasinoItemsPerSet = betCasinoDisplayItems.length;
  const liveCasinoItemsPerSet = liveCasinoDisplayItems.length;
  const highrollerItemsPerSet = highrollerDisplayItems.length;
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

  // TOP SLOTS slider – sync transform to index (clamped)
  useEffect(() => {
    const el = sliderRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -currentIndex * (178 + 18))}px)`;
  }, [currentIndex]);

  // BetCasino Original slider – sync transform to index (clamped)
  useEffect(() => {
    const el = betCasinoSliderRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -betCasinoIndex * (178 + 18))}px)`;
  }, [betCasinoIndex]);

  // Live Casino slider – sync transform to index (clamped)
  useEffect(() => {
    const el = liveCasinoSliderRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -liveCasinoIndex * (178 + 18))}px)`;
  }, [liveCasinoIndex]);

  // Highroller Hall slider – sync transform to index (clamped)
  useEffect(() => {
    const el = highrollerSliderRef.current;
    if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -highrollerIndex * (178 + 18))}px)`;
  }, [highrollerIndex]);

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
                  >
                    <Link to="/casino" className="slider3d_slide_link link_plain" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
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
                    </Link>
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
                <button type="button" className="btnbnr" onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal', { detail: 'signup' }))}>Sign Up and Play</button>
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
        <h2 className='heading_h2'>Trending Games</h2>
        <div className='game_items_video'>
          {(() => {
            const trendingCategories = ['Aviator', 'Dragon Tiger', 'Chicken Road', 'Baccarat', 'Roulette', 'Teen Patti'];
            return showTrendingVideos
              ? trendingVideos.map((src, i) => {
                const category = trendingCategories[i] ?? 'lobby';
                const to = `/casino?provider=all&category=${encodeURIComponent(category)}`;
                return (
                  <Link key={i} to={to} className='game_video_bl' style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                    <video width="100%" height="auto" autoPlay muted loop playsInline loading="lazy">
                      <source src={src} type="video/mp4" />
                    </video>
                    <span className='game_video_bl_title'>{category}</span>
                  </Link>
                );
              })
              : trendingVideos.map((_, i) => (
                <div key={i} className='game_video_bl' aria-hidden="true" />
              ));
          })()}
        </div>
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
                      <img loading="lazy" src={item.thumb} alt="game" />
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
                      <img loading="lazy" src={item.thumb} alt="game" />
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
                      <img loading="lazy" src={item.thumb} alt="game" />
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
                      <img loading="lazy" src={item.thumb} alt="game" />
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
                      <img loading="lazy" src={item.thumb} alt="game" />
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
                          <img loading="lazy" src={item.thumbnail || item.thumb || item.image} alt={item.name || 'game'} />
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
                        <img loading="lazy" src={item.thumbnail || item.thumb || item.image} alt={item.name || 'game'} />
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


        <div className="top_match_section sportsmatch_s">
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

            <div className="sports_grid_section">
             
              <div className="sports_grid_table_wrap desktop_view">
                <table className="sports_grid_table">
                  <thead>
                    <tr className="sports_grid_header_row">
                      <th className="sports_grid_match_cell">MATCH</th>
                      <th className="sports_grid_icons_cell" aria-label="Markets"><span className="sports_grid_header_markets">Markets</span></th>
                      {[0, 1, 2].map((i) => (
                        <React.Fragment key={i}>
                          <th className="sports_grid_odds_cell">Back</th>
                          <th className="sports_grid_odds_cell">Lay</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topMatchesLoading ? (
                      <tr><td colSpan={8} className="sports_grid_loading">Loading cricket matches...</td></tr>
                    ) : topMatchesByDay.length === 0 ? (
                      <tr><td colSpan={8} className="sports_grid_empty">No matches at the moment.</td></tr>
                    ) : (
                      topMatchesByDay.map(({ day, matches }) =>
                        matches.map((match, idx) => {
                          const oddsPayload = match.gameId ? topMatchesOddsByGameId[match.gameId] : null;
                          const matchOdds = oddsPayload?.matchOdds ?? [];
                          const market = matchOdds[0];
                          const oddList = market ? toOddDatasArray(market.oddDatas) : [];
                          const cardOdds = oddList.slice(0, 6).map((o) => ({
                            back: o.b1 ?? o.back ?? '—',
                            lay: o.l1 ?? o.lay ?? '—',
                            sizeFormatted: formatOddsSize(o.bs1 ?? o.ls1 ?? o.size),
                          }));
                          return (
                            <tr
                              key={match.eventId ?? match.gameId ?? `${day}-${idx}`}
                              className="sports_grid_row"
                              onClick={(e) => handleTopMatchRowClick(e, match)}
                            >
                              <td className="sports_grid_match_cell d-flex align-items-center gap-3">
                                <div className="sports_grid_match_cell_inner">
                                  <span className="sports_grid_day_time">{match.dayGroup}{match.timeOnly ? ` ${match.timeOnly}` : ''}</span>
                                  {match.inPlay && <span className="sports_grid_live">LIVE</span>}
                                </div>
                                <div className="sports_grid_match_info">
                                  <div className="sports_grid_tournament">{match.tournament}</div>
                                  <div className="sports_grid_teams">{match.teams}</div>
                                </div>
                              </td>
                              <td className="sports_grid_icons_cell">
                                <div className="sports_grid_market_icons">
                                  {MARKET_ICONS.map((icon) => (
                                    <span key={icon} className="sports_grid_market_icon">{icon}</span>
                                  ))}
                                </div>
                              </td>
                              {[0, 1, 2].map((i) => {
                                const pair = cardOdds[i];
                                const disabledClass = !pair ? 'sports_grid_odds_disabled' : '';
                                return (
                                  <React.Fragment key={i}>
                                    <td className={`sports_grid_odds_cell sports_grid_back ${disabledClass}`}>
                                      {pair ? (
                                        <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); handleTopMatchRowClick(e, match); }}>
                                          <span className="sports_grid_odds_val">{pair.back}</span>
                                          <span className="sports_grid_odds_size">{pair.sizeFormatted}</span>
                                        </button>
                                      ) : (
                                        <span className="sports_grid_odds_dash"><i className="ri-lock-line" aria-hidden /></span>
                                      )}
                                    </td>
                                    <td className={`sports_grid_odds_cell sports_grid_lay ${disabledClass}`}>
                                      {pair ? (
                                        <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); handleTopMatchRowClick(e, match); }}>
                                          <span className="sports_grid_odds_val">{pair.lay}</span>
                                          <span className="sports_grid_odds_size">{pair.sizeFormatted}</span>
                                        </button>
                                      ) : (
                                        <span className="sports_grid_odds_dash"><i className="ri-lock-line" aria-hidden /></span>
                                      )}
                                    </td>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          );
                        })
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="sports_grid_table_wrap mobile_view">
                <table className="sports_grid_table sports_grid_table_mobile">
                  <thead>
                    <tr className="sports_grid_header_row">
                      <th className="sports_grid_match_cell">MATCH</th>
                      <th className="sports_grid_mobile_backs_header">Back</th>
                      <th className="sports_grid_mobile_lays_header">Lay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMatchesLoading ? (
                      <tr><td colSpan={3} className="sports_grid_loading">Loading cricket matches...</td></tr>
                    ) : topMatchesByDay.length === 0 ? (
                      <tr><td colSpan={3} className="sports_grid_empty">No matches at the moment.</td></tr>
                    ) : (
                      topMatchesByDay.map(({ day, matches }) =>
                        matches.map((match, idx) => {
                          const oddsPayload = match.gameId ? topMatchesOddsByGameId[match.gameId] : null;
                          const matchOdds = oddsPayload?.matchOdds ?? [];
                          const market = matchOdds[0];
                          const oddList = market ? toOddDatasArray(market.oddDatas) : [];
                          const cardOdds = oddList.slice(0, 6).map((o) => ({
                            back: o.b1 ?? o.back ?? '—',
                            lay: o.l1 ?? o.lay ?? '—',
                            sizeFormatted: formatOddsSize(o.bs1 ?? o.ls1 ?? o.size),
                          }));
                          const padTo3 = (arr) => { const a = [...arr]; while (a.length < 3) a.push(null); return a.slice(0, 3); };
                          const sortByBack = (a, b) => { const na = a ? parseFloat(a.back) : NaN; const nb = b ? parseFloat(b.back) : NaN; if (Number.isNaN(na) && Number.isNaN(nb)) return 0; if (Number.isNaN(na)) return 1; if (Number.isNaN(nb)) return -1; return na - nb; };
                          const sortByLay = (a, b) => { const na = a ? parseFloat(a.lay) : NaN; const nb = b ? parseFloat(b.lay) : NaN; if (Number.isNaN(na) && Number.isNaN(nb)) return 0; if (Number.isNaN(na)) return 1; if (Number.isNaN(nb)) return -1; return na - nb; };
                          const backSorted = padTo3([...cardOdds].sort(sortByBack));
                          const laySorted = padTo3([...cardOdds].sort(sortByLay));
                          return (
                            <tr
                              key={match.eventId ?? match.gameId ?? `${day}-${idx}`}
                              className="sports_grid_row"
                              onClick={(e) => handleTopMatchRowClick(e, match)}
                            >
                              <td className="sports_grid_match_cell d-flex align-items-center gap-3">
                                <div className="sports_grid_match_cell_inner">
                                  <span className="sports_grid_day_time">{match.dayGroup}{match.timeOnly && <span className="sports_grid_time_only"> {match.timeOnly}</span>}</span>
                                  {match.inPlay && <span className="sports_grid_live">LIVE</span>}
                                </div>
                                <div className="sports_grid_match_info">
                                  <div className="sports_grid_teams">{match.teams}</div>
                                </div>
                              </td>
                              <td className="sports_grid_mobile_backs_cell">
                                <div className="sports_grid_mobile_odds_list">
                                  {backSorted.map((pair, i) => (
                                    <div key={i} className={`sports_grid_mobile_odds_item sports_grid_back ${!pair ? 'sports_grid_odds_disabled' : ''}`}>
                                      {pair ? (
                                        <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); handleTopMatchRowClick(e, match); }}>
                                          <span className="sports_grid_odds_val">{pair.back}</span>
                                          <span className="sports_grid_odds_size">{pair.sizeFormatted}</span>
                                        </button>
                                      ) : (
                                        <span className="sports_grid_odds_dash"><i className="ri-lock-line" aria-hidden /></span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="sports_grid_mobile_lays_cell">
                                <div className="sports_grid_mobile_odds_list">
                                  {laySorted.map((pair, i) => (
                                    <div key={i} className={`sports_grid_mobile_odds_item sports_grid_lay ${!pair ? 'sports_grid_odds_disabled' : ''}`}>
                                      {pair ? (
                                        <button type="button" className="sports_grid_odds_btn" onClick={(e) => { e.stopPropagation(); handleTopMatchRowClick(e, match); }}>
                                          <span className="sports_grid_odds_val">{pair.lay}</span>
                                          <span className="sports_grid_odds_size">{pair.sizeFormatted}</span>
                                        </button>
                                      ) : (
                                        <span className="sports_grid_odds_dash"><i className="ri-lock-line" aria-hidden /></span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>





        <div className='container-fluid support_help_container'>
          <div className='support_help_card'>
            <i className='ri-customer-service-2-fill support_help_card_icon' aria-hidden="true" />
            <p className='support_help_card_text'>Need help? Our 24/7 support is here for you.</p>
          </div>
        </div>

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
      </Suspense>
    </>
  )
}

export default LandingPage;

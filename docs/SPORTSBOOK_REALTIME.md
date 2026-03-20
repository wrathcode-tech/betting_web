# Sportsbook realtime architecture (frontend)

This project is **JavaScript + React** (not TypeScript). The following mirrors the “high-performance consumer” spec using the same patterns.

## 1. Socket singleton — `src/socket/sportsbookSocket.js`

- One Socket.IO connection to `/sportsbook`.
- **Reference-counted** `subscribeMatches` / `subscribeOdds` / `subscribeScoreboard` (safe with React Strict Mode).
- **Re-subscribe** all active streams on `connect` / `reconnect`.
- **Dedupes** identical `matches` / `odds` / `scoreboard` payloads (prefers `timestamp` from server).
- `reconnectionAttempts: Infinity` with delay capped by `reconnectionDelayMax`.

Debug: `getSportsbookSubscriptionStats()`.

## 2. Normalized store — `src/stores/sportsbookRealtimeStore.js`

- `matchesBySport`, `oddsByGameId`, `scoreboardByGameId`.
- Updates keep **unchanged branch references** so `useSyncExternalStore` subscribers only re-render when their slice changes.
- `patchOddsIfChanged` / `mergeMatchesForSportIfChanged` skip work when signature unchanged.

## 3. Hooks

| File | Role |
|------|------|
| `src/hooks/useSportsbookSocket.js` | Connect + reconnect on `loginStateChange` |
| `src/hooks/useMatchesStream.js` | REST first → `subscribe:matches` → store |
| `src/hooks/useOddsStream.js` | REST hydrate → `subscribe:odds` (+ optional scoreboard) → store; REST **stale fallback** if no socket activity |

## 4. UI building blocks — `src/sportsbook/`

- `MatchListRow.js` — `React.memo` row shell.
- `OddsLadder.js` — `React.memo` 3× (back/lay); locked state when missing.

## 5. Integration status

- **In use:** socket manager powers existing pages (`SportsGame`, `LandingPage`, `CricketDetail`, `useSportsbook`).
- **Ready to adopt:** `useMatchesStream`, `useOddsStream`, store, `OddsLadder`, `MatchListRow` for gradual migration (replace local `useState` odds maps with store + selectors).

## 6. Rules (checklist)

- Do **not** open multiple connections — always `connectSportsbookSocket`.
- Match list page: **`subscribe:matches` only**; odds only for visible/detail flows (see `SportsGame` active-tab odds cap).
- Prefer **incremental** store patches over replacing full lists on each tick.

## 7. TypeScript / Zustand

If you migrate to TypeScript + Zustand, mirror:

- `sportsbookSocket.ts` ← copy API from `sportsbookSocket.js`
- Store slices ← same shape as `sportsbookRealtimeStore.js`

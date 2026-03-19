# Frontend Socket.IO Audit Report

## 1. BUG LIST

| # | Issue | Root cause | Fix |
|---|--------|------------|-----|
| 1 | Demo user connected to balance socket | BalanceContext connected balance socket for any token; backend rejects demo token for balance | BalanceContext uses `useAuth().isDemo`; calls `connectBalanceSocket(token)` only when `token && !isDemo`; otherwise `disconnectBalanceSocket()` |
| 2 | Stale lastBalance after logout | balanceSocket did not clear `lastBalance` on disconnect | In `disconnectBalanceSocket()` and in socket `disconnect` handler set `lastBalance = null` |
| 3 | Sportsbook socket not used as guest | CricketDetail and useSportsbook required token and returned early, so guests had no real-time matches/odds | Removed `if (!token) return`; call `connectSportsbookSocket(getToken() \|\| null)` so guest connects with `auth: {}` |
| 4 | Odds payload not parsed safely | Direct use of `payload.data` and `marketClosed === true` could crash or mis-handle missing fields | CricketDetail `normalizeOdds`: `matchOdds = d?.matchOdds ?? []`, `marketClosed = d?.marketClosed ?? true`. useSportsbookOdds: build `safe` with `matchOdds`, `bookMakerOdds`, `fancyOdds`, `marketClosed` defaults before merging |
| 5 | No subscription limit | Backend expects ≤20 subscriptions per socket | `getTotalSubscriptionCount()`; `MAX_SUBSCRIPTIONS = 20`; in `subscribeMatches`, `subscribeOdds`, `subscribeScoreboard` return early if at limit |
| 6 | RATE_LIMIT error not handled | Socket `error` event was forwarded but not specially handled | In sportsbookSocket `error` handler detect `code === 'RATE_LIMIT'` or message contains `RATE_LIMIT` and log (consumers can addErrorListener for UX) |
| 7 | SportsGame required token for socket | Same as #3 for SportsGame | Call `connectSportsbookSocket(getToken() \|\| null)` and remove `if (!token) return` |

---

## 2. CODE FIXES (summary)

### balanceSocket.js
- **disconnectBalanceSocket()**: Set `lastBalance = null` before clearing listeners.
- **disconnect handler**: Set `lastBalance = null` so getLastBalance() is not stale after disconnect.

### sportsbookSocket.js
- **getTotalSubscriptionCount()**: Returns `subscribedSports.size + subscribedOddsMap.size + subscribedScoreboardMap.size`.
- **MAX_SUBSCRIPTIONS = 20**: subscribeMatches, subscribeOdds, subscribeScoreboard return without adding if `getTotalSubscriptionCount() >= MAX_SUBSCRIPTIONS`.
- **error handler**: If `err?.code === 'RATE_LIMIT'` or message includes `RATE_LIMIT`, log warning; still forward to errorListeners.

### BalanceContext.js
- Import **useAuth**.
- **isDemo** from useAuth().
- When `token` exists: if **!isDemo** call `connectBalanceSocket(token)`, else `disconnectBalanceSocket()`.
- Always call `connectSportsbookSocket(token)` when token exists (guest/demo/user).
- Effect dependency array includes **isDemo**.

### CricketDetail.js
- **Matches socket effect**: `connectSportsbookSocket(getToken() || null)`; removed `if (!token) return`.
- **Odds socket effect**: Same; removed token check.
- **normalizeOdds**: `matchOdds = d?.matchOdds ?? d?.match_odds ?? []` (then ensure array); `marketClosed = d?.marketClosed ?? true`.

### useSportsbook.js
- **useSportsbookMatches**: `connectSportsbookSocket(getToken() || null)`; removed token check.
- **useSportsbookOdds**: Same; parse `payload.data` into `safe` with matchOdds, bookMakerOdds, fancyOdds, marketClosed defaults; set state from safe.
- **useSportsbookOpenBets**: `connectSportsbookSocket(getToken() || null)`; removed token check.

### SportsGame.js
- **Socket effect**: `connectSportsbookSocket(getToken() || null)`; removed `if (!token) return`.

---

## 3. PERFORMANCE & MEMORY

- **No duplicate connections**: balanceSocket and sportsbookSocket use single `let socket`; reuse when already connected with same auth.
- **Cleanup**: BalanceContext effect cleanup disconnects both sockets and removes listeners; CricketDetail, useSportsbook, SportsGame, LandingPage, UserHeader all unsubscribe (removeMatchesListener, unsubscribeMatches, etc.) in effect cleanup.
- **Listener sets**: balanceSocket and sportsbookSocket use Sets for listeners; add/remove prevent stacking; ensureHandlers uses `socket.off()` before `socket.on()` so no double handlers.
- **Reconnect**: sportsbookSocket reemitSubscriptions() on `connect` and `reconnect`; subscription maps are not cleared on disconnect so re-subscribe is correct. balanceSocket has no client subscriptions; server pushes balance by token.

---

## 4. FINAL STATUS

### Working flows
- **Balance socket**: Connects only for real user (token and !isDemo). Disconnects and clears lastBalance on logout/demo. Single instance; path `/socket.io`; auth `{ token: 'Bearer …' }`.
- **Sportsbook socket**: Separate namespace `/sportsbook`; path `/socket.io`. Connects with token (user/demo) or without (guest). Auth change triggers disconnect and new connect. reemitSubscriptions on connect/reconnect.
- **Subscribe/unsubscribe**: subscribe:matches, subscribe:odds, subscribe:scoreboard with correct payloads (gameId/eventId, sport). Unsubscribe on effect cleanup. Total subscriptions capped at 20.
- **Events**: matches (payload.data array), odds (safe parse with matchOdds, bookMakerOdds, fancyOdds, marketClosed), scoreboard, betUpdate, balance. error handled with RATE_LIMIT detection.
- **Login/logout**: On login (token set) BalanceContext connects balance socket if !isDemo and sportsbook with token; on logout (token clear) both disconnect, state reset.
- **Demo**: Demo user does not connect to balance socket; can use sportsbook socket; UI restrictions unchanged (isDemo from AuthContext).

### Remaining risks
- **Subscription limit**: When at 20, new subscribe is no-op; UI may not reflect that a subscription was skipped (no user message). Optional: addErrorListener and show “Too many subscriptions” if needed.
- **Scoreboard inPlay**: Consumers should treat `data.inPlay === false` as “not live” and show appropriate message; CricketDetail uses liveScore from odds payload; any dedicated scoreboard listener should check inPlay.
- **Backend contract**: If backend uses different event names or payload shapes, adjust handlers and reemitSubscriptions to match.

# Sportsbook frontend integration

This document maps the API/socket contract to the implemented frontend.

## API client

**File:** `src/api/services/sportsbookApi.js`

| Doc endpoint | Method | Notes |
|--------------|--------|--------|
| GET `/:sportName/matches` | `getMatches(sportName, { fresh? })` | cricket, soccer, tennis |
| GET `/:sportName/odds?gameId=` | `getOdds(sportName, gameIdOrEventId)` | Tennis uses eventId |
| GET `/score?eventId=` | `getScore(eventId)` | |
| POST `/bet/place` | `placeBet(body)` | body: sport, gameId, eventName, marketType, marketId, selectionId, selectionName, betType, odds, stake |
| GET `/bet/open` | `getOpenBets(params?)` | params: gameId, marketType, sport, page, limit |
| GET `/bet/history` | `getBetHistory(params?)` | params: page, limit, sport, from, to, result (won/lost/void) |
| GET `/bet/summary` | `getBetSummary()` | openBetsCount, exposure, todayPnl |
| GET `/bet/:betId/cashout-value` | `getCashoutValue(betId)` | |
| POST `/bet/:betId/cashout` | `cashout(betId)` | |

All protected calls use `Authorization: Bearer <token>` via AuthService.

## React hooks

**File:** `src/hooks/useSportsbook.js`

- **useSportsbookMatches(sport, { fresh?, subscribeSocket? })** – fetch matches; optional socket subscription for live list.
- **useSportsbookOdds(sport, gameIdOrEventId)** – fetch odds and subscribe to live odds.
- **useSportsbookOpenBets(params?, { subscribeBetUpdate? })** – GET open bets; optional refetch on betUpdate.
- **useSportsbookBetHistory(params)** – GET history with sport, from, to, result, pagination.
- **useSportsbookBetSummary()** – GET summary.
- **usePlaceBet()** – returns `{ placeBet, placing, error, result }`; prevents duplicate submit.
- **useCashout(betId)** – returns `{ cashoutValue, loading, fetchValue, executeCashout, cashingOut, error }`.

## Socket.IO

**File:** `src/socket/sportsbookSocket.js`

- **Namespace:** `{baseUrl}/sportsbook`
- **Auth:** `auth: { token: accessToken }`
- **Client events:** `subscribe:matches` `{ sport }` (home/sports uses three emits via `subscribeMatchesMany`); `subscribe:odds` `{ gameId }` or `{ eventId, sport }` (tennis); `subscribe:scoreboard` `{ gameId }` or `{ eventId, sport }` (tennis).
- **Server events:** `matches`, `odds`, `scoreboard`, `betUpdate`, `balance`.

**Connection & subscriptions (single place):** `SportsbookStoreProvider` calls `connectSportsbookSocket(token || null)` on mount and on `loginStateChange`. **`SportsbookRouteMatchStreams`** (inside the provider) drives `subscribe:matches` from **pathname**: `/` and `/sports` → three `{ sport }` emits (cricket, tennis, soccer); `/cricket` | `/tennis` | `/soccer` → one sport for logged-in non-demo users. Changing route unsubscribes the previous set. Duplicate `subscribe:matches` emits for the same sport on one connection are skipped (`matchSubSentToServer` Set in `sportsbookSocket.js`).

- **`useSportsOddsSubscription(gameId, sport, enabled?)`**
- **`useSportsScoreboardSubscription(gameId, sport, enabled?)`**
- **`useSportsMatchesSubscription`** – ref-count helper; avoid stacking the same sports as the route sync on `/`, `/sports`, or detail paths.

`BalanceContext` only registers `betUpdate` for wallet updates.

## State management

**Bet slip:** `src/context/BetSlipContext.js`

- **Provider:** `BetSlipProvider` (wraps app inside `BalanceProvider` in Routing.js).
- **useBetSlip():** `selections`, `stake`, `placeError`, `placing`, `lastResult`, `addSelection`, `removeSelection`, `setStake`, `clearSlip`, `placeBet`.
- Add selection from odds view with `addSelection({ sport, gameId, eventName, marketType, marketId, selectionId, selectionName, betType, odds })`. Then set stake and call `placeBet()`.

## UI modules (existing)

| Feature | Location | Notes |
|---------|----------|--------|
| Match list | `src/sports/SportsGame.js` | Tabs: cricket, tennis, soccer; uses matches API + socket; click → detail |
| Odds view + bet slip + open bets | `src/cricket/cricketDetail.js` | Single match; odds, score, bet slip, open bets, cashout |
| Bet history | `src/StatementPages/BetHistory.js` | GET /bet/history with sport, from, to, result filters |
| Open bets (standalone) | `src/StatementPages/MyBets.js` | Uses GET /bet/open |

Routes: `/sports` (match list), `/cricket` `/tennis` `/soccer` (detail), `/my-bets`, `/bet-history`.

## Error handling

- API client returns raw response; hooks set `error` state on catch.
- `usePlaceBet` sets `placeError` and returns `{ success, message }`; duplicate submit is blocked.
- Socket errors are logged in sportsbookSocket; reconnection is automatic.

## Idempotency

- Prevent duplicate bet submission via `usePlaceBet` (ref guard) or `BetSlipContext.placeBet` (placingRef). Add `requestId` in body when backend supports it.

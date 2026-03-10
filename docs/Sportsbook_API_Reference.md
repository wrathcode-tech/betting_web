# Sportsbook API & Webhook Implementation

- **REST base:** `https://YOUR_HOST/api/v1`
- **Socket.IO base:** `https://YOUR_HOST`
- **Webhook base:** `https://YOUR_HOST/api/sportsbook-webhook`

---

## 1. Public REST API (no auth)

No `Authorization` header. Use for matches, odds, and score (guests and logged-in users).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sportsbook/:sportName/matches` | Match list. `sportName`: `cricket` \| `soccer` \| `tennis`. Query: `?fresh=1` to bypass cache. |
| GET | `/sportsbook/:sportName/odds?gameId=<id>` | Odds for one match. `gameId` from matches. |
| GET | `/sportsbook/score?eventId=<id>` | Live score: `{ liveScore }` (Status, Message, ScoreData.Score with Team1Name, Player1, Bowler, etc.). `eventId` = gameId. |

**Response shapes**

- **Matches:** `{ success, data: { data: [...], count }, message }`. Each item: `gameId`, `eventId`, `eventName`, `eventTime`, `inPlay`, `seriesName`, etc.
- **Odds:** `{ success, data: { matchOdds, bookMakerOdds, fancyOdds, otherMarketOdds, premiumFancy, liveScore } }`. `liveScore` is the raw live score payload.
- **Score:** `{ success, data: { liveScore } }` — full live score payload. Or `{ liveScore: { error: true, updatedAt } }` on failure.

---

## 2. Protected REST API (Bearer token)

Header: `Authorization: Bearer <accessToken>`.

### Betting

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sportsbook/bet/place` | Place bet. Body: `sport`, `gameId`, `eventName`, `marketType`, `marketId`, `selectionId`, `selectionName`, `betType` (`back`\|`lay`), `odds`, `stake`. Optional: `requestId`, `priceVersion`, `seriesName`, `eventTime`, `isLive`. |
| POST | `/sportsbook/bet/:betId/cancel` | Cancel open bet. |
| GET | `/sportsbook/bet/open` | Open bets. Query: `gameId`, `marketType`, `sport`, `page`, `limit`. |
| GET | `/sportsbook/bet/history` | Bet history. Query: `sport`, `from`, `to`, `result`, `page`, `limit`. |
| GET | `/sportsbook/bet/summary` | Dashboard: `openBetsCount`, `totalExposure`, `todayPnl`. |
| GET | `/sportsbook/bet/:betId` | Single bet detail. |
| GET | `/sportsbook/exposure` | User exposure. |
| GET | `/sportsbook/realtime-pnl` | Real-time P&L for open bets. |
| GET | `/sportsbook/profit-loss` | P&L statement. Query: `sport`, `from`, `to`. |
| GET | `/sportsbook/bet/:betId/cashout-value` | Preview cashout amount. |
| POST | `/sportsbook/bet/:betId/cashout` | Execute cashout. |
| POST | `/sportsbook/bet/:betId/loss-cut` | Cashout only when in loss. |
| GET | `/sportsbook/loss-limit` | Get loss limit. |
| PUT | `/sportsbook/loss-limit` | Set loss limit. Body: `{ dailyLossLimit: number \| null }`. |

All monetary values (stake, liability, balance, P&L, cashout) are in **INR**.

---

## 3. Webhook (provider → backend)

Base path: `/api/sportsbook-webhook`. No auth by default. Optional: set `SPORTSBOOK_WEBHOOK_SECRET` and send `X-Webhook-Secret` or `X-Sportsbook-Secret` (or `?secret=...`).

Data is written to **Redis** only; REST and Socket use this cache.

### 3.1 POST `/api/sportsbook-webhook/matches`

Body:

```json
{
  "sport": "cricket",
  "data": [
    {
      "gameId": "35324076",
      "eventName": "England v India",
      "eventTime": "2026-03-06T09:30",
      "inPlay": false,
      "seriesName": "Test Series"
    }
  ]
}
```

### 3.2 POST `/api/sportsbook-webhook/odds`

Body:

```json
{
  "gameId": "35324076",
  "sport": "cricket",
  "data": {
    "matchOdds": [],
    "bookMakerOdds": [],
    "fancyOdds": [],
    "otherMarketOdds": [],
    "premiumFancy": []
  }
}
```

### 3.3 POST `/api/sportsbook-webhook/matches/batch`

Body:

```json
{
  "sports": [
    { "sport": "cricket", "data": [ { "gameId": "1", "eventName": "Match 1" } ] },
    { "sport": "soccer", "data": [] }
  ]
}
```

Alternate key: `data` instead of `sports` (same structure).

---

## 4. Postman

Import: **`docs/Sportsbook_Postman_Collection.json`**.

Collection variables: `baseUrl`, `accessToken`, `sportName`, `gameId`, `betId`, `webhookSecret`.

---

## 5. Errors

| Code | Meaning |
|------|---------|
| 400 | Validation error (e.g. missing `gameId`, invalid `sport`). |
| 401 | No/invalid token (protected) or invalid webhook secret. |
| 404 | Route or resource not found. |
| 409 | Duplicate (`requestId`), odds changed, or slippage. |
| 429 | Rate limit (e.g. place bet > 3/sec). |
| 503 | Match/odds data temporarily unavailable. |

Responses: `{ success: false, message: "..." }` (and optional `data`).

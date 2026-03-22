# Sportsbook Socket — Backend Integration Spec (English)

**Namespace:** `/sportsbook`  
**Socket.IO path:** `/socket.io`

This document describes the contract the React client expects after the **array-based subscription** update. Share this with the backend team as the source of truth.

---

## 1. Client → Server (what the browser emits)

The first **data argument** of each `emit` is an **array of objects** (unless the client is run with legacy mode — see section 4).

| Event | Payload (first argument) |
|--------|---------------------------|
| `subscribe:matches` | `[{ "sport": "cricket" }, { "sport": "tennis" }, …]` |
| `unsubscribe:matches` | `[{ "sport": "cricket" }, …]` |
| `subscribe:odds` | `[{ "gameId": "<id>", "sport": "cricket" }, …]` |
| `unsubscribe:odds` | `[{ "gameId": "<id>" }, …]` |
| `subscribe:scoreboard` | `[{ "gameId": "<id>", "sport": "cricket" }, …]` |
| `unsubscribe:scoreboard` | `[{ "gameId": "<id>" }, …]` |

**Backend expectations**

- Treat each array element as one subscription or unsubscription action.
- Apply them in order (or idempotently — client may re-send the same set after reconnect).
- Ignore empty arrays.
- `gameId` is what the client sends; if your domain uses `eventId` for some sports, map it on the server.

---

## 2. Server → Client (what you should push)

The client accepts **three** shapes so you can roll out gradually:

1. **Top-level array:** `socket.emit("matches", [ msg1, msg2 ])`
2. **Wrapped:** `socket.emit("matches", { items: [ msg1, msg2 ] })`
3. **Legacy single object:** `socket.emit("matches", msg)` — still supported

### 2.1 Event: `matches`

Each message object should include (as per your existing list contract):

- `sport` — required for routing and client-side deduplication
- `schema` — e.g. `"listSummary"` when sending the match list
- `data` — array of match rows (each row is an object)
- `timestamp` — optional but recommended
- `error`, `message` — optional

**Example (batched — two sports in one emission):**

```json
[
  {
    "sport": "cricket",
    "schema": "listSummary",
    "timestamp": 1710000000123,
    "data": [
      {
        "gameId": "1",
        "name": "Team A v Team B",
        "sport": "cricket",
        "inPlay": true,
        "markets": [],
        "selections": [],
        "marketClosed": false
      }
    ]
  },
  {
    "sport": "tennis",
    "schema": "listSummary",
    "timestamp": 1710000000456,
    "data": []
  }
]
```

### 2.2 Event: `odds`

Each array element is one game/event update.

- Include **`gameId` and/or `eventId`** (at least one; both is fine).
- Include **`data`** — full odds object (e.g. `matchOdds`, `bookMakerOdds`, `fancyOdds`, flags, `oddsUpdatedAt`, optional `liveScore`, `tvUrl`, etc.).
- `timestamp` — optional.

**Example:**

```json
[
  {
    "gameId": "12345",
    "sport": "cricket",
    "timestamp": 1710000000999,
    "data": {
      "matchOdds": [],
      "bookMakerOdds": [],
      "fancyOdds": [],
      "marketClosed": false,
      "oddsUpdatedAt": 1710000000999,
      "liveScore": null,
      "tvUrl": null
    }
  }
]
```

### 2.3 Event: `scoreboard`

Same pattern: array of objects, each with `gameId` / `eventId` and **`data`** (live score payload).

```json
[
  {
    "gameId": "12345",
    "timestamp": 1710000001000,
    "data": {}
  }
]
```

### 2.4 Other events

`betUpdate`, `balance`, and `error` are unchanged on the client core path. If you want to batch them later, you can use the same **array** or `{ items: [...] }` convention for consistency.

---

## 3. Reconnection

On connect/reconnect the client **re-sends** all active subscriptions using the **array** format. Your handlers should be **idempotent** (subscribing twice to the same `sport` / `gameId` should not error or duplicate work in a harmful way).

---

## 4. Legacy client mode (optional)

If the server has **not** been updated yet and still expects a **single object** per emit (e.g. `{ sport }` or `{ gameId, sport }`), the deployment can set:

`REACT_APP_SPORTSBOOK_LEGACY_SOCKET_EMIT=true`

Then the client falls back to the old emit shape. Remove this once the server supports arrays.

---

## 5. Short copy-paste message for backend / Slack

You can send this as-is:

> **Sportsbook `/sportsbook` socket — array protocol**  
> The web client now sends subscriptions as **arrays** in the first payload argument:  
> - `subscribe:matches` / `unsubscribe:matches` → `[{ sport }, …]`  
> - `subscribe:odds` / `unsubscribe:odds` → `[{ gameId, sport }, …]` / `[{ gameId }, …]`  
> - `subscribe:scoreboard` / `unsubscribe:scoreboard` → `[{ gameId, sport }, …]` / `[{ gameId }, …]`  
> Please update Socket.IO handlers to **iterate the array** and apply each entry.  
> For pushes to the client, please prefer **`matches` / `odds` / `scoreboard`** as either a **top-level array of message objects** or `{ items: [...] }`. Each element should be self-contained (`sport` + `schema` + `data` for list messages; `gameId` or `eventId` + `data` for odds and scoreboard). The client still accepts a **single object** per event for backward compatibility during rollout.  
> If you need the old emit format temporarily, we can enable `REACT_APP_SPORTSBOOK_LEGACY_SOCKET_EMIT=true` on the frontend until your side is ready.

---

*File:* `src/socket/SPORTSBOOK_SOCKET_BACKEND_SPEC_EN.md`

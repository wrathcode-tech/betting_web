# Sportsbook Socket — Array protocol (client ↔ server)

**Namespace:** `/sportsbook`  
**Path:** `/socket.io`  
**Purpose:** Frontend ab subscription messages **array of objects** ke roop mein bhejta hai, aur backend se **matches / odds / scoreboard** (aur similar pushes) ko bhi **array of objects** (ya `items` wrapper) mein expect karta hai taaki ek packet mein multiple updates ho saken.

---

## 1) Client → Server (incoming to your handlers)

Socket.IO `emit` ka **pehla data argument** hamesha **Array** ho (legacy mode off hone par).

| Event | Payload shape (array of objects) |
|--------|----------------------------------|
| `subscribe:matches` | `[{ sport: "cricket" }, { sport: "tennis" }, …]` |
| `unsubscribe:matches` | `[{ sport: "cricket" }, …]` |
| `subscribe:odds` | `[{ gameId: "<id>", sport: "cricket" }, …]` |
| `unsubscribe:odds` | `[{ gameId: "<id>" }, …]` |
| `subscribe:scoreboard` | `[{ gameId: "<id>", sport: "cricket" }, …]` |
| `unsubscribe:scoreboard` | `[{ gameId: "<id>" }, …]` |

**Implementation notes for backend**

- Har array element ko alag subscription / unsubscription samjho (batch apply).
- Khali array ignore kar sakte ho.
- `gameId` / `eventId` naming: client `gameId` bhejta hai; tennis jaise flows mein tumhara server `eventId` use kare to mapping tumhari side par clear honi chahiye.

**Legacy compatibility (optional)**

- Agar purana server abhi bhi single object expect karta ho (`{ sport }` ya `{ gameId, sport }`), frontend mein env set karo:  
  `REACT_APP_SPORTSBOOK_LEGACY_SOCKET_EMIT=true`  
  Tab client purane format par wapas chala jata hai.

---

## 2) Server → Client (outgoing from your Socket.IO server)

Frontend **teen formats** accept karta hai (migration-friendly):

1. **Top-level array:** `socket.emit("matches", [ obj1, obj2 ])`
2. **Wrapped:** `socket.emit("matches", { items: [ obj1, obj2 ] })`
3. **Single object (legacy):** `socket.emit("matches", obj)` — pehle jaisa

### 2.1 `matches`

Har object ideally ye fields rakhe (list / listSummary ke hisaab se jo tum contract mein use karte ho):

- `sport` (required for routing / dedupe)
- `schema` (e.g. `"listSummary"` jab list ho)
- `data` — **matches ka array** (har match ek object)
- `timestamp` (optional, dedupe / ordering ke liye useful)
- `error`, `message` (optional)

**Example (batch):**

```json
[
  {
    "sport": "cricket",
    "schema": "listSummary",
    "timestamp": 1710000000123,
    "data": [ { "gameId": "1", "name": "A v B", "sport": "cricket", "inPlay": true, "markets": [], "selections": [], "marketClosed": false } ]
  },
  {
    "sport": "tennis",
    "schema": "listSummary",
    "timestamp": 1710000000456,
    "data": []
  }
]
```

### 2.2 `odds`

Har array element = **ek event / game** ka odds push.

- `gameId` **ya** `eventId` (kam se kam ek; dono ho to bhi chalega)
- `data` — full odds payload (matchOdds, bookMakerOdds, fancyOdds, …)
- `timestamp` (optional)

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

### 2.3 `scoreboard`

Same idea: array of objects, har item mein `gameId` / `eventId` + `data` (live score / strip).

```json
[
  {
    "gameId": "12345",
    "timestamp": 1710000001000,
    "data": { }
  }
]
```

### 2.4 Other events (`betUpdate`, `balance`, `error`)

Inko bhi agar tum batch karna chahte ho to **same pattern** use karo: top-level array ya `{ items: [...] }`.  
Frontend ka core sportsbook layer abhi primarily `matches` / `odds` / `scoreboard` par normalize karta hai; baaki listeners ko tum apne hisaab se extend kar sakte ho.

---

## 3) Acceptance checklist (backend)

- [ ] `subscribe:matches` / `unsubscribe:matches` **array** body parse ho rahi hai.
- [ ] `subscribe:odds` / `unsubscribe:odds` **array** body parse ho rahi hai.
- [ ] `subscribe:scoreboard` / `unsubscribe:scoreboard` **array** body parse ho rahi hai.
- [ ] Push side: `matches`, `odds`, `scoreboard` ko **array of objects** (ya `{ items }`) bhejne par client sahi fan-out karta hai.
- [ ] Reconnect par client dubara subscribe karta hai — server idempotent subscription rakhe.

---

## 4) Copy-paste prompt (English) for backend dev

> We updated the React client for namespace `/sportsbook`. **All subscription emits now send an array as the first payload argument**, e.g. `subscribe:matches` → `[{ sport: "cricket" }, { sport: "tennis" }]`, `subscribe:odds` → `[{ gameId, sport }, …]`, `unsubscribe:odds` → `[{ gameId }, …]`, same for scoreboard. Please update Socket.IO handlers to iterate the array and apply each entry.  
> For server → client, please **prefer sending batched updates** as either a **top-level array** or `{ items: [...] }` on `matches`, `odds`, and `scoreboard`. Each element should be a self-contained object (include `sport` + `schema` + `data` for list payloads; include `gameId`/`eventId` + `data` for odds/scoreboard). The client still accepts the old single-object message for backward compatibility during rollout.

---

*File path in repo:* `src/socket/SPORTSBOOK_BACKEND_SOCKET_ARRAY_SPEC.md`

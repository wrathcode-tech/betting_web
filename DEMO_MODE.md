# Demo Mode – Dual Balance & Permissions

Demo users (`user.isDemo === true`) get **wallet = ₹0** (real money) and **`demoPlayBalance`** (WCO casino play money). These must **never** be mixed in UI or state.

## Central helpers (`src/utils/demoPermissions.js`, re-exported from `authUtils`)

- `isDemoUser(user)`
- `canBetSportsbook(user)` → `false` for demo
- `canUseWallet(user)` → `false` for demo  
- `canPlayCasino(user)` → `true` (always; casino uses demo credits)
- `getDisplayWalletBalance(user, liveWallet)` → **0** for demo
- `getDemoPlayBalanceFromUser(user)` → number or `null`
- `isDemoMutationUrlAllowed(url)` → allowlist for POST (demo-login, refresh-token, logout, **`/games/launch`**)

## Auth (`AuthContext`)

- `user` persisted in **sessionStorage** (`user` key).
- `isDemo = user?.isDemo === true`.
- On demo login, `balance` stored as **0**; **`demoPlayBalance`** from API.

## Balance (`BalanceContext`)

- **Real user:** `balance` from socket; `demoPlayBalance` = `null`.
- **Demo user:** `balance` state forced to **0** on every balance event; **`demoPlayBalance`** from socket payload (`demoPlayBalance` / `demo_play_balance`) or profile.
- Sportsbook bet socket updates **do not** move wallet for demo (wallet stays 0).

## API (`apiCall.js`)

- Demo users: block POST/PUT/PATCH/DELETE except **`isDemoMutationUrlAllowed`** (includes **`/games/launch`**).
- Message: `Demo users are not allowed to perform this action`.

## Routes (`Routing.js`)

Demo blocked paths (redirect home + toast):

- `/deposit`, `/withdrawal`
- `/add-account`, `/add-bank`

**Not blocked:** `/game` (WCO iframe).

**Pages:** `NewDeposit` / `NewWithdrawal` also redirect if `isDemo` (belt & suspenders).

## Header (`UserHeader`)

- **Demo Mode** badge.
- **Wallet ₹0.00** + line **Demo credits ₹…** (from `useBalance().demoPlayBalance`).
- **Deposit** = disabled button (not hidden), withdrawal link hidden as before.

## Sportsbook

- **BetSlip `placeBet`:** immediate toast *"Demo mode — sportsbook betting is disabled…"* (no API call).
- Cricket / other UIs: keep **Place Bet** disabled for demo where already wired.

## Casino

- **CasinoGame:** play navigates to `/game`; no demo block.
- Duplicate balance listener removed (only `BalanceContext` drives balances).

## Hook

- `useDemoBalance()` in `src/hooks/useDemoBalance.js` → `{ isDemo, walletBalance, demoPlayBalance }`.

## Socket (`balanceSocket`)

- Listens for `demoPlayBalance` / `demo_play_balance` on `balance` event; `getLastDemoPlayBalance()`.

## Refresh / edge cases

- On `loginStateChange`, balances re-sync from storage + socket helpers.
- Switching demo ↔ real clears appropriate state via token effect in `BalanceProvider`.

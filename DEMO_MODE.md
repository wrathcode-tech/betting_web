# Demo Mode (Guest Login) – Behavior

Demo users can explore the app but cannot perform real-money actions. All restrictions are driven by `user.isDemo === true` from auth state.

## 1. Auth state

- **Storage:** User + token are stored globally (AuthContext + authStorage).
- **Control:** `user.isDemo` controls UI and actions. Use `useAuth()` for `user` and `isDemo`, and `isDemoUser(user)` from `utils/authUtils` outside React (e.g. API layer).

## 2. Header (when `user.isDemo === true`)

- Show label: **"Demo Mode"** (tooltip: "Login to enable this feature").
- Hide **Deposit** button.
- Wallet/balance shows "View only – ₹0.00".
- Profile dropdown is hidden for demo.

## 3. Demo user permissions

**ALLOW**

- View matches, odds, dashboard, wallet (balance = 0).

**BLOCK**

- Deposit / Withdraw.
- Cashout, Cancel bet (buttons disabled with tooltip).

## 4. Bet placement

- **Place Bet** is **enabled** for demo so the user can click.
- Request is sent to the API; API may respond with insufficient balance or 403.
- **If `user.isDemo === true`:**
  - Show: *"Demo account cannot place bets. Please login with mobile/email to continue."*
- **Else:**
  - Show normal error (e.g. *"Insufficient balance"*).

## 5. Route protection

When `user.isDemo`, these routes are blocked and user is redirected home with a toast:

- `/deposit`, `/withdrawal`, `/withdraw`
- `/game`, `/add-account`, `/add-bank`
- `/my-wallet`, `/wallet/actions`

Toast message: **"Login required to access this feature"**.

## 6. Global UI

- For disabled actions use: `disabled={user?.isDemo}` or `disabled={isDemo}`.
- Add tooltip where useful: `title={isDemo ? 'Login to enable this feature' : undefined}`.

## 7. Error handling (API layer)

- **403** and `user.isDemo`: show **"Register to play with real money"**.
- **401:** logout and redirect to login (existing interceptor).

## 8. Clean usage

- **useAuth()** – `const { user, isDemo, setUser, clearUser } = useAuth();`
- **isDemoUser(user)** – `utils/authUtils.js` (for API/guard use).
- Avoid duplicate checks; prefer `isDemo` or `isDemoUser(user)` consistently.

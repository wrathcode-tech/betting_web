# Frontend User Flows – Audit Report

## 1. BUG LIST

| # | Issue | Root cause | Fix |
|---|--------|------------|-----|
| 1 | Token only in sessionStorage; inconsistent across tabs/components | Multiple components read/wrote token directly to sessionStorage; no single source of truth | Introduced `src/utils/authStorage.js` with getToken/setToken/getRefreshToken/setRefreshToken/clearAuth; token written to both sessionStorage and localStorage; all reads use getToken() |
| 2 | Logout / 401 did not clear all auth data | Manual removeItem only cleared sessionStorage; localStorage and user key not cleared | tokenExpire() and UserHeader logout now call clearAuth(); demo expiry in AuthContext calls clearAuth() |
| 3 | AuthService used sessionStorage.getItem('token') in 68 places | Token read was duplicated and could diverge from authStorage | AuthService imports getToken/getRefreshToken from authStorage; all auth/wallet/games/sportsbook methods use getToken() or getRefreshToken() |
| 4 | Login/signup/demo stored token only in sessionStorage | LoginModal used sessionStorage.setItem('token', ...) on success | LoginModal uses setToken() and setRefreshToken() from authStorage on login, signup, demo login, and after verify |
| 5 | Generic "Something went wrong" on API errors | Catch blocks in LoginModal ignored error.response.data.message | All auth handlers show error?.response?.data?.message \|\| error?.message with a fallback |
| 6 | Backend validation errors (Joi) not shown on form | API returns validationErrors but UI did not map to field errors | Added applyValidationErrors() in LoginModal; called on failed send OTP, register, login, forgot OTP, forgot reset, demo login |
| 7 | Refresh token flow used sessionStorage only | apiCall interceptor read refreshToken from sessionStorage and wrote new token to sessionStorage | apiCall uses getRefreshToken() and setToken(newToken) from authStorage |
| 8 | "Token is expired" handling did not clear both storages | tokenExpire cleared only sessionStorage | tokenExpire calls clearAuth(); passes isDemo for correct message |
| 9 | getStoredUserForGuard read only sessionStorage | authUtils duplicated storage logic | getStoredUserForGuard() now uses getStoredUser() from authStorage |
| 10 | No Change password UI | AuthService.bettingChangePassword existed but no profile UI | Profile page: "Change password" button opens modal with currentPassword, newPassword, confirmNewPassword; calls AuthService.bettingChangePassword; shows result?.message |
| 11 | Logout all not exposed | ApiConfig had bettingLogoutAll but no method or UI | AuthService.bettingLogoutAll() added; Profile "Logout from all devices" button calls it then clearAuth() and redirect to /login |
| 12 | ProfilePage and others still read token from sessionStorage | getToken() was not used everywhere | Replaced sessionStorage.getItem('token') with getToken() in Routing, Header, LoginPage, BalanceContext, LandingPage, historyApi, ProfileTransactions, CricketDetail, SportsGame, MyWallet, NewWithdrawal, AddAccount, ProfilePage, GameHistory, SportsBook, CasinoGame, useSportsbook, AuthContext |

---

## 2. CODE FIXES (summary)

- **`src/utils/authStorage.js`** (new): getToken, setToken, getRefreshToken, setRefreshToken, getStoredUser, setStoredUser, clearAuth. Writes token/refreshToken to both sessionStorage and localStorage; user in sessionStorage. SSR-safe checks for typeof sessionStorage/localStorage.
- **`src/api/apiConfig/apiCall.js`**: Imports clearAuth, getRefreshToken, getToken, setToken from authStorage. tokenExpire() calls clearAuth(). Refresh flow uses getRefreshToken() and setToken(newToken). "Token is expired" branch uses getToken() and tokenExpire(isDemo).
- **`src/api/services/AuthService.js`**: Removed local getStoredToken. Import getToken, getRefreshToken from authStorage. Replaced all sessionStorage.getItem("token") with getToken(), sessionStorage.getItem("refreshToken") with getRefreshToken(), getStoredToken() with getToken(). Added bettingLogoutAll(). Removed debug console.log.
- **`src/utils/authUtils.js`**: getStoredUserForGuard() now uses getStoredUser from authStorage.
- **`src/customComponents/LoginModal.js`**: Import setToken, setRefreshToken. On login/signup/demo/verify success use setToken(token) and setRefreshToken(refresh). All catch blocks show error?.response?.data?.message \|\| error?.message. Added applyValidationErrors() and call it on every failed auth API response.
- **`src/customComponents/UserHeader.js`**: Import clearAuth, getToken. Logout calls clearAuth(). fetchUserDisplayName and socket sync use getToken().
- **`src/context/AuthContext.js`**: Import clearAuth, getStoredUser, getToken, setStoredUser from authStorage. Initial state useState(() => getStoredUser()). Token check and getMe effect use getToken(). Demo expiry calls clearAuth() then setUserState(null) and redirect.
- **`src/Routing.js`**, **`src/customComponents/Header.js`**, **`src/pages/LoginPage.js`**: isLoggedIn / token from getToken().
- **`src/context/BalanceContext.js`**, **`src/LandingPage/LandingPage.js`**: Token state and loginStateChange use getToken().
- **`src/api/historyApi.js`**: authHeaders() uses getToken().
- **`src/ProfileTransactions/ProfileTransactions.js`**, **`src/StatementPages/MyWallet.js`**, **`src/newWithdrawal/NewWithdrawal.js`**, **`src/BankDetails/AddAccount.js`**, **`src/ProfilePage/index.jsx`**, **`src/GameHistory/GameHistory.js`**, **`src/SportsBook/SportsBook.js`**, **`src/Casino/CasinoGame.js`**, **`src/hooks/useSportsbook.js`**, **`src/cricket/CricketDetail.js`**, **`src/sports/SportsGame.js`**: All token reads use getToken() from authStorage.
- **`src/ProfilePage/index.jsx`**: getToken() for fetchProfile. Change password modal (currentPassword, newPassword, confirmNewPassword) with AuthService.bettingChangePassword and result?.message. "Logout from all devices" button with handleLogoutAll (bettingLogoutAll then clearAuth + navigate /login). Profile update failure shows result?.message.

---

## 3. IMPROVEMENTS

- **UX**: Backend error messages and field-level validation errors shown in auth forms instead of generic "Something went wrong."
- **Consistency**: Single way to read/write token and clear auth (authStorage) across app and apiCall.
- **Session resilience**: Token stored in both sessionStorage and localStorage so behavior is consistent regardless of which storage a component or tab uses.
- **Change password**: Available from profile with current/new/confirm password and backend message on success/failure.
- **Logout all**: Optional "Logout from all devices" from profile for users who want to invalidate all sessions.

---

## 4. FINAL STATUS

### Fixed

- **Authentication**: Register (OTP → verify → create), login, forgot/reset password use correct endpoints and payloads; token and refreshToken stored via authStorage; validation errors and backend message shown.
- **Token & session**: Every protected call uses token from getToken(); refresh flow uses getRefreshToken/setToken; 401 triggers clearAuth() and redirect; no infinite retry (__retried guard); "Token is expired" calls tokenExpire(isDemo).
- **User profile**: GET /auth/me and PUT /auth/profile (FormData for image); profile data rendered; update shows result?.message; change password and logout-all from profile.
- **Demo user**: Demo login stores token/user; isDemo and DemoBlockRoute block /deposit, /withdrawal, /game, etc.; apiCall guardDemoUser blocks POST/PUT/DELETE for demo; balance UI shows "View only – ₹0.00" for demo.
- **Wallet**: Balance from API and socket; withdrawal flow (request OTP → submit with OTP); backend message shown (e.g. insufficient balance, min wager); walletBalanceUpdate event keeps UI in sync.
- **Error handling**: Backend format { success, message, errorCode } respected; 401 → logout; 403 → message (including suspended/demo); 429 → rate limit message; 400 → message + validationErrors; auth forms use applyValidationErrors and result?.message / error?.response?.data?.message.
- **Sockets**: Balance and sportsbook sockets use token from getToken(); connect when token present, disconnect when absent; BalanceContext listens to walletBalanceUpdate for immediate UI update after deposit/withdrawal.
- **Edge cases**: No token → getToken() null, protected routes redirect to login; invalid/expired token → 401 interceptor clears auth and redirects; demo on restricted routes → DemoBlockRoute redirects; parallel requests use same token from authStorage.

### Backend clarification (optional)

- **dateOfBirth**: If backend GET/PUT profile expects or returns dateOfBirth, add field to profile form and payload (currently fullName, email, profileImage).
- **Validation shape**: If Joi returns details[].path/message instead of errors/validationErrors, extend applyValidationErrors in LoginModal to map that shape.
- **Logout-all response**: If backend returns a specific shape or status, handle it (e.g. show message before redirect).

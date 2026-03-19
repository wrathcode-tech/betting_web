# Frontend API Integration Audit Report

**Scope:** All frontend integrations for backend modules **excluding** User/Auth, Socket.IO, and Sportsbook core (already audited).

**Backend contract:** Success `{ success: true, message?, data }`; Error `{ success: false, message, errorCode?, errors? }`; Pagination `{ page, limit, totalRecords, totalPages }`.

---

## 1. BUG LIST

| # | Issue | Root cause | Fix |
|---|--------|------------|-----|
| 1 | ProfileTransactions used response as list without checking `success` | Code used `res?.data ?? res` and pagination without guarding on `res?.success === false` | Guard on `res?.success === false`: set transactions to `[]`, reset pagination, show `res?.message`, return; then use `res?.data ?? res` and `res?.pagination` with `totalRecords` support |
| 2 | GameHistory used response as list without checking `success` | Same as above; failure could render backend error object as rows | Same pattern: early return on `res?.success === false` with empty state and message; in catch set empty state and show `err?.message` |
| 3 | SupportPage getIssueList did not check `success` before using response as data | List and pagination were derived from `result` without failure check | If `result?.success === false`: set `issueList` to `[]`, reset ticket pagination, show `result?.message`, return; then use `result?.data ?? result` and pagination including `totalRecords` |
| 4 | ReferralProgram multiple endpoints used response as data without success check | loadDashboard, loadBalance, loadReferralList, loadRewardsHistory, loadProfit, loadRewardsLive, handleExport treated response as data on failure | Each handler: if `res?.success === false` show message and return (or set empty list/pagination); use `res?.data` only after success; in catch show `e?.message`; removed duplicate setRewardsPagination in one catch |
| 5 | MyWallet fetchStatement did not check `success` or show backend error | On API failure, raw could be undefined and no user message shown | Guard on `res?.success === false`: setData([]), alertErrorMessage(res.message), return; use `res?.data ?? res` for list; in catch show `e?.message` |
| 6 | AccountStatement fetchStatement did not check `success` or show error | Same as MyWallet | Same fix: success check, setData([]), alertErrorMessage on failure and in catch |
| 7 | DepositHistory / WithdrawalHistory / OpenBets did not show backend message on failure | Else branch set empty data but did not show `res?.message`; catch used generic "Failed to load history" | On `res?.success === false` show `res?.message` via toast; in catch show `err?.message \|\| 'Failed to load history'`; pagination normalized to support `totalRecords` (totalPages from totalRecords when needed) |
| 8 | Pagination metadata not aligned with backend (totalRecords) | Some components only used `res.pagination` without normalizing `totalRecords` to totalPages | Use `pag.total ?? pag.totalRecords` for total count; set totalPages from `pag.totalPages ?? (limit && total ? Math.ceil(total / limit) : 1)` where applicable (ProfileTransactions, GameHistory, DepositHistory, WithdrawalHistory, OpenBets, SupportPage, ReferralProgram) |

---

## 2. CODE FIXES (exact files and changes)

### 2.1 ProfileTransactions (`src/ProfileTransactions/ProfileTransactions.js`)

- **Import:** `import { alertErrorMessage } from '../customComponents/CustomAlertMessage'`
- **Fetch logic:** Before using response, if `res?.success === false`: set `transactions` to `[]`, reset pagination, `alertErrorMessage(res.message)`, return. Then use `res?.data ?? res` for list and `res?.pagination ?? raw?.pagination` for pagination; support `pag.total ?? pag.totalRecords ?? 0` for total count.

### 2.2 GameHistory (`src/GameHistory/GameHistory.js`)

- **Import:** `import { alertErrorMessage } from '../customComponents/CustomAlertMessage'`
- **Fetch logic:** If `res?.success === false`: set transactions to `[]`, reset pagination, show `res?.message`, return. Data from `res?.data ?? res`, pagination from `data?.pagination ?? res?.pagination` with totalRecords. In catch: set empty state and `alertErrorMessage(err?.message)`.

### 2.3 SupportPage (`src/pages/SupportPage.js`)

- **getIssueList:** If `result?.success === false`: set `issueList` to `[]`, `ticketTotalPages` to 0, `ticketPage` to 1, show `result?.message`, return. List from `result?.data ?? result`; total pages from `raw?.pagination?.totalRecords` or pagination object.

### 2.4 ReferralProgram (`src/ReferralProgram/ReferralProgram.js`)

- **loadDashboard, loadBalance:** If `res?.success === false` show message and return (balance sets balanceInfo to null on failure).
- **loadReferralList, loadRewardsHistory, loadProfit:** On failure set list and pagination to empty/zero, show message, return; in catch show `e?.message` (single setRewardsPagination in catch).
- **loadRewardsLive:** If `res?.success === false` return without updating state.
- **handleExport:** If `res?.success === false` show message and return before treating response as blob.

### 2.5 MyWallet (`src/StatementPages/MyWallet.js`)

- **Import:** `import { alertErrorMessage } from '../customComponents/CustomAlertMessage'`
- **fetchStatement:** If `res?.success === false`: setData([]), alertErrorMessage(res.message), return. Then `raw = res?.data ?? res`; list from raw; setData(Array.isArray(list) ? list.map(...) : []). Catch: setData([]), alertErrorMessage(e?.message).

### 2.6 AccountStatement (`src/StatementPages/AccountStatement.js`)

- **Import:** `import { alertErrorMessage } from '../customComponents/CustomAlertMessage'`
- **fetchStatement:** Same pattern as MyWallet: success check, setData([]) and message on failure; use `res?.data ?? res` for list; catch with alertErrorMessage(e?.message).

### 2.7 DepositHistory (`src/pages/DepositHistory.js`)

- **Then branch:** On success, pagination from `res.pagination` with `total ?? totalRecords`, totalPages computed if needed. On failure (`res?.success === false`) show `res?.message` via toast.
- **Catch:** `toast.error(err?.message || 'Failed to load history')`.

### 2.8 WithdrawalHistory (`src/pages/WithdrawalHistory.js`)

- Same as DepositHistory: pagination normalization (totalRecords), show `res?.message` on failure, `err?.message` in catch.

### 2.9 OpenBets (`src/pages/OpenBets.js`)

- Same pattern: pagination with totalRecords; on failure toast `res?.message`; in catch `err?.message || 'Failed to load history'`.

---

## 3. UX IMPROVEMENTS

- **Loading / empty / error states:** All audited list pages now set empty list and reset pagination on API failure and show the backend message (alert or toast), avoiding silent failures and broken tables.
- **Pagination:** Consistent handling of `totalRecords` and `totalPages` so "Page 1 of N" and next/prev remain correct when backend sends either format.
- **Error messages:** Users see backend `message` (and in apiCall, 403/429 are already surfaced); no generic "Something went wrong" where the backend sent a specific message.
- **429 (rate limit):** Handled globally in `apiCall.js` (alert "Too many attempts. Try again in 15 minutes."). Optional future improvement: on forms that get 429, disable submit for a cooldown and show "Try again in X minutes."
- **Validation errors:** apiCall returns `validationErrors` for 400. Optional: map these to field-level errors on referral-apply and support-ticket forms (similar to LoginModal’s applyValidationErrors).

---

## 4. FINAL STATUS

### Fixed modules

- **ProfileTransactions** – Success check, `res.data`, pagination (totalRecords), alert on failure and in catch.
- **GameHistory** – Same; catch shows error message.
- **SupportPage** – getIssueList: success check, empty list/pagination, message on failure.
- **ReferralProgram** – All load/export handlers: success check, user-visible errors, no double setState in catch.
- **MyWallet** – fetchStatement: success check, alertErrorMessage, catch message.
- **AccountStatement** – Same as MyWallet.
- **DepositHistory** – Backend message on failure, catch message, pagination totalRecords.
- **WithdrawalHistory** – Same.
- **OpenBets** – Same.

### Already aligned (no code change)

- **API structure:** `apiConfig.js` uses `/api/v1`, kebab-case endpoints (bank-accounts, deposit-options, etc.); historyApi uses buildUrl with correct bases.
- **NewDeposit / NewWithdrawal / AddAccount:** Already check `res?.success`, use `res?.data`, show `res?.message` on failure.
- **DepositHistory / WithdrawalHistory / OpenBets:** Already used `res && res.success && Array.isArray(res.data)`; only added failure message and pagination normalization.
- **BettingProfitLoss:** Already checks `res.success === false`, uses `res.data`, sets error message.
- **apiCall.js:** Already returns `{ success: false, message, errorCode, validationErrors }`; 401 → logout; 403/429 → alert; 400 → message + validationErrors.

### Remaining (optional)

- **429 cooldown UI:** Per-form disable of submit button and "Try again in X minutes" when `errorCode === 'TOO_MANY_REQUESTS'`.
- **Field-level validation:** Use `result.validationErrors` on referral-apply and support-ticket submit to show errors next to fields.
- **Admin / master / notifications:** If the app adds admin or notification API modules, apply the same patterns: check `response.success`, use `response.data`, handle `errorCode` and pagination.

---

**Goal achieved:** Frontend is aligned with backend contract for the audited modules: correct success/data/pagination handling, no silent failures, and consistent error messaging. Admin flows (bank, deposit, withdrawal) and feature modules (referral, support, games history, statements) follow the same response and error handling patterns.

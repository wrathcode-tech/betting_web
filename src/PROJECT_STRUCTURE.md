# Project Structure & Naming Convention

## File Naming (Professional)

- **React components / pages:** `PascalCase.js` (e.g. `ProfileTransactions.js`, `CricketDetail.js`, `Sidebar.js`)
- **CSS:** Same as component when 1:1 (e.g. `ProfileTransactions.css`, `GamePlay.css`), or `kebab-case.css` for shared
- **Utilities / config:** `camelCase.js` (e.g. `apiConfig.js`, `historyApi.js`)
- **Hooks:** `useCamelCase.js` (e.g. `useSportsbook.js`, `useDebounce.js`)

## Folder Layout

```
src/
├── api/                 # API config, calls, services
│   ├── apiConfig/
│   ├── services/
│   └── historyApi.js
├── components/         # Reusable UI (FilterBar, HistoryTable, Pagination, etc.)
├── context/            # React context providers
├── customComponents/   # Layout & shared (Header, Footer, Sidebar, LoginModal, etc.)
│   └── SideBar/
│       └── Sidebar.js
├── cricket/            # Cricket/Tennis/Soccer detail (CricketDetail.js)
├── StatementPages/     # MyBets, MyWallet, BetHistory, StatementPage, etc.
├── ProfileTransactions/
│   └── ProfileTransactions.js
├── pages/              # Route pages (LoginPage, DepositHistory, ReferralRewards, etc.)
├── Casino/, GamePlay/, GameHistory/, SportsBook/, sports/
├── newDeposit/, newWithdrawal/, BankDetails/
├── ReferralProgram/, RankSystem/, GameRule/
├── LandingPage/, Layout.js, Routing.js
├── hooks/, utils/, socket/
└── index.js, App.js
```

## Renamed Files (Applied)

| Old | New |
|-----|-----|
| `profileTransactions.js` | `ProfileTransactions.js` |
| `profileTransactions.css` | `ProfileTransactions.css` |
| `sideBar.js` | `Sidebar.js` |
| `gamePlay.js` / `.css` | `GamePlay.js` / `GamePlay.css` |
| `casinoGame.js` | `CasinoGame.js` |
| `cricketDetail.js` / `.css` | `CricketDetail.js` / `CricketDetail.css` |
| `referralProgram.js` / `.css` | `ReferralProgram.js` / `ReferralProgram.css` |
| `rankSystem.js` / `.css` | `RankSystem.js` / `RankSystem.css` |
| `newDeposit.js` / `.css` | `NewDeposit.js` / `NewDeposit.css` |
| `newWithdrawal.js` / `.css` | `NewWithdrawal.js` / `NewWithdrawal.css` |
| `addAccount.js` / `.css` | `AddAccount.js` / `AddAccount.css` |
| `addBank.js` | `AddBank.js` |
| `gameRules.js` | `GameRules.js` |
| `footer.js` | `Footer.js` |

All imports have been updated to use the new names.

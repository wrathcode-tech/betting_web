# Project Structure and Ownership

This document explains where code should live so any developer can quickly find the right file.

## 1) Layer responsibilities

```text
src/
├── api/                     # API config + service methods
│   ├── apiConfig/           # base URL + endpoint constants
│   └── services/            # AuthService, sportsbookApi, etc.
│
├── context/                 # global providers/state containers
├── hooks/                   # reusable custom hooks
├── utils/                   # pure helpers (no UI)
├── socket/                  # socket connection helpers + specs
│
├── customComponents/        # app-wide shared UI
├── components/              # generic UI widgets (table/pagination style)
│
├── pages/                   # route pages (login/support/history/terms)
├── StatementPages/          # betting/account statement pages
│
├── Casino/                  # casino module
├── SportsBook/              # sportsbook module
├── sports/                  # sports listing/inplay page
├── cricket/                 # event detail page logic (cricket/tennis/soccer)
├── GamePlay/                # game launch/gameplay area
├── GameRule/                # game rules page
├── ReferralProgram/         # referral page/module
├── RankSystem/              # rank system module
├── promotions/              # promotions module
├── newDeposit/              # deposit flow
├── newWithdrawal/           # withdrawal flow
├── BankDetails/             # bank account setup
│
├── Layout.js                # main shell around routed pages
├── Routing.js               # all routes and route guards
├── App.js                   # app composition
└── index.js                 # React entry point
```

## 2) Route mapping (quick lookup)

- `/` -> `LandingPage/LandingPage.js`
- `/casino` -> `Casino/CasinoGame.js`
- `/sports` -> `sports/SportsGame.js`
- `/sportsbook` -> `SportsBook/SportsBook.js`
- `/cricket`, `/tennis`, `/soccer` -> `cricket/CricketDetail.js`
- `/game-rules` -> `GameRule/GameRules.js`
- `/terms-and-conditions` -> `pages/TermsAndConditions.js`
- `/support` -> `pages/SupportPage.js`
- `/referral` -> `ReferralProgram/ReferralProgram.js`
- `/rank` -> `RankSystem/RankSystem.js`
- `/deposit` -> `newDeposit/NewDeposit.js`
- `/withdrawal` -> `newWithdrawal/NewWithdrawal.js`

## 3) Naming rules

- React component/page: `PascalCase.js`
- Hook: `useSomething.js`
- Utility/config: `camelCase.js`
- Component style: same feature folder, clear name (`FeatureName.css`)

## 4) Where to add new code

- New route page: `pages/` or feature folder, then register in `Routing.js`.
- New API endpoint: `api/apiConfig/apiConfig.js` + related method in `api/services/`.
- Shared UI used in many places: `customComponents/`.
- Feature-only UI/logic: keep inside that feature folder.
- Shared pure helper: `utils/`.
- Shared hook: `hooks/`.

## 5) Stability rules for team work

- Do not create duplicate filenames with different casing on Windows.
- Keep imports relative to folder ownership (avoid random cross-folder dumping).
- Keep route guards and auth redirects centralized in `Routing.js` / `Layout.js`.

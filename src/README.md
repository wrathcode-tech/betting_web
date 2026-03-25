# Source Folder Quick Guide

Use this file as the first stop before editing the project.

## App flow

- Entry point: `index.js`
- App shell: `App.js`
- Routes: `Routing.js`
- Shared layout wrapper: `Layout.js`

## Where to work

- `api/`: backend API setup and service methods
- `context/`: global providers (auth, balance, sportsbook, config)
- `customComponents/`: shared UI used across many pages (header/sidebar/footer/modals)
- `components/`: reusable generic widgets
- `hooks/`: reusable React hooks
- `utils/`: pure helpers and shared utility logic
- `pages/`: route pages (login, support, terms, histories)
- `StatementPages/`: reports and statement screens
- feature folders (`Casino/`, `SportsBook/`, `cricket/`, `GamePlay/`, `GameRule/`, etc.): feature-specific UI and logic

## Team conventions

- Keep route registration only in `Routing.js`.
- Prefer feature-local code in its own feature folder.
- Avoid case-only filename differences on Windows (`gamePlay.js` vs `GamePlay.js`).
- If a component is shared by multiple features, place it in `customComponents/` or `components/`.

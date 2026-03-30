/**
 * Warm lazy chunks on hover/touch before click — same import paths as Routing.js (one chunk per path).
 */
const prefetchers = {
  '/casino': () => import('../Casino/CasinoGame'),
  '/sports': () => import('../sports/SportsGame'),
  '/sportsbook': () => import('../SportsBook/SportsBook'),
  '/game-rules': () => import('../GameRule/GameRules'),
  '/transactions': () => import('../ProfileTransactions/ProfileTransactions'),
  '/my-bets': () => import('../StatementPages/MyBets'),
  '/bet-history': () => import('../pages/BetHistoryPage'),
  '/game-history': () => import('../GameHistory/GameHistory'),
  '/my-wallet': () => import('../StatementPages/MyWallet'),
  '/account-statement': () => import('../StatementPages/AccountStatement'),
  '/support': () => import('../pages/SupportPage'),
  '/notifications': () => import('../pages/NotificationsPage'),
  '/deposit': () => import('../newDeposit/NewDeposit'),
  '/withdrawal': () => import('../newWithdrawal/NewWithdrawal'),
}

/** Same modules as Routing.js lazy routes — warms cache so navigation rarely hits Suspense fallback */
const ALL_ROUTE_CHUNK_LOADERS = [
  () => import('../LandingPage/LandingPage'),
  () => import('../ProfilePage'),
  () => import('../Casino/CasinoGame'),
  () => import('../Casino/CasinoCategoryPage'),
  () => import('../GamePlay'),
  () => import('../GameHistory/GameHistory'),
  () => import('../sports/SportsGame'),
  () => import('../SportsBook/SportsBook'),
  () => import('../ProfileTransactions/ProfileTransactions'),
  () => import('../StatementPages/MyBets'),
  () => import('../StatementPages/MyWallet'),
  () => import('../StatementPages/TurnoverHistory'),
  () => import('../StatementPages/AccountStatement'),
  () => import('../StatementPages/BonusStatement'),
  () => import('../StatementPages/DepositTurnover'),
  () => import('../GameRule/GameRules'),
  () => import('../pages/TermsAndConditions'),
  () => import('../cricket/CricketDetail'),
  () => import('../newDeposit/NewDeposit'),
  () => import('../newWithdrawal/NewWithdrawal'),
  () => import('../BankDetails/AddAccount'),
  () => import('../BankDetails/AddBank'),
  () => import('../pages/LoginPage'),
  () => import('../pages/SupportPage'),
  () => import('../pages/DepositHistory'),
  () => import('../pages/WithdrawalHistory'),
  () => import('../pages/StatementHistory'),
  () => import('../pages/OpenBets'),
  () => import('../pages/BetHistoryPage'),
  () => import('../pages/ReferralRewards'),
  () => import('../pages/NotificationsPage'),
]

export function prefetchRoute(path) {
  if (!path || typeof path !== 'string') return
  const base = path.split('?')[0].replace(/\/$/, '') || '/'
  const loader = prefetchers[base]
  if (loader) loader().catch(() => {})
}

/**
 * After first paint, prefetch all lazy page chunks during idle time so sidebar / in-app nav
 * does not flash an empty or fallback frame.
 */
export function schedulePrefetchAllRouteChunks() {
  if (typeof window === 'undefined') return

  const run = () => {
    ALL_ROUTE_CHUNK_LOADERS.forEach((load) => {
      void load().catch(() => {})
    })
  }

  const ric = window.requestIdleCallback
  if (typeof ric === 'function') {
    ric.call(window, run, { timeout: 2000 })
  } else {
    window.setTimeout(run, 300)
  }
}

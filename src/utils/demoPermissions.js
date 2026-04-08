/**
 * Centralized demo vs real permission + balance display rules.
 * Real wallet (balance) must never be mixed with demoPlayBalance (WCO casino play money).
 */

export function isDemoUser(user) {
  return user?.isDemo === true;
}

export function canBetSportsbook(user) {
  return !isDemoUser(user);
}

export function canUseWallet(user) {
  return !isDemoUser(user);
}

/** Demo users can launch WCO / casino games using demo play balance. */
export function canPlayCasino(_user) {
  return true;
}

/**
 * Wallet UI: demo users always see 0 for real wallet.
 * @param {object|null} user
 * @param {number|null|undefined} liveWalletFromSocket - raw wallet from API/socket (ignored for demo)
 */
export function getDisplayWalletBalance(user, liveWalletFromSocket) {
  if (isDemoUser(user)) return 0;
  const n = Number(liveWalletFromSocket);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Casino / demo credits amount from profile.
 */
export function getDemoPlayBalanceFromUser(user) {
  if (!isDemoUser(user)) return null;
  const v = user?.demoPlayBalance ?? user?.demo_play_balance ?? 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * POST/PUT/PATCH/DELETE allowlist for demo users (everything else blocked in apiCall).
 * Must include refresh-token, logout, and WCO launch.
 */
export function isDemoMutationUrlAllowed(url) {
  if (!url || typeof url !== 'string') return false;
  const u = url.toLowerCase();
  if (u.includes('/auth/demo-login')) return true;
  if (u.includes('refresh-token')) return true;
  if (u.includes('/auth/logout')) return true;
  if (u.includes('/games/launch')) return true;
  return false;
}

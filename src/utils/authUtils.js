/**
 * Auth helpers for demo mode + storage (used by api guard, BalanceContext).
 */
export {
  isDemoUser,
  canBetSportsbook,
  canUseWallet,
  canPlayCasino,
  getDisplayWalletBalance,
  getDemoPlayBalanceFromUser,
  isDemoMutationUrlAllowed,
} from './demoPermissions';

/**
 * Get stored user from sessionStorage (for use outside React, e.g. apiCall).
 * @returns {object | null}
 */
export function getStoredUserForGuard() {
  try {
    const raw = sessionStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

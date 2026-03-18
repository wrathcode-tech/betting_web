/**
 * Auth helpers for demo (view-only) mode.
 * Use with centralized auth context and API layer.
 */

/**
 * @param {object | null} user - User from auth context / storage
 * @returns {boolean} true if user is in demo (view-only) mode
 */
export function isDemoUser(user) {
  return user?.isDemo === true;
}

/**
 * Get stored user from localStorage(for use outside React, e.g. apiCall).
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

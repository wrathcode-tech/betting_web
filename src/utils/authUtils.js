/**
 * Auth helpers for demo (view-only) mode.
 * Use with centralized auth context and API layer.
 */
import { getStoredUser } from './authStorage';

/**
 * @param {object | null} user - User from auth context / storage
 * @returns {boolean} true if user is in demo (view-only) mode
 */
export function isDemoUser(user) {
  return user?.isDemo === true;
}

/**
 * Get stored user (for use outside React, e.g. apiCall guard).
 * @returns {object | null}
 */
export function getStoredUserForGuard() {
  return getStoredUser();
}

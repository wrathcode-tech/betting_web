/**
 * Sportsbook domain helpers — align with backend socket + REST contract.
 */

export const SPORT_NAMES = ['cricket', 'tennis', 'soccer'];

export function isSportName(s) {
  return s === 'cricket' || s === 'tennis' || s === 'soccer';
}

import { getSportsbookSocket } from '../../socket/sportsbookSocket';

/**
 * Sportsbook WebSocket disabled — always returns null.
 */
export function useSportsbookSocket() {
  return getSportsbookSocket();
}

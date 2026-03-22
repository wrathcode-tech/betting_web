import { useEffect } from 'react';
import { connectSportsbookSocket, getSportsbookSocket } from '../socket/sportsbookSocket';

/**
 * Ensures a single `/sportsbook` connection for the tab; pass token from auth (guest allowed).
 */
export function useSportsbookSocket(token) {
  useEffect(() => {
    connectSportsbookSocket(token ?? null);
  }, [token]);

  return getSportsbookSocket();
}

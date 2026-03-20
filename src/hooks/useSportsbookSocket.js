/**
 * Ensures a single sportsbook socket connection; reconnects when auth changes.
 */
import { useEffect } from 'react';
import { getToken } from '../utils/authStorage';
import { connectSportsbookSocket } from '../socket/sportsbookSocket';

export default function useSportsbookSocket() {
  useEffect(() => {
    const sync = () => {
      connectSportsbookSocket(getToken() || null);
    };
    sync();
    window.addEventListener('loginStateChange', sync);
    return () => window.removeEventListener('loginStateChange', sync);
  }, []);
}

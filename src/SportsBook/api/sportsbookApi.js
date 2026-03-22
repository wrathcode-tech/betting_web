/**
 * REST layer — optional hydration / fallback only. All live data via Socket.IO.
 */
import axios from 'axios';

function apiOrigin() {
  return (process.env.REACT_APP_BETTING_API_URL || '').replace(/\/$/, '');
}

function authHeaders() {
  if (typeof sessionStorage === 'undefined') return {};
  const t = sessionStorage.getItem('token');
  if (!t) return {};
  return { Authorization: t.startsWith('Bearer ') ? t : `Bearer ${t}` };
}

function isRecord(v) {
  return v !== null && typeof v === 'object';
}

/**
 * GET /api/v1/sportsbook/:sport/odds?gameId=
 */
export async function fetchOddsByGameId(sport, gameId) {
  const base = apiOrigin();
  if (!base) return null;
  try {
    const { data } = await axios.get(`${base}/api/v1/sportsbook/${sport}/odds`, {
      params: { gameId },
      headers: authHeaders(),
      timeout: 15000,
    });
    if (!isRecord(data)) return null;
    const inner = data.data;
    if (inner && typeof inner === 'object') return inner;
    return data;
  } catch (e) {
    console.warn('[sportsbookApi] fetchOddsByGameId', e?.message);
    return null;
  }
}

/**
 * Optional list hydration — shape may differ from socket listSummary.
 */
export async function fetchMatchesList(sport) {
  const base = apiOrigin();
  if (!base) return null;
  try {
    const { data } = await axios.get(`${base}/api/v1/sportsbook/${sport}/matches`, {
      headers: authHeaders(),
      timeout: 15000,
    });
    return data;
  } catch (e) {
    console.warn('[sportsbookApi] fetchMatchesList', e?.message);
    return null;
  }
}

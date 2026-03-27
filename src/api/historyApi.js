import { ApiCallGet } from './apiConfig/apiCall';
import { ApiConfig } from './apiConfig/apiConfig';

const isDemoSession = () => {
  try {
    const raw = sessionStorage.getItem('user');
    if (!raw) return false;
    const user = JSON.parse(raw);
    return user?.isDemo === true;
  } catch {
    return false;
  }
};

function emptyHistoryResult(page = 1, limit = 20, key = 'data') {
  return Promise.resolve({
    success: true,
    [key]: [],
    pagination: { page: Number(page) || 1, limit: Number(limit) || 20, totalRecords: 0, totalPages: 1 },
  });
}

const authHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Build URL with optional query params. Omit null/undefined/empty string.
 */
function buildUrl(base, path, params = {}) {
  const url = base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== '') {
      searchParams.set(key, String(value).trim());
    }
  });
  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
}

/**
 * Standard history response: { success, message, data: [...], pagination: { page, limit, totalRecords, totalPages } }
 */

/** GET /wallet/deposit-transactions – page, limit, startDate, endDate, status, sort */
export function getDepositTransactions(params = {}) {
  const { page = 1, limit = 20, startDate, endDate, status, sort } = params;
  if (isDemoSession()) return emptyHistoryResult(page, limit);
  const url = buildUrl(ApiConfig.baseBettingWallet, ApiConfig.bettingDepositTransactions, {
    page,
    limit,
    startDate,
    endDate,
    status,
    sort,
  });
  return ApiCallGet(url, authHeaders());
}

/** GET /wallet/withdrawal-transactions – page, limit, startDate, endDate, status, sort */
export function getWithdrawalTransactions(params = {}) {
  const { page = 1, limit = 20, startDate, endDate, status, sort } = params;
  if (isDemoSession()) return emptyHistoryResult(page, limit);
  const url = buildUrl(ApiConfig.baseBettingWallet, ApiConfig.bettingWithdrawalTransactions, {
    page,
    limit,
    startDate,
    endDate,
    status,
    sort,
  });
  return ApiCallGet(url, authHeaders());
}

/** GET /wallet/statement – page, limit, from, to, type, sort */
export function getAccountStatement(params = {}) {
  const { page = 1, limit = 20, from, to, type, sort } = params;
  if (isDemoSession()) return emptyHistoryResult(page, limit);
  const url = buildUrl(ApiConfig.baseBettingWallet, ApiConfig.bettingWalletStatement, {
    page,
    limit,
    from,
    to,
    type,
    sort,
  });
  return ApiCallGet(url, authHeaders());
}

/** GET /api/v1/account/statement – page, limit, from, to, type, sort */
export function getAccountStatementFromAccount(params = {}) {
  const { page = 1, limit = 20, from, to, type, sort } = params;
  if (isDemoSession()) return emptyHistoryResult(page, limit);
  const base = ApiConfig.baseBettingAccount?.replace(/\/$/, '') ?? '';
  const path = ApiConfig.bettingAccountStatement ?? 'statement';
  const url = buildUrl(base, path, { page, limit, from, to, type, sort });
  return ApiCallGet(url, authHeaders());
}

/** GET /wallet/transactions/:id */
export function getWalletTransactionById(id) {
  const base = ApiConfig.baseBettingWallet.replace(/\/$/, '');
  const path = `${ApiConfig.bettingWalletTransactions}/${encodeURIComponent(id)}`;
  return ApiCallGet(`${base}/${path}`, authHeaders());
}

/** GET /sportsbook/bet/open – page, limit, gameId, marketType, sport */
export function getOpenBets(params = {}) {
  const { page = 1, limit = 20, gameId, marketType, sport } = params;
  if (isDemoSession()) return emptyHistoryResult(page, limit, 'data');
  const url = buildUrl(ApiConfig.baseBettingSportsbook, ApiConfig.bettingBetOpen, {
    page,
    limit,
    gameId,
    marketType,
    sport,
  });
  return ApiCallGet(url, authHeaders());
}

/** GET /sportsbook/bet/history – page, limit, sport, from, to, result, sort */
export function getBetHistory(params = {}) {
  const { page = 1, limit = 20, sport, from, to, result, sort } = params;
  if (isDemoSession()) return emptyHistoryResult(page, limit, 'data');
  const url = buildUrl(ApiConfig.baseBettingSportsbook, ApiConfig.bettingBetHistory, {
    page,
    limit,
    sport,
    from,
    to,
    result,
    sort,
  });
  return ApiCallGet(url, authHeaders());
}

/** GET /referral/rewards/history – page, limit, from, to, type, status, sort */
export function getReferralRewards(params = {}) {
  const { page = 1, limit = 20, from, to, type, status, sort } = params;
  if (isDemoSession()) return emptyHistoryResult(page, limit);
  const url = buildUrl(ApiConfig.baseBettingReferral, ApiConfig.bettingReferralRewardsHistory, {
    page,
    limit,
    from,
    to,
    type,
    status,
    sort,
  });
  return ApiCallGet(url, authHeaders());
}

import { ApiConfig } from "../apiConfig/apiConfig";
import { ApiCallGet, ApiCallPost, ApiCallPostFormData, ApiCallPut, ApiCallPutFormData, ApiCallPatch, ApiCallDelete } from "../apiConfig/apiCall";

// Read token from sessionStorage OR localStorage (for backward compatibility)
const getStoredToken = () => {
  try {
    return sessionStorage.getItem("token") || localStorage.getItem("token");
  } catch {
    try {
      return sessionStorage.getItem("token");
    } catch {
      return null;
    }
  }
};

const isDemoSession = () => {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return false;
    const user = JSON.parse(raw);
    return user?.isDemo === true;
  } catch {
    return false;
  }
};

const AuthService = {


  // ============================================================================
  // BETTING AUTH METHODS
  // ============================================================================

  bettingSendOtp: async (mobile) => {
    const { baseBettingAuth, bettingSendOtp } = ApiConfig;
    const url = baseBettingAuth + bettingSendOtp;
    const params = { mobile };
    const headers = { "Content-Type": "application/json" };
    return ApiCallPost(url, params, headers);
  },

  bettingRegister: async (mobile, otp, password, confirmPassword, referralCode = "") => {
    const { baseBettingAuth, bettingRegister } = ApiConfig;
    const url = baseBettingAuth + bettingRegister;
    const params = { mobile, otp, password, confirmPassword, referralCode };
    const headers = { "Content-Type": "application/json" };
    return ApiCallPost(url, params, headers);
  },

  bettingLogin: async (mobile, password) => {
    const { baseBettingAuth, bettingLogin } = ApiConfig;
    const url = baseBettingAuth + bettingLogin;
    const params = { mobile, password };
    const headers = { "Content-Type": "application/json" };
    return ApiCallPost(url, params, headers);
  },

  /** POST /api/v1/auth/demo-login – view-only guest. Returns { token, user: { id, username, balance: 0, currency, isDemo: true, expiresAt } }. */
  bettingDemoLogin: async () => {
    const { baseBettingAuth, bettingDemoLogin } = ApiConfig;
    const url = baseBettingAuth + bettingDemoLogin;
    const headers = { "Content-Type": "application/json" };
    return ApiCallPost(url, {}, headers);
  },

  bettingRefreshToken: async (refreshToken) => {
    const { baseBettingAuth, bettingRefreshToken } = ApiConfig;
    const url = baseBettingAuth + bettingRefreshToken;
    const params = { refreshToken };
    const headers = { "Content-Type": "application/json" };
    return ApiCallPost(url, params, headers);
  },

  bettingForgotPasswordSendOtp: async (mobile) => {
    const { baseBettingAuth, bettingForgotPasswordSendOtp } = ApiConfig;
    const url = baseBettingAuth + bettingForgotPasswordSendOtp;
    const params = { mobile };
    const headers = { "Content-Type": "application/json" };
    return ApiCallPost(url, params, headers);
  },

  bettingForgotPasswordReset: async (mobile, otp, newPassword, confirmNewPassword) => {
    const { baseBettingAuth, bettingForgotPasswordReset } = ApiConfig;
    const url = baseBettingAuth + bettingForgotPasswordReset;
    const params = { mobile, otp, newPassword, confirmNewPassword };
    const headers = { "Content-Type": "application/json" };
    return ApiCallPost(url, params, headers);
  },

  /** POST /auth/logout – body: { refreshToken } (per API doc). */
  bettingLogout: async () => {
    const token = sessionStorage.getItem("token");
    const refreshToken = sessionStorage.getItem("refreshToken");
    const { baseBettingAuth, bettingLogout } = ApiConfig;
    const url = baseBettingAuth + bettingLogout;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallPost(url, { refreshToken: refreshToken || "" }, headers);
  },

  bettingGetMe: async () => {
    const token = sessionStorage.getItem("token");
    const { baseBettingAuth, bettingGetMe } = ApiConfig;
    const url = baseBettingAuth + bettingGetMe;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallGet(url, headers);
  },

  bettingUpdateProfile: async (payload, profileImageFile = null) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingAuth, bettingUpdateProfile } = ApiConfig;
    const url = baseBettingAuth + bettingUpdateProfile;
    const authHeader = `Bearer ${token}`;
    const data = payload && typeof payload === "object" ? payload : {};
    // Always send as FormData (same as deposit) so backend gets consistent multipart body
    const formData = new FormData();
    formData.append("fullName", data.fullName != null ? String(data.fullName).trim() : "");
    formData.append("email", data.email != null ? String(data.email).trim() : "");
    if (profileImageFile) formData.append("profileImage", profileImageFile);
    return ApiCallPutFormData(url, formData, authHeader);
  },

  /** POST /auth/change-password – body: currentPassword, newPassword, confirmNewPassword (per API doc). */
  bettingChangePassword: async (currentPassword, newPassword, confirmNewPassword) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingAuth, bettingChangePassword } = ApiConfig;
    const url = baseBettingAuth + bettingChangePassword;
    const params = { currentPassword, newPassword, confirmNewPassword };
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallPost(url, params, headers);
  },

  bettingGetDepositOptions: async () => {
    const token = sessionStorage.getItem("token");
    const { baseBettingWallet, bettingDepositOptions } = ApiConfig;
    const url = baseBettingWallet + bettingDepositOptions;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/wallet/generate-address – auth required. No request body. */
  walletGenerateAddress: async () => {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingWallet, bettingGenerateAddress } = ApiConfig;
    const url = baseBettingWallet + bettingGenerateAddress;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/wallet/verify-usdt-deposit – checks newly arrived USDT deposits for generated BEP20 address. */
  walletVerifyUsdtDeposit: async () => {
    const token = getStoredToken();
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingWallet, bettingVerifyUsdtDeposit } = ApiConfig;
    const url = baseBettingWallet + bettingVerifyUsdtDeposit;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/user/platform-configuration – returns { success, data: { depositServiceStatus, withdrawalServiceStatus, referralServiceStatus, ... } }. */
  getPlatformConfiguration: async () => {
    const token = sessionStorage.getItem("token");
    const { baseBettingUser, platformConfiguration } = ApiConfig;
    const url = `${baseBettingUser}/${platformConfiguration}`;
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/user/transaction-limits – min/max deposit & withdrawal, bonus %, min wager for withdrawal. */
  getTransactionLimits: async () => {
    const token = sessionStorage.getItem("token");
    const { baseBettingUser, transactionLimits } = ApiConfig;
    const url = `${baseBettingUser}/${transactionLimits}`;
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/user/deposit-accounts/master – auth required. Returns { data: { accounts, source } }. */
  getMasterDepositAccounts: async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingUser, depositAccountsMaster } = ApiConfig;
    const url = `${baseBettingUser}/${depositAccountsMaster}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/user/notifications – auth required. Supports optional page/limit query params. */
  getUserNotifications: async (params = {}) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingUser, userNotifications } = ApiConfig;
    const q = new URLSearchParams();
    if (params.page != null) q.set("page", String(params.page));
    if (params.limit != null) q.set("limit", String(params.limit));
    const qs = q.toString();
    const url = `${baseBettingUser}/${userNotifications}${qs ? `?${qs}` : ""}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** PATCH /api/v1/user/notifications/mark-all-read – auth required. */
  markAllNotificationsRead: async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingUser, userNotificationsMarkAllRead } = ApiConfig;
    const url = `${baseBettingUser}/${userNotificationsMarkAllRead}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPatch(url, {}, headers);
  },

  /** PATCH /api/v1/user/notifications/:id/read – auth required. */
  markNotificationRead: async (notificationId) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const id = notificationId != null ? String(notificationId).trim() : "";
    if (!id) return { success: false, message: "Notification id required" };
    const { baseBettingUser, userNotifications } = ApiConfig;
    const url = `${baseBettingUser}/${userNotifications}/${encodeURIComponent(id)}/read`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPatch(url, {}, headers);
  },

  bettingGetBalance: async () => {
    const token = sessionStorage.getItem("token");
    const { baseBettingWallet, bettingBalance } = ApiConfig;
    const url = baseBettingWallet + bettingBalance;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/wallet/deposit-transactions – auth required. Returns { data: { transactions, pagination } }. */
  walletDepositTransactions: async (page = 1, limit = 10) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingWallet, bettingDepositTransactions } = ApiConfig;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const url = `${baseBettingWallet}${bettingDepositTransactions}?${params.toString()}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/wallet/transactions – list with pagination (page, limit, type). Returns { data: { transactions, pagination } }. */
  walletTransactions: async (page = 1, limit = 10, type = "all") => {
    if (isDemoSession()) {
      return {
        success: true,
        data: {
          transactions: [],
          pagination: { page: Number(page) || 1, limit: Number(limit) || 10, total: 0, totalPages: 1 },
        },
      };
    }
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingWallet, bettingWalletTransactions } = ApiConfig;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type && type !== "all") params.set("type", type);
    const base = baseBettingWallet.replace(/\/$/, "");
    const path = bettingWalletTransactions.replace(/^\//, "");
    const url = `${base}/${path}?${params.toString()}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/wallet/transactions/:id – single transaction by ID (Section 2). */
  walletTransactionById: async (transactionId) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const id = transactionId != null ? String(transactionId).trim() : "";
    if (!id) return { success: false, message: "Transaction ID required" };
    const { baseBettingWallet, bettingWalletTransactions } = ApiConfig;
    const base = baseBettingWallet.replace(/\/$/, "");
    const path = bettingWalletTransactions.replace(/^\//, "");
    const url = `${base}/${path}/${encodeURIComponent(id)}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/wallet/withdrawal-transactions – auth required. Returns { data: { transactions, pagination } }. */
  walletWithdrawalTransactions: async (page = 1, limit = 10) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingWallet, bettingWithdrawalTransactions } = ApiConfig;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const url = `${baseBettingWallet}${bettingWithdrawalTransactions}?${params.toString()}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** POST /api/v1/wallet/withdrawal – auth required. Body: { accountId, amount, otp, note }. */
  walletWithdrawal: async (accountId, amount, otp, note = "") => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingWallet, bettingWithdrawal } = ApiConfig;
    const url = baseBettingWallet + bettingWithdrawal;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const payload = {
      accountId,
      amount: Number(amount),
      otp: String(otp || "").trim(),
      note: String(note || "").slice(0, 200),
    };
    return ApiCallPost(url, payload, headers);
  },

  /** POST /api/v1/wallet/send-withdrawal-otp – auth required. Body: empty {}. Sends OTP to user's registered mobile. */
  walletRequestWithdrawalOtp: async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingWallet, bettingSendWithdrawalOtp } = ApiConfig;
    const url = baseBettingWallet + bettingSendWithdrawalOtp;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, {}, headers);
  },

  /** POST /api/v1/wallet/send-withdrawal-otp – auth required. Body: { accountId, amount, otp, note }. Verifies OTP and processes withdrawal. */
  walletSendWithdrawalOtp: async (accountId, amount, note = "", otp = "") => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingWallet, bettingSendWithdrawalOtp } = ApiConfig;
    const url = baseBettingWallet + bettingSendWithdrawalOtp;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const payload = {
      accountId,
      amount: Number(amount),
      note: String(note || "").slice(0, 200),
      otp: String(otp || "").trim(),
    };
    return ApiCallPost(url, payload, headers);
  },

  bettingCreateDeposit: async (payload, paymentProofFile = null) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingWallet, bettingDeposit } = ApiConfig;
    const url = baseBettingWallet + bettingDeposit;
    const authHeader = `Bearer ${token}`;
    const data = payload && typeof payload === "object" ? payload : {};
    if (paymentProofFile) {
      const formData = new FormData();
      formData.append("amount", String(data.amount ?? ""));
      formData.append("utrNumber", String(data.utrNumber ?? ""));
      formData.append("paymentMethod", String(data.paymentMethod ?? "upi"));
      if (data.remarks != null) formData.append("remarks", String(data.remarks));
      if (data.adminDetailId) formData.append("adminDetailId", String(data.adminDetailId));
      formData.append("paymentProof", paymentProofFile);
      return ApiCallPostFormData(url, formData, authHeader);
    }
    const headers = { "Content-Type": "application/json", Authorization: authHeader };
    return ApiCallPost(url, data, headers);
  },

  /** Uses auth route POST /api/v1/auth/send-otp-bank (same base as signup OTP) */
  bettingBankAccountsSendOtp: async () => {
    const token = sessionStorage.getItem("token");
    const { baseBettingAuth, bettingSendOtpBank } = ApiConfig;
    const url = baseBettingAuth + bettingSendOtpBank;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, {}, headers);
  },

  bettingBankAccountsAdd: async (payload) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingBankAccounts } = ApiConfig;
    const url = baseBettingBankAccounts;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, payload, headers);
  },

  bettingBankAccountsList: async () => {
    const token = sessionStorage.getItem("token");
    const { baseBettingBankAccounts } = ApiConfig;
    const url = baseBettingBankAccounts;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  bettingBankAccountsDelete: async (accountId) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingBankAccounts } = ApiConfig;
    const url = `${baseBettingBankAccounts}/${accountId}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallDelete(url, headers);
  },

  bettingBankAccountsSetDefault: async (accountId) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingBankAccounts } = ApiConfig;
    const url = `${baseBettingBankAccounts}/${accountId}/default`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPatch(url, {}, headers);
  },

  // ---------- Betting Games (WCO – list + launch for iframe) ----------
  bettingGamesGetProviders: async () => {
    const token = sessionStorage.getItem("token");
    const { baseBettingGames, bettingGamesProviders } = ApiConfig;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(baseBettingGames + bettingGamesProviders, headers);
  },
  bettingGamesGetCategories: async () => {
    const token = sessionStorage.getItem("token");
    const { baseBettingGames, bettingGamesCategories } = ApiConfig;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(baseBettingGames + bettingGamesCategories, headers);
  },
  bettingGamesByCategory: async (category, page = 1, limit = 20, search = "") => {
    const token = sessionStorage.getItem("token");
    const { baseBettingGames } = ApiConfig;
    const params = new URLSearchParams({ page, limit });
    if (search) params.set("search", search);
    const url = `${baseBettingGames}category/${encodeURIComponent(category)}?${params}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },
  bettingGamesByProvider: async (providerCode, page = 1, limit = 20, search = "") => {
    const token = sessionStorage.getItem("token");
    const { baseBettingGames } = ApiConfig;
    const params = new URLSearchParams({ page, limit });
    if (search) params.set("search", search);
    const url = `${baseBettingGames}provider/${encodeURIComponent(providerCode)}?${params}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },
  /** GET /api/v1/games?providerCode=&category=&page=1&limit=20. providerCode "all" (case-insensitive) → "ALL" (no provider filter). */
  bettingGamesList: async (providerCode, category = "all", page = 1, limit = 20) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingGames } = ApiConfig;
    const normalizedProvider = providerCode && String(providerCode).toLowerCase() === "all" ? "ALL" : providerCode;
    const params = new URLSearchParams({ providerCode: normalizedProvider, page, limit: Math.min(limit, 50) });
    if (category && category !== "all") params.set("category", category);
    const base = baseBettingGames.replace(/\/$/, "");
    const url = `${base}?${params}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },
  bettingGamesFeatured: async (limit = 20) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingGames, bettingGamesFeatured } = ApiConfig;
    const url = `${baseBettingGames}${bettingGamesFeatured}?limit=${limit}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },
  bettingGamesPopular: async (limit = 20) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingGames, bettingGamesPopular } = ApiConfig;
    const url = `${baseBettingGames}${bettingGamesPopular}?limit=${limit}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },
  /** GET /api/v1/games/landing – no auth. Returns liveCasino, slots, trending, roulette, cardGames. */
  bettingGamesLanding: async () => {
    const { baseBettingGames, bettingGamesLanding } = ApiConfig;
    const url = baseBettingGames + bettingGamesLanding;
    const headers = { "Content-Type": "application/json" };
    return ApiCallGet(url, headers);
  },
  /** Launch game – returns launchURL for iframe. Requires login. */
  bettingGamesLaunch: async (gameCode, providerCode, platform = "desktop") => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required to play" };
    const { baseBettingGames, bettingGamesLaunch } = ApiConfig;
    const url = baseBettingGames + bettingGamesLaunch;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, { gameCode, providerCode, platform }, headers);
  },

  /** POST /api/v1/games/launch-sportsbook – Launch BT sportsbook. Body: { platform: "desktop", gameCode: null, providerCode: "BT" }. Returns { status, message, data: { launchURL, sessionId, providerCode, balance } }. */
  gamesLaunchSportsbook: async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return { status: "error", message: "Login required" };
    const { baseBettingGames, bettingGamesLaunchSportsbook } = ApiConfig;
    const url = baseBettingGames + bettingGamesLaunchSportsbook;
    const body = { platform: "desktop", gameCode: null, providerCode: "BT" };
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, body, headers);
  },

  /** GET /api/v1/sportsbook/{sportName}/matches – Public. sportName: cricket | soccer | tennis. Query: fresh=1. Response: { success, data: { data: [...], count }, message }. */
  sportsbookMatches: async (sportName, options = {}) => {
    const { baseBettingSportsbook } = ApiConfig;
    const params = new URLSearchParams();
    if (options.fresh) params.set("fresh", "1");
    const q = params.toString();
    const url = `${baseBettingSportsbook}/${encodeURIComponent(sportName)}/matches${q ? `?${q}` : ""}`;
    // Public endpoint — do not send Bearer (demo JWT is rejected by some gateways as "Token is expired")
    const headers = { "Content-Type": "application/json" };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/sportsbook/{sportName}/odds?gameId={gameId} or ?eventId={eventId} for tennis. Public; no auth. */
  sportsbookOdds: async (sportName, gameIdOrEventId) => {
    const { baseBettingSportsbook } = ApiConfig;
    const isTennis = String(sportName).toLowerCase() === "tennis";
    const param = isTennis ? "eventId" : "gameId";
    const url = `${baseBettingSportsbook}/${encodeURIComponent(sportName)}/odds?${param}=${encodeURIComponent(gameIdOrEventId)}`;
    const headers = { "Content-Type": "application/json" };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/sportsbook/score?eventId={eventId} – public; returns { liveScore } (same shape as socket) for guests. */
  sportsbookScore: async (eventId) => {
    if (!eventId) return { liveScore: null };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/score?eventId=${encodeURIComponent(eventId)}`;
    const headers = { "Content-Type": "application/json" };
    const res = await ApiCallGet(url, headers);
    const liveScore = res?.liveScore ?? res?.data?.liveScore ?? null;
    return { liveScore };
  },

  /** Professorji scorecard: GET https://apis.professorji.in/api/scorecard?eventId=...&sport=cricket&matchName=... */
  sportsbookProfessorjiScorecard: async ({ eventId, sport = "cricket", matchName } = {}) => {
    if (!eventId) return { liveScore: null, raw: null };
    const params = new URLSearchParams();
    params.set("id", String(eventId));
    params.set("sport", String(sport || "cricket"));
    if (matchName != null && String(matchName).trim() !== "") {
      params.set("matchName", String(matchName).trim());
    }
    const url = `https://score.akamaized.uk/?${params.toString()}`;
    let raw = null;
    try {
      // Use fetch to avoid axios auth interceptor side-effects (unexpected logout on external 401).
      const resp = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "omit",
      });
      if (!resp.ok) return { liveScore: null, raw: null };
      raw = await resp.json();
    } catch {
      return { liveScore: null, raw: null };
    }
    const liveScore =
      raw?.liveScore ??
      raw?.LiveScore ??
      (raw?.ScoreData ? raw : null);
    return { liveScore, raw };
  },

  /** Professorji TV URL: GET https://apis.professorji.in/api/tv?eventId=...&sport=cricket */
  sportsbookProfessorjiTv: async ({ eventId, sport = "cricket" } = {}) => {
    if (!eventId) return { tvUrl: null, raw: null };
    const params = new URLSearchParams();
    params.set("eventId", String(eventId));
    params.set("sport", String(sport || "cricket"));
    const url = `https://apis.professorji.in/api/tv?${params.toString()}`;
    let raw = null;
    try {
      const resp = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "omit",
      });
      if (!resp.ok) return { tvUrl: null, raw: null };
      raw = await resp.json();
    } catch {
      return { tvUrl: null, raw: null };
    }
    const tvUrl =
      raw?.tvUrl ??
      raw?.tv_url ??
      raw?.data?.tvUrl ??
      raw?.data?.tv_url ??
      null;
    return { tvUrl, raw };
  },

  /** GET /api/v1/sportsbook/event/config?eventId=<gameId> – tvUrl for live stream (Berlin). Response: { response: { tvUrl, eventId, minStack, maxStack, ... } }. */
  sportsbookEventConfig: async (eventId) => {
    if (!eventId) return { tvUrl: null };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/event/config?eventId=${encodeURIComponent(eventId)}`;
    const headers = { "Content-Type": "application/json" };
    const res = await ApiCallGet(url, headers);
    const response = res?.response ?? res?.data ?? res;
    const tvUrl = response?.tvUrl ?? response?.tv_url ?? null;
    return { tvUrl, ...response };
  },

  /** GET /api/v1/games/history – sessions list. Query: page, limit, from, to (ISO date). */
  gamesHistory: async (params = {}) => {
    if (isDemoSession()) {
      const page = Number(params.page ?? 1) || 1;
      const limit = Number(params.limit ?? 10) || 10;
      return { success: true, data: { sessions: [], pagination: { page, limit, total: 0, totalPages: 1 } } };
    }
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingGames, bettingGamesHistory } = ApiConfig;
    const q = new URLSearchParams();
    q.set("page", String(params.page != null ? params.page : 1));
    q.set("limit", String(params.limit != null ? params.limit : 10));
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    const url = `${baseBettingGames}${bettingGamesHistory}?${q.toString()}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/games/transactions – rounds (game, date, bet, result, amount). Query: page, limit, gameCode, providerCode. */
  gamesTransactions: async (page = 1, limit = 20, opts = {}) => {
    if (isDemoSession()) {
      return {
        success: true,
        data: { transactions: [], pagination: { page: Number(page) || 1, limit: Number(limit) || 20, total: 0, totalPages: 1 } },
      };
    }
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingGames, bettingGamesTransactions } = ApiConfig;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (opts.gameCode) params.set("gameCode", opts.gameCode);
    if (opts.providerCode) params.set("providerCode", opts.providerCode);
    const url = `${baseBettingGames}${bettingGamesTransactions}?${params.toString()}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/games/transaction-history – ledger (date, credit, debit, balance, remark). Query: page, limit, from, to. */
  gamesTransactionHistory: async (params = {}) => {
    if (isDemoSession()) {
      const page = Number(params.page ?? 1) || 1;
      const limit = Number(params.limit ?? 20) || 20;
      return { success: true, data: { transactions: [], pagination: { page, limit, total: 0, totalPages: 1 } } };
    }
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingGames, bettingGamesTransactionHistory } = ApiConfig;
    const q = new URLSearchParams();
    q.set("page", String(params.page != null ? params.page : 1));
    q.set("limit", String(params.limit != null ? params.limit : 20));
    if (params.from) q.set("from", params.from);
    if (params.to) q.set("to", params.to);
    const url = `${baseBettingGames}${bettingGamesTransactionHistory}?${q.toString()}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/games/sportsbook/transactions – auth required. Returns { status, data: { transactions, pagination } }. */
  gamesSportsbookTransactions: async (page = 1, limit = 10) => {
    if (isDemoSession()) {
      return {
        success: true,
        data: { transactions: [], pagination: { page: Number(page) || 1, limit: Number(limit) || 10, total: 0, totalPages: 1 } },
      };
    }
    const token = sessionStorage.getItem("token");
    if (!token) return { status: "error", message: "Login required" };
    const { baseBettingGames, gamesSportsbookTransactions } = ApiConfig;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const url = `${baseBettingGames}${gamesSportsbookTransactions}?${params.toString()}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/games/sportsbook/transaction-history – auth required. Returns { status, data: { transactions, pagination } }. */
  gamesSportsbookTransactionHistory: async (page = 1, limit = 20) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { status: "error", message: "Login required" };
    const { baseBettingGames, gamesSportsbookTransactionHistory } = ApiConfig;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const url = `${baseBettingGames}${gamesSportsbookTransactionHistory}?${params.toString()}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** POST /api/v1/sportsbook/place-bet — Headers: Authorization: Bearer (access token), Content-Type: application/json. Body: sport, gameId, eventName, seriesName?, eventTime?, marketType, marketId, marketName?, selectionId, selectionName, betType, odds, stake, isLive?, requestId? */
  sportsbookPlaceBet: async (body) => {
    const raw = sessionStorage.getItem("token");
    if (!raw) return { success: false, message: "Login required" };
    const token = String(raw).replace(/^\s*Bearer\s+/i, "").trim();
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/place-bet`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallPost(url, body, headers);
  },

  /** POST /api/v1/sportsbook/bet/{betId}/cancel – Cancel an open bet. */
  sportsbookCancelBet: async (betId) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/bet/${encodeURIComponent(betId)}/cancel`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, {}, headers);
  },

  /** POST /api/v1/sportsbook/bet/{betId}/cashout – Execute cashout. Socket: betUpdate (cashed_out) + balance. */
  sportsbookCashout: async (betId) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/bet/${encodeURIComponent(betId)}/cashout`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, {}, headers);
  },

  /** POST /api/v1/sportsbook/bet/{betId}/loss-cut – Cashout only when in loss; returns 400 if profit/break-even. */
  sportsbookLossCut: async (betId) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/bet/${encodeURIComponent(betId)}/loss-cut`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, {}, headers);
  },

  /** GET /api/v1/sportsbook/loss-limit – Current loss limit settings (dailyLossLimit, isActive, currency). */
  sportsbookGetLossLimit: async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/loss-limit`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },

  /** PUT /api/v1/sportsbook/loss-limit – Set daily loss limit. Body: { dailyLossLimit: number | null }. */
  sportsbookSetLossLimit: async (dailyLossLimit) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/loss-limit`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const body = dailyLossLimit == null || dailyLossLimit === "" ? { dailyLossLimit: null } : { dailyLossLimit: Number(dailyLossLimit) };
    return ApiCallPut(url, body, headers);
  },

  /** GET /api/v1/sportsbook/bet/open – Open bets. Query: gameId, marketType, sport, page, limit. Auth: Bearer. Response: { data: { bets: [...] } } or similar. */
  sportsbookOpenBets: async (params = {}) => {
    if (isDemoSession()) {
      const page = Number(params.page ?? 1) || 1;
      const limit = Number(params.limit ?? 20) || 20;
      return { success: true, data: { bets: [], pagination: { page, limit, total: 0, totalPages: 1 } } };
    }
    const token = sessionStorage.getItem("token");
    const { baseBettingSportsbook } = ApiConfig;
    const q = new URLSearchParams(params).toString();
    const url = `${baseBettingSportsbook}/bet/open${q ? `?${q}` : ""}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/sportsbook/bet/history – Bet history. Query: page, limit, sport, from, to, result (won | lost | void). */
  sportsbookBetHistory: async (params = {}) => {
    if (isDemoSession()) {
      const page = Number(params.page ?? 1) || 1;
      const limit = Number(params.limit ?? 20) || 20;
      return { success: true, data: { bets: [], pagination: { page, limit, total: 0, totalPages: 1 } } };
    }
    const token = sessionStorage.getItem("token");
    const { baseBettingSportsbook } = ApiConfig;
    const q = new URLSearchParams(params).toString();
    const url = `${baseBettingSportsbook}/bet/history${q ? `?${q}` : ""}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/sportsbook/bet/summary – Dashboard: openBetsCount, totalExposure, todayPnl. Define before /bet/:betId. */
  sportsbookBetSummary: async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/bet/summary`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/sportsbook/bet/{betId} – Single bet details (betId = 24-char hex). */
  sportsbookBetById: async (betId) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/bet/${encodeURIComponent(betId)}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/sportsbook/realtime-pnl – Real-time P&L (open bets, cashoutValue, realtimePnl). */
  sportsbookRealtimePnl: async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/realtime-pnl`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/sportsbook/exposure – User exposure (total and per-market risk in INR). */
  sportsbookExposure: async () => {
    const token = sessionStorage.getItem("token");
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/exposure`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/sportsbook/profit-loss – P&L. Params: sport, from, to. */
  sportsbookProfitLoss: async (params = {}) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingSportsbook } = ApiConfig;
    const q = new URLSearchParams(params).toString();
    const url = `${baseBettingSportsbook}/profit-loss${q ? `?${q}` : ""}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/sportsbook/betfair-result/{type}?marketId=X – type: match-odds | bookmaker | fancy. marketId comma-separated for multiple. */
  sportsbookBetfairResult: async (type, marketId) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/betfair-result/${encodeURIComponent(type)}?marketId=${encodeURIComponent(marketId)}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },

  // ============================================================================
  // SUPPORT / TICKETS
  // ============================================================================

  /** GET /api/v1/support/tickets – List tickets. Query: search?, status? (open|in_progress|resolved|closed), page, limit. */
  getUserTickets: async (params = {}) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSupport, supportTickets } = ApiConfig;
    const q = new URLSearchParams();
    if (params.search != null) q.set("search", params.search);
    if (params.status != null) q.set("status", params.status);
    if (params.page != null) q.set("page", String(params.page));
    if (params.limit != null) q.set("limit", String(params.limit));
    const url = `${baseBettingSupport}/${supportTickets}${q.toString() ? `?${q}` : ""}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/support/tickets/:ticketId – Ticket detail + messages (chat). */
  getTicketDetail: async (ticketId) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSupport, supportTickets } = ApiConfig;
    const url = `${baseBettingSupport}/${supportTickets}/${encodeURIComponent(ticketId)}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** POST /api/v1/support/tickets – Create ticket. Body: { subject, category, priority?, description, attachmentUrl?, attachmentName? }. category: deposit|withdrawal|betting|casino|launchpad|account|other. priority: low|medium|high. */
  submitTicket: async (body) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSupport, supportTickets } = ApiConfig;
    const url = `${baseBettingSupport}/${supportTickets}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const payload = typeof body === "object" && body != null ? body : {};
    return ApiCallPost(url, payload, headers);
  },

  /** POST /api/v1/support/tickets/:ticketId/messages – Send message. Body: { message, attachmentUrl?, attachmentName? }. */
  replyTicket: async (ticketId, body) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSupport, supportTickets } = ApiConfig;
    const url = `${baseBettingSupport}/${supportTickets}/${encodeURIComponent(ticketId)}/messages`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const payload = typeof body === "object" && body != null ? body : {};
    return ApiCallPost(url, payload, headers);
  },

  /** PATCH /api/v1/support/tickets/:ticketId/close – Close ticket. */
  closeTicket: async (ticketId) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSupport, supportTickets } = ApiConfig;
    const url = `${baseBettingSupport}/${supportTickets}/${encodeURIComponent(ticketId)}/close`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPatch(url, {}, headers);
  },

  // ============================================================================
  // REFERRAL (Section 5) – protected
  // ============================================================================
  referralDashboard: async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingReferral } = ApiConfig;
    const url = `${baseBettingReferral}/dashboard`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },
  referralBalance: async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingReferral } = ApiConfig;
    const url = `${baseBettingReferral}/balance`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },
  referralClaim: async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingReferral } = ApiConfig;
    const url = `${baseBettingReferral}/balance/claim`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, {}, headers);
  },
  referralList: async (params = {}) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingReferral } = ApiConfig;
    const q = new URLSearchParams(params).toString();
    const url = `${baseBettingReferral}/referrals${q ? `?${q}` : ""}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },
  referralApply: async (referralCode) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingReferral } = ApiConfig;
    const url = `${baseBettingReferral}/apply`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, { referralCode: String(referralCode || "").trim() }, headers);
  },
  /** GET /api/v1/referral/referrals/export?from&to – CSV export (Section 5). */
  referralExport: async (params = {}) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingReferral } = ApiConfig;
    const q = new URLSearchParams(params).toString();
    const url = `${baseBettingReferral}/referrals/export${q ? `?${q}` : ""}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },
  /** GET /api/v1/referral/profit?page&limit – profit per referred user. */
  referralProfit: async (params = {}) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingReferral } = ApiConfig;
    const q = new URLSearchParams(params).toString();
    const url = `${baseBettingReferral}/profit${q ? `?${q}` : ""}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },
  /** GET /api/v1/referral/rewards/history?page&limit&from&to. */
  referralRewardsHistory: async (params = {}) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingReferral } = ApiConfig;
    const q = new URLSearchParams(params).toString();
    const url = `${baseBettingReferral}/rewards/history${q ? `?${q}` : ""}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  // ============================================================================
  // SEARCH (Section 6) – public, rate limited. Doc: ?q= or ?query= & limit
  // ============================================================================
  searchTrending: async (limit = 20) => {
    const { baseBettingSearch } = ApiConfig;
    const url = `${baseBettingSearch}/trending?limit=${Math.min(limit, 50)}`;
    const headers = { "Content-Type": "application/json" };
    return ApiCallGet(url, headers);
  },
  search: async (query, limit = 15) => {
    const { baseBettingSearch } = ApiConfig;
    const q = new URLSearchParams({ limit: Math.min(limit, 50) });
    const term = query != null ? String(query).trim() : "";
    if (term) {
      q.set("q", term);
      q.set("query", term);
    }
    const url = `${baseBettingSearch}${q.toString() ? `?${q}` : "?"}`;
    const headers = { "Content-Type": "application/json" };
    return ApiCallGet(url, headers);
  },

  // ============================================================================
  // END OF BETTING AUTH METHODS
  // ============================================================================

}

export default AuthService;

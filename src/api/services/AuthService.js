import { ApiConfig } from "../apiConfig/apiConfig";
import { ApiCallGet, ApiCallGetVerifyRegistration, ApiCallPost, ApiCallPostFormData, ApiCallPut, ApiCallPutFormData, ApiCallPatch, ApiCallDelete } from "../apiConfig/apiCall";
import { ConsoleLogs } from "../../utils/ConsoleLogs";

const TAG = "AuthService";

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

  bettingForgotPasswordReset: async (mobile, otp, newPassword, confirmPassword) => {
    const { baseBettingAuth, bettingForgotPasswordReset } = ApiConfig;
    const url = baseBettingAuth + bettingForgotPasswordReset;
    const params = { mobile, otp, newPassword, confirmPassword };
    const headers = { "Content-Type": "application/json" };
    return ApiCallPost(url, params, headers);
  },

  bettingLogout: async () => {
    const token = sessionStorage.getItem("token");
    const { baseBettingAuth, bettingLogout } = ApiConfig;
    const url = baseBettingAuth + bettingLogout;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallPost(url, {}, headers);
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

  bettingChangePassword: async (currentPassword, newPassword, confirmPassword) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingAuth, bettingChangePassword } = ApiConfig;
    const url = baseBettingAuth + bettingChangePassword;
    const params = { currentPassword, newPassword, confirmPassword };
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

  /** GET /api/v1/user/deposit-accounts/master – auth required. Returns { data: { accounts, source } }. */
  getMasterDepositAccounts: async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingUser, depositAccountsMaster } = ApiConfig;
    const url = `${baseBettingUser}/${depositAccountsMaster}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
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
    console.log("🚀 ~ token:", token)
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

  /** GET /api/v1/sportsbook/{sportName}/matches – sportName: cricket | soccer | tennis. Auth optional (public). Query: fresh=1 to bypass cache. */
  sportsbookMatches: async (sportName, options = {}) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingSportsbook } = ApiConfig;
    const params = new URLSearchParams();
    if (options.fresh) params.set("fresh", "1");
    const q = params.toString();
    const url = `${baseBettingSportsbook}/${encodeURIComponent(sportName)}/matches${q ? `?${q}` : ""}`;
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/sportsbook/{sportName}/odds?gameId={gameId} – matchOdds, bookMakerOdds, fancyOdds, premiumFancy. Auth required. */
  sportsbookOdds: async (sportName, gameId) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required for odds" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/${encodeURIComponent(sportName)}/odds?gameId=${encodeURIComponent(gameId)}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/games/transactions?page=1&limit=20 – auth required. Returns { data: { transactions, pagination } }. */
  gamesTransactions: async (page = 1, limit = 20) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingGames, bettingGamesTransactions } = ApiConfig;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const url = `${baseBettingGames}${bettingGamesTransactions}?${params.toString()}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/games/sportsbook/transactions – auth required. Returns { status, data: { transactions, pagination } }. */
  gamesSportsbookTransactions: async (page = 1, limit = 10) => {
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

  /** POST /api/v1/sportsbook/bet/place – Place a back/lay bet. Body: sport, gameId, eventName, marketType, marketId, selectionId, selectionName, betType, odds, stake, etc. */
  sportsbookPlaceBet: async (body) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/bet/place`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
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

  /** GET /api/v1/sportsbook/bet/{betId}/cashout-value – Get cashout value for a bet. */
  sportsbookCashoutValue: async (betId) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/bet/${encodeURIComponent(betId)}/cashout-value`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
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

  /** PUT /api/v1/sportsbook/loss-limit – Set/update daily loss limit. Body: { dailyLossLimit } (0–500000 or null to remove). */
  sportsbookSetLossLimit: async (dailyLossLimit) => {
    const token = sessionStorage.getItem("token");
    if (!token) return { success: false, message: "Login required" };
    const { baseBettingSportsbook } = ApiConfig;
    const url = `${baseBettingSportsbook}/loss-limit`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const body = dailyLossLimit == null || dailyLossLimit === "" ? { dailyLossLimit: null } : { dailyLossLimit: Number(dailyLossLimit) };
    return ApiCallPut(url, body, headers);
  },

  /** GET /api/v1/sportsbook/bet/open – Open bets. Query: page, limit, gameId, marketType, sport. */
  sportsbookOpenBets: async (params = {}) => {
    const token = sessionStorage.getItem("token");
    const { baseBettingSportsbook } = ApiConfig;
    const q = new URLSearchParams(params).toString();
    const url = `${baseBettingSportsbook}/bet/open${q ? `?${q}` : ""}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },

  /** GET /api/v1/sportsbook/bet/history – Bet history. Query: page, limit, sport, from, to, result (won | lost | void). */
  sportsbookBetHistory: async (params = {}) => {
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
  // END OF BETTING AUTH METHODS
  // ============================================================================

}

export default AuthService;

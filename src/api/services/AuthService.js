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
    const token = localStorage.getItem("token");
    const { baseBettingAuth, bettingLogout } = ApiConfig;
    const url = baseBettingAuth + bettingLogout;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallPost(url, {}, headers);
  },

  bettingGetMe: async () => {
    const token = localStorage.getItem("token");
    const { baseBettingAuth, bettingGetMe } = ApiConfig;
    const url = baseBettingAuth + bettingGetMe;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallGet(url, headers);
  },

  bettingUpdateProfile: async (payload, profileImageFile = null) => {
    const token = localStorage.getItem("token");
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
    const token = localStorage.getItem("token");
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
    const token = localStorage.getItem("token");
    const { baseBettingWallet, bettingDepositOptions } = ApiConfig;
    const url = baseBettingWallet + bettingDepositOptions;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallGet(url, headers);
  },

  bettingGetBalance: async () => {
    const token = localStorage.getItem("token");
    const { baseBettingWallet, bettingBalance } = ApiConfig;
    const url = baseBettingWallet + bettingBalance;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallGet(url, headers);
  },

  bettingGetTransactions: async (page = 1, limit = 10, type = "deposit,withdrawal", status = "") => {
    const token = localStorage.getItem("token");
    const { baseBettingWallet, bettingTransactions } = ApiConfig;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    const url = `${baseBettingWallet}${bettingTransactions}?${params.toString()}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return ApiCallGet(url, headers);
  },

  bettingCreateDeposit: async (payload, paymentProofFile = null) => {
    const token = localStorage.getItem("token");
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
    const token = localStorage.getItem("token");
    const { baseBettingAuth, bettingSendOtpBank } = ApiConfig;
    const url = baseBettingAuth + bettingSendOtpBank;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, {}, headers);
  },

  bettingBankAccountsAdd: async (payload) => {
    const token = localStorage.getItem("token");
    const { baseBettingBankAccounts } = ApiConfig;
    const url = baseBettingBankAccounts;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, payload, headers);
  },

  bettingBankAccountsList: async () => {
    const token = localStorage.getItem("token");
    const { baseBettingBankAccounts } = ApiConfig;
    const url = baseBettingBankAccounts;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallGet(url, headers);
  },

  bettingBankAccountsDelete: async (accountId) => {
    const token = localStorage.getItem("token");
    const { baseBettingBankAccounts } = ApiConfig;
    const url = `${baseBettingBankAccounts}/${accountId}`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallDelete(url, headers);
  },

  bettingBankAccountsSetDefault: async (accountId) => {
    const token = localStorage.getItem("token");
    const { baseBettingBankAccounts } = ApiConfig;
    const url = `${baseBettingBankAccounts}/${accountId}/default`;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPatch(url, {}, headers);
  },

  // ---------- Betting Games (WCO – list + launch for iframe) ----------
  bettingGamesGetProviders: async () => {
    const token = localStorage.getItem("token");
    const { baseBettingGames, bettingGamesProviders } = ApiConfig;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(baseBettingGames + bettingGamesProviders, headers);
  },
  bettingGamesGetCategories: async () => {
    const token = localStorage.getItem("token");
    const { baseBettingGames, bettingGamesCategories } = ApiConfig;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(baseBettingGames + bettingGamesCategories, headers);
  },
  bettingGamesByCategory: async (category, page = 1, limit = 20, search = "") => {
    const token = localStorage.getItem("token");
    const { baseBettingGames } = ApiConfig;
    const params = new URLSearchParams({ page, limit });
    if (search) params.set("search", search);
    const url = `${baseBettingGames}category/${encodeURIComponent(category)}?${params}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },
  bettingGamesByProvider: async (providerCode, page = 1, limit = 20, search = "") => {
    const token = localStorage.getItem("token");
    const { baseBettingGames } = ApiConfig;
    const params = new URLSearchParams({ page, limit });
    if (search) params.set("search", search);
    const url = `${baseBettingGames}provider/${encodeURIComponent(providerCode)}?${params}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },
  /** GET /api/v1/games?providerCode=&category=&page=1&limit=20. providerCode "all" (case-insensitive) → "ALL" (no provider filter). */
  bettingGamesList: async (providerCode, category = "all", page = 1, limit = 20) => {
    const token = localStorage.getItem("token");
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
    const token = localStorage.getItem("token");
    const { baseBettingGames, bettingGamesFeatured } = ApiConfig;
    const url = `${baseBettingGames}${bettingGamesFeatured}?limit=${limit}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },
  bettingGamesPopular: async (limit = 20) => {
    const token = localStorage.getItem("token");
    const { baseBettingGames, bettingGamesPopular } = ApiConfig;
    const url = `${baseBettingGames}${bettingGamesPopular}?limit=${limit}`;
    const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return ApiCallGet(url, headers);
  },
  /** Launch game – returns launchURL for iframe. Requires login. */
  bettingGamesLaunch: async (gameCode, providerCode, platform = "desktop") => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, message: "Login required to play" };
    const { baseBettingGames, bettingGamesLaunch } = ApiConfig;
    const url = baseBettingGames + bettingGamesLaunch;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    return ApiCallPost(url, { gameCode, providerCode, platform }, headers);
  },

  // ============================================================================
  // END OF BETTING AUTH METHODS
  // ============================================================================

};

export default AuthService;

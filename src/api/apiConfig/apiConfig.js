

// Betting backend base URL (set REACT_APP_BETTING_API_URL in production)
const bettingUrl = process.env.REACT_APP_BETTING_API_URL || "https://gamingbackend.wrathcode.com";
console.log("🚀 ~ bettingUrl:", bettingUrl)




export const deployedUrl = `${window.origin}/`

export const ApiConfig = {
  // =========Betting Auth Endpoints==========
  bettingSendOtp: "send-otp",
  bettingRegister: "register",
  bettingLogin: "login",
  bettingRefreshToken: "refresh-token",
  bettingForgotPasswordSendOtp: "forgot-password/send-otp",
  bettingForgotPasswordReset: "forgot-password/reset",
  bettingLogout: "logout",
  bettingLogoutAll: "logout-all",
  bettingChangePassword: "change-password",
  bettingGetMe: "me",
  bettingUpdateProfile: "profile",
  /** Send OTP for add bank account (same auth base as signup – POST /api/v1/auth/send-otp-bank) */
  bettingSendOtpBank: "send-otp-bank",

  // ============URLs================

 
  // ============Betting URLs================
  baseBettingAuth: `${bettingUrl}/api/v1/auth/`,
  baseBettingWallet: `${bettingUrl}/api/v1/wallet/`,
  baseBettingUrl: bettingUrl,
  bettingDepositOptions: "deposit-options",
  bettingDeposit: "deposit",
  bettingBalance: "balance",
  bettingTransactions: "transactions",

  // Bank accounts (base + paths must match backend: POST /api/v1/bank-accounts/send-otp etc.)
  baseBettingBankAccounts: `${bettingUrl}/api/v1/bank-accounts`,
  bettingBankAccountsSendOtp: "send-otp",

  // Games (WCO – list, launch for iframe)
  baseBettingGames: `${bettingUrl}/api/v1/games/`,
  bettingGamesProviders: "providers",
  bettingGamesCategories: "categories",
  bettingGamesLaunch: "launch",
  bettingGamesFeatured: "featured",
  bettingGamesPopular: "popular",
  bettingGamesLanding: "landing",

  // ============webSocketUrl================

};

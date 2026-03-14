

// Betting backend base URL. Use REACT_APP_BETTING_API_URL (or VITE_API_URL in Vite). Doc: BASE_URL/api/v1.
const bettingUrl = process.env.REACT_APP_BETTING_API_URL || process.env.VITE_API_URL || "https://gamingbackend.wrathcode.com";




export const deployedUrl = `${window.origin}/`

export const ApiConfig = {
  // =========Betting Auth Endpoints==========
  bettingSendOtp: "send-otp",
  bettingRegister: "register",
  bettingLogin: "login",
  bettingRefreshToken: "refresh-token",
  bettingForgotPasswordSendOtp: "forgot-password/send-otp",
  bettingForgotPasswordReset: "forgot-password/reset", // body: mobile, otp, newPassword, confirmNewPassword
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
  bettingDepositTransactions: "deposit-transactions",
  bettingWithdrawalTransactions: "withdrawal-transactions",
  bettingWithdrawal: "withdrawal",
  bettingSendWithdrawalOtp: "send-withdrawal-otp",
  /** GET /wallet/transactions/:id – single transaction (Section 2). */
  bettingWalletTransactions: "transactions",

  // Bank accounts (base + paths must match backend: POST /api/v1/bank-accounts/send-otp etc.)
  baseBettingBankAccounts: `${bettingUrl}/api/v1/bank-accounts`,
  bettingBankAccountsSendOtp: "send-otp",

  // Games (WCO – list, launch for iframe)
  baseBettingGames: `${bettingUrl}/api/v1/games/`,
  bettingGamesProviders: "providers",
  bettingGamesCategories: "categories",
  bettingGamesLaunch: "launch",
  bettingGamesLaunchSportsbook: "launch-sportsbook",
  bettingGamesFeatured: "featured",
  bettingGamesPopular: "popular",
  bettingGamesLanding: "landing",
  bettingGamesTransactions: "transactions",
  gamesSportsbookTransactions: "sportsbook/transactions",
  gamesSportsbookTransactionHistory: "sportsbook/transaction-history",

  // Sportsbook & Betting – base https://YOUR_API_HOST/api/v1/sportsbook (auth: Bearer token; socket namespace /sportsbook)
  baseBettingSportsbook: `${bettingUrl}/api/v1/sportsbook`,

  // User – master deposit accounts for /deposit page
  baseBettingUser: `${bettingUrl}/api/v1/user`,
  depositAccountsMaster: "deposit-accounts/master",

  // Support / Tickets (Section 7)
  baseBettingSupport: `${bettingUrl}/api/v1/support`,
  supportTickets: "tickets", // POST create, GET list. List: ?search=&status=&page=&limit=
  // GET tickets/:ticketId, POST tickets/:ticketId/messages, PATCH tickets/:ticketId/close

  // Referral (Section 5) – dashboard, balance, claim, referrals, referrals/export, profit, rewards/history, rewards/live, apply
  baseBettingReferral: `${bettingUrl}/api/v1/referral`,
  // Search (Section 6) – public; GET /search/trending?limit, GET /search?q= or ?query= & limit
  baseBettingSearch: `${bettingUrl}/api/v1/search`,

  // ============webSocketUrl================

};

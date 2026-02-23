// const appUrl = "http://localhost:5001";
const appUrl = "https://backend.demoexchange.wrathcode.com";
const appUrl2 = appUrl;
// const appUrl = "http://192.168.1.21:5001";
// const appUrl2 = appUrl;




export const deployedUrl = `${window.origin}/`

export const ApiConfig = {
  // =========EndPoints==========
  loginwithGoogle: 'user/third-party-login',
  signupwithGoogle: 'user/third-party-signup',
  login: "login",
  registerEmail: "register-email",
  registerPhone: "register-phone",
  registrationOtp: "registration-otp",
  verifyRegistrationToken: "verify-registration-token",
  verifyRegistrationOtp: "verify-registration-otp",
  getOtp: "send-otp",
  getcode: "verify-otp",
  forgotpassword: "forgot_password",
  activityLogs: "get_logs",
  setCurrency: "currency-preference",
  userfunds: "user-wallet",
  userP2pWallet: "p2p-wallet",
  walletHistory: 'wallet-history',
  depositHistory: 'wallet-deposit-history',
  withdrawalHistory: 'wallet-withdrawal-history',
  generateAddress: "generate-address",
  estimatedPortfolio: "estimated-portfolio",
  allWalletsPortfolio: "all-wallets-portfolio",
  withdrawalcurrencypath: 'withdrawal',
  identity: "submit-kyc",
  favoriteCoin: 'favorite-coin',
  favoriteList: 'favorite-list',
  setSecurity: "change_password",
  updateSettings: "edit-profile",
  placeOrder: 'place-order',
  pastOrder: 'past-order',
  cancelOrder: 'cancel-order',
  coinDetails: 'coin-details',
  update2fa: "enable-2fa",
  googleAuth: "generate-google-qr",
  getHistoricalData: 'historical-data',
  getDetails: "profile",
  depositInr: 'deposit_inr',
  withdrawalInr: 'withdraw_inr',
  userBankDetails: 'get_user_bank_details',
  editBank: 'user_bank_details',
  sendkginotp: 'send-kgin-otp',
  verifykginotp: 'verify-kgin-otp',
  notifiactionlist: 'user-notifications',
  reffercode: 'user_refer_code',
  getPairs: 'get-pairs',
  getMemePairs: 'get-meme-pairs',
  getHotPairs: 'get-hot-pairs',
  convertToken: "v1/swapping/convertToken",
  swapToken: "v1/swapping/swapToken",
  coinListedDetails: "send-coin-listing-request",
  partnerships: "signUp",
  total_refer_count: "total_refer_count",
  refer_list: "referral_user_list",
  referral_balance: "referral_balance",
  joining_balance: "joining_balance",
  coin_details: "coin-details",
  get_top_GL: "get_top_GL",
  get_trending: "get_trending",
  user_cancel_withdrawal: "user_cancel_withdrawal",
  cancel_all_order: "cancel_all_order",
  verify_deposit: "verify-deposit",
  transfer_funds: "transfer-funds",
  p2pCoinList: "p2p_coin_list",
  fiatCurrencyList: "fiat_currency_list",
  addBankDetails: "add-bank-details",
  addUpiDetails: "add_user_upi",
  createNewPost: "create_new_post",
  sellOrder: "sell_order",
  buyOrder: "buy_order",
  fetchPaymentMethods: "fetch_payment_methods",
  getCoinList: "get-coin",
  currentPrice: "current_price",
  myAds: "my_ads",
  buyCurrency: "buy_currency",
  myOrders: "my_orders",
  p2pRuntime: "runtime_api",
  buyRequest: "buy_request",
  notifySeller: "merchant_confirmation",
  notifyMerchent: "trader_confirmation",
  addOrderNotification: "add_order_notification",
  notify: "notify_trader",
  editUpiDetails: 'edit_user_upi',
  editBankDetails: 'edit-bank-details',
  rateOrder: "rate_user",
  transferFunds: "swaping_wallets",
  submitTicket: "submit-ticket",
  getUserTickets: "get-user-tickets",
  getTicketCategories: "get-categories",
  replyTicket: "user-reply-ticket",
  swapHistory: "swapping_history",
  getLatestNews: "get_latest_news",
  quick_buy_sell: "quick_buy_sell",
  quickBuySellHistory: "history",
  request_refund: "request_refund",
  getPartnerName: "getPartnerName",
  getCvbotUserWallet: "get-user-wallet",
  markasAllRead: "mark-all-as-read",
  markasRead: "mark-as-read",
  depositCvbotFunds: "deposit-balance",
  accessTokenSumsub: "access-token-sumsub",
  editavatar: "edit-avatar",
  editusername: "edit-name",
  editemail: "edit-email",
  editPhone: "edit-phone",
  depositActiveCoins: "deposit-active-coins",
  availableWalletTypes: "available-wallet-types",
  walletTransfer: "wallet-transfer",
  getPerticularWalletBalance: "get-perticular-wallet-balance",
  getWalletBalance: "get-wallet-balance",
  walletTransferHistory: "wallet-transfer-history",
  bonusHistory: "bonus-history",
  withdrawActiveCoins: "withdraw-active-coins",
  allCoins: "all-coins",
  blogList: "blog-list",
  viewBlog: "view-blog",
  baseCurrencyList: "base_currency_list",
  getConversionRate: "get_conversion_rate",
  getApk: "getApk",




  // Earning Router
  packageList: "package-list",
  subscribedPackageList: "subscribed-package-list",
  earningPortfolio: "earning-portfolio",
  earningPortfolioSummary: "earning-portfolio-summary",
  subscribeEarningPackage: "subscribe-earning-package",


  // Arbitrage Router
  getPackageList: "bot-package-listing",
  buyArbitrageBot: "buy-arbitrage-bot",
  addFunds: "add-funds",
  getActivePackage: "get-active-package",
  getInvestment: "get-investment",


  // Futures Router

  order: "order",
  cancel: "cancel",
  closePosition: "close-position",

  // annoucemnt Router

  getAnnouncementCategoryList: "announcement-category-list",
  getAnnouncementList: "announcement-listing",
  announcementView: "announcement-view",


  // Launchpad Router

  getUserlpList: "user-launchpad-listing",
  getUpcominglpList: "upcoming-launchpad-listing",
  getCancellpList: "cancelled-launchpad-listing",
  getLiveListing: "live-launchpad-listing",
  getEndedListing: "ended-launchpad-listing",
  getUserPurchingList: "user-purchaseing-listing",
  tokenPurches: "purchase-token",
  userlpDetails: "user-launchpad-details",
  subscriptionHistory: "user-token-subscription-history",
  launchpadTransHistory: "user-token-transaction-history",




  // Options Routes

  optionPairs: "optionPairs",
  contractDates: "contractDates",
  placeOptionOrder: "placeOrder",
  cancelOptionOrder: "cancelOrder",

  // Giveaway Routes
  checkGiveawayStatus: "checkEleigibleForGiveaway",
  getGiveawayList: "giveawayList",
  claimGiveaway: "claimGiveaway",


  // P2P Routes
  getCurrency: "getCurrency",
  getFiatCurrency: "getFiatCurrency",
  getAllPaymentMethods: "getAllPaymentMethods",
  p2pSellOrderForBuyer: "p2pSellOrderForBuyer",
  p2pBuyOrderForSeller: "p2pBuyOrderForSellers",
  getPaymentMethodFields: "getPaymentMethodFields",
  addUserPaymentMethod: "addUserPaymentMethod",
  getUserPaymentMethods: "getUserPaymentMethods",
  deleteUserPaymentMethod: "deletePaymentMethod",
  createAd: "createAd",
  buyFromAd: "buyFromAd",
  sellFromAd: "sellFromAd",
  getP2pOrderDetails: "getOrderDetails",
  getP2pOrders: "orders",
  getPairPrice: "getPairPrice",

  // P2P Order Actions
  markPaymentCompleted: "markPaymentCompleted",
  releaseCrypto: "releaseCrypto",
  cancelP2pOrder: "cancelOrder",
  buyerDispute: "buyerDispute",
  sellerDispute: "sellerDispute",

  // P2P Chat endpoints
  sendChatMessage: "chat/send",
  uploadChatImage: "chat/upload",
  getChatHistory: "chat",
  markChatRead: "chat/read",
  getChatUnreadCount: "chat/unread/count",
  deleteChatMessage: "chat/delete",
  getUserAds: "getUserAds",
  closeAd: "closeAd",
  updateAdStatus: "updateAdStatus",
  getP2pProfile: "profile",

  // Security & 2FA endpoints
  securityStatus: "status",
  securitySendOtp: "send-otp",
  securityVerifyOtp: "verify-otp",
  securityGenerateGoogleQr: "generate-google-qr",
  security2faSetup: "2fa/setup",
  security2faConfirm: "2fa/confirm",
  security2faDisable: "2fa/disable",
  securityUpdate2fa: "update-2fa",
  securityEmailAdd: "email/add",
  securityEmailChangeInitiate: "email/change/initiate",
  securityEmailChangeComplete: "email/change/complete",
  securityMobileAdd: "mobile/add",
  securityMobileChangeInitiate: "mobile/change/initiate",
  securityMobileChangeComplete: "mobile/change/complete",
  securitySettings: "settings",
  securityLogin2fa: "login-2fa",
  securityChangePassword: "change-password",

  // Passkey (WebAuthn) endpoints
  passkeyRegisterOptions: "passkey/register/options",
  passkeyRegisterVerify: "passkey/register/verify",
  passkeyList: "passkeys",
  passkeyRename: "passkey/rename",
  passkeyDelete: "passkey/delete",
  passkeyAuthOptions: "passkey/auth/options",
  passkeyAuthVerify: "passkey/auth/verify",
  passkeyLoginComplete: "passkey/login/complete",

  // ============URLs================

  baseUrl: `${appUrl}/`,
  baseImage: `${appUrl2}/`,
  baseAuth: `${appUrl}/v1/user/`,
  baseSecurity: `${appUrl}/v1/security/`,
  baseUserBot: `${appUrl}/v1/bot/`,
  baseEarning: `${appUrl}/v1/earning/`,
  basePartner: `${appUrl}/v1/partnerShip/`,
  baseTrans: `${appUrl}/v1/transaction/`,
  tradeHistoryExport: 'trade-history-export',
  walletHistoryExport: 'wallet-history-export',
  baseExchange: `${appUrl}/v1/exchange/`,
  baseWallet: `${appUrl}/v1/wallet/`,
  baseCoin: `${appUrl}/v1/coin/`,
  baseP2p: `${appUrl}/v1/p2p/`,
  baseSupport: `${appUrl}/v1/support/`,
  baseNotification: `${appUrl}/v1/notifications/`,
  baseSwap: `${appUrl}/v1/qbs/`,
  baseCvbot: `${appUrl}/v1/cvbot/`,
  baseCoinList: `${appUrl}/v1/coin-listing/`,
  baseFutures: `${appUrl}/v1/futures/`,
  baseOptions: `${appUrl}/v1/options/`,
  // ============webSocketUrl================

  webSocketUrl: appUrl,
};

import { ApiConfig } from "../apiConfig/apiConfig";
import { ApiCallGet, ApiCallGetVerifyRegistration, ApiCallPost, ApiCallPut } from "../apiConfig/apiCall";
import { ConsoleLogs } from "../../utils/ConsoleLogs";

const TAG = "AuthService";

const AuthService = {

  login: async (signId, password, token) => {
    const { baseAuth, login } = ApiConfig;
    const url = baseAuth + login;
    const params = {
      email_or_phone: signId,
      password: password,
      token
    };
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },

  registerEmail: async (signId, password, invitation, token) => {
    const { baseAuth, registerEmail } = ApiConfig;
    const url = baseAuth + registerEmail;
    const params = {
      email: signId,
      password: password,
      referral_code: invitation,
      token: token,
    };
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },


  registerPhone: async (signId, password, invitation, countryCode, token) => {
    const { baseAuth, registerPhone } = ApiConfig;
    const url = baseAuth + registerPhone;
    const params = {
      phone: signId,
      password: password,
      referral_code: invitation,
      token: token,
      country_code: countryCode,
    };
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },

  registrationOtp: async (signId, registeredBy) => {
    const { baseAuth, registrationOtp } = ApiConfig;
    const url = baseAuth + registrationOtp;
    const params = {
      signId: signId, registeredBy
    };
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },

  verifyRegistrationToken: async (authenticationToken) => {
    const token = authenticationToken
    const { baseAuth, verifyRegistrationToken } = ApiConfig;
    const url = baseAuth + verifyRegistrationToken;
    const headers = {
      Authorization: token,
      "Content-Type": "application/json",
    };
    return ApiCallGetVerifyRegistration(url, headers);
  },

  getOtp: async (signid, type, sendTo = null) => {
    const { baseAuth, getOtp: otpEndpoint } = ApiConfig;
    const url = baseAuth + otpEndpoint;
    const params = {
      email_or_phone: signid,
      type: type,
      "resend": true
    };
    // For login flow, specify which method to send OTP to (email or mobile)
    if (sendTo) {
      params.sendTo = sendTo;
    }
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },

  verifyRegistrationOtp: async (signId, verification_code, registeredBy, token) => {
    const { baseAuth, verifyRegistrationOtp } = ApiConfig;
    const url = baseAuth + verifyRegistrationOtp;
    const params = {
      signId: signId, verification_code, token, registeredBy
    };
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },

  getCode: async (signId, type, otp) => {
    const { baseAuth, getcode } = ApiConfig;
    const url = baseAuth + getcode;
    const params = {
      "email_or_phone": signId,
      "type": type,
      // For Google Auth (type 2), keep as string to preserve leading zeros
      // For Email/Mobile OTP (type 1 & 3), convert to number
      "otp": type === 2 ? otp : parseInt(otp, 10)
    };
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },

  forgotPassword: async (inputData, type, countryCode = "+91") => {
    const { baseAuth, forgotpassword } = ApiConfig;
    const url = baseAuth + forgotpassword;
    const fullPhonePayload = `${countryCode} ${inputData?.signId}`;
    const params = {
      email_or_phone: type === "phone" ? fullPhonePayload : inputData?.signId,
      verification_code: +inputData?.otp,
      new_password: inputData?.password,
    };
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },

  googleLogin: async (tokenResponse, captchaData) => {
    const { baseUrl, loginwithGoogle } = ApiConfig;
    const url = baseUrl + loginwithGoogle;
    // const { captcha_output, gen_time, lot_number, pass_token } = captchaData
    const params = {
      Token: tokenResponse?.access_token,
      type: 'google',
      // captcha_output, gen_time, lot_number, pass_token
    };
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },

  signupwithGoogle: async (tokenResponse, captchaData, invitation) => {
    const { baseUrl, signupwithGoogle } = ApiConfig;
    const url = baseUrl + signupwithGoogle;
    // const { captcha_output, gen_time, lot_number, pass_token } = captchaData
    const params = {
      Token: tokenResponse?.access_token,
      type: 'google', referral_code: invitation
      // captcha_output, gen_time, lot_number, pass_token
    };
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },



  getActivityLogs: async (skip, limit) => {
    const token = localStorage.getItem("token");
    const { baseAuth, activityLogs } = ApiConfig;
    const url = baseAuth + activityLogs;
    const params = {
      skip, limit
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },


  accessTokenSumsub: async () => {
    const token = localStorage.getItem("token");
    const { baseAuth, accessTokenSumsub } = ApiConfig;
    const url = baseAuth + accessTokenSumsub;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  setCurrency: async (currencyType) => {
    const token = localStorage.getItem("token");
    const { baseAuth, setCurrency } = ApiConfig;
    const url = baseAuth + setCurrency;
    const params = {
      currency: currencyType,
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPut(url, params, headers);
  },

  transferToSpot: async (selectedCurrency, withdrawAmount) => {
    const token = localStorage.getItem("token");
    const { baseP2p, transferFunds } = ApiConfig;
    const url = baseP2p + transferFunds;
    const params = {
      spot_wallet: true,
      amount: +withdrawAmount,
      short_name: selectedCurrency
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  transferToP2P: async (selectedCurrency, withdrawAmount) => {
    const token = localStorage.getItem("token");
    const { baseP2p, transferFunds } = ApiConfig;
    const url = baseP2p + transferFunds;
    const params = {
      funding_wallet: true,
      amount: +withdrawAmount,
      short_name: selectedCurrency
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  getUserfunds: async (type) => {
    const token = localStorage.getItem("token");
    const { baseWallet, userfunds } = ApiConfig;
    const url = baseWallet + userfunds + `?wallet_type=${type}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  userP2pWallet: async () => {
    const token = localStorage.getItem("token");
    const { baseWallet, userP2pWallet } = ApiConfig;
    const url = baseWallet + userP2pWallet;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  availableWalletTypes: async () => {
    const token = localStorage.getItem("token");
    const { baseWallet, availableWalletTypes } = ApiConfig;
    const url = baseWallet + availableWalletTypes;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  getPerticularWalletBalance: async (currencyId, fromWallet, toWallet) => {
    const token = localStorage.getItem("token");
    const { baseWallet, getPerticularWalletBalance } = ApiConfig;
    const url = baseWallet + getPerticularWalletBalance + `?fromWallet=${fromWallet}&toWallet=${toWallet}&currencyId=${currencyId}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  getWalletBalance: async (currencyId, fromWallet) => {
    const token = localStorage.getItem("token");
    const { baseWallet, getWalletBalance } = ApiConfig;
    const url = baseWallet + getWalletBalance + `?fromWallet=${fromWallet}&currencyId=${currencyId}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  walletTransferHistory: async (skip, limit) => {
    const token = localStorage.getItem("token");
    const { baseWallet, walletTransferHistory } = ApiConfig;
    const url = baseWallet + walletTransferHistory + `?skip=${skip}&limit=${limit}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },
  bonusHistory: async (skip, limit) => {
    const token = localStorage.getItem("token");
    const { baseWallet, bonusHistory } = ApiConfig;
    const url = baseWallet + bonusHistory + `?skip=${skip}&limit=${limit}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  walletHistory: async (skip, limit) => {
    const token = localStorage.getItem('token');
    const { baseTrans, walletHistory } = ApiConfig;
    const url = baseTrans + walletHistory + `?skip=${skip}&limit=${limit}`;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  tradeHistory: async (skip, limit) => {
    const token = localStorage.getItem('token');
    const { baseTrans } = ApiConfig;
    const url = baseTrans + `trade-history?skip=${skip}&limit=${limit}`;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  tradeHistoryExport: async (from, to, limit = 10000) => {
    const token = localStorage.getItem('token');
    const { baseTrans, tradeHistoryExport } = ApiConfig;
    const url = `${baseTrans}${tradeHistoryExport}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${limit}`;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  walletHistoryExport: async (from, to, type = 'all', limit = 10000) => {
    const token = localStorage.getItem('token');
    const { baseTrans, walletHistoryExport } = ApiConfig;
    const params = new URLSearchParams({ from, to, limit: String(limit) });
    if (type && type !== 'all') params.set('type', type);
    const url = `${baseTrans}${walletHistoryExport}?${params.toString()}`;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  blogList: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, blogList } = ApiConfig;
    const url = baseAuth + blogList;

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);

  },
  launchpadTransHistory: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, launchpadTransHistory } = ApiConfig;
    const url = baseAuth + launchpadTransHistory;

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);

  },
  checkGiveawayStatus: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, checkGiveawayStatus } = ApiConfig;
    const url = baseAuth + checkGiveawayStatus;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);

  },



  allOpenOrder: async (skip, limit) => {
    const token = localStorage.getItem('token');
    const { baseExchange } = ApiConfig;
    const url = baseExchange + `all-open-orders?skip=${skip}&limit=${limit}`;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },



  generateAddress: async (generate, chain) => {
    const token = localStorage.getItem("token");
    const { baseWallet, generateAddress } = ApiConfig;
    const url = baseWallet + generateAddress;
    const params = {
      "generate": generate,
      "chain": chain
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPut(url, params, headers);
  },

  estimatedPortfolio: async (type) => {
    const token = localStorage.getItem("token");
    const { baseWallet, estimatedPortfolio } = ApiConfig;
    const url = baseWallet + estimatedPortfolio + `?walletType=${type}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  allWalletsPortfolio: async () => {
    const token = localStorage.getItem("token");
    const { baseWallet, allWalletsPortfolio } = ApiConfig;
    const url = baseWallet + allWalletsPortfolio;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  nexbAmount: async (baseCurrencyId, quoteCurrencyId, userId, usdtCoin) => {
    console.log("apiii")
    const token = localStorage.getItem("token");
    const { baseUrl, convertToken } = ApiConfig;
    const url = baseUrl + convertToken;
    const params = {
      userId: userId,
      base_Currency_id: baseCurrencyId,
      quote_Currency_id: quoteCurrencyId,
      amountToPay: usdtCoin,
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },
  claimGiveaway: async (tsize, deliveryAddress) => {
    const token = localStorage.getItem("token");
    const { baseAuth, claimGiveaway } = ApiConfig;
    const url = baseAuth + claimGiveaway;
    const params = {
      tshirtSize: tsize,
      devliveryAddress: deliveryAddress,

    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },


  swapAmount: async (baseCurrencyId, quoteCurrencyId, userId, usdtCoin, nexbCoin) => {
    const token = localStorage.getItem("token");
    const { baseUrl, swapToken } = ApiConfig;
    const url = baseUrl + swapToken;
    const params = {
      userId: userId,
      base_Currency_id: baseCurrencyId,
      quote_Currency_id: quoteCurrencyId,
      amountToPay: usdtCoin,
      amountToBuy: nexbCoin,
      fromCurrency: "USDT",
      toCurrency: "NEXB",
      side: "BUY"
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },



  withdrawalCurrency: async (walletAddress, amountValue, otp, selectedChain, signId, balance) => {
    const token = localStorage.getItem("token");
    const { baseWallet, withdrawalcurrencypath } = ApiConfig;
    const url = baseWallet + withdrawalcurrencypath;
    const params = {
      withdrawal_address: walletAddress,
      amount: amountValue,
      chain: selectedChain?.chain,
      coinName: selectedChain?.name,
      verification_code: +otp,
      email_or_phone: signId,
      usdt_balance: balance,
    };
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, params, headers);
  },

  walletTransfer: async (fromWallet, toWallet, currencyId, amount) => {
    const token = localStorage.getItem("token");
    const { baseWallet, walletTransfer } = ApiConfig;
    const url = baseWallet + walletTransfer;
    const params = {
      fromWallet, toWallet, currencyId, amount
    };
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, params, headers);
  },

  addkyc: async (formData) => {
    const token = localStorage.getItem("token");
    const { baseAuth, identity } = ApiConfig;
    const url = baseAuth + identity;
    const headers = {
      "Content-Type": "multipart/form-data",
      Authorization: token,
    };
    return ApiCallPost(url, formData, headers);
  },

  // KYC API methods
  getCountries: async () => {
    const { baseUrl } = ApiConfig;
    const url = baseUrl + "api/meta/countries";
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallGet(url, headers);
  },

  getKycConfig: async (countryCode) => {
    const token = localStorage.getItem("token");
    const { baseUrl } = ApiConfig;
    const url = baseUrl + `api/kyc/config/${countryCode}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  getKycStatus: async () => {
    const token = localStorage.getItem("token");
    const { baseAuth } = ApiConfig;
    const url = baseAuth + "kyc-status";
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  getAnnouncementCategoryList: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getAnnouncementCategoryList } = ApiConfig;
    const url = baseAuth + getAnnouncementCategoryList;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },
  getUpcominglpList: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getUpcominglpList } = ApiConfig;
    const url = baseAuth + getUpcominglpList;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },
  getCancellpList: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getCancellpList } = ApiConfig;
    const url = baseAuth + getCancellpList;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },
  getLiveListing: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getLiveListing } = ApiConfig;
    const url = baseAuth + getLiveListing;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },
  getEndedListing: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getEndedListing } = ApiConfig;
    const url = baseAuth + getEndedListing;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },
  getUserPurchingList: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getUserPurchingList } = ApiConfig;
    const url = baseAuth + getUserPurchingList;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },
  getGiveawayList: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getGiveawayList } = ApiConfig;
    const url = baseAuth + getGiveawayList;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },
  getUserlpList: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getUserlpList } = ApiConfig;
    const url = baseAuth + getUserlpList;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },
  getAnnouncementList: async (id) => {
    const token = localStorage.getItem('token');
    const { baseAuth, getAnnouncementList } = ApiConfig;
    const url = baseAuth + getAnnouncementList + `/${id}`;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },
  userlpDetails: async (id) => {
    const token = localStorage.getItem('token');
    const { baseAuth, userlpDetails } = ApiConfig;
    const url = baseAuth + userlpDetails + `/${id}`;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },
  subscriptionHistory: async (id) => {
    const token = localStorage.getItem('token');
    const { baseAuth, subscriptionHistory } = ApiConfig;
    const url = baseAuth + subscriptionHistory;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  tokenPurches: async (launchpadId, amountInvested) => {
    const token = localStorage.getItem('token');
    const { baseAuth, tokenPurches } = ApiConfig;
    const url = baseAuth + tokenPurches;
    const params = {
      launchpadId: launchpadId,
      amountInvested: +amountInvested,
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  announcementView: async (id) => {
    const token = localStorage.getItem('token');
    const { baseAuth, announcementView } = ApiConfig;
    const url = baseAuth + announcementView + `/${id}`;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },


  favoriteCoin: async (pairId) => {
    const token = localStorage.getItem('token');
    const { baseAuth, favoriteCoin } = ApiConfig;
    const url = baseAuth + favoriteCoin;
    const params = {
      "pair_id": pairId
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  favoriteList: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, favoriteList } = ApiConfig;
    const url = baseAuth + favoriteList;

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);

  },

  depositActiveCoins: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, depositActiveCoins } = ApiConfig;
    const url = baseAuth + depositActiveCoins;

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);

  },

  withdrawActiveCoins: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, withdrawActiveCoins } = ApiConfig;
    const url = baseAuth + withdrawActiveCoins;

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);

  },

  allCoins: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, allCoins } = ApiConfig;
    const url = baseAuth + allCoins;

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);

  },

  setSecurity: async (password, conPassword, verificationcode, verifyMethod) => {
    const token = localStorage.getItem("token");
    const { baseAuth, setSecurity } = ApiConfig;
    const url = baseAuth + setSecurity;
    const params = {
      new_password: password,
      confirm_password: conPassword,
      verification_code: verifyMethod === 2 ? verificationcode : verificationcode, // Keep as string for Google Auth
      verify_method: verifyMethod // 1=email, 2=google auth, 3=mobile
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  updateSettings: async (formData) => {
    const token = localStorage.getItem("token");
    const { baseAuth, updateSettings } = ApiConfig;
    const url = baseAuth + updateSettings;
    ConsoleLogs(TAG + ', updateSettings', `url : ' + ${url}`);
    const headers = {
      'Content-Type': 'multipart/form-data',
      'Authorization': token
    };
    return ApiCallPut(url, formData, headers);
  },

  editavatar: async (formData) => {
    const token = localStorage.getItem("token");
    const { baseAuth, editavatar } = ApiConfig;
    const url = baseAuth + editavatar;
    ConsoleLogs(TAG + ', updateSettings', `url : ' + ${url}`);
    const headers = {
      'Content-Type': 'multipart/form-data',
      'Authorization': token
    };
    return ApiCallPut(url, formData, headers);
  },


  editusername: async (firstName, lastName) => {
    const token = localStorage.getItem('token');
    const { baseAuth, editusername } = ApiConfig;
    const url = baseAuth + editusername;
    const params = {
      "firstName": firstName,
      "lastName": lastName,
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPut(url, params, headers);
  },

  editemail: async (emailId, eotp) => {
    const token = localStorage.getItem('token');
    const { baseAuth, editemail } = ApiConfig;
    const url = baseAuth + editemail;
    const params = {
      "emailId": emailId,
      "eotp": eotp,
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPut(url, params, headers);
  },

  editPhone: async (mobileNumber, motp) => {
    const token = localStorage.getItem('token');
    const { baseAuth, editPhone } = ApiConfig;
    const url = baseAuth + editPhone;
    const params = {
      "mobileNumber": mobileNumber,
      "motp": motp,
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPut(url, params, headers);
  },

  placeOrder: async (infoPlaceOrder, buyprice, buyamount, base_currency_id, quote_currency_id, side) => {
    const token = localStorage.getItem('token');
    const { baseExchange, placeOrder } = ApiConfig;
    const url = baseExchange + placeOrder;
    const params = {
      "order_type": infoPlaceOrder,
      "base_currency_id": base_currency_id,
      "quote_currency_id": quote_currency_id,
      "side": side,
      "price": +buyprice,
      "quantity": +buyamount
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  getPackageList: async () => {
    const token = localStorage.getItem("token");
    const { baseUserBot, getPackageList } = ApiConfig;
    const url = baseUserBot + getPackageList;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  getActivePackage: async () => {
    const token = localStorage.getItem("token");
    const { baseUserBot, getActivePackage } = ApiConfig;
    const url = baseUserBot + getActivePackage;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  getInvestment: async () => {
    const token = localStorage.getItem("token");
    const { baseUserBot, getInvestment } = ApiConfig;
    const url = baseUserBot + getInvestment;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  pastOrder: async (base_currency_id, quote_currency_id, skip, limit) => {
    const token = localStorage.getItem('token');
    const { baseExchange, pastOrder } = ApiConfig;
    const url = baseExchange + pastOrder;
    const params = {
      "base_currency_id": base_currency_id,
      "quote_currency_id": quote_currency_id,
      "skip": skip,
      "limit": limit,
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  depositHistory: async (skip, limit) => {
    const token = localStorage.getItem('token');
    const { baseTrans, depositHistory } = ApiConfig;
    const url = baseTrans + depositHistory;
    const params = {
      "skip": skip,
      "limit": limit,
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  withdrawalHistory: async (skip, limit) => {
    const token = localStorage.getItem('token');
    const { baseTrans, withdrawalHistory } = ApiConfig;
    const url = baseTrans + withdrawalHistory;
    const params = {
      "skip": skip,
      "limit": limit,
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  cancelOrder: async (orderId) => {
    const token = localStorage.getItem('token');
    const { baseExchange, cancelOrder } = ApiConfig;
    const url = baseExchange + cancelOrder;
    const params = {
      "order_id": orderId
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },


  cancelAllOrder: async () => {
    const token = localStorage.getItem('token');
    const { baseExchange, cancel_all_order } = ApiConfig;
    const url = baseExchange + cancel_all_order;
    const params = {};
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  coinDetails: async (currency_id) => {
    const token = localStorage.getItem('token');
    const { baseExchange, coinDetails } = ApiConfig;
    const url = baseExchange + coinDetails;
    const params = {
      "currency_id": currency_id
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  update2fa: async (authType, code, verifyType) => {
    const token = localStorage.getItem("token");
    const { baseAuth, update2fa } = ApiConfig;
    const url = baseAuth + update2fa;
    const params = {
      type: authType,
      verification_code: Number(code),
      email_or_phone: verifyType
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPut(url, params, headers);
  },


  googleAuth: async () => {
    const token = localStorage.getItem("token");
    const { baseAuth, googleAuth } = ApiConfig;
    const url = baseAuth + googleAuth;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  getHistoricalData: async (fromSymbol, toSymbol, from, to, chartResolution) => {
    const token = localStorage.getItem('token');
    const { baseExchange, getHistoricalData } = ApiConfig;
    const url = baseExchange + getHistoricalData;
    const params = {
      base_currency: fromSymbol,
      quote_currency: toSymbol,
      from: from,
      to: to,
      limit: 2000,
      chartResolution,
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  rateOrder: async (rating) => {
    const token = localStorage.getItem("token");
    const { baseP2p, rateOrder } = ApiConfig;

    const url = baseP2p + rateOrder;
    const params = {
      ratings: rating,
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };

    return ApiCallPost(url, params, headers);
  },

  editBankDetails: async (accountType, bankName, holderName, accountNumber, ifscCode, branchAddress, id) => {
    const token = localStorage.getItem("token");
    const { baseAuth, editBankDetails } = ApiConfig;
    const url = baseAuth + editBankDetails;
    const params = {
      _id: id,
      account_type: accountType,
      bank_name: bankName,
      account_holder_name: holderName,
      account_number: accountNumber,
      ifsc_code: ifscCode,
      branch_name: branchAddress,
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  editUpiDetails: async (formData) => {
    const token = localStorage.getItem("token");
    const { baseAuth, editUpiDetails } = ApiConfig;
    const url = baseAuth + editUpiDetails;

    const headers = {
      "Content-Type": "multipart/form-data",
      Authorization: token,
    };
    return ApiCallPut(url, formData, headers);
  },


  cryptoCompareApi: async (base, quote, to, resolution) => {
    const token = localStorage.getItem('token');
    const url = `https://min-api.cryptocompare.com/data/v2/${resolution}?fsym=${base}&tsym=${quote}&toTs=${to}&limit=2000`
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },


  getDetails: async () => {
    const token = localStorage.getItem("token");
    const { baseAuth, getDetails } = ApiConfig;
    const url = baseAuth + getDetails;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  inrDeposit: async (formData) => {
    const token = localStorage.getItem("token");
    const { baseWallet, depositInr } = ApiConfig;
    const url = baseWallet + depositInr;
    const headers = {
      "Content-Type": "multipart/form-data",
      Authorization: token,
    };
    return ApiCallPost(url, formData, headers);
  },

  inrWithdrawal: async (withdrawAmount) => {
    const token = localStorage.getItem("token");
    const { baseWallet, withdrawalInr } = ApiConfig;
    const url = baseWallet + withdrawalInr;
    const params = {
      amount: withdrawAmount,
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },


  getUserBankDetails: async () => {
    const token = localStorage.getItem("token");
    const { baseAuth, userBankDetails } = ApiConfig;
    const url = baseAuth + userBankDetails;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  quickBuySellHistory: async (skip, limit) => {
    const token = localStorage.getItem('token');
    const { baseSwap, quickBuySellHistory } = ApiConfig;
    const url = baseSwap + quickBuySellHistory + `?skip=${skip}&limit=${limit}`;
    const headers = { 'Content-Type': 'application/json', "Authorization": token };
    return ApiCallGet(url, headers);
  },

  baseCurrencyList: async () => {
    const token = localStorage.getItem('token');
    const { baseSwap, baseCurrencyList } = ApiConfig;
    const url = baseSwap + baseCurrencyList;
    const headers = { 'Content-Type': 'application/json', "Authorization": token };
    return ApiCallGet(url, headers);
  },

  getConversionRate: async (from, receive) => {
    const token = localStorage.getItem('token');
    const { baseSwap, getConversionRate } = ApiConfig;
    const url = baseSwap + getConversionRate + `?from=${from}&receive=${receive}`;
    const headers = { 'Content-Type': 'application/json', "Authorization": token };
    return ApiCallGet(url, headers);
  },

  getApk: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getApk } = ApiConfig;
    const url = baseAuth + getApk;
    const headers = { 'Content-Type': 'application/json', "Authorization": token };
    return ApiCallGet(url, headers);
  },


  swapToken: async (fromWallet, toWallet, amount) => {
    const token = localStorage.getItem('token');
    const { baseSwap, quick_buy_sell } = ApiConfig;
    const url = baseSwap + quick_buy_sell;
    const params = {
      fromWallet, toWallet, amount
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  getPartnerName: async (partnerId) => {
    const token = localStorage.getItem("token");
    const { basePartner, getPartnerName } = ApiConfig;
    const url = basePartner + getPartnerName + `/${partnerId}`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  packageList: async () => {
    const token = localStorage.getItem("token");
    const { baseEarning, packageList } = ApiConfig;
    const url = baseEarning + packageList;

    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  subscribedPackageList: async (skip, limit) => {
    const token = localStorage.getItem("token");
    const { baseEarning, subscribedPackageList } = ApiConfig;
    const url = baseEarning + subscribedPackageList + `?skip=${skip}&limit=${limit}`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  earningPortfolio: async () => {
    const token = localStorage.getItem("token");
    const { baseEarning, earningPortfolio } = ApiConfig;
    const url = baseEarning + earningPortfolio;

    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  earningPortfolioSummary: async () => {
    const token = localStorage.getItem("token");
    const { baseEarning, earningPortfolioSummary } = ApiConfig;
    const url = baseEarning + earningPortfolioSummary;

    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  subscribeEarningPackage: async (planId, investAmount, walletType) => {
    const token = localStorage.getItem("token");
    const { baseEarning, subscribeEarningPackage } = ApiConfig;
    const url = baseEarning + subscribeEarningPackage;
    const params = { planId, investAmount, walletType };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  buyArbitrageBot: async (planId, walletType) => {
    const token = localStorage.getItem("token");
    const { baseUserBot, buyArbitrageBot } = ApiConfig;
    const url = baseUserBot + buyArbitrageBot;
    const params = { planId, walletType };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  addFunds: async (investAmount, walletType) => {
    const token = localStorage.getItem("token");
    const { baseUserBot, addFunds } = ApiConfig;
    const url = baseUserBot + addFunds;
    const params = { investAmount, walletType };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  getCvbotUserWallet: async (Id) => {
    const token = localStorage.getItem("token");
    const { baseCvbot, getCvbotUserWallet } = ApiConfig;
    const url = baseCvbot + getCvbotUserWallet + `/${Id}`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },


  depositCvbotFunds: async (Id) => {
    const token = localStorage.getItem("token");
    const { baseCvbot, depositCvbotFunds } = ApiConfig;
    const url = baseCvbot + depositCvbotFunds;
    const params = { cvBotUuid: Id };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  sendKginOtpOtp: async (kginNumber) => {
    const token = localStorage.getItem("token");
    const { baseAuth, sendkginotp } = ApiConfig;
    const url = baseAuth + sendkginotp;
    const params = { mobileNumber: Number(kginNumber) };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  verifyKginOtpOtp: async (kginNumber, kginOtp) => {
    const token = localStorage.getItem("token");
    const { baseAuth, verifykginotp } = ApiConfig;
    const url = baseAuth + verifykginotp;
    const params = {
      mobileNumber: Number(kginNumber),
      otp: kginOtp
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  notifications: async () => {
    const token = localStorage.getItem("token");
    const { baseNotification, notifiactionlist } = ApiConfig;
    const url = baseNotification + notifiactionlist;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },
  markasAllRead: async () => {
    const token = localStorage.getItem('token');
    const { baseNotification, markasAllRead } = ApiConfig;
    const url = baseNotification + markasAllRead;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  markasRead: async (notificationId) => {
    const token = localStorage.getItem("token");
    const { baseNotification, markasRead } = ApiConfig;
    const url = baseNotification + markasRead;
    const params = {
      notificationId
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },


  refferlsList: async () => {
    const token = localStorage.getItem("token");
    const { baseAuth, reffercode } = ApiConfig;
    const url = baseAuth + reffercode;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  getPairs: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getPairs } = ApiConfig;
    const url = baseAuth + getPairs;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  getMemePairs: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getMemePairs } = ApiConfig;
    const url = baseAuth + getMemePairs;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  getHotPairs: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getHotPairs } = ApiConfig;
    const url = baseAuth + getHotPairs;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  get_top_GL: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, get_top_GL } = ApiConfig;
    const url = baseAuth + get_top_GL;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },


  get_trending: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, get_trending } = ApiConfig;
    const url = baseAuth + get_trending;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  p2pCoinList: async () => {
    const token = localStorage.getItem('token');
    const { baseCoin, p2pCoinList } = ApiConfig;
    const url = baseCoin + p2pCoinList;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  getCoinList: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getCoinList } = ApiConfig;
    const url = baseAuth + getCoinList;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  fetchPaymentMethods: async () => {
    const token = localStorage.getItem('token');
    const { baseP2p, fetchPaymentMethods } = ApiConfig;
    const url = baseP2p + fetchPaymentMethods;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  p2pBuyOrder: async (short_name) => {
    const token = localStorage.getItem('token');
    const { baseP2p, buyOrder } = ApiConfig;
    const url = baseP2p + buyOrder;
    const params = { short_name };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  p2pSellOrder: async (short_name) => {
    const token = localStorage.getItem('token');
    const { baseP2p, sellOrder } = ApiConfig;
    const url = baseP2p + sellOrder;
    const params = { short_name };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  currentPrice: async (fiat, asset) => {
    const token = localStorage.getItem('token');
    const { baseP2p, currentPrice } = ApiConfig;
    const url = baseP2p + currentPrice;
    const params = {
      "base_currency": asset,
      "quote_currency": fiat
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  fiatCurrencyList: async () => {
    const token = localStorage.getItem('token');
    const { baseP2p, fiatCurrencyList } = ApiConfig;
    const url = baseP2p + fiatCurrencyList;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  myAds: async () => {
    const token = localStorage.getItem('token');
    const { baseP2p, myAds } = ApiConfig;
    const url = baseP2p + myAds;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  myOrders: async () => {
    const token = localStorage.getItem('token');
    const { baseP2p, myOrders } = ApiConfig;
    const url = baseP2p + myOrders;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  runtime: async (status, orderId) => {
    const token = localStorage.getItem('token');
    const { baseP2p, p2pRuntime } = ApiConfig;
    const url = baseP2p + p2pRuntime;
    const params = {
      status: status,
      order_id: orderId
    };
    const headers = {
      "Authorization": token,
      'Content-Type': 'application/json',
    };
    return ApiCallPost(url, params, headers);
  },


  notify: async (orderId) => {
    const token = localStorage.getItem('token');
    const { baseP2p, notify } = ApiConfig;
    const url = baseP2p + notify;
    const params = {
      "order_id": orderId
    }

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  addOrderNotification: async (orderId) => {
    const token = localStorage.getItem('token');
    const { baseP2p, addOrderNotification } = ApiConfig;
    const url = baseP2p + addOrderNotification;

    const params = {
      order_id: orderId
    }

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  swapHistory: async () => {
    const token = localStorage.getItem("token");
    const { baseP2p, swapHistory } = ApiConfig;
    const url = baseP2p + swapHistory;
    const params = {
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);

  },

  notifySellerTrader: async (status, orderId) => {
    const token = localStorage.getItem('token');
    const { baseP2p, notifyMerchent } = ApiConfig;
    const url = baseP2p + notifyMerchent;
    const params = {
      order_id: orderId,
      trader_status: status,
    }

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  notifySellerMerchent: async (status, orderId) => {
    const token = localStorage.getItem('token');
    const { baseP2p, notifySeller } = ApiConfig;
    const url = baseP2p + notifySeller;
    const params = {
      order_id: orderId,
      merchant_status: status,
    }

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  buyRequest: async (orderId) => {
    const token = localStorage.getItem('token');
    const { baseP2p, buyRequest } = ApiConfig;
    const url = baseP2p + buyRequest;
    const params = {
      "order_id": orderId
    }

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  buyCurrency: async (payableAmount, receivableAmount, id, postAdId, timestamp, sellerSelectedPayment, method) => {
    const token = localStorage.getItem('token');
    const { baseP2p, buyCurrency } = ApiConfig;
    const url = baseP2p + buyCurrency;
    const params = {
      "amount": payableAmount,
      "receiving_amount": receivableAmount,
      "postAd_user": postAdId,
      "add_id": id,
      "payment_timestamp": timestamp,
      "payment_type": sellerSelectedPayment,
      "payment_method": method,
    }
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  createNewPost: async (input, paymentMethod) => {
    const token = localStorage.getItem('token');
    const { baseP2p, createNewPost } = ApiConfig;
    const url = baseP2p + createNewPost;
    const params = {
      "base_currency": input?.asset,
      "quote_currency": input?.fiat,
      "side": input?.side,
      "price_type": input?.priceType,
      "fixed_price": input?.price,
      "payment_time": input?.time,
      // "min_amount": input?.minAmount,
      // "max_amount": input?.maxAmount,
      "payment_method": paymentMethod,
      "kyc": input?.kyc,
      "totalTransactions": input?.transaction,
      "counterCurrency": input?.minCurrency,
      "currencyAmount": input?.currencyAmount || 0,
      "volume": input?.volume,
      "registered_days": +input?.regDays
    }
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  assetAddList: async (projectName, contactName, telegramId, phoneNumber, emailAddress, referredBy, comments, countryCode, contractAddress) => {
    const { baseCoinList, coinListedDetails } = ApiConfig;
    const url = baseCoinList + coinListedDetails;
    const params = {
      projectName: projectName,
      contactName: contactName,
      telegramId: telegramId,
      phoneNumber: phoneNumber,
      emailId: emailAddress,
      referredBy: referredBy,
      comments: comments,
      countryCode: countryCode,
      smartContractAddress: contractAddress,
    };
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },

  addPartnerShipDetails: async (formData) => {
    const token = localStorage.getItem("token");
    const { basePartner, partnerships } = ApiConfig;
    const url = basePartner + partnerships;
    const headers = {
      "Content-Type": "multipart/form-data",
      Authorization: token,
    };
    return ApiCallPost(url, formData, headers);
  },

  addUpiDetails: async (formData) => {
    const token = localStorage.getItem("token");
    const { baseAuth, addUpiDetails } = ApiConfig;
    const url = baseAuth + addUpiDetails;
    const headers = {
      "Content-Type": "multipart/form-data",
      Authorization: token,
    };
    return ApiCallPost(url, formData, headers);
  },

  addBankDetails: async (account_type, bank_name, account_holder_name, account_number, ifsc_code, branch_name) => {
    const token = localStorage.getItem("token");
    const { baseAuth, addBankDetails } = ApiConfig;
    const url = baseAuth + addBankDetails;
    const params = { account_type, bank_name, account_holder_name, account_number, ifsc_code, branch_name }
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },


  registerPartner: async (emailAddress, password) => {
    const url = ApiConfig.baseUrl + 'v1/partnerShip/signUp';
    const params = {
      email: emailAddress,
      password: password
    };
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, params, headers);
  },

  viewBlog: async (id) => {
    const token = localStorage.getItem('token');
    const { baseAuth, viewBlog } = ApiConfig;
    const url = baseAuth + viewBlog + `/${id}`;

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);

  },


  totalReferCount: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, total_refer_count } = ApiConfig;
    const url = baseAuth + total_refer_count;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  getReferList: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, refer_list } = ApiConfig;
    const url = baseAuth + refer_list;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  getLatestNews: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, getLatestNews } = ApiConfig;
    const url = baseAuth + getLatestNews;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  totalReferBalance: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, referral_balance } = ApiConfig;
    const url = baseAuth + referral_balance;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  getjoiningbalance: async () => {
    const token = localStorage.getItem('token');
    const { baseAuth, joining_balance } = ApiConfig;
    const url = baseAuth + joining_balance;
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);
  },

  getCoinDetails: async (currency_id) => {
    const token = localStorage.getItem("token");
    const { baseExchange, coin_details } = ApiConfig;
    const url = baseExchange + coin_details;
    const params = {
      currency_id
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  cancelWithdrawal: async (_id, amount, currency_id, fee) => {
    const token = localStorage.getItem("token");
    const { baseWallet, user_cancel_withdrawal } = ApiConfig;
    const url = baseWallet + user_cancel_withdrawal;
    const params = {
      _id, amount, currency_id, fee
    };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },


  verifyDeposit: async (status, chain, currency_id) => {
    const token = localStorage.getItem('token');
    const { baseWallet, verify_deposit } = ApiConfig;
    const url = baseWallet + verify_deposit;
    const params = {
      status, chain, currency_id
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  transfer_funds: async (chain, currency) => {
    const token = localStorage.getItem('token');
    const { baseWallet, transfer_funds } = ApiConfig;
    const url = baseWallet + transfer_funds;
    const params = {
      chain, currency
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  closePosition: async (positionId) => {
    const token = localStorage.getItem('token');
    const { baseFutures, closePosition } = ApiConfig;
    const url = baseFutures + closePosition;
    const params = {
      positionId
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },
  cancelFutureOrder: async (orderId) => {
    const token = localStorage.getItem('token');
    const { baseFutures, cancel } = ApiConfig;
    const url = baseFutures + cancel;
    const params = {
      orderId
    };
    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  placeFutureOrder: async (baseCurrency, quoteCurrency, marketType, side, quantity, price, leverage, takeProfit, stopLoss, isTpSl) => {
    const token = localStorage.getItem('token');
    const { baseFutures, order } = ApiConfig;
    const url = baseFutures + order;
    const params = {
      baseCurrency: baseCurrency,
      quoteCurrency: quoteCurrency,
      marketType: marketType,
      side: side,
      quantity: quantity,
      leverage: leverage,
    };

    if (marketType === "LIMIT") {
      params.price = price
    };

    if (isTpSl) {
      if (takeProfit > 0) {
        params.takeProfit = takeProfit
      };
      if (stopLoss < 0) {
        params.stopLoss = stopLoss
      };
    };


    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  placeReverseFutureOrder: async (baseCurrency, quoteCurrency, side, quantity, leverage) => {
    const token = localStorage.getItem('token');
    const { baseFutures, order } = ApiConfig;
    const url = baseFutures + order;
    const params = {
      baseCurrency: baseCurrency,
      quoteCurrency: quoteCurrency,
      marketType: "MARKET",
      side: side,
      quantity: quantity,
      leverage: leverage,
    };
    console.log("🚀 ~ params:", params)


    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);
  },

  submitTicket: async (formData) => {
    const token = localStorage.getItem("token");
    const { baseSupport, submitTicket } = ApiConfig;
    const url = baseSupport + submitTicket;
    const headers = {
      'Content-Type': 'multipart/form-data',
      'Authorization': token
    };

    return ApiCallPost(url, formData, headers);
  },

  getUserTickets: async () => {
    const token = localStorage.getItem("token");
    const { baseSupport, getUserTickets } = ApiConfig;
    const url = baseSupport + getUserTickets;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };

    return ApiCallGet(url, headers);
  },

  getTicketCategories: async () => {
    const { baseSupport, getTicketCategories } = ApiConfig;
    const url = baseSupport + getTicketCategories;
    const headers = {
      "Content-Type": "application/json"
    };

    return ApiCallGet(url, headers);
  },

  replyTicket: async (messagerply, id) => {
    const token = localStorage.getItem("token");
    const { baseSupport, replyTicket } = ApiConfig;
    const url = baseSupport + replyTicket;
    const params = {
      replyBy: 1,
      query: messagerply,
      ticket_id: id,

    }
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };

    return ApiCallPost(url, params, headers);
  },

  request_refund: async (order_id) => {
    const token = localStorage.getItem("token");
    const { baseP2p, request_refund } = ApiConfig;
    const url = baseP2p + request_refund;
    const params = { order_id }
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  getReferredUserData: async (code) => {
    const url = `https://cvtoken.us/stake/api/user-data/${code}`
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallGet(url, headers);
  },



  // P2P Ends here........


  // Options Routes


  optionPairs: async () => {
    const token = localStorage.getItem('token');
    const { baseOptions, optionPairs } = ApiConfig;
    const url = baseOptions + optionPairs;

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);

  },

  contractDates: async (underlying) => {
    const token = localStorage.getItem('token');
    const { baseOptions, contractDates } = ApiConfig;
    const url = baseOptions + contractDates + `?underlying=${underlying}`;

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallGet(url, headers);

  },

  placeOptionOrder: async (symbol, side, price, quantity) => {
    const token = localStorage.getItem('token');
    const { baseOptions, placeOptionOrder } = ApiConfig;
    const url = baseOptions + placeOptionOrder;
    const params = { symbol, side, price, quantity }

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);

  },

  cancelOptionOrder: async (orderId) => {
    const token = localStorage.getItem('token');
    const { baseOptions, cancelOptionOrder } = ApiConfig;
    const url = baseOptions + cancelOptionOrder;
    const params = { orderId }

    const headers = {
      'Content-Type': 'application/json',
      "Authorization": token,
    };
    return ApiCallPost(url, params, headers);

  },


  // P2P Routes Starts Here
  getCurrency: async () => {
    const token = localStorage.getItem("token");
    const { baseP2p, getCurrency } = ApiConfig;
    const url = baseP2p + getCurrency;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  getFiatCurrency: async () => {
    const token = localStorage.getItem("token");
    const { baseP2p, getFiatCurrency } = ApiConfig;
    const url = baseP2p + getFiatCurrency;
    console.log(url, 'urlurlurl');
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  getAllPaymentMethods: async () => {
    const token = localStorage.getItem("token");
    const { baseP2p, getAllPaymentMethods } = ApiConfig;
    const url = baseP2p + getAllPaymentMethods;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  p2pSellOrderForBuyer: async (params = {}) => {
    const token = localStorage.getItem("token");
    const { baseP2p, p2pSellOrderForBuyer } = ApiConfig;
    const queryParams = new URLSearchParams();
    if (params.fiat) queryParams.append('fiat', params.fiat);
    if (params.crypto) queryParams.append('crypto', params.crypto);
    if (params.paymentType && params.paymentType !== 'All payments') queryParams.append('paymentType', params.paymentType);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    const url = baseP2p + p2pSellOrderForBuyer + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },
  p2pBuyOrderForSeller: async (params = {}) => {
    const token = localStorage.getItem("token");
    const { baseP2p, p2pBuyOrderForSeller } = ApiConfig;
    const queryParams = new URLSearchParams();
    if (params.fiat) queryParams.append('fiat', params.fiat);
    if (params.crypto) queryParams.append('crypto', params.crypto);
    if (params.paymentType && params.paymentType !== 'All payments') queryParams.append('paymentType', params.paymentType);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    const url = baseP2p + p2pBuyOrderForSeller + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  getUserPaymentMethods: async () => {
    const token = localStorage.getItem("token");
    const { baseP2p, getUserPaymentMethods } = ApiConfig;
    const url = baseP2p + getUserPaymentMethods;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  getPaymentMethodFields: async (id) => {
    const token = localStorage.getItem("token");
    const { baseP2p, getPaymentMethodFields } = ApiConfig;
    const url = baseP2p + getPaymentMethodFields + `?id=${id}`;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  getPairPrice: async (crypto, fiat) => {
    const token = localStorage.getItem("token");
    const { baseP2p, getPairPrice } = ApiConfig;
    const url = baseP2p + getPairPrice + `?crypto=${crypto}&fiat=${fiat}`;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  getUserAds: async (params = {}) => {
    const token = localStorage.getItem("token");
    const { baseP2p, getUserAds } = ApiConfig;
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.side) queryParams.append('side', params.side);
    if (params.status) queryParams.append('status', params.status);
    if (params.fiatCurrency) queryParams.append('fiatCurrency', params.fiatCurrency);
    if (params.qouteCurrency) queryParams.append('qouteCurrency', params.qouteCurrency);
    const url = baseP2p + getUserAds + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  closeAd: async (adId, reason = '') => {
    const token = localStorage.getItem("token");
    const { baseP2p, closeAd } = ApiConfig;
    const url = baseP2p + closeAd;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    const payload = { adId };
    if (reason && reason.trim()) {
      payload.reason = reason.trim();
    }
    return ApiCallPost(url, payload, headers);
  },

  updateAdStatus: async (adId, isOnline) => {
    const token = localStorage.getItem("token");
    const { baseP2p, updateAdStatus } = ApiConfig;
    const url = baseP2p + updateAdStatus;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, { adId, isOnline }, headers);
  },

  addUserPaymentMethod: async (formData) => {
    const token = localStorage.getItem("token");
    const { baseP2p, addUserPaymentMethod } = ApiConfig;
    const url = baseP2p + addUserPaymentMethod;
    const headers = {
      "Content-Type": "multipart/form-data",
      'Authorization': token
    };
    return ApiCallPost(url, formData, headers);
  },

  deleteUserPaymentMethod: async (paymentMethodId) => {
    const token = localStorage.getItem("token");
    const { baseP2p, deleteUserPaymentMethod } = ApiConfig;
    const url = baseP2p + deleteUserPaymentMethod;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, { paymentMethodId }, headers);
  },

  createAd: async (formData) => {
    const token = localStorage.getItem("token");
    const { baseP2p, createAd } = ApiConfig;
    const url = baseP2p + createAd;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, formData, headers);
  },
  buyFromAd: async (formData) => {
    const token = localStorage.getItem("token");
    const { baseP2p, buyFromAd } = ApiConfig;
    const url = baseP2p + buyFromAd;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, formData, headers);
  },

  sellFromAd: async (formData) => {
    const token = localStorage.getItem("token");
    const { baseP2p, sellFromAd } = ApiConfig;
    const url = baseP2p + sellFromAd;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, formData, headers);
  },

  getP2pOrderDetails: async (orderId) => {
    const token = localStorage.getItem("token");
    const { baseP2p, getP2pOrderDetails } = ApiConfig;
    const url = baseP2p + getP2pOrderDetails + `/${orderId}`;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  getP2pOrders: async (params = {}) => {
    const token = localStorage.getItem("token");
    const { baseP2p, getP2pOrders } = ApiConfig;
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.side) queryParams.append('side', params.side);
    if (params.crypto) queryParams.append('crypto', params.crypto);
    if (params.fiat) queryParams.append('fiat', params.fiat);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    const url = baseP2p + getP2pOrders + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  // ============ P2P ORDER ACTIONS ============

  // Buyer marks payment as completed (with optional payment proof)
  markPaymentCompleted: async (orderId, paymentProof = null) => {
    const token = localStorage.getItem("token");
    const { baseP2p, markPaymentCompleted } = ApiConfig;
    const url = baseP2p + markPaymentCompleted;

    const formData = new FormData();
    formData.append('orderId', orderId);
    if (paymentProof) {
      formData.append('paymentProof', paymentProof);
    }

    const headers = {
      'Authorization': token
      // Note: Don't set Content-Type for FormData, let browser set it with boundary
    };
    return ApiCallPost(url, formData, headers);
  },

  // Seller releases crypto after verifying payment
  releaseCrypto: async (orderId) => {
    const token = localStorage.getItem("token");
    const { baseP2p, releaseCrypto } = ApiConfig;
    const url = baseP2p + releaseCrypto;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, { orderId }, headers);
  },

  // Buyer cancels order (only PENDING_PAYMENT status)
  cancelP2pOrder: async (orderId, cancelReason = '') => {
    const token = localStorage.getItem("token");
    const { baseP2p, cancelP2pOrder } = ApiConfig;
    const url = baseP2p + cancelP2pOrder;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, { orderId, cancelReason }, headers);
  },

  // Buyer raises dispute (only after PAID status)
  buyerRaiseDispute: async (orderId, reason) => {
    const token = localStorage.getItem("token");
    const { baseP2p, buyerDispute } = ApiConfig;
    const url = baseP2p + buyerDispute;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, { orderId, reason }, headers);
  },

  // Seller raises dispute (only after PAID status)
  sellerRaiseDispute: async (orderId, reason) => {
    const token = localStorage.getItem("token");
    const { baseP2p, sellerDispute } = ApiConfig;
    const url = baseP2p + sellerDispute;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, { orderId, reason }, headers);
  },

  getP2pProfile: async (userId = null) => {
    const token = localStorage.getItem("token");
    const { baseP2p, getP2pProfile } = ApiConfig;
    let url = baseP2p + getP2pProfile;
    if (userId) {
      url += `?userId=${userId}`;
    }
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  // ============ P2P CHAT APIs ============

  // Send text message
  sendChatMessage: async (orderId, message) => {
    const token = localStorage.getItem("token");
    const { baseP2p, sendChatMessage } = ApiConfig;
    const url = baseP2p + sendChatMessage;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, { orderId, message }, headers);
  },

  // Upload chat image
  uploadChatImage: async (orderId, file) => {
    const token = localStorage.getItem("token");
    const { baseP2p, uploadChatImage } = ApiConfig;
    const url = baseP2p + uploadChatImage;

    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('image', file);

    const headers = {
      'Authorization': token
    };
    return ApiCallPost(url, formData, headers);
  },

  // Get chat history
  getChatHistory: async (orderId, params = {}) => {
    const token = localStorage.getItem("token");
    const { baseP2p, getChatHistory } = ApiConfig;
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.before) queryParams.append('before', params.before);
    const url = baseP2p + getChatHistory + `/${orderId}` + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  // Mark chat messages as read
  markChatAsRead: async (orderId) => {
    const token = localStorage.getItem("token");
    const { baseP2p, markChatRead } = ApiConfig;
    const url = baseP2p + markChatRead;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, { orderId }, headers);
  },

  // Get unread message count
  getChatUnreadCount: async (orderId = null) => {
    const token = localStorage.getItem("token");
    const { baseP2p, getChatUnreadCount } = ApiConfig;
    let url = baseP2p + getChatUnreadCount;
    if (orderId) {
      url += `?orderId=${orderId}`;
    }
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallGet(url, headers);
  },

  // Delete chat message
  deleteChatMessage: async (messageId) => {
    const token = localStorage.getItem("token");
    const { baseP2p, deleteChatMessage } = ApiConfig;
    const url = baseP2p + deleteChatMessage;
    const headers = {
      "Content-Type": "application/json",
      'Authorization': token
    };
    return ApiCallPost(url, { messageId }, headers);
  },

  // P2P ends here


  // ============================================================================
  // SECURITY & 2FA METHODS
  // ============================================================================

  /**
   * Send OTP for security verification (2FA setup, email change, phone change, etc.)
   * @param {string} target - Target type: 'email', 'mobile', 'new_email', 'new_mobile'
   * @param {string} purpose - Purpose of OTP (login, 2fa_setup, email_change, phone_change, etc.)
   * @param {string} value - Optional: New email/phone value when target is 'new_email' or 'new_mobile'
   */
  /**
   * Get user's security status and methods
   */
  getSecurityStatus: async () => {
    const token = localStorage.getItem("token");
    const { baseSecurity, securityStatus } = ApiConfig;
    const url = baseSecurity + securityStatus;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },



  securitySendOtp: async (target, purpose, value = null) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, securitySendOtp } = ApiConfig;
    const url = baseSecurity + securitySendOtp;
    const params = { target, purpose };
    if (value) {
      params.value = value;
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  /**
   * Verify OTP for security actions
   * @param {string} target - Target type: 'email', 'mobile', 'new_email', 'new_mobile'
   * @param {string} otp - 6-digit OTP code
   * @param {string} purpose - Purpose of OTP (e.g., '2fa_verification', 'change_email')
   * @param {string} identifier - Optional: New email/phone value when target is 'new_email' or 'new_mobile'
   */
  securityVerifyOtp: async (target, otp, purpose, identifier = null) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, securityVerifyOtp } = ApiConfig;
    const url = baseSecurity + securityVerifyOtp;
    const params = { target, otp, purpose };
    if (identifier) {
      params.identifier = identifier;
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  /**
   * Get user's security status
   */
  securityGetStatus: async () => {
    const token = localStorage.getItem("token");
    const { baseSecurity, securityStatus } = ApiConfig;
    const url = baseSecurity + securityStatus;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  /**
   * Verify TOTP code for security actions
   * @param {string} code - 6-digit TOTP code from authenticator app
   * @param {string} purpose - Purpose of verification (e.g., 'add_passkey', 'change_email')
   */
  securityVerifyTotp: async (code, purpose) => {
    const token = localStorage.getItem("token");
    const { baseSecurity } = ApiConfig;
    const url = baseSecurity + "verify-totp";
    const params = { code: String(code), purpose };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  /**
   * Initiate 2FA setup - generates QR code and secret
   */
  security2faSetup: async () => {
    const token = localStorage.getItem("token");
    const { baseSecurity, security2faSetup: setupEndpoint } = ApiConfig;
    const url = baseSecurity + setupEndpoint;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, {}, headers);
  },

  /**
   * Confirm 2FA setup - verifies TOTP code and activates 2FA
   * @param {string} code - 6-digit TOTP code from authenticator app
   */
  security2faConfirm: async (code) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, security2faConfirm: confirmEndpoint } = ApiConfig;
    const url = baseSecurity + confirmEndpoint;
    const params = { code };
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, params, headers);
  },

  /**
   * Disable 2FA
   * @param {string} authenticatorCode - The 6-digit code from Google Authenticator
   * @param {string} otpCode - OTP code for email/mobile verification
   * @param {string} verifyMethod - 'email', 'mobile', or 'passkey'
   * @param {string} passkeyUserId - User ID from passkey verification
   */
  security2faDisable: async (authenticatorCode, otpCode = null, verifyMethod = null, passkeyUserId = null) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, security2faDisable: disableEndpoint } = ApiConfig;
    const url = baseSecurity + disableEndpoint;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    const data = {};
    if (authenticatorCode) data.code = authenticatorCode;
    if (otpCode) data.otpCode = otpCode;
    if (verifyMethod) data.verifyMethod = verifyMethod;
    if (passkeyUserId) data.passkeyUserId = passkeyUserId;
    return ApiCallPost(url, data, headers);
  },

  /**
   * Add mobile number to account
   * @param {object} data - { mobileNumber, countryCode, mobileOtp }
   */
  securityMobileAdd: async (data) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, securityMobileAdd: mobileAddEndpoint } = ApiConfig;
    const url = baseSecurity + mobileAddEndpoint;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, data, headers);
  },

  /**
   * Add Email (for users who signed up with phone)
   * @param {object} data - { email, tofaCode (optional), mobileOtp, emailOtp }
   */
  securityEmailAdd: async (data) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, securityEmailAdd: emailAddEndpoint } = ApiConfig;
    const url = baseSecurity + emailAddEndpoint;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, data, headers);
  },

  /**
   * Initiate Email Change - stores pending change and sends OTP to new email
   * @param {object} data - { newEmail, tofaCode (optional), currentEmailOtp }
   */
  securityEmailChangeInitiate: async (data) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, securityEmailChangeInitiate: endpoint } = ApiConfig;
    const url = baseSecurity + endpoint;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, data, headers);
  },

  /**
   * Complete Email Change - verifies new email OTP and updates email
   * @param {object} data - { newEmailOtp }
   */
  securityEmailChangeComplete: async (data) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, securityEmailChangeComplete: endpoint } = ApiConfig;
    const url = baseSecurity + endpoint;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, data, headers);
  },

  /**
   * Initiate Mobile Change - stores pending change and sends OTP to new mobile
   * @param {object} data - { newMobileNumber, newCountryCode, tofaCode (optional), currentMobileOtp }
   */
  securityMobileChangeInitiate: async (data) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, securityMobileChangeInitiate: endpoint } = ApiConfig;
    const url = baseSecurity + endpoint;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, data, headers);
  },

  /**
   * Complete Mobile Change - verifies new mobile OTP and updates mobile
   * @param {object} data - { newMobileOtp }
   */
  securityMobileChangeComplete: async (data) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, securityMobileChangeComplete: endpoint } = ApiConfig;
    const url = baseSecurity + endpoint;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, data, headers);
  },

  // ============================================================================
  // PASSKEY (WebAuthn) METHODS
  // ============================================================================

  /**
   * Get passkey registration options (Step 1)
   * Returns challenge and options for WebAuthn registration
   */
  passkeyGetRegistrationOptions: async () => {
    const token = localStorage.getItem("token");
    const { baseSecurity, passkeyRegisterOptions } = ApiConfig;
    const url = baseSecurity + passkeyRegisterOptions;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, {}, headers);
  },

  /**
   * Verify passkey registration (Step 2)
   * @param {object} credential - WebAuthn credential response
   * @param {string} name - User-friendly name for the passkey
   */
  passkeyVerifyRegistration: async (credential, name = null) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, passkeyRegisterVerify } = ApiConfig;
    const url = baseSecurity + passkeyRegisterVerify;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, { credential, name }, headers);
  },

  /**
   * Get list of user's passkeys
   */
  passkeyGetList: async () => {
    const token = localStorage.getItem("token");
    const { baseSecurity, passkeyList } = ApiConfig;
    const url = baseSecurity + passkeyList;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallGet(url, headers);
  },

  /**
   * Rename a passkey
   * @param {string} passkeyId - ID of the passkey
   * @param {string} name - New name for the passkey
   */
  passkeyRename: async (passkeyId, name) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, passkeyRename: endpoint } = ApiConfig;
    const url = baseSecurity + endpoint;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    return ApiCallPost(url, { passkeyId, name }, headers);
  },

  /**
   * Delete a passkey
   * @param {string} passkeyId - ID of the passkey
   * @param {string} verifyMethod - 'totp', 'email', or 'mobile'
   * @param {string} code - Verification code
   */
  passkeyDelete: async (passkeyId, verifyMethod, code, passkeyUserId = null) => {
    const token = localStorage.getItem("token");
    const { baseSecurity, passkeyDelete: endpoint } = ApiConfig;
    const url = baseSecurity + endpoint;
    const headers = {
      "Content-Type": "application/json",
      Authorization: token,
    };
    const data = { passkeyId, verifyMethod, code };
    if (passkeyUserId) {
      data.passkeyUserId = passkeyUserId;
    }
    return ApiCallPost(url, data, headers);
  },

  /**
   * Get passkey authentication options (for login)
   * @param {string} signId - Email or phone number
   */
  passkeyGetAuthOptions: async (signId) => {
    const { baseSecurity, passkeyAuthOptions } = ApiConfig;
    const url = baseSecurity + passkeyAuthOptions;
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, { signId }, headers);
  },

  /**
   * Verify passkey authentication (for login)
   * @param {string} signId - Email or phone number
   * @param {object} credential - WebAuthn credential response
   */
  passkeyVerifyAuth: async (signId, credential) => {
    const { baseSecurity, passkeyAuthVerify } = ApiConfig;
    const url = baseSecurity + passkeyAuthVerify;
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, { signId, credential }, headers);
  },

  /**
   * Complete login after passkey verification
   * @param {string} signId - Email or phone number
   * @param {object} verificationData - Data from passkey verification
   */
  completePasskeyLogin: async (signId, verificationData) => {
    const { baseSecurity } = ApiConfig;
    const url = baseSecurity + "passkey/login/complete";
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, { signId, ...verificationData }, headers);
  },

  /**
   * Get discoverable passkey authentication options (sign in with passkey - no email required)
   */
  passkeyDiscoverableAuthOptions: async () => {
    const { baseSecurity } = ApiConfig;
    const url = baseSecurity + "passkey/discoverable/options";
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, {}, headers);
  },

  /**
   * Verify discoverable passkey authentication (sign in with passkey - no email required)
   * @param {object} credential - WebAuthn credential response
   * @param {string} challenge - Challenge from the options response
   */
  passkeyDiscoverableVerify: async (credential, challenge) => {
    const { baseSecurity } = ApiConfig;
    const url = baseSecurity + "passkey/discoverable/verify";
    const headers = {
      "Content-Type": "application/json",
    };
    return ApiCallPost(url, { credential, challenge }, headers);
  },

  // ============================================================================
  // END OF SECURITY METHODS
  // ============================================================================

};

export default AuthService;

import axios from "axios";
import { alertErrorMessage } from "../../customComponents/CustomAlertMessage";
import { ApiConfig } from "../apiConfig/apiConfig";
import { getStoredUserForGuard, isDemoUser, isDemoMutationUrlAllowed } from "../../utils/authUtils";

// Default timeout of 30 seconds
const TIMEOUT = 30000;

const DEMO_BLOCKED_ACTION_MSG = 'Demo users are not allowed to perform this action';

const tokenExpire = (isDemo = false) => {
  alertErrorMessage(isDemo ? 'Demo session expired. Please login again.' : 'Token is Expired Please Login Again');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent('loginStateChange'));
  window.location.href = '/login';
};

/**
 * Demo users: block wallet/sportsbook mutations. Allow WCO launch, auth refresh/logout, demo-login.
 * See utils/demoPermissions.js — isDemoMutationUrlAllowed.
 */
const guardDemoUser = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (isDemoMutationUrlAllowed(url)) return null;
  const user = getStoredUserForGuard();
  if (!isDemoUser(user)) return null;
  return { success: false, message: DEMO_BLOCKED_ACTION_MSG };
};

const refreshUrl = `${ApiConfig.baseBettingAuth}${ApiConfig.bettingRefreshToken}`;

/** Per API doc: on 401, retry once with new token from refresh-token, then redirect to login. Do not reload for guest (no token sent). */
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error?.response?.status !== 401 || originalRequest.__retried) {
      return Promise.reject(error);
    }
    if (originalRequest?.url?.includes(ApiConfig.bettingRefreshToken)) {
      const user = getStoredUserForGuard();
      tokenExpire(isDemoUser(user));
      return Promise.reject(error);
    }
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!refreshToken) {
      if (originalRequest?.headers?.Authorization) {
        const user = getStoredUserForGuard();
        tokenExpire(isDemoUser(user));
      }
      return Promise.reject(error);
    }
    try {
      const { data } = await axios.post(refreshUrl, { refreshToken }, { timeout: TIMEOUT });
      const newToken = data?.data?.accessToken ?? data?.accessToken;
      if (!newToken) {
        const user = getStoredUserForGuard();
        tokenExpire(isDemoUser(user));
        return Promise.reject(error);
      }
      sessionStorage.setItem('token', newToken);
      originalRequest.__retried = true;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axios(originalRequest);
    } catch {
      const user = getStoredUserForGuard();
      tokenExpire(isDemoUser(user));
      return Promise.reject(error);
    }
  }
);

/** Parse backend error shape: { success: false, message, errorCode }. Apply global handling for status codes. */
const handleApiError = (error) => {
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return { success: false, message: 'Request timeout. Please try again.' };
  }
  if (!error.response) {
    return { success: false, message: 'Network error. Please check your connection.' };
  }
  if (error?.response?.data?.message === "Token is expired" && sessionStorage.getItem('token')) {
    tokenExpire(isDemoUser(getStoredUserForGuard()));
    return { success: false, message: 'Token expired.' };
  }

  const status = error.response?.status;
  const data = error.response?.data || {};
  const message = data.message || data.msg || data.error || '';
  const errorCode = data.errorCode || data.code;

  if (status === 401) {
    const isDemo = isDemoUser(getStoredUserForGuard());
    if (error.config?.headers?.Authorization) {
      tokenExpire(isDemo);
    }
    const msg = isDemo ? 'Demo session expired. Please login again.' : (message || 'Unauthorized.');
    return { success: false, message: msg, errorCode };
  }
  if (status === 403) {
    const isDemo = isDemoUser(getStoredUserForGuard());
    const msg = isDemo ? DEMO_BLOCKED_ACTION_MSG : (message || 'Access denied.');
    alertErrorMessage(msg);
    return { success: false, message: msg, errorCode };
  }
  if (status === 429) {
    alertErrorMessage('Too many attempts. Try again in 15 minutes.');
    return { success: false, message: 'Too many attempts. Try again in 15 minutes.', errorCode };
  }
  if (status === 404) {
    return { success: false, message: message || 'Not found.', errorCode };
  }
  if (status === 400 && message) {
    return { success: false, message, errorCode, validationErrors: data.errors || data.validationErrors };
  }

  return { success: false, message: message || 'Something went wrong.', errorCode, ...data };
};

export const ApiCallPost = async (url, parameters, headers) => {
  const blocked = guardDemoUser(url);
  if (blocked) {
    alertErrorMessage(blocked.message);
    return blocked;
  }
  try {
    const response = await axios.post(url, parameters, { headers: headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/** POST with FormData (e.g. deposit with payment proof file). Do not set Content-Type. */
export const ApiCallPostFormData = async (url, formData, authHeader) => {
  const blocked = guardDemoUser(url);
  if (blocked) {
    alertErrorMessage(blocked.message);
    return blocked;
  }
  try {
    const headers = authHeader ? { Authorization: authHeader } : {};
    const response = await axios.post(url, formData, { headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const ApiCallGet = async (url, headers) => {
  try {
    const response = await axios.get(url, { headers: headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const ApiCallGetVerifyRegistration = async (url, headers) => {
  try {
    const response = await axios.get(url, { headers: headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return error?.response?.data;
  }
};

export const ApiCallPut = async (url, parameters, headers) => {
  const blocked = guardDemoUser(url);
  if (blocked) {
    alertErrorMessage(blocked.message);
    return blocked;
  }
  try {
    const response = await axios.put(url, parameters, { headers: headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/** PUT with FormData (for file upload). Do not set Content-Type so browser sets multipart boundary. */
export const ApiCallPutFormData = async (url, formData, authHeader) => {
  const blocked = guardDemoUser(url);
  if (blocked) {
    alertErrorMessage(blocked.message);
    return blocked;
  }
  try {
    const headers = authHeader ? { Authorization: authHeader } : {};
    const response = await axios.put(url, formData, { headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const ApiCallPatch = async (url, parameters, headers) => {
  const blocked = guardDemoUser(url);
  if (blocked) {
    alertErrorMessage(blocked.message);
    return blocked;
  }
  try {
    const response = await axios.patch(url, parameters, { headers: headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const ApiCallDelete = async (url, headers) => {
  const blocked = guardDemoUser(url);
  if (blocked) {
    alertErrorMessage(blocked.message);
    return blocked;
  }
  try {
    const response = await axios.delete(url, { headers: headers || {}, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};
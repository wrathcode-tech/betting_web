import axios from "axios";
import { alertErrorMessage } from "../../customComponents/CustomAlertMessage";

// Default timeout of 30 seconds
const TIMEOUT = 30000;

const handleApiError = (error) => {
  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return { success: false, message: 'Request timeout. Please try again.' };
  }
  
  // Handle network errors
  if (!error.response) {
    return { success: false, message: 'Network error. Please check your connection.' };
  }
  
  // Handle token expiry
  if (error?.response?.data?.message === "Token is expired") {
    tokenExpire();
    return;
  }
  
  return error?.response?.data;
};

export const ApiCallPost = async (url, parameters, headers) => {
  try {
    const response = await axios.post(url, parameters, { headers: headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/** POST with FormData (e.g. deposit with payment proof file). Do not set Content-Type. */
export const ApiCallPostFormData = async (url, formData, authHeader) => {
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
  try {
    const response = await axios.put(url, parameters, { headers: headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/** PUT with FormData (for file upload). Do not set Content-Type so browser sets multipart boundary. */
export const ApiCallPutFormData = async (url, formData, authHeader) => {
  try {
    const headers = authHeader ? { Authorization: authHeader } : {};
    const response = await axios.put(url, formData, { headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const ApiCallPatch = async (url, parameters, headers) => {
  try {
    const response = await axios.patch(url, parameters, { headers: headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const ApiCallDelete = async (url, headers) => {
  try {
    const response = await axios.delete(url, { headers: headers || {}, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

const tokenExpire = () => {
  alertErrorMessage('Token is Expired Please Login Again');
  sessionStorage.clear();
  window.location.reload();
}
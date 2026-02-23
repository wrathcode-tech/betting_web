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

export const ApiCallPatch = async (url, parameters, headers) => {
  try {
    const response = await axios.patch(url, parameters, { headers: headers, timeout: TIMEOUT });
    return response?.data;
  } catch (error) {
    return handleApiError(error);
  }
};

const tokenExpire = () => {
  alertErrorMessage('Token is Expired Please Login Again');
  localStorage.clear();
  window.location.reload();
}
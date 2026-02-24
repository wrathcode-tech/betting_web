import { snackbar } from '../utils/snackbarUtils';

export const alertSuccessMessage = (message) => {
  snackbar.success(message);
};

export const alertErrorMessage = (message) => {
  snackbar.error(message);
};

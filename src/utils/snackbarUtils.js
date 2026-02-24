import { toast } from 'react-toastify';

/**
 * Snackbar-style notifications using react-toastify.
 * Use from anywhere: snackbar.success('Done'), snackbar.error('Failed'), etc.
 */
function show(message, type = 'default', options = {}) {
  const opts = { position: 'top-right', ...options };
  if (type === 'success') toast.success(message, opts);
  else if (type === 'error') toast.error(message, opts);
  else if (type === 'warning') toast.warning(message, opts);
  else if (type === 'info') toast.info(message, opts);
  else toast(message, opts);
}

export const snackbar = {
  success: (message, options) => show(message, 'success', options),
  error: (message, options) => show(message, 'error', options),
  warning: (message, options) => show(message, 'warning', options),
  info: (message, options) => show(message, 'info', options),
  default: (message, options) => show(message, 'default', options),
};

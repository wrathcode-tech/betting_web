import { useSnackbar } from 'notistack';

let enqueueSnackbarRef = null;

/**
 * Renders inside SnackbarProvider. Captures enqueueSnackbar so we can use it outside React components.
 * Add <SnackbarUtilsConfigurator /> inside SnackbarProvider in App.js.
 */
export function SnackbarUtilsConfigurator() {
  const { enqueueSnackbar } = useSnackbar();
  enqueueSnackbarRef = enqueueSnackbar;
  return null;
}

function show(message, variant = 'default', options = {}) {
  if (enqueueSnackbarRef) {
    enqueueSnackbarRef(message, { variant, ...options });
  } else {
    // Fallback if provider not mounted yet (e.g. in tests)
    if (typeof window !== 'undefined') window.alert(message);
  }
}

export const snackbar = {
  success: (message, options) => show(message, 'success', options),
  error: (message, options) => show(message, 'error', options),
  warning: (message, options) => show(message, 'warning', options),
  info: (message, options) => show(message, 'info', options),
  default: (message, options) => show(message, 'default', options),
};

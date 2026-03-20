/**
 * Unified read for wallet (real) vs demo casino credits.
 * Wallet is always 0 for demo in UI; demoPlayBalance is WCO play money.
 */
import { useAuth } from '../context/AuthContext';
import { useBalance } from '../context/BalanceContext';
import { getDisplayWalletBalance } from '../utils/authUtils';

export function useDemoBalance() {
  const { user, isDemo } = useAuth();
  const { balance, demoPlayBalance } = useBalance();

  const walletBalance = getDisplayWalletBalance(user, balance);
  const credits =
    isDemo
      ? Number(demoPlayBalance ?? user?.demoPlayBalance ?? user?.demo_play_balance ?? 0)
      : null;

  return {
    isDemo,
    /** Real wallet amount for display (0 when demo). */
    walletBalance,
    /** Casino demo credits; null when not demo. */
    demoPlayBalance: isDemo ? (Number.isFinite(credits) ? credits : 0) : null,
  };
}

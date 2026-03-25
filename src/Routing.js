import React, { Suspense, memo } from "react";
import { lazyWithRetry } from "./utils/lazyWithRetry";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import { SidebarProvider } from "./context/SidebarContext";
import { CasinoProvidersProvider } from "./context/CasinoProvidersContext";
import { BalanceProvider } from "./context/BalanceContext";
import { BetSlipProvider } from "./context/BetSlipContext";
import { SportsbookStoreProvider } from "./context/SportsbookStore";
import { PlatformConfigProvider } from "./context/PlatformConfigContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./Layout";
import ReferralProgram from "./ReferralProgram/ReferralProgram";

// Demo: block real wallet & bank routes. Casino /game allowed (WCO uses demoPlayBalance).
const DEMO_BLOCKED_PATHS = [
  '/deposit', '/withdrawal',
  '/add-account', '/add-bank',
];

function ProtectedRoute() {
  const location = useLocation();
  const isLoggedIn = !!(sessionStorage.getItem("token"));
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ returnTo: location.pathname + location.search }} />;
  return <Outlet />;
}

function DemoBlockRoute() {
  const location = useLocation();
  const { isDemo } = useAuth();
  if (isDemo && DEMO_BLOCKED_PATHS.includes(location.pathname)) {
    return <Navigate to="/" replace state={{ demoBlocked: true, message: 'Demo users can only explore the platform' }} />;
  }
  return <Outlet />;
}

// Lazy load pages – only the current route's chunk loads (faster initial load)
const LandingPage = lazyWithRetry(() => import("./LandingPage/LandingPage"));
const ProfilePage = lazyWithRetry(() => import("./ProfilePage"));
const CasinoGame = lazyWithRetry(() => import("./Casino/CasinoGame"));
const CasinoCategoryPage = lazyWithRetry(() => import("./Casino/CasinoCategoryPage"));
const GamePlay = lazyWithRetry(() => import("./GamePlay"));
const GameHistory = lazyWithRetry(() => import("./GameHistory/GameHistory"));
const SportsGame = lazyWithRetry(() => import("./sports/SportsGame"));
const SportsBook = lazyWithRetry(() => import("./SportsBook/SportsBook"));
const ProfileTransactions = lazyWithRetry(() => import("./ProfileTransactions/ProfileTransactions"));
const Promotions = lazyWithRetry(() => import("./promotions/Promotions"));
const MyBets = lazyWithRetry(() => import("./StatementPages/MyBets"));
const MyWallet = lazyWithRetry(() => import("./StatementPages/MyWallet"));
const BettingProfitLoss = lazyWithRetry(() => import("./StatementPages/BettingProfitLoss"));
const TurnoverHistory = lazyWithRetry(() => import("./StatementPages/TurnoverHistory"));
const AccountStatement = lazyWithRetry(() => import("./StatementPages/AccountStatement"));
const BonusStatement = lazyWithRetry(() => import("./StatementPages/BonusStatement"));
const DepositTurnover = lazyWithRetry(() => import("./StatementPages/DepositTurnover"));
const GameRules = lazyWithRetry(() => import("./GameRule/GameRules"));
const TermsAndConditions = lazyWithRetry(() => import("./pages/TermsAndConditions"));
const CricketDetail = lazyWithRetry(() => import("./cricket/CricketDetail"));
const RankSystem = lazyWithRetry(() => import("./RankSystem/RankSystem"));
const NewDeposit = lazyWithRetry(() => import("./newDeposit/NewDeposit"));
const NewWithdrawal = lazyWithRetry(() => import("./newWithdrawal/NewWithdrawal"));
const AddAccount = lazyWithRetry(() => import("./BankDetails/AddAccount"));
const AddBank = lazyWithRetry(() => import("./BankDetails/AddBank"));
const LoginPage = lazyWithRetry(() => import("./pages/LoginPage"));
const SupportPage = lazyWithRetry(() => import("./pages/SupportPage"));
const DepositHistory = lazyWithRetry(() => import("./pages/DepositHistory"));
const WithdrawalHistory = lazyWithRetry(() => import("./pages/WithdrawalHistory"));
const StatementHistory = lazyWithRetry(() => import("./pages/StatementHistory"));
const OpenBets = lazyWithRetry(() => import("./pages/OpenBets"));
const BetHistoryPage = lazyWithRetry(() => import("./pages/BetHistoryPage"));
const ReferralRewards = lazyWithRetry(() => import("./pages/ReferralRewards"));

const Routing = memo(function Routing() {
  return (
    <Router>
      <AuthProvider>
      <SidebarProvider>
        <PlatformConfigProvider>
        <CasinoProvidersProvider>
        <SportsbookStoreProvider>
        <BalanceProvider>
        <BetSlipProvider>
        <ScrollToTop />
        <Suspense fallback={null}>
          <Routes>
            <Route element={<Layout />}>
              {/* Public routes – no login required */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<LoginPage />} />
              <Route path="/casino" element={<CasinoGame />} />
              <Route path="/casino/category/:categoryId" element={<CasinoCategoryPage />} />
              <Route path="/sports" element={<SportsGame />} />
              <Route path="/sportsbook" element={<SportsBook />} />
              <Route path="/cricket" element={<CricketDetail />} />
              <Route path="/tennis" element={<CricketDetail />} />
              <Route path="/soccer" element={<CricketDetail />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/game-rules" element={<GameRules />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              {/* Protected routes – demo blocked from deposit/withdrawal (not /game – casino play money) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DemoBlockRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/game" element={<GamePlay />} />
                <Route path="/game-history" element={<GameHistory />} />
                <Route path="/transactions" element={<ProfileTransactions />} />
                <Route path="/my-bets" element={<MyBets />} />
                <Route path="/bet-history" element={<BetHistoryPage />} />
                <Route path="/deposit-history" element={<DepositHistory />} />
                <Route path="/withdrawal-history" element={<WithdrawalHistory />} />
                <Route path="/statement-history" element={<StatementHistory />} />
                <Route path="/open-bets" element={<OpenBets />} />
                <Route path="/referral-rewards" element={<ReferralRewards />} />
                <Route path="/my-wallet" element={<MyWallet />} />
                <Route path="/betting-profit-loss" element={<BettingProfitLoss />} />
                <Route path="/turnover-history" element={<TurnoverHistory />} />
                <Route path="/account-statement" element={<AccountStatement />} />
                <Route path="/bonus-statement" element={<BonusStatement />} />
                <Route path="/deposit-turnover" element={<DepositTurnover />} />
                <Route path="/referral" element={<ReferralProgram />} />
                <Route path="/rank" element={<RankSystem />} />
                <Route path="/deposit" element={<NewDeposit />} />
                <Route path="/withdrawal" element={<NewWithdrawal />} />
                <Route path="/add-account" element={<AddAccount />} />
                <Route path="/add-bank" element={<AddBank />} />
                <Route path="/support" element={<SupportPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
        </BetSlipProvider>
        </BalanceProvider>
        </SportsbookStoreProvider>
        </CasinoProvidersProvider>
        </PlatformConfigProvider>
      </SidebarProvider>
      </AuthProvider>
    </Router>
  );
});

export default Routing;

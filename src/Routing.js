import React, { Suspense, lazy, memo } from "react";
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
const LandingPage = lazy(() => import("./LandingPage/LandingPage"));
const ProfilePage = lazy(() => import("./ProfilePage"));
const CasinoGame = lazy(() => import("./Casino/CasinoGame"));
const CasinoCategoryPage = lazy(() => import("./Casino/CasinoCategoryPage"));
const GamePlay = lazy(() => import("./GamePlay"));
const GameHistory = lazy(() => import("./GameHistory/GameHistory"));
const SportsGame = lazy(() => import("./sports/SportsGame"));
const SportsBook = lazy(() => import("./SportsBook/SportsBook"));
const ProfileTransactions = lazy(() => import("./ProfileTransactions/ProfileTransactions"));
const Promotions = lazy(() => import("./promotions/Promotions"));
const MyBets = lazy(() => import("./StatementPages/MyBets"));
const MyWallet = lazy(() => import("./StatementPages/MyWallet"));
const BettingProfitLoss = lazy(() => import("./StatementPages/BettingProfitLoss"));
const TurnoverHistory = lazy(() => import("./StatementPages/TurnoverHistory"));
const AccountStatement = lazy(() => import("./StatementPages/AccountStatement"));
const BonusStatement = lazy(() => import("./StatementPages/BonusStatement"));
const DepositTurnover = lazy(() => import("./StatementPages/DepositTurnover"));
const GameRules = lazy(() => import("./GameRule/GameRules"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const CricketDetail = lazy(() => import("./cricket/CricketDetail"));
const ReferralProgram = lazy(() => import("./ReferralProgram/ReferralProgram"));
const RankSystem = lazy(() => import("./RankSystem/RankSystem"));
const NewDeposit = lazy(() => import("./newDeposit/NewDeposit"));
const NewWithdrawal = lazy(() => import("./newWithdrawal/NewWithdrawal"));
const AddAccount = lazy(() => import("./BankDetails/AddAccount"));
const AddBank = lazy(() => import("./BankDetails/AddBank"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const DepositHistory = lazy(() => import("./pages/DepositHistory"));
const WithdrawalHistory = lazy(() => import("./pages/WithdrawalHistory"));
const StatementHistory = lazy(() => import("./pages/StatementHistory"));
const OpenBets = lazy(() => import("./pages/OpenBets"));
const BetHistoryPage = lazy(() => import("./pages/BetHistoryPage"));
const ReferralRewards = lazy(() => import("./pages/ReferralRewards"));

const Routing = memo(function Routing() {
  return (
    <Router>
      <AuthProvider>
      <SidebarProvider>
        <PlatformConfigProvider>
        <CasinoProvidersProvider>
        <BalanceProvider>
        <SportsbookStoreProvider>
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
        </SportsbookStoreProvider>
        </BalanceProvider>
        </CasinoProvidersProvider>
        </PlatformConfigProvider>
      </SidebarProvider>
      </AuthProvider>
    </Router>
  );
});

export default Routing;

import React, { Suspense, lazy, memo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import { SidebarProvider } from "./context/SidebarContext";
import { CasinoProvidersProvider } from "./context/CasinoProvidersContext";
import Layout from "./Layout";

function ProtectedRoute() {
  const isLoggedIn = !!(sessionStorage.getItem("token"));
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
};

// Lazy load pages – only the current route's chunk loads (faster initial load)
const LandingPage = lazy(() => import("./LandingPage/LandingPage"));
const ProfilePage = lazy(() => import("./ProfilePage"));
const CasinoGame = lazy(() => import("./Casino/casinoGame"));
const CasinoCategoryPage = lazy(() => import("./Casino/CasinoCategoryPage"));
const GamePlay = lazy(() => import("./GamePlay/gamePlay"));
const GameHistory = lazy(() => import("./GameHistory/GameHistory"));
const SportsGame = lazy(() => import("./sports/SportsGame"));
const ProfileTransactions = lazy(() => import("./ProfileTransactions/profileTransactions"));
const Promotions = lazy(() => import("./promotions/Promotions"));
const MyBets = lazy(() => import("./StatementPages/MyBets"));
const MyWallet = lazy(() => import("./StatementPages/MyWallet"));
const BettingProfitLoss = lazy(() => import("./StatementPages/BettingProfitLoss"));
const TurnoverHistory = lazy(() => import("./StatementPages/TurnoverHistory"));
const AccountStatement = lazy(() => import("./StatementPages/AccountStatement"));
const BonusStatement = lazy(() => import("./StatementPages/BonusStatement"));
const DepositTurnover = lazy(() => import("./StatementPages/DepositTurnover"));
const GameRules = lazy(() => import("./GameRule/gameRules"));
const CricketDetail = lazy(() => import("./cricket/cricketDetail"));
const ReferralProgram = lazy(() => import("./ReferralProgram/referralProgram"));
const RankSystem = lazy(() => import("./RankSystem/rankSystem"));
const NewDeposit = lazy(() => import("./newDeposit/newDeposit"));
const NewWithdrawal = lazy(() => import("./newWithdrawal/newWithdrawal"));
const AddAccount = lazy(() => import("./BankDetails/addAccount"));
const AddBank = lazy(() => import("./BankDetails/addBank"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

const Routing = memo(function Routing() {
  return (
    <Router>
      <SidebarProvider>
        <CasinoProvidersProvider>
        <ScrollToTop />
        <Suspense fallback={null}>
          <Routes>
            <Route element={<Layout />}>
              {/* Public routes – no login required */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/casino" element={<CasinoGame />} />
              <Route path="/casino/category/:categoryId" element={<CasinoCategoryPage />} />
              <Route path="/sports" element={<SportsGame />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/game-rules" element={<GameRules />} />
              {/* Protected routes – redirect to /login if not logged in */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/game" element={<GamePlay />} />
                <Route path="/game-history" element={<GameHistory />} />
                <Route path="/transactions" element={<ProfileTransactions />} />
                <Route path="/my-bets" element={<MyBets />} />
                <Route path="/my-wallet" element={<MyWallet />} />
                <Route path="/betting-profit-loss" element={<BettingProfitLoss />} />
                <Route path="/turnover-history" element={<TurnoverHistory />} />
                <Route path="/account-statement" element={<AccountStatement />} />
                <Route path="/bonus-statement" element={<BonusStatement />} />
                <Route path="/deposit-turnover" element={<DepositTurnover />} />
                <Route path="/cricket" element={<CricketDetail />} />
                <Route path="/referral" element={<ReferralProgram />} />
                <Route path="/rank" element={<RankSystem />} />
                <Route path="/deposit" element={<NewDeposit />} />
                <Route path="/withdrawal" element={<NewWithdrawal />} />
                <Route path="/add-account" element={<AddAccount />} />
                <Route path="/add-bank" element={<AddBank />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
        </CasinoProvidersProvider>
      </SidebarProvider>
    </Router>
  );
});

export default Routing;

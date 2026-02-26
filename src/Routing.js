import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import { SidebarProvider } from "./context/SidebarContext";
import Layout from "./Layout";

// Landing is critical for first load – keep eager
import LandingPage from "./LandingPage/LandingPage";

// Lazy-load all other routes for faster initial load and route transitions
const ProfilePage = lazy(() => import("./ProfilePage"));
const CasinoGame = lazy(() => import("./Casino/casinoGame"));
const CasinoCategoryPage = lazy(() => import("./Casino/CasinoCategoryPage"));
const GamePlay = lazy(() => import("./GamePlay/gamePlay"));
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

const LAZY_FALLBACK = null;

function WrapSuspense({ children }) {
  return <Suspense fallback={LAZY_FALLBACK}>{children}</Suspense>;
}

const Routing = () => {
  return (
    <Router>
      <SidebarProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/profile" element={<WrapSuspense><ProfilePage /></WrapSuspense>} />
            <Route path="/casino" element={<WrapSuspense><CasinoGame /></WrapSuspense>} />
            <Route path="/casino/category/:categoryId" element={<WrapSuspense><CasinoCategoryPage /></WrapSuspense>} />
            <Route path="/game" element={<WrapSuspense><GamePlay /></WrapSuspense>} />
            <Route path="/sports" element={<WrapSuspense><SportsGame /></WrapSuspense>} />
            <Route path="/transactions" element={<WrapSuspense><ProfileTransactions /></WrapSuspense>} />
            <Route path="/my-bets" element={<WrapSuspense><MyBets /></WrapSuspense>} />
            <Route path="/my-wallet" element={<WrapSuspense><MyWallet /></WrapSuspense>} />
            <Route path="/betting-profit-loss" element={<WrapSuspense><BettingProfitLoss /></WrapSuspense>} />
            <Route path="/turnover-history" element={<WrapSuspense><TurnoverHistory /></WrapSuspense>} />
            <Route path="/account-statement" element={<WrapSuspense><AccountStatement /></WrapSuspense>} />
            <Route path="/bonus-statement" element={<WrapSuspense><BonusStatement /></WrapSuspense>} />
            <Route path="/deposit-turnover" element={<WrapSuspense><DepositTurnover /></WrapSuspense>} />
            <Route path="/cricket" element={<WrapSuspense><CricketDetail /></WrapSuspense>} />
            <Route path="/referral" element={<WrapSuspense><ReferralProgram /></WrapSuspense>} />
            <Route path="/rank" element={<WrapSuspense><RankSystem /></WrapSuspense>} />
            <Route path="/deposit" element={<WrapSuspense><NewDeposit /></WrapSuspense>} />
            <Route path="/withdrawal" element={<WrapSuspense><NewWithdrawal /></WrapSuspense>} />
            <Route path="/add-account" element={<WrapSuspense><AddAccount /></WrapSuspense>} />
            <Route path="/add-bank" element={<WrapSuspense><AddBank /></WrapSuspense>} />
            <Route path="/promotions" element={<WrapSuspense><Promotions /></WrapSuspense>} />
            <Route path="/game-rules" element={<WrapSuspense><GameRules /></WrapSuspense>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </SidebarProvider>
    </Router>
  );
};

export default Routing;

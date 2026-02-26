import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import { SidebarProvider } from "./context/SidebarContext";
import Layout from "./Layout";

import LandingPage from "./LandingPage/LandingPage";
import ProfilePage from "./ProfilePage";
import CasinoGame from "./Casino/casinoGame";
import CasinoCategoryPage from "./Casino/CasinoCategoryPage";
import GamePlay from "./GamePlay/gamePlay";
import SportsGame from "./sports/SportsGame";
import ProfileTransactions from "./ProfileTransactions/profileTransactions";
import Promotions from "./promotions/Promotions";

const CricketDetail = lazy(() => import("./cricket/cricketDetail"));
const ReferralProgram = lazy(() => import("./ReferralProgram/referralProgram"));
const RankSystem = lazy(() => import("./RankSystem/rankSystem"));
const NewDeposit = lazy(() => import("./newDeposit/newDeposit"));
const NewWithdrawal = lazy(() => import("./newWithdrawal/newWithdrawal"));
const AddAccount = lazy(() => import("./BankDetails/addAccount"));
const AddBank = lazy(() => import("./BankDetails/addBank"));

const Routing = () => {
  return (
    <Router>
      <SidebarProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/casino" element={<CasinoGame />} />
            <Route path="/casino/category/:categoryId" element={<CasinoCategoryPage />} />
            <Route path="/game" element={<GamePlay />} />
            <Route path="/sports" element={<SportsGame />} />
            <Route path="/transactions" element={<ProfileTransactions />} />
            <Route path="/cricket" element={<Suspense fallback={null}><CricketDetail /></Suspense>} />
            <Route path="/referral" element={<Suspense fallback={null}><ReferralProgram /></Suspense>} />
            <Route path="/rank" element={<Suspense fallback={null}><RankSystem /></Suspense>} />
            <Route path="/deposit" element={<Suspense fallback={null}><NewDeposit /></Suspense>} />
            <Route path="/withdrawal" element={<Suspense fallback={null}><NewWithdrawal /></Suspense>} />
            <Route path="/add-account" element={<Suspense fallback={null}><AddAccount /></Suspense>} />
            <Route path="/add-bank" element={<Suspense fallback={null}><AddBank /></Suspense>} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/promotions" element={<Promotions />} />
          </Route>
        </Routes>
      </SidebarProvider>
    </Router>
  );
};

export default Routing;

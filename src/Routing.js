import React from "react";
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
import CricketDetail from "./cricket/cricketDetail";
import ReferralProgram from "./ReferralProgram/referralProgram";
import RankSystem from "./RankSystem/rankSystem";
import NewDeposit from "./newDeposit/newDeposit";
import NewWithdrawal from "./newWithdrawal/newWithdrawal";
import AddAccount from "./BankDetails/addAccount";
import AddBank from "./BankDetails/addBank";
import Promotions from "./promotions/Promotions";

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
            <Route path="/cricket" element={<CricketDetail />} />
            <Route path="/referral" element={<ReferralProgram />} />
            <Route path="/rank" element={<RankSystem />} />
            <Route path="/deposit" element={<NewDeposit />} />
            <Route path="/withdrawal" element={<NewWithdrawal />} />
            <Route path="/add-account" element={<AddAccount />} />
            <Route path="/add-bank" element={<AddBank />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/promotions" element={<Promotions />} />
          </Route>
        </Routes>
      </SidebarProvider>
    </Router>
  );
};

export default Routing;

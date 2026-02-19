import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./LandingPage/LandingPage";
import ProfilePage from "./ProfilePage";
import CasinoGame from "./Casino/casinoGame";
import GamePlay from "./GamePlay/gamePlay";
import SportsGame from "./sports/SportsGame";
import ProfileTransactions from "./ProfileTransactions/profileTransactions";
import CricketDetail from "./cricket/cricketDetail";
import ReferralProgram from "./ReferralProgram/referralProgram";
import RankSystem from "./RankSystem/rankSystem";

const Routing = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/casino" element={<CasinoGame />} />
        <Route path="/game" element={<GamePlay />} />
        <Route path="/sports" element={<SportsGame />} />
        <Route path="/transactions" element={<ProfileTransactions />} />
        <Route path="/cricket" element={<CricketDetail />} />
        <Route path="/referral" element={<ReferralProgram />} />
        <Route path="/rank" element={<RankSystem />} />

        {/* Fallback: unknown paths redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default Routing;

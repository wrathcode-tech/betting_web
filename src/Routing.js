import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";

// Lazy load pages – only the current route’s chunk loads (faster initial load)
const LandingPage = lazy(() => import("./LandingPage/LandingPage"));
const ProfilePage = lazy(() => import("./ProfilePage"));
const CasinoGame = lazy(() => import("./Casino/casinoGame"));
const CasinoCategoryPage = lazy(() => import("./Casino/CasinoCategoryPage"));
const GamePlay = lazy(() => import("./GamePlay/gamePlay"));
const SportsGame = lazy(() => import("./sports/SportsGame"));
const ProfileTransactions = lazy(() => import("./ProfileTransactions/profileTransactions"));
const CricketDetail = lazy(() => import("./cricket/cricketDetail"));
const ReferralProgram = lazy(() => import("./ReferralProgram/referralProgram"));
const RankSystem = lazy(() => import("./RankSystem/rankSystem"));

function PageFallback() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d131c" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #1e2a38", borderTopColor: "#f97a31", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

const Routing = () => {
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default Routing;

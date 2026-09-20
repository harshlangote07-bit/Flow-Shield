import { useEffect, useMemo, useState } from "react";
import { Link, Route, Router, Switch, useLocation } from "wouter";

import RainfallRadarPage from "./pages/RainfallRadarPage";

import Shell from "./components/Shell";

import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage";
import AnalysisPage from "./pages/AnalysisPage";
import DrainagePage from "./pages/DrainagePage";
import AlertsPage from "./pages/AlertsPage";
import OfficialLogin from "./pages/OfficialLogin";
import ProfilePage from "./pages/ProfilePage";
import OfficialPage from "./pages/OfficialPage";
import RouterView from "./routes/RouterView";

/* =========================================================
   APP
========================================================= */

function App() {
  const [selectedZone, setSelectedZone] = useState("harbor");

  const [acknowledged, setAcknowledged] = useState([]);

  /*
   * Restore official session after browser refresh.
   */

  const [officialUser, setOfficialUser] = useState(() => {
    try {
      const saved = localStorage.getItem("flowshield_official_user");

      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  /*
   * Login
   */

  const handleLogin = (user) => {
    setOfficialUser(user);

    localStorage.setItem("flowshield_official_user", JSON.stringify(user));
  };

  /*
   * Logout
   */

  const handleLogout = () => {
    setOfficialUser(null);

    localStorage.removeItem("flowshield_official_user");
  };

  return (
    <Router base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Shell officialUser={officialUser} onLogout={handleLogout}>
        <RouterView
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          acknowledged={acknowledged}
          setAcknowledged={setAcknowledged}
          officialUser={officialUser}
          onLogin={handleLogin}
        />
      </Shell>
    </Router>
  );
}

export default App;

import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";

import DashboardPage from "../pages/DashboardPage";
import MapPage from "../pages/MapPage";
import RainfallRadarPage from "../pages/RainfallRadarPage";
import AnalysisPage from "../pages/AnalysisPage";
import DrainagePage from "../pages/DrainagePage";
import AlertsPage from "../pages/AlertsPage";
import OfficialLogin from "../pages/OfficialLogin";
import ProfilePage from "../pages/ProfilePage";
import OfficialPage from "../pages/OfficialPage";
import { Link } from "wouter";

function NotFound() {
  return (
    <div className="page not-found">
      <div>
        <div className="eyebrow">Signal lost</div>

        <h1>404</h1>

        <p
          className="subtitle"
          style={{
            margin: "14px auto 20px",
          }}
        >
          That operational view does not exist.
        </p>

        <Link
          href="/"
          className="button button-primary"
          data-testid="link-return-command-center"
        >
          Return to command center
        </Link>
      </div>
    </div>
  );
}

function RedirectToLogin() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/official-login");
  }, [setLocation]);

  return null;
}

function RedirectToOfficial() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/official");
  }, [setLocation]);

  return null;
}

export default function RouterView({
  selectedZone,
  setSelectedZone,
  acknowledged,
  setAcknowledged,
  officialUser,
  onLogin,
}) {
  return (
    <Switch>
      <Route path="/">
        <DashboardPage setSelectedZone={setSelectedZone} />
      </Route>

      <Route path="/map">
        <MapPage
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
        />
      </Route>

      <Route path="/rainfall-radar">
        <RainfallRadarPage />
      </Route>

      <Route path="/analysis">
        <AnalysisPage />
      </Route>

      <Route path="/drainage">
        <DrainagePage officialUser={officialUser} />
      </Route>

      <Route path="/alerts">
        <AlertsPage
          acknowledged={acknowledged}
          setAcknowledged={setAcknowledged}
        />
      </Route>

      <Route path="/official-login">
        {officialUser ? (
          <RedirectToOfficial />
        ) : (
          <OfficialLogin onLogin={onLogin} />
        )}
      </Route>

      <Route path="/official">
        {officialUser ? (
          <OfficialPage officialUser={officialUser} />
        ) : (
          <RedirectToLogin />
        )}
      </Route>

      <Route path="/profile">
        {officialUser ? (
          <ProfilePage officialUser={officialUser} />
        ) : (
          <RedirectToLogin />
        )}
      </Route>

      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  SlidersHorizontal,
  Waves,
} from "lucide-react";
import { Link, useLocation } from "wouter";

import PageHeading from "../components/PageHeading";
import RiskChip from "../components/RiskChip";
import MapCanvas from "../components/MapCanvas";
import {
  getAllRisks,
  getAreas,
  getAlerts,
} from "../services/api";

/* =========================================================
   HELPERS
========================================================= */

function normalizeRiskLevel(level) {
  switch (String(level || "").toUpperCase()) {
    case "CRITICAL":
      return "critical";
    case "VERY_HIGH":
      return "very-high";
    case "HIGH":
      return "high";
    case "MODERATE":
      return "medium";
    case "LOW":
      return "low";
    default:
      return "low";
  }
}

function formatRiskLabel(level) {
  switch (String(level || "").toUpperCase()) {
    case "VERY_HIGH":
      return "very high";
    case "MODERATE":
      return "moderate";
    case "CRITICAL":
      return "critical";
    default:
      return String(level || "unknown").toLowerCase();
  }
}

function formatTime(timestamp) {
  if (!timestamp) {
    return "No recent update";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "No recent update";
  }

  return date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardPage({ setSelectedZone }) {
  const [, setLocation] = useLocation();

  const [selected, setSelected] = useState(null);

  const [risks, setRisks] = useState([]);
  const [areas, setAreas] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Load dashboard data from backend.
   */

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [riskResponse, areaResponse, alertResponse] =
          await Promise.all([
            getAllRisks(),
            getAreas(),
            getAlerts(),
          ]);

        if (cancelled) {
          return;
        }

        setRisks(riskResponse?.data || []);
        setAreas(areaResponse?.data || []);
        setAlerts(alertResponse?.data || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Select the first real area when backend data arrives.
   */

  useEffect(() => {
    if (selected || risks.length === 0) {
      return;
    }

    const firstAreaId = risks[0]?.areaId;

    if (firstAreaId) {
      setSelected(firstAreaId);
      setSelectedZone(firstAreaId);
    }
  }, [risks, selected, setSelectedZone]);

  /*
   * City risk index.
   *
   * This is the average of the latest saved risk scores
   * returned by the backend.
   */

  const cityRisk = useMemo(() => {
    if (risks.length === 0) {
      return 0;
    }

    const total = risks.reduce(
      (sum, item) => sum + Number(item?.risk?.score || 0),
      0
    );

    return total / risks.length;
  }, [risks]);

  /*
   * Priority zones.
   *
   * Sort by actual backend risk score.
   */

  const priorityZones = useMemo(() => {
    return [...risks]
      .sort(
        (a, b) =>
          Number(b?.risk?.score || 0) -
          Number(a?.risk?.score || 0)
      )
      .slice(0, 3);
  }, [risks]);

  /*
   * Latest alerts.
   */

  const latestAlerts = useMemo(() => {
    return [...alerts]
      .sort((a, b) => {
        const aTime = new Date(
          a?.createdAt || a?.updatedAt || 0
        ).getTime();

        const bTime = new Date(
          b?.createdAt || b?.updatedAt || 0
        ).getTime();

        return bTime - aTime;
      })
      .slice(0, 3);
  }, [alerts]);

  const selectZone = (id) => {
    setSelected(id);
    setSelectedZone(id);
  };

  return (
    <div className="page">
      <PageHeading
        eyebrow="Live backend data"
        title="Command center"
        subtitle="A live read on where water is moving, what is driving the risk, and which areas need attention."
        action={
          <Link
            href="/analysis"
            className="button button-primary"
            data-testid="link-run-analysis"
          >
            <SlidersHorizontal size={14} />
            Run risk analysis
          </Link>
        }
      />

      {error && (
        <div className="panel section-gap">
          <div className="panel-kicker">Backend connection</div>
          <h2>Unable to load live data</h2>
          <p className="subtitle">{error}</p>
        </div>
      )}

      <section className="metric-grid">
        <div className="metric-card alert">
          <div className="metric-label">
            City risk index
            <AlertTriangle size={15} className="alert-icon" />
          </div>

          <div className="metric-value">
            {loading ? "—" : Math.round(cityRisk)}
            <small>/100</small>
          </div>

          <div className="metric-trend">
            {loading
              ? "Loading latest risk"
              : risks.length > 0
                ? `${risks.length} area${
                    risks.length === 1 ? "" : "s"
                  } reporting`
                : "No risk assessments available"}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Zones monitored
            <Activity size={15} />
          </div>

          <div className="metric-value">
            {loading ? "—" : areas.length}
          </div>

          <div className="metric-trend">
            {loading
              ? "Loading areas"
              : `${areas.filter((area) => area.isActive).length} active feeds`}
          </div>
        </div>

        <div className="metric-card warn">
          <div className="metric-label">
            Active alerts
            <Bell size={15} />
          </div>

          <div className="metric-value">
            {loading ? "—" : String(alerts.length).padStart(2, "0")}
          </div>

          <div className="metric-trend">
            {alerts.length > 0
              ? `${alerts.length} alert${
                  alerts.length === 1 ? "" : "s"
                } require review`
              : "No active alerts"}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Highest risk area
            <CheckCircle2 size={15} />
          </div>

          <div className="metric-value">
            {loading
              ? "—"
              : priorityZones.length > 0
                ? Math.round(
                    Number(priorityZones[0]?.risk?.score || 0)
                  )
                : "—"}
            {priorityZones.length > 0 && <small>/100</small>}
          </div>

          <div className="metric-trend">
            {priorityZones.length > 0
              ? priorityZones[0].areaName
              : "No risk data"}
          </div>
        </div>
      </section>

      <section className="dashboard-grid section-gap">
        <div className="panel risk-map">
          <MapCanvas
            compact
            selectedId={selected}
            onSelect={selectZone}
          />
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">
                Priority zones
              </div>

              <h2>Where attention is moving</h2>
            </div>

            <Link
              href="/map"
              className="panel-link"
              data-testid="link-open-map"
            >
              Open map
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="zone-summary">
            {loading && (
              <div className="summary-row">
                Loading live risk data...
              </div>
            )}

            {!loading && priorityZones.length === 0 && (
              <div className="summary-row">
                No risk assessments available.
              </div>
            )}

            {!loading &&
              priorityZones.map((zone) => {
                const score = Number(
                  zone?.risk?.score || 0
                );

                const level = zone?.risk?.level || "LOW";
                const risk = normalizeRiskLevel(level);

                return (
                  <button
                    type="button"
                    className="summary-row"
                    key={zone.areaId}
                    onClick={() => {
                      selectZone(zone.areaId);
                      setLocation("/map");
                    }}
                    data-testid={`button-priority-${zone.areaId}`}
                  >
                    <div>
                      <strong>{zone.areaName}</strong>

                      <small>
                        {zone.city}, {zone.state} · updated{" "}
                        {formatTime(zone?.risk?.updatedAt)}
                      </small>
                    </div>

                    <RiskChip risk={risk}>
                      {Math.round(score)} ·{" "}
                      {formatRiskLabel(level)}
                    </RiskChip>
                  </button>
                );
              })}
          </div>
        </div>
      </section>

      <section className="bottom-grid section-gap">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">
                Needs a decision
              </div>

              <h2>Latest alerts</h2>
            </div>

            <Link
              href="/alerts"
              className="panel-link"
              data-testid="link-all-alerts"
            >
              All alerts
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="alert-list">
            {loading && (
              <div className="alert-row">
                Loading alerts...
              </div>
            )}

            {!loading && latestAlerts.length === 0 && (
              <div className="alert-row">
                <div>
                  <strong>No active alerts</strong>
                  <p>
                    The backend currently has no active
                    alerts for monitored areas.
                  </p>
                </div>
              </div>
            )}

            {!loading &&
              latestAlerts.map((alert) => (
                <Link
                  href="/alerts"
                  className="alert-row"
                  key={alert._id || alert.alertId}
                  data-testid={`link-alert-${
                    alert._id || alert.alertId
                  }`}
                >
                  <i
                    className={`alert-severity ${
                      String(
                        alert.severity || "low"
                      ).toLowerCase()
                    }`}
                  />

                  <div>
                    <strong>
                      {alert.title ||
                        alert.message ||
                        "Flood risk alert"}
                    </strong>

                    <p>
                      {alert.description ||
                        alert.body ||
                        "Review the latest risk information."}
                    </p>
                  </div>

                  <span className="alert-time">
                    {formatTime(
                      alert.createdAt ||
                        alert.updatedAt
                    )}
                  </span>
                </Link>
              ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">
                Crew posture
              </div>

              <h2>Drainage readiness</h2>
            </div>

            <Link
              href="/drainage"
              className="panel-link"
              data-testid="link-drainage-watch"
            >
              Review
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="drain-list">
            <div className="drain-item">
              <div className="drain-icon">
                <Check size={15} />
              </div>

              <div>
                <strong>Live drainage data</strong>

                <small>
                  Detailed infrastructure status is
                  available in Drainage Watch.
                </small>
              </div>

              <span className="drain-status">
                live
              </span>
            </div>

            <div className="drain-item">
              <div className="drain-icon">
                <Waves size={15} />
              </div>

              <div>
                <strong>Network-aware scoring</strong>

                <small>
                  Drainage connectivity contributes to
                  the risk engine.
                </small>
              </div>

              <span className="drain-status">
                active
              </span>
            </div>

            <div className="drain-item">
              <div className="drain-icon">
                <Check size={15} />
              </div>

              <div>
                <strong>Official updates</strong>

                <small>
                  Authorized officials can update
                  drainage infrastructure state.
                </small>
              </div>

              <span className="drain-status">
                secured
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
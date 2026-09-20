import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  RefreshCw,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Link } from "wouter";

import PageHeading from "../components/PageHeading";
import RiskChip from "../components/RiskChip";
import {
  getAlerts,
  getAllRisks,
  getRiskHistory,
} from "../services/api";

/* =========================================================
   HELPERS
========================================================= */

function normalizeSeverity(value, score = 0) {
  const normalized = String(value || "").toLowerCase();

  if (
    normalized === "critical" ||
    normalized === "very-high" ||
    normalized === "very_high"
  ) {
    return "high";
  }

  if (
    normalized === "high" ||
    normalized === "warning"
  ) {
    return "high";
  }

  if (
    normalized === "moderate" ||
    normalized === "medium"
  ) {
    return "medium";
  }

  if (score >= 65) return "high";
  if (score >= 30) return "medium";

  return "low";
}

function formatSeverity(value, score = 0) {
  const normalized = String(value || "").toUpperCase();

  if (normalized) {
    return normalized.replace(/_/g, " ");
  }

  if (score >= 80) return "CRITICAL";
  if (score >= 65) return "VERY HIGH";
  if (score >= 50) return "HIGH";
  if (score >= 30) return "MODERATE";

  return "LOW";
}

function formatTime(value) {
  if (!value) return "time unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return "time unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRiskScore(item) {
  return Number(
    item?.risk?.score ??
      item?.score ??
      0,
  );
}

function getRiskAreaId(item) {
  return item?.areaId ?? item?.risk?.areaId ?? "";
}

function getAlertId(alert, index) {
  return (
    alert?._id ??
    alert?.id ??
    alert?.alertId ??
    `alert-${index}`
  );
}

function getAlertTitle(alert) {
  return (
    alert?.title ??
    alert?.name ??
    alert?.message ??
    "Flood risk alert"
  );
}

function getAlertArea(alert) {
  return (
    alert?.areaName ??
    alert?.zone ??
    alert?.area?.name ??
    alert?.areaId ??
    "Monitored area"
  );
}

function getAlertTime(alert) {
  return (
    alert?.createdAt ??
    alert?.updatedAt ??
    alert?.timestamp ??
    alert?.issuedAt
  );
}

/* =========================================================
   ALERTS PAGE
========================================================= */

export default function AlertsPage({
  acknowledged,
  setAcknowledged,
}) {
  const [alerts, setAlerts] = useState([]);
  const [risks, setRisks] = useState([]);
  const [history, setHistory] = useState([]);

  const [selected, setSelected] = useState(null);

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  /* =========================================================
     LOAD ALERTS + CURRENT RISKS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        setStatus("loading");
        setError("");

        const [alertsResponse, risksResponse] =
          await Promise.all([
            getAlerts(),
            getAllRisks(),
          ]);

        if (cancelled) return;

        const nextAlerts = Array.isArray(
          alertsResponse?.data,
        )
          ? alertsResponse.data
          : [];

        const nextRisks = Array.isArray(
          risksResponse?.data,
        )
          ? risksResponse.data
          : [];

        setAlerts(nextAlerts);
        setRisks(nextRisks);

        if (nextAlerts.length) {
          setSelected(nextAlerts[0]);
        }

        setStatus("idle");
      } catch (requestError) {
        if (cancelled) return;

        console.error(
          "Alerts page error:",
          requestError,
        );

        setError(
          requestError?.message ||
            "Unable to load alerts from the backend.",
        );

        setStatus("error");
      }
    }

    loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     LOAD RISK HISTORY FOR THE FIRST MONITORED AREA
  ========================================================= */

  useEffect(() => {
    if (!risks.length) {
      setHistory([]);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      try {
        const areaId = getRiskAreaId(risks[0]);

        if (!areaId) {
          setHistory([]);
          return;
        }

        const response =
          await getRiskHistory(areaId);

        if (cancelled) return;

        const nextHistory = Array.isArray(
          response?.data,
        )
          ? response.data
          : [];

        setHistory(nextHistory);
      } catch (requestError) {
        if (cancelled) return;

        console.error(
          "Risk history error:",
          requestError,
        );

        setHistory([]);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [risks]);

  /* =========================================================
     BUILD CHART DATA FROM BACKEND HISTORY
  ========================================================= */

  const trendData = useMemo(() => {
    const sortedHistory = [...history].sort(
      (a, b) =>
        new Date(a.timestamp || a.createdAt || 0) -
        new Date(b.timestamp || b.createdAt || 0),
    );

    const data = sortedHistory.map((item) => ({
      time: formatTime(
        item.timestamp ||
          item.createdAt ||
          item.updatedAt,
      ),
      risk: Math.round(getRiskScore(item)),
    }));

    /*
     * If there is no stored history yet, use the latest
     * live risk so the chart does not pretend there is
     * historical data.
     */
    if (!data.length && risks.length) {
      const current = risks[0];

      data.push({
        time: formatTime(
          current?.risk?.timestamp ??
            current?.risk?.updatedAt,
        ),
        risk: Math.round(
          getRiskScore(current),
        ),
      });
    }

    return data;
  }, [history, risks]);

  /* =========================================================
     ALERT METRICS
  ========================================================= */

  const urgentCount = useMemo(
    () =>
      alerts.filter((alert) => {
        const severity =
          alert?.severity ??
          alert?.level ??
          alert?.riskLevel;

        return (
          severity &&
          ["critical", "very_high", "very-high", "high"].includes(
            String(severity).toLowerCase(),
          )
        );
      }).length,
    [alerts],
  );

  const selectedIsAcknowledged =
    selected &&
    acknowledged.includes(
      selected._id ??
        selected.id ??
        selected.alertId,
    );

  /* =========================================================
     ACKNOWLEDGE
  ========================================================= */

  const acknowledgeSelected = () => {
    if (!selected) return;

    const id =
      selected._id ??
      selected.id ??
      selected.alertId;

    if (!id) return;

    setAcknowledged((list) =>
      list.includes(id)
        ? list
        : [...list, id],
    );
  };

  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (status === "error" && !risks.length) {
    return (
      <div className="page">
        <PageHeading
          eyebrow="Signal & forecast"
          title="Alerts and predictions"
          subtitle="Live alerts could not be loaded from the Flow Shield backend."
          action={
            <div className="risk-chip high">
              <AlertTriangle size={12} />
              Backend unavailable
            </div>
          }
        />

        <div className="panel">
          <div className="alert-detail-empty">
            <p>{error}</p>

            <button
              className="button button-primary"
              type="button"
              onClick={() =>
                window.location.reload()
              }
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="page">
      <PageHeading
        eyebrow="Signal & forecast"
        title="Alerts and predictions"
        subtitle="Live operational alerts and recent risk movement from the Flow Shield backend."
        action={
          <div
            className={`risk-chip ${
              urgentCount > 0 ? "high" : "info"
            }`}
          >
            <AlertTriangle size={12} />
            {urgentCount} urgent
          </div>
        }
      />

      <div className="alerts-layout">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">
                Risk history
              </div>

              <h2>Recent monitored risk</h2>
            </div>

            <span className="mono tiny muted">
              live backend data
            </span>
          </div>

          <div className="chart-wrap">
            {trendData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={trendData}
                  margin={{
                    top: 8,
                    right: 8,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="riskFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#f07c3d"
                        stopOpacity=".36"
                      />

                      <stop
                        offset="100%"
                        stopColor="#f07c3d"
                        stopOpacity=".03"
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#d5e2df"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                    tick={{
                      fill: "#60767b",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tick={{
                      fill: "#60767b",
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      border: "1px solid #d5e2df",
                      borderRadius: 5,
                      fontSize: 11,
                      background: "#f8fbfa",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="risk"
                    name="Risk score"
                    stroke="#bd4b46"
                    fill="url(#riskFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="alert-detail-empty">
                No risk history is available yet.
              </div>
            )}
          </div>

          <div className="timeline-list">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => {
                const id = getAlertId(
                  alert,
                  index,
                );

                const score = Number(
                  alert?.score ??
                    alert?.riskScore ??
                    0,
                );

                const severity =
                  alert?.severity ??
                  alert?.level ??
                  alert?.riskLevel;

                const tone = normalizeSeverity(
                  severity,
                  score,
                );

                return (
                  <button
                    key={id}
                    type="button"
                    className={`timeline-item ${
                      selected &&
                      (
                        selected._id ??
                        selected.id ??
                        selected.alertId
                      ) === id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelected(alert)
                    }
                    data-testid={`button-alert-${id}`}
                  >
                    <strong>
                      <i
                        className={`alert-severity ${tone}`}
                        style={{
                          display:
                            "inline-block",
                          marginRight: 7,
                        }}
                      />

                      {getAlertTitle(alert)}
                    </strong>

                    <span>
                      {getAlertArea(alert)} ·{" "}
                      {formatDateTime(
                        getAlertTime(alert),
                      )}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="alert-detail-empty">
                No active alerts reported by the backend.
              </div>
            )}
          </div>
        </div>

        <aside className="panel alert-detail">
          <div className="panel-kicker">
            Alert detail
          </div>

          {selected ? (
            <>
              <div
                className="detail-head"
                style={{
                  marginTop: 7,
                }}
              >
                <div>
                  <strong>
                    {getAlertTitle(selected)}
                  </strong>

                  <p>
                    {getAlertArea(selected)} ·
                    reported{" "}
                    {formatDateTime(
                      getAlertTime(selected),
                    )}
                  </p>
                </div>

                <RiskChip
                  risk={normalizeSeverity(
                    selected?.severity ??
                      selected?.level ??
                      selected?.riskLevel,
                    Number(
                      selected?.score ??
                        selected?.riskScore ??
                        0,
                    ),
                  )}
                >
                  {formatSeverity(
                    selected?.severity ??
                      selected?.level ??
                      selected?.riskLevel,
                    Number(
                      selected?.score ??
                        selected?.riskScore ??
                        0,
                    ),
                  )}
                </RiskChip>
              </div>

              <div
                style={{
                  paddingTop: 18,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  {selected?.body ??
                    selected?.description ??
                    selected?.message ??
                    "No additional alert details were provided by the backend."}
                </p>

                <div className="recommendation">
                  <strong>
                    Suggested field action
                  </strong>

                  <p>
                    {selected?.action ??
                      selected?.recommendedAction ??
                      "Review the affected area and verify the latest drainage and water-level conditions."}
                  </p>
                </div>
              </div>

              <div className="detail-actions">
                {selectedIsAcknowledged ? (
                  <div
                    className="success-banner"
                    style={{
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    <CheckCircle2 size={15} />
                    Acknowledged
                  </div>
                ) : (
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={
                      acknowledgeSelected
                    }
                    data-testid="button-acknowledge-alert"
                  >
                    <Check size={14} />
                    Acknowledge alert
                  </button>
                )}

                <Link
                  href="/map"
                  className="button button-quiet"
                  data-testid="link-alert-map"
                >
                  <Eye size={14} />
                  Inspect map
                </Link>
              </div>
            </>
          ) : (
            <div className="alert-detail-empty">
              <div className="empty-mark">
                <CheckCircle2 size={22} />
              </div>

              <h3>No active alerts</h3>

              <p>
                The backend currently reports no active
                flood alerts for the monitored areas.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
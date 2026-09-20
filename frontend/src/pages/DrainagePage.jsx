import { useEffect, useState } from "react";

import {
  Check,
  ClipboardCheck,
  FileCheck2,
  MessageSquareWarning,
  RefreshCw,
} from "lucide-react";

import PageHeading from "../components/PageHeading";
import RiskChip from "../components/RiskChip";

import {
  getAreas,
  getDrainage,
  getDrainageReports,
  getDrainageRisk,
  submitPublicDrainageReport,
} from "../services/api";

/* =========================================================
   HELPERS
========================================================= */

function getAreaId(area) {
  return area?.areaId ?? area?._id ?? "";
}

function formatTime(value) {
  if (!value) return "Not recorded";

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

function relativeTime(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  const diffMs = Date.now() - date.getTime();

  const minutes = Math.max(
    0,
    Math.floor(diffMs / 60000),
  );

  if (minutes < 1) return "Just now";

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function conditionTone(condition, status) {
  const value = String(
    status || condition || "",
  ).toLowerCase();

  if (
    value === "failed" ||
    value === "blocked" ||
    value === "critical"
  ) {
    return "high";
  }

  if (
    value === "partially_blocked" ||
    value === "under_maintenance" ||
    value === "poor" ||
    value === "fair"
  ) {
    return "medium";
  }

  return "low";
}

function formatCondition(condition, status) {
  if (status === "failed") return "Failed";

  if (status === "blocked") return "Blocked";

  if (status === "partially_blocked") {
    return "Partially blocked";
  }

  if (status === "under_maintenance") {
    return "Maintenance";
  }

  if (condition) {
    return String(condition)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      );
  }

  return "Operational";
}

function reportStatus(report) {
  if (report?.status) {
    return String(report.status)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      );
  }

  if (report?.verified) {
    return "Verified";
  }

  return "Reported";
}

function reportTone(report) {
  if (report?.status === "rejected") {
    return "high";
  }

  if (
    report?.verified ||
    report?.status === "verified"
  ) {
    return "low";
  }

  return "medium";
}

/* =========================================================
   DRAINAGE PAGE
========================================================= */

export default function DrainagePage({
  officialUser,
}) {
  const [areas, setAreas] = useState([]);

  const [selectedAreaId, setSelectedAreaId] =
    useState("");

  const [assets, setAssets] = useState([]);
  const [reports, setReports] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const [tab, setTab] = useState("verified");

  const [status, setStatus] =
    useState("loading");

  const [error, setError] = useState("");

  const [showReportForm, setShowReportForm] =
    useState(false);

  const [reportForm, setReportForm] = useState({
    severity: "moderate",
    blockagePercent: "",
    description: "",
  });

  const [reportSubmitting, setReportSubmitting] =
    useState(false);

  const [reportMessage, setReportMessage] =
    useState("");

  /* =========================================================
     LOAD AREAS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadAreas() {
      try {
        const response = await getAreas();

        if (cancelled) return;

        const nextAreas = Array.isArray(
          response?.data,
        )
          ? response.data
          : [];

        setAreas(nextAreas);

        if (nextAreas.length) {
          setSelectedAreaId(
            (current) =>
              current ||
              getAreaId(nextAreas[0]),
          );
        }
      } catch (requestError) {
        if (cancelled) return;

        console.error(
          "Drainage areas error:",
          requestError,
        );

        setError(
          requestError?.message ||
            "Unable to load monitored areas.",
        );

        setStatus("error");
      }
    }

    loadAreas();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     SUBMIT PUBLIC REPORT
  ========================================================= */

  async function submitReport(event) {
    event.preventDefault();

    if (!selectedAreaId) {
      setReportMessage(
        "Please select an area first.",
      );
      return;
    }

    if (!reportForm.description.trim()) {
      setReportMessage(
        "Please describe the issue.",
      );
      return;
    }

    try {
      setReportSubmitting(true);
      setReportMessage("");

      await submitPublicDrainageReport(
        selectedAreaId,
        {
          severity: reportForm.severity,
          blockagePercent:
            reportForm.blockagePercent === ""
              ? null
              : Number(
                  reportForm.blockagePercent,
                ),
          description:
            reportForm.description.trim(),
        },
      );

      setReportForm({
        severity: "moderate",
        blockagePercent: "",
        description: "",
      });

      setShowReportForm(false);
      setTab("reports");

      setReportMessage(
        "Report submitted successfully.",
      );

      await loadDrainageData(selectedAreaId);
    } catch (requestError) {
      setReportMessage(
        requestError?.message ||
          "Unable to submit report.",
      );
    } finally {
      setReportSubmitting(false);
    }
  }

  /* =========================================================
     LOAD DRAINAGE DATA
  ========================================================= */

  async function loadDrainageData(areaId) {
    if (!areaId) return;

    try {
      setStatus("loading");
      setError("");

      const [
        drainageResponse,
        riskResponse,
        reportsResponse,
      ] = await Promise.all([
        getDrainage(areaId),
        getDrainageRisk(areaId),
        getDrainageReports(areaId),
      ]);

      const drainageData =
        drainageResponse?.data || {};

      const riskData =
        riskResponse?.data || {};

      const nextAssets = Array.isArray(
        drainageData.assets,
      )
        ? drainageData.assets
        : [];

      const nextReports = Array.isArray(
        reportsResponse?.data,
      )
        ? reportsResponse.data
        : Array.isArray(
            drainageData.reports,
          )
          ? drainageData.reports
          : [];

      setAssets(nextAssets);
      setReports(nextReports);

      setMetrics({
        ...drainageData.metrics,
        ...riskData,
      });

      setStatus("idle");
    } catch (requestError) {
      console.error(
        "Drainage data error:",
        requestError,
      );

      setError(
        requestError?.message ||
          "Unable to load drainage data.",
      );

      setStatus("error");
    }
  }

  /* =========================================================
     LOAD WHEN AREA CHANGES
  ========================================================= */

  useEffect(() => {
    if (!selectedAreaId) return;

    loadDrainageData(selectedAreaId);
  }, [selectedAreaId]);

  /* =========================================================
     REFRESH
  ========================================================= */

  const refresh = () => {
    if (selectedAreaId) {
      loadDrainageData(selectedAreaId);
    }
  };

  /* =========================================================
     DERIVED VALUES
  ========================================================= */

  const openReports = reports.filter(
    (report) =>
      report?.status !== "verified" &&
      report?.status !== "resolved" &&
      report?.verified !== true,
  );

  const activeAssets = assets.filter(
    (asset) => asset?.isActive !== false,
  );

  const lastAssetUpdate =
    activeAssets.reduce(
      (latest, asset) => {
        const value =
          asset?.lastUpdatedAt ??
          asset?.lastInspectedAt ??
          asset?.updatedAt;

        if (!value) return latest;

        if (
          !latest ||
          new Date(value) >
            new Date(latest)
        ) {
          return value;
        }

        return latest;
      },
      null,
    );

  const selectedArea = areas.find(
    (area) =>
      getAreaId(area) === selectedAreaId,
  );

  const drainageScore = Number(
    metrics?.drainageScore ?? 0,
  );

  const drainageRisk =
    drainageScore >= 65
      ? "high"
      : drainageScore >= 30
        ? "medium"
        : "low";

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (
    status === "loading" &&
    !assets.length &&
    !metrics
  ) {
    return (
      <div className="page">
        <PageHeading
          eyebrow="Field operations"
          title="Drainage watch"
          subtitle="Loading live drainage assets and reports from the Flow Shield backend."
          action={
            <div className="risk-chip info">
              <RefreshCw
                size={12}
                className="spin"
              />
              Loading
            </div>
          }
        />

        <div className="panel">
          <div className="loading-state">
            <div className="loading-block">
              <div className="skeleton large" />
              <div className="skeleton" />
              <div className="skeleton" />

              <div className="loading-caption">
                Connecting to drainage feeds…
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (status === "error" && !metrics) {
    return (
      <div className="page">
        <PageHeading
          eyebrow="Field operations"
          title="Drainage watch"
          subtitle="Live drainage data could not be loaded."
        />

        <div className="panel">
          <div className="alert-detail-empty">
            <p>{error}</p>

            <button
              className="button button-primary"
              type="button"
              onClick={refresh}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeading
        eyebrow="Field operations"
        title="Drainage watch"
        subtitle="Monitor verified drainage assets and public reports without confusing unverified reports for confirmed conditions."
        action={
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="button button-primary"
              type="button"
              onClick={() =>
                setShowReportForm(true)
              }
              data-testid="button-public-report"
            >
              <MessageSquareWarning
                size={14}
              />
              Submit public report
            </button>

            <button
              className="button button-teal"
              type="button"
              onClick={refresh}
              disabled={status === "loading"}
              data-testid="button-refresh-drainage"
            >
              <RefreshCw
                size={14}
                className={
                  status === "loading"
                    ? "spin"
                    : ""
                }
              />
              Refresh feeds
            </button>
          </div>
        }
      />

      {/* =====================================================
          PUBLIC REPORT FORM
      ===================================================== */}

      {showReportForm && (
        <form
          className="card"
          onSubmit={submitReport}
          style={{
            marginTop: "12px",
            padding: "16px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Report a drainage issue
          </h3>

          <div className="form-group">
            <label>Severity</label>

            <select
              value={reportForm.severity}
              onChange={(event) =>
                setReportForm(
                  (current) => ({
                    ...current,
                    severity:
                      event.target.value,
                  }),
                )
              }
            >
              <option value="low">
                Low
              </option>

              <option value="moderate">
                Moderate
              </option>

              <option value="high">
                High
              </option>

              <option value="critical">
                Critical
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Blockage percentage (optional)
            </label>

            <input
              type="number"
              min="0"
              max="100"
              value={
                reportForm.blockagePercent
              }
              onChange={(event) =>
                setReportForm(
                  (current) => ({
                    ...current,
                    blockagePercent:
                      event.target.value,
                  }),
                )
              }
              placeholder="e.g. 60"
            />
          </div>

          <div className="form-group">
            <label>Description</label>

            <textarea
              value={
                reportForm.description
              }
              onChange={(event) =>
                setReportForm(
                  (current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }),
                )
              }
              placeholder="Describe the drainage issue..."
              rows={4}
              required
            />
          </div>

          {reportMessage && (
            <p>{reportMessage}</p>
          )}

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <button
              type="button"
              className="button"
              onClick={() => {
                setShowReportForm(false);
                setReportMessage("");
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="button button-primary"
              disabled={reportSubmitting}
            >
              {reportSubmitting
                ? "Submitting..."
                : "Submit report"}
            </button>
          </div>
        </form>
      )}

      {/* =====================================================
          AREA SELECTOR
      ===================================================== */}

      <div
        className="panel"
        style={{
          marginBottom: 16,
          padding: 16,
        }}
      >
        <div className="field">
          <label htmlFor="drainage-area">
            Monitored area
          </label>

          <select
            id="drainage-area"
            className="select"
            value={selectedAreaId}
            onChange={(event) =>
              setSelectedAreaId(
                event.target.value,
              )
            }
          >
            {areas.map((area) => (
              <option
                key={getAreaId(area)}
                value={getAreaId(area)}
              >
                {area.name ||
                  getAreaId(area)}
              </option>
            ))}
          </select>

          <p className="form-help">
            Live drainage assets and reports
            for{" "}
            {selectedArea?.name ||
              selectedAreaId ||
              "the selected area"}
            .
          </p>
        </div>
      </div>

      {/* =====================================================
          LIVE STATS
      ===================================================== */}

      <div className="drainage-stats">
        <div className="mini-stat">
          <span>Assets online</span>

          <strong>
            {metrics?.operationalAssets ??
              0}
            /
            {metrics?.totalAssets ?? 0}
          </strong>

          <em>
            {metrics?.totalAssets
              ? `${Math.round(
                  ((metrics.operationalAssets ??
                    0) /
                    metrics.totalAssets) *
                    100,
                )}% operational`
              : "No assets reporting"}
          </em>
        </div>

        <div className="mini-stat">
          <span>Blocked assets</span>

          <strong>
            {metrics?.blockedAssets ?? 0}
          </strong>

          <em>
            {metrics?.partiallyBlockedAssets ??
              0}{" "}
            partially blocked
          </em>
        </div>

        <div className="mini-stat">
          <span>Open reports</span>

          <strong>
            {openReports.length}
          </strong>

          <em>
            {reports.length} total reports
          </em>
        </div>

        <div className="mini-stat">
          <span>Drainage risk</span>

          <strong>
            {Math.round(drainageScore)}
            /100
          </strong>

          <em>
            <RiskChip risk={drainageRisk}>
              {drainageRisk}
            </RiskChip>
          </em>
        </div>
      </div>

      <div className="panel">
        {/* ===================================================
            TABS
        =================================================== */}

        <div className="page-tabs">
          <button
            type="button"
            className={`tab ${
              tab === "verified"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setTab("verified")
            }
            data-testid="tab-verified"
          >
            Verified assets
          </button>

          <button
            type="button"
            className={`tab ${
              tab === "reports"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setTab("reports")
            }
            data-testid="tab-reports"
          >
            Public reports

            <span
              className="risk-chip medium"
              style={{
                marginLeft: 5,
                height: 18,
              }}
            >
              {openReports.length}
            </span>
          </button>
        </div>

        {/* ===================================================
            ASSETS
        =================================================== */}

        {tab === "verified" ? (
          <div className="table-wrap">
            {activeAssets.length ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Location</th>
                    <th>Condition</th>
                    <th>Last check</th>
                    <th>Source</th>
                  </tr>
                </thead>

                <tbody>
                  {activeAssets.map(
                    (asset) => {
                      const condition =
                        formatCondition(
                          asset?.condition,
                          asset?.status,
                        );

                      const tone =
                        conditionTone(
                          asset?.condition,
                          asset?.status,
                        );

                      const lastCheck =
                        asset?.lastInspectedAt ??
                        asset?.lastUpdatedAt ??
                        asset?.updatedAt;

                      return (
                        <tr
                          key={
                            asset?._id ??
                            asset?.assetId
                          }
                        >
                          <td>
                            <strong>
                              {asset?.name ||
                                asset?.assetId ||
                                "Drainage asset"}
                            </strong>

                            {asset?.isTrunk && (
                              <div
                                className="mono tiny muted"
                                style={{
                                  marginTop: 4,
                                }}
                              >
                                Trunk network asset
                              </div>
                            )}
                          </td>

                          <td>
                            {asset?.location
                              ?.latitude !=
                              null &&
                            asset?.location
                              ?.longitude !=
                              null
                              ? `${Number(
                                  asset.location
                                    .latitude,
                                ).toFixed(4)}, ${Number(
                                  asset.location
                                    .longitude,
                                ).toFixed(4)}`
                              : selectedArea
                                  ?.name ||
                                "Area location"}
                          </td>

                          <td>
                            <RiskChip
                              risk={tone}
                            >
                              {condition}
                            </RiskChip>
                          </td>

                          <td>
                            {relativeTime(
                              lastCheck,
                            )}
                          </td>

                          <td>
                            <span className="source-label verified">
                              <FileCheck2
                                size={11}
                                style={{
                                  verticalAlign:
                                    "middle",
                                }}
                              />{" "}
                              Backend asset record
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            ) : (
              <div className="alert-detail-empty">
                No active drainage assets are
                currently stored for this area.
              </div>
            )}
          </div>
        ) : (
          /* =================================================
             REPORTS
          ================================================= */

          <div>
            {reports.length ? (
              reports.map(
                (report, index) => {
                  const reportId =
                    report?._id ??
                    report?.reportId ??
                    `report-${index}`;

                  const isVerified =
                    report?.verified === true ||
                    report?.status ===
                      "verified";

                  return (
                    <div
                      className="report-card"
                      key={reportId}
                    >
                      <div>
                        <strong>
                          {report?.description ||
                            report?.reportId ||
                            "Drainage report"}
                        </strong>

                        <p>
                          {report?.blockagePercent !=
                          null
                            ? `Reported blockage: ${report.blockagePercent}%`
                            : "No blockage percentage supplied."}
                        </p>

                        <div className="report-meta">
                          {report?.severity
                            ? `${report.severity} · `
                            : ""}

                          {formatTime(
                            report?.reportedAt ??
                              report?.createdAt,
                          )}

                          {" · "}

                          {reportStatus(
                            report,
                          )}
                        </div>
                      </div>

                      {isVerified ? (
                        <RiskChip risk="low">
                          <Check size={11} />
                          verified
                        </RiskChip>
                      ) : (
                        <RiskChip
                          risk={reportTone(
                            report,
                          )}
                        >
                          <ClipboardCheck
                            size={11}
                          />

                          {reportStatus(
                            report,
                          )}
                        </RiskChip>
                      )}
                    </div>
                  );
                },
              )
            ) : (
              <div className="alert-detail-empty">
                No drainage reports have been
                stored for this area.
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          DATA NOTE
      ===================================================== */}

      {lastAssetUpdate && (
        <div
          className="mono tiny muted"
          style={{
            marginTop: 10,
          }}
        >
          Latest drainage asset update:{" "}
          {formatTime(lastAssetUpdate)}
        </div>
      )}
    </div>
  );
}
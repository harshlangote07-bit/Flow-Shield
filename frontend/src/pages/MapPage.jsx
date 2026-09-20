import { useEffect, useMemo, useState } from "react";

import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  Layers,
  RefreshCw,
} from "lucide-react";

import PageHeading from "../components/PageHeading";
import RiskChip from "../components/RiskChip";
import MapCanvas from "../components/MapCanvas";

import bengaluruZones from "../data/bengaluruZones.json";

import {
  getAllRisks,
  getAreas,
} from "../services/api";

/* =========================================================
   HELPERS
========================================================= */

function getAreaId(area) {
  return area?.areaId ?? area?._id ?? "";
}

function normalizeRiskLevel(level, score = 0) {
  const normalized = String(level || "").toUpperCase();

  if (normalized === "CRITICAL") return "critical";
  if (normalized === "VERY_HIGH") return "very-high";
  if (normalized === "HIGH") return "high";
  if (normalized === "MODERATE") return "medium";
  if (normalized === "LOW") return "low";

  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";

  return "low";
}

function formatRiskLevel(level, score = 0) {
  const risk = normalizeRiskLevel(
    level,
    score,
  );

  if (risk === "very-high") {
    return "VERY HIGH";
  }

  return risk.toUpperCase();
}

function formatTime(value) {
  if (!value) return "Not available";

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

/* =========================================================
   MAP PAGE
========================================================= */

export default function MapPage({
  selectedZone,
  setSelectedZone,
}) {
  const [, navigate] = useLocation();

  const [areas, setAreas] = useState([]);
  const [risks, setRisks] = useState([]);

  const [selected, setSelected] = useState(
    selectedZone || null,
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =========================================================
     LOAD REAL BACKEND DATA
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadMapData() {
      try {
        setLoading(true);
        setError("");

        const [areasResponse, risksResponse] =
          await Promise.all([
            getAreas(),
            getAllRisks(),
          ]);

        if (cancelled) return;

        const nextAreas =
          Array.isArray(
            areasResponse?.data,
          )
            ? areasResponse.data
            : [];

        const nextRisks =
          Array.isArray(
            risksResponse?.data,
          )
            ? risksResponse.data
            : [];

        setAreas(nextAreas);
        setRisks(nextRisks);

        /*
         * If nothing has been selected yet, select the
         * first real backend area.
         */
        if (
          !selectedZone &&
          nextAreas.length
        ) {
          setSelected(
            getAreaId(nextAreas[0]),
          );

          setSelectedZone(
            getAreaId(nextAreas[0]),
          );
        }
      } catch (requestError) {
        if (cancelled) return;

        console.error(
          "Map backend data error:",
          requestError,
        );

        setError(
          requestError?.message ||
            "Unable to load live map data.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMapData();

    return () => {
      cancelled = true;
    };
  }, [selectedZone, setSelectedZone]);

  /* =========================================================
     BUILD BACKEND MAP AREAS
  ========================================================= */

  const backendAreas = useMemo(() => {
    return areas
      .map((area) => {
        const areaId =
          getAreaId(area);

        const riskRecord =
          risks.find(
            (item) =>
              item?.areaId ===
              areaId,
          );

        return {
          ...area,

          areaId,

          risk: riskRecord?.risk ?? null,

          riskScore:
            Number(
              riskRecord?.risk?.score ??
                0,
            ),

          riskLevel:
            riskRecord?.risk?.level ??
            "LOW",
        };
      })
      .filter(
        (area) =>
          area?.boundary?.type ===
            "Polygon" &&
          Array.isArray(
            area?.boundary?.coordinates,
          ),
      );
  }, [areas, risks]);

  /* =========================================================
     STATIC ZONE
  ========================================================= */

  const zoneFeature =
    bengaluruZones.features.find(
      (feature) =>
        feature.properties?.id ===
        selected,
    ) || null;

  const staticZone =
    zoneFeature?.properties || null;

  /* =========================================================
     BACKEND AREA
  ========================================================= */

  const backendArea =
    backendAreas.find(
      (area) =>
        area.areaId === selected,
    ) || null;

  const selectedBackendRisk =
    backendArea?.risk ?? null;

  const selectedBackendScore =
    Number(
      selectedBackendRisk?.score ??
        backendArea?.riskScore ??
        0,
    );

  const selectedBackendLevel =
    selectedBackendRisk?.level ??
    backendArea?.riskLevel ??
    "LOW";

  /* =========================================================
     SELECT HANDLER
  ========================================================= */

  const onSelect = (id) => {
    setSelected(id);
    setSelectedZone(id);
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const refreshMap = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        areasResponse,
        risksResponse,
      ] = await Promise.all([
        getAreas(),
        getAllRisks(),
      ]);

      setAreas(
        Array.isArray(
          areasResponse?.data,
        )
          ? areasResponse.data
          : [],
      );

      setRisks(
        Array.isArray(
          risksResponse?.data,
        )
          ? risksResponse.data
          : [],
      );
    } catch (requestError) {
      console.error(
        "Map refresh error:",
        requestError,
      );

      setError(
        requestError?.message ||
          "Unable to refresh map data.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="page">
      <PageHeading
        eyebrow="Spatial intelligence"
        title="Flood risk map"
        subtitle="Explore Bengaluru's mapped zones together with live monitored areas and their latest backend flood-risk scores."
        action={
          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <button
              className="button button-quiet"
              type="button"
              onClick={refreshMap}
              disabled={loading}
            >
              <RefreshCw
                size={14}
                className={
                  loading ? "spin" : ""
                }
              />
              Refresh
            </button>

            <div className="button button-quiet">
              <Layers size={14} />
              4 active layers
            </div>
          </div>
        }
      />

      {/* =====================================================
          MAP CONTROLS
      ===================================================== */}

      <div className="map-controls">
        <button
          className="control-pill active"
          type="button"
          data-testid="button-layer-risk"
        >
          Risk surface
        </button>

        <button
          className="control-pill"
          type="button"
          data-testid="button-layer-rain"
          onClick={() =>
            navigate("/rainfall-radar")
          }
        >
          Rainfall radar
        </button>

        <span
          className="muted tiny"
          style={{
            marginLeft: "auto",
          }}
        >
          Live backend risk ·{" "}
          {backendAreas.length} monitored area
          {backendAreas.length === 1
            ? ""
            : "s"}
        </span>
      </div>

      {error && (
        <div
          className="recommendation"
          style={{
            marginBottom: 16,
          }}
        >
          <strong>
            Live map data unavailable
          </strong>

          <p>{error}</p>
        </div>
      )}

      {/* =====================================================
          MAP
      ===================================================== */}

      <div className="map-layout">
        <div className="panel map-page-canvas">
          <MapCanvas
            selectedId={selected}
            onSelect={onSelect}
            backendAreas={backendAreas}
          />
        </div>

        {/* ===================================================
            DETAILS
        =================================================== */}

        <aside className="panel">
          {/* ================================================
              BACKEND AREA SELECTED
          ================================================ */}

          {backendArea ? (
            <>
              <div className="detail-head">
                <div>
                  <div className="panel-kicker">
                    Live monitored area
                  </div>

                  <strong>
                    {backendArea.name ||
                      "Monitored area"}
                  </strong>

                  <p>
                    {backendArea.city ||
                      "Bengaluru"}
                    {backendArea.state
                      ? `, ${backendArea.state}`
                      : ""}
                  </p>
                </div>

                <div
                  className={`score-ring ${
                    selectedBackendScore >=
                    70
                      ? "score-high"
                      : selectedBackendScore >=
                        40
                        ? "score-medium"
                        : "score-low"
                  }`}
                >
                  {selectedBackendScore}
                </div>
              </div>

              <div className="factor">
                <div className="factor-line">
                  <span>
                    Live risk score
                  </span>

                  <span>
                    {selectedBackendScore}
                    /100
                  </span>
                </div>

                <div className="factor-bar">
                  <i
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          selectedBackendScore,
                        ),
                      )}%`,
                    }}
                  />
                </div>

                <div className="factor-note">
                  Latest flood-risk calculation
                  stored by the Flow Shield
                  backend.
                </div>
              </div>

              <div className="factor">
                <div className="factor-line">
                  <span>
                    Risk level
                  </span>

                  <RiskChip
                    risk={normalizeRiskLevel(
                      selectedBackendLevel,
                      selectedBackendScore,
                    )}
                  >
                    {formatRiskLevel(
                      selectedBackendLevel,
                      selectedBackendScore,
                    )}
                  </RiskChip>
                </div>

                <div className="factor-note">
                  Current level returned by the
                  backend risk engine.
                </div>
              </div>

              {selectedBackendRisk
                ?.components && (
                <div className="factor">
                  <div className="panel-kicker">
                    Risk components
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 8,
                      marginTop: 10,
                    }}
                  >
                    {Object.entries(
                      selectedBackendRisk
                        .components,
                    ).map(
                      ([name, value]) => (
                        <div
                          key={name}
                          className="factor-line"
                        >
                          <span>
                            {name
                              .replace(
                                /([A-Z])/g,
                                " $1",
                              )
                              .replace(
                                /^./,
                                (letter) =>
                                  letter.toUpperCase(),
                              )}
                          </span>

                          <span>
                            {Number(
                              value,
                            ).toFixed(1)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              <div className="factor">
                <div className="factor-line">
                  <span>
                    Area ID
                  </span>

                  <span>
                    {backendArea.areaId}
                  </span>
                </div>

                <div className="factor-note">
                  Backend area identifier used for
                  risk, weather, drainage and
                  other live data.
                </div>
              </div>

              <div className="factor">
                <div className="factor-line">
                  <span>
                    Last risk update
                  </span>

                  <span>
                    {formatTime(
                      selectedBackendRisk?.updatedAt ??
                        selectedBackendRisk?.createdAt,
                    )}
                  </span>
                </div>
              </div>

              <div className="detail-actions">
                <Link
                  href="/drainage"
                  className="button button-teal button-small"
                  data-testid="link-zone-drainage"
                >
                  Review drainage{" "}
                  <ArrowRight size={13} />
                </Link>

                <Link
                  href="/analysis"
                  className="button button-quiet button-small"
                  data-testid="link-zone-analysis"
                >
                  Recalculate
                </Link>
              </div>
            </>
          ) : zoneFeature ? (
            /* ================================================
               STATIC BENGALURU GEOMETRY
               ================================================ */

            <>
              <div className="detail-head">
                <div>
                  <div className="panel-kicker">
                    Mapped zone
                  </div>

                  <strong>
                    {staticZone.name ||
                      "Bengaluru zone"}
                  </strong>

                  <p>
                    {staticZone.source_area ||
                      "Bengaluru"}
                  </p>
                </div>

                <div
                  className={`score-ring ${
                    Number(
                      staticZone.riskScore,
                    ) >= 70
                      ? "score-high"
                      : Number(
                            staticZone.riskScore,
                          ) >= 40
                        ? "score-medium"
                        : "score-low"
                  }`}
                >
                  {staticZone.riskScore ??
                    "—"}
                </div>
              </div>

              <div className="recommendation">
                <strong>
                  Map geometry
                </strong>

                <p>
                  This Bengaluru boundary comes from
                  the project's local GeoJSON map
                  geometry. It is not being presented
                  as a live MongoDB area until a
                  matching area is created in the
                  database.
                </p>
              </div>

              <div className="factor">
                <div className="factor-line">
                  <span>
                    Map risk value
                  </span>

                  <span>
                    {staticZone.riskScore ??
                      "—"}
                    /100
                  </span>
                </div>

                <div className="factor-bar">
                  <i
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          Number(
                            staticZone.riskScore,
                          ) || 0,
                        ),
                      )}%`,
                    }}
                  />
                </div>

                <div className="factor-note">
                  Existing map-geometry value. Live
                  backend risk is shown when a DB
                  area is selected.
                </div>
              </div>

              <div className="factor">
                <div className="factor-line">
                  <span>
                    Zone ID
                  </span>

                  <span>
                    {staticZone.id ||
                      "—"}
                  </span>
                </div>
              </div>

              <div className="detail-actions">
                <Link
                  href="/rainfall-radar"
                  className="button button-teal button-small"
                >
                  Rainfall radar{" "}
                  <ArrowRight size={13} />
                </Link>

                <Link
                  href="/analysis"
                  className="button button-quiet button-small"
                  data-testid="link-zone-analysis"
                >
                  Analysis
                </Link>
              </div>
            </>
          ) : (
            /* ================================================
               NOTHING SELECTED
               ================================================ */

            <div
              style={{
                minHeight: "420px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "32px",
              }}
            >
              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "16px",
                  opacity: 0.7,
                }}
              >
                ◇
              </div>

              <div className="panel-kicker">
                ZONE DETAILS
              </div>

              <strong
                style={{
                  fontSize: "20px",
                  marginTop: "8px",
                }}
              >
                Select a zone
              </strong>

              <p
                style={{
                  maxWidth: "260px",
                  marginTop: "10px",
                  lineHeight: "1.5",
                }}
              >
                Click a mapped zone or live monitored
                area to inspect its flood-risk data.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
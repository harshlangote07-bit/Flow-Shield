import { useEffect, useMemo, useState } from "react";

import {
  ChevronRight,
  CloudRain,
  Gauge,
  Info,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

import PageHeading from "../components/PageHeading";
import RiskChip from "../components/RiskChip";
import {
  getAreas,
  getAllRisks,
  getCurrentWeather,
  getWaterBodyRisk,
} from "../services/api";

/* =========================================================
   HELPERS
========================================================= */

function normalizeRiskLevel(level, score) {
  if (level) {
    return String(level).toUpperCase();
  }

  if (score >= 80) return "CRITICAL";
  if (score >= 65) return "VERY_HIGH";
  if (score >= 50) return "HIGH";
  if (score >= 30) return "MODERATE";
  return "LOW";
}

function riskLabel(score) {
  if (score >= 80) return "Critical";
  if (score >= 65) return "Very high";
  if (score >= 50) return "High risk";
  if (score >= 30) return "Moderate";
  return "Low risk";
}

function riskTone(score) {
  if (score >= 50) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function getScore(risk) {
  return Number(risk?.risk?.score ?? risk?.score ?? 0);
}

function getAreaId(item) {
  return item?.areaId ?? item?._id ?? "";
}

function getAreaName(area, risk) {
  return (
    area?.name ||
    risk?.areaName ||
    risk?.risk?.areaName ||
    getAreaId(area) ||
    "Selected area"
  );
}

function getCurrentWaterLevel(waterBodies) {
  if (!Array.isArray(waterBodies) || !waterBodies.length) {
    return 0;
  }

  const waterBody = waterBodies[0];

  const latestLevel =
    waterBody?.latestObservation?.currentWaterLevelMeters ??
    waterBody?.latestObservation?.waterLevelMeters ??
    waterBody?.currentWaterLevelMeters ??
    0;

  return Number(latestLevel) || 0;
}

function drainageState(score) {
  if (score >= 65) return "constrained";
  if (score >= 30) return "partial";
  return "open";
}

function terrainState(score) {
  if (score >= 65) return "basin";
  if (score >= 35) return "mixed";
  return "elevated";
}

/* =========================================================
   ANALYSIS PAGE
========================================================= */

export default function AnalysisPage() {
  const [areas, setAreas] = useState([]);
  const [risks, setRisks] = useState([]);

  const [region, setRegion] = useState("");

  const [duration, setDuration] = useState(3);
  const [rainfall, setRainfall] = useState(0);
  const [river, setRiver] = useState(0);
  const [drainage, setDrainage] = useState("open");
  const [terrain, setTerrain] = useState("mixed");

  const [status, setStatus] = useState("loading");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const selectedArea = useMemo(
    () => areas.find((area) => getAreaId(area) === region) || areas[0],
    [areas, region],
  );

  const selectedRisk = useMemo(() => {
    if (!selectedArea) return null;

    const areaId = getAreaId(selectedArea);

    return (
      risks.find(
        (item) =>
          item?.areaId === areaId ||
          item?.risk?.areaId === areaId,
      ) || null
    );
  }, [areas, region, risks, selectedArea]);

  const currentScore = getScore(selectedRisk);

  const currentLevel = normalizeRiskLevel(
    selectedRisk?.risk?.level,
    currentScore,
  );

  const currentRiskLabel = riskLabel(currentScore);

  const currentRiskTone = riskTone(currentScore);

  const selectedAreaName = getAreaName(selectedArea, selectedRisk);

  /* =========================================================
     LOAD REAL BACKEND DATA
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadAnalysisData() {
      try {
        setStatus("loading");
        setError("");

        const [areasResponse, risksResponse] = await Promise.all([
          getAreas(),
          getAllRisks(),
        ]);

        if (cancelled) return;

        const nextAreas = Array.isArray(areasResponse?.data)
          ? areasResponse.data
          : [];

        const nextRisks = Array.isArray(risksResponse?.data)
          ? risksResponse.data
          : [];

        setAreas(nextAreas);
        setRisks(nextRisks);

        if (nextAreas.length) {
          setRegion((current) => current || getAreaId(nextAreas[0]));
        }

        setStatus("idle");
      } catch (requestError) {
        if (cancelled) return;

        console.error("Analysis data error:", requestError);

        setError(
          requestError?.message ||
            "Unable to load live analysis data from the backend.",
        );

        setStatus("error");
      }
    }

    loadAnalysisData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     LOAD LIVE WEATHER + WATER LEVEL FOR SELECTED AREA
  ========================================================= */

  useEffect(() => {
    if (!selectedArea) return;

    let cancelled = false;

    async function loadSelectedAreaData() {
      try {
        const areaId = getAreaId(selectedArea);

        const [weatherResponse, waterResponse] = await Promise.all([
          getCurrentWeather(areaId),
          getWaterBodyRisk(areaId),
        ]);

        if (cancelled) return;

        const observation = weatherResponse?.data?.observation;

        const rainfall3h = Number(
          observation?.rainfall3h ??
            observation?.rainfall1h ??
            0,
        );

        const waterBodies = Array.isArray(waterResponse?.data)
          ? waterResponse.data
          : [];

        const waterLevel = getCurrentWaterLevel(waterBodies);

        const drainageScore = Number(
          selectedRisk?.risk?.components?.drainage ?? 0,
        );

        const terrainScore = Number(
          selectedRisk?.risk?.components?.terrain ?? 0,
        );

        setRainfall(Number.isFinite(rainfall3h) ? rainfall3h : 0);
        setRiver(Number.isFinite(waterLevel) ? waterLevel : 0);

        setDrainage(drainageState(drainageScore));
        setTerrain(terrainState(terrainScore));

        setResult(null);
      } catch (requestError) {
        if (cancelled) return;

        console.error("Selected area analysis data error:", requestError);

        /*
         * Do not break the page if weather/water data is temporarily
         * unavailable. The actual risk score still comes from MongoDB.
         */
      }
    }

    loadSelectedAreaData();

    return () => {
      cancelled = true;
    };
  }, [selectedArea, selectedRisk]);

  /* =========================================================
     REGION CHANGE
  ========================================================= */

  const handleRegionChange = (event) => {
    const nextRegion = event.target.value;

    setRegion(nextRegion);
    setResult(null);
    setStatus("idle");
  };

  /* =========================================================
     WHAT-IF CALCULATION
  ========================================================= */

  const calculate = (event) => {
    event.preventDefault();

    if (!selectedArea) {
      return;
    }

    setStatus("loading");
    setResult(null);

    window.setTimeout(() => {
      const drainagePressure =
        drainage === "constrained"
          ? 4
          : drainage === "partial"
            ? 2
            : 0;

      const terrainPressure =
        terrain === "basin"
          ? 2
          : terrain === "mixed"
            ? 1
            : 0;

      const rainPressure =
        duration * Math.max(
          1.2,
          rainfall / 44,
        );

      const projectedScore = Math.min(
        98,
        Math.max(
          currentScore,
          Math.round(
            currentScore +
              rainPressure +
              drainagePressure +
              terrainPressure,
          ),
        ),
      );

      setResult({
        currentScore,
        projectedScore,
        delta: projectedScore - currentScore,
        currentLevel: riskLabel(currentScore),
        projectedLevel: riskLabel(projectedScore),
      });

      setStatus("done");
    }, 500);
  };

  /* =========================================================
     RESET TO LIVE VALUES
  ========================================================= */

  const resetAnalysis = async () => {
    setResult(null);
    setStatus("idle");

    if (!selectedArea) return;

    try {
      const areaId = getAreaId(selectedArea);

      const [weatherResponse, waterResponse] = await Promise.all([
        getCurrentWeather(areaId),
        getWaterBodyRisk(areaId),
      ]);

      const observation = weatherResponse?.data?.observation;

      const rainfall3h = Number(
        observation?.rainfall3h ??
          observation?.rainfall1h ??
          0,
      );

      const waterBodies = Array.isArray(waterResponse?.data)
        ? waterResponse.data
        : [];

      const waterLevel = getCurrentWaterLevel(waterBodies);

      const drainageScore = Number(
        selectedRisk?.risk?.components?.drainage ?? 0,
      );

      const terrainScore = Number(
        selectedRisk?.risk?.components?.terrain ?? 0,
      );

      setDuration(3);
      setRainfall(Number.isFinite(rainfall3h) ? rainfall3h : 0);
      setRiver(Number.isFinite(waterLevel) ? waterLevel : 0);
      setDrainage(drainageState(drainageScore));
      setTerrain(terrainState(terrainScore));
    } catch (requestError) {
      console.error("Reset analysis error:", requestError);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  if (status === "loading" && !areas.length) {
    return (
      <div className="page">
        <PageHeading
          eyebrow="Decision support"
          title="What-if risk analysis"
          subtitle="Loading live area and risk data from Flow Shield."
          action={
            <div className="risk-chip info">
              <RefreshCw size={12} className="spin" />
              Loading live data
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
                Connecting to the flood-risk backend…
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !areas.length) {
    return (
      <div className="page">
        <PageHeading
          eyebrow="Decision support"
          title="What-if risk analysis"
          subtitle="The analysis page could not load live backend data."
          action={
            <div className="risk-chip high">
              Backend unavailable
            </div>
          }
        />

        <div className="panel">
          <div className="result-empty">
            <div>
              <div className="empty-mark">
                <Info size={22} />
              </div>

              <h3>Unable to load analysis data</h3>

              <p>{error}</p>

              <button
                className="button button-primary"
                type="button"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeading
        eyebrow="Decision support"
        title="What-if risk analysis"
        subtitle="Choose a live monitored area and explore how its current flood risk could change if rainfall continues."
        action={
          <div className="risk-chip info">
            <Info size={12} />
            Scenario simulator
          </div>
        }
      />

      <div className="analysis-layout">
        <form
          className="panel form-stack"
          onSubmit={calculate}
        >
          <div className="panel-header">
            <div>
              <div className="panel-kicker">
                What-if inputs
              </div>

              <h2>Choose a region</h2>
            </div>

            <CloudRain
              size={20}
              color="var(--orange)"
            />
          </div>

          <div className="field">
            <label htmlFor="region">
              Region
            </label>

            <select
              id="region"
              className="select"
              value={region}
              onChange={handleRegionChange}
              data-testid="select-region"
            >
              {areas.map((area) => {
                const areaId = getAreaId(area);

                const areaRisk =
                  risks.find(
                    (item) =>
                      item?.areaId === areaId ||
                      item?.risk?.areaId === areaId,
                  );

                const score = getScore(areaRisk);

                return (
                  <option
                    key={areaId}
                    value={areaId}
                  >
                    {area.name || areaId} · current {Math.round(score)}/100
                  </option>
                );
              })}
            </select>

            <p className="form-help">
              Current risk comes directly from the monitored
              area stored in MongoDB.
            </p>
          </div>

          <div className="field">
            <label htmlFor="duration">
              If rain continues for{" "}
              <b>
                {duration}{" "}
                {duration === 1
                  ? "hour"
                  : "hours"}
              </b>
            </label>

            <input
              id="duration"
              type="range"
              min="0"
              max="12"
              step="1"
              value={duration}
              onChange={(event) => {
                setDuration(
                  Number(event.target.value),
                );
                setResult(null);
                setStatus("idle");
              }}
              data-testid="input-rain-duration"
            />

            <div className="range-hints">
              <span>Now</span>
              <span>12 hours</span>
            </div>

            <p className="form-help">
              Scenario window for the selected monitored
              area.
            </p>
          </div>

          <div className="field">
            <label htmlFor="rainfall">
              Current rainfall in last 3 hours{" "}
              <b>{rainfall.toFixed(1)} mm</b>
            </label>

            <input
              id="rainfall"
              type="range"
              min="0"
              max="120"
              step="0.1"
              value={rainfall}
              onChange={(event) => {
                setRainfall(
                  Number(event.target.value),
                );
                setResult(null);
                setStatus("idle");
              }}
              data-testid="input-rainfall"
            />

            <p className="form-help">
              Live Open-Meteo precipitation persisted by
              the backend.
            </p>
          </div>

          <div className="field">
            <label htmlFor="river">
              River / canal level{" "}
              <b>{river.toFixed(1)} m</b>
            </label>

            <input
              id="river"
              type="range"
              min="0"
              max="10"
              step=".1"
              value={river}
              onChange={(event) => {
                setRiver(
                  Number(event.target.value),
                );
                setResult(null);
                setStatus("idle");
              }}
              data-testid="input-river-level"
            />

            <p className="form-help">
              Latest water-level observation for the selected
              area's water bodies.
            </p>
          </div>

          <div className="field">
            <label htmlFor="drainage">
              Drainage capacity
            </label>

            <select
              id="drainage"
              className="select"
              value={drainage}
              onChange={(event) => {
                setDrainage(event.target.value);
                setResult(null);
                setStatus("idle");
              }}
              data-testid="select-drainage"
            >
              <option value="open">
                Open — pumps and grates clear
              </option>

              <option value="partial">
                Partial — some capacity unavailable
              </option>

              <option value="constrained">
                Constrained — known blockage or failure
              </option>
            </select>

            <p className="form-help">
              Default state is derived from the live drainage
              risk component.
            </p>
          </div>

          <div className="field">
            <label htmlFor="terrain">
              Terrain profile
            </label>

            <select
              id="terrain"
              className="select"
              value={terrain}
              onChange={(event) => {
                setTerrain(event.target.value);
                setResult(null);
                setStatus("idle");
              }}
              data-testid="select-terrain"
            >
              <option value="elevated">
                Elevated district
              </option>

              <option value="mixed">
                Mixed urban slope
              </option>

              <option value="basin">
                Low-lying basin
              </option>
            </select>

            <p className="form-help">
              Default profile is derived from the live terrain
              risk component.
            </p>
          </div>

          <div className="form-actions">
            <button
              className="button button-primary"
              type="submit"
              disabled={
                status === "loading" ||
                !selectedArea
              }
              data-testid="button-calculate"
            >
              {status === "loading" ? (
                <>
                  <RefreshCw
                    size={14}
                    className="spin"
                  />
                  Projecting
                </>
              ) : (
                <>
                  <Gauge size={14} />
                  Compare risk
                </>
              )}
            </button>

            <button
              className="button button-quiet"
              type="button"
              onClick={resetAnalysis}
              data-testid="button-reset-analysis"
            >
              Reset
            </button>
          </div>
        </form>

        <section className="panel">
          {status === "loading" && areas.length > 0 && (
            <div className="loading-state">
              <div className="loading-block">
                <div className="skeleton large" />
                <div className="skeleton" />
                <div className="skeleton" />

                <div className="loading-caption">
                  Projecting {selectedAreaName} across the
                  next {duration} hours…
                </div>
              </div>
            </div>
          )}

          {status === "idle" && (
            <div className="what-if-empty">
              <div className="current-status-strip">
                <div>
                  <span className="panel-kicker">
                    Current status · {selectedAreaName}
                  </span>

                  <strong>
                    {Math.round(currentScore)}
                    <small>/100</small>
                  </strong>

                  <RiskChip risk={currentRiskTone}>
                    {currentRiskLabel}
                  </RiskChip>
                </div>

                <div className="current-status-meta">
                  <span>Rain now</span>
                  <b>
                    {rainfall.toFixed(1)} mm / 3h
                  </b>

                  <span>Gauge</span>
                  <b>
                    {river.toFixed(1)} m
                  </b>
                </div>
              </div>

              <div className="result-empty">
                <div>
                  <div className="empty-mark">
                    <SlidersHorizontal size={22} />
                  </div>

                  <h3>
                    Project the next few hours
                  </h3>

                  <p>
                    Set how long rain continues, then compare
                    the projected score with{" "}
                    {selectedAreaName}'s current backend
                    risk.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === "done" && result && (
            <div className="result-card">
              <div className="panel-kicker">
                Current vs what-if · {selectedAreaName}
              </div>

              <div className="comparison-grid">
                <div className="comparison-card current">
                  <span>Current status</span>

                  <strong>
                    {result.currentScore}
                    <small>/100</small>
                  </strong>

                  <RiskChip
                    risk={riskTone(
                      result.currentScore,
                    )}
                  >
                    {result.currentLevel}
                  </RiskChip>

                  <p>
                    Based on the latest monitored backend
                    conditions.
                  </p>
                </div>

                <div className="comparison-arrow">
                  <ChevronRight size={18} />
                  <span>{duration}h</span>
                </div>

                <div
                  className={`comparison-card projected ${riskTone(
                    result.projectedScore,
                  )}`}
                >
                  <span>If rain continues</span>

                  <strong>
                    {result.projectedScore}
                    <small>/100</small>
                  </strong>

                  <RiskChip
                    risk={riskTone(
                      result.projectedScore,
                    )}
                  >
                    {result.projectedLevel}
                  </RiskChip>

                  <p>
                    Projected change{" "}
                    <b className="delta">
                      +{result.delta} pts
                    </b>
                  </p>
                </div>
              </div>

              <div className="scenario-meter">
                <div className="meter-label">
                  <span>Risk movement</span>

                  <b>
                    {result.currentScore} →{" "}
                    {result.projectedScore}
                  </b>
                </div>

                <div className="meter-track">
                  <i
                    style={{
                      left: `${result.currentScore}%`,
                      width: `${Math.max(
                        0,
                        result.delta,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="result-grid">
                <div className="mini-factor">
                  <span>Rainfall window</span>
                  <strong>
                    {duration}h continued
                  </strong>
                </div>

                <div className="mini-factor">
                  <span>Rainfall load</span>
                  <strong>
                    {rainfall.toFixed(1)} mm
                  </strong>
                </div>

                <div className="mini-factor">
                  <span>Capacity state</span>
                  <strong>{drainage}</strong>
                </div>

                <div className="mini-factor">
                  <span>Terrain</span>
                  <strong>{terrain}</strong>
                </div>
              </div>

              <div className="result-callout">
                <strong>
                  Operational read:
                </strong>{" "}
                {result.projectedScore >= 65
                  ? `If the rain continues for ${duration} hours, ${selectedAreaName} reaches a very high scenario score. Verify drainage capacity and monitor the next backend update.`
                  : result.projectedScore >= 50
                    ? `If the rain continues for ${duration} hours, ${selectedAreaName} enters a high scenario score. Monitor the next rainfall and water-level updates.`
                    : result.projectedScore >= 30
                      ? `${selectedAreaName} remains in a moderate scenario range. Continue monitoring rainfall, drainage and water-level conditions.`
                      : `${selectedAreaName} remains in a lower scenario range under these assumptions. Continue normal monitoring.`}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
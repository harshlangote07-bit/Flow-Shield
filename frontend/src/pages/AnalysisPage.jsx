import { useState } from "react";

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
import { ZONES } from "../data/mockData";

/* =========================================================
   ANALYSIS PAGE
========================================================= */

export default function AnalysisPage() {
  const [region, setRegion] = useState("harbor");

  const [duration, setDuration] = useState(3);

  const [rainfall, setRainfall] = useState(58);

  const [river, setRiver] = useState(2.4);

  const [drainage, setDrainage] = useState("constrained");

  const [terrain, setTerrain] = useState("basin");

  const [status, setStatus] = useState("idle");

  const [result, setResult] = useState(null);

  const selectedZone = ZONES.find((item) => item.id === region) || ZONES[0];

  const currentScore = selectedZone.score;

  const currentLevel =
    currentScore > 74 ? "High risk" : currentScore > 48 ? "Watch" : "Low risk";

  const currentRainfall = Number.parseInt(selectedZone.rainfall, 10);

  const riskLabel = (score) =>
    score > 74 ? "High risk" : score > 48 ? "Watch" : "Low risk";

  const riskTone = (score) =>
    score > 74 ? "high" : score > 48 ? "medium" : "low";

  const handleRegionChange = (event) => {
    const nextRegion = event.target.value;

    const nextZone = ZONES.find((item) => item.id === nextRegion) || ZONES[0];

    setRegion(nextRegion);

    setRainfall(Number.parseInt(nextZone.rainfall, 10));

    setRiver(Number.parseFloat(nextZone.level));

    setResult(null);
    setStatus("idle");
  };

  const calculate = (event) => {
    event.preventDefault();

    setStatus("loading");
    setResult(null);

    window.setTimeout(() => {
      const drainagePressure =
        drainage === "constrained" ? 4 : drainage === "partial" ? 2 : 0;

      const terrainPressure =
        terrain === "basin" ? 2 : terrain === "mixed" ? 1 : 0;

      const rainPressure = duration * Math.max(1.2, rainfall / 44);

      const gaugePressure =
        Math.max(0, river - Number.parseFloat(selectedZone.level)) * 6;

      const projectedScore = Math.min(
        98,
        Math.max(
          currentScore,
          Math.round(
            currentScore +
            rainPressure +
            drainagePressure +
            terrainPressure +
            gaugePressure,
          ),
        ),
      );

      setResult({
        currentScore,
        projectedScore,
        delta: projectedScore - currentScore,
        currentLevel,
        projectedLevel: riskLabel(projectedScore),
      });

      setStatus("done");
    }, 900);
  };
  return <div className="page">
    <PageHeading eyebrow="Decision support" title="What-if risk analysis" subtitle="Choose a region and see how its risk could change if the rain continues. Compare the current situation with a transparent local projection before committing crews." action={<div className="risk-chip info"><Info size={12} /> Scenario simulator</div>} />
    <div className="analysis-layout"><form className="panel form-stack" onSubmit={calculate}>
      <div className="panel-header"><div><div className="panel-kicker">What-if inputs</div><h2>Choose a region</h2></div><CloudRain size={20} color="var(--orange)" /></div>
      <div className="field"><label htmlFor="region">Region</label><select id="region" className="select" value={region} onChange={handleRegionChange} data-testid="select-region">{ZONES.map((zone) => <option key={zone.id} value={zone.id}>{zone.name} · current {zone.score}/100</option>)}</select><p className="form-help">The current score updates with the region so the comparison starts from a monitored zone.</p></div>
      <div className="field"><label htmlFor="duration">If rain continues for <b>{duration} {duration === 1 ? "hour" : "hours"}</b></label><input id="duration" type="range" min="0" max="12" step="1" value={duration} onChange={(e) => { setDuration(Number(e.target.value)); setResult(null); setStatus("idle"); }} data-testid="input-rain-duration" /><div className="range-hints"><span>Now</span><span>12 hours</span></div><p className="form-help">Projection window for the next rainfall band over {selectedZone.name}.</p></div>
      <div className="field"><label htmlFor="rainfall">Current rainfall in last 3 hours <b>{rainfall} mm</b></label><input id="rainfall" type="range" min="0" max="120" value={rainfall} onChange={(e) => { setRainfall(Number(e.target.value)); setResult(null); setStatus("idle"); }} data-testid="input-rainfall" /><p className="form-help">Measured precipitation across the selected catchment.</p></div>
      <div className="field"><label htmlFor="river">River / canal level <b>{river.toFixed(1)} m</b></label><input id="river" type="range" min="0" max="4" step=".1" value={river} onChange={(e) => setRiver(Number(e.target.value))} data-testid="input-river-level" /><p className="form-help">Current gauge reading relative to the local datum.</p></div>
      <div className="field"><label htmlFor="drainage">Drainage capacity</label><select id="drainage" className="select" value={drainage} onChange={(e) => setDrainage(e.target.value)} data-testid="select-drainage"><option value="open">Open — pumps and grates clear</option><option value="partial">Partial — some capacity unavailable</option><option value="constrained">Constrained — known blockage or failure</option></select></div>
      <div className="field"><label htmlFor="terrain">Terrain profile</label><select id="terrain" className="select" value={terrain} onChange={(e) => setTerrain(e.target.value)} data-testid="select-terrain"><option value="elevated">Elevated district</option><option value="mixed">Mixed urban slope</option><option value="basin">Low-lying basin</option></select></div>
      <div className="form-actions"><button className="button button-primary" type="submit" disabled={status === "loading"} data-testid="button-calculate">{status === "loading" ? <><RefreshCw size={14} className="spin" /> Projecting</> : <><Gauge size={14} /> Compare risk</>}</button><button className="button button-quiet" type="button" onClick={() => { setRegion("harbor"); setDuration(3); setRainfall(58); setRiver(2.4); setDrainage("constrained"); setTerrain("basin"); setResult(null); setStatus("idle"); }} data-testid="button-reset-analysis">Reset</button></div>
    </form><section className="panel">
        {status === "loading" && <div className="loading-state"><div className="loading-block"><div className="skeleton large" /><div className="skeleton" /><div className="skeleton" /><div className="loading-caption">Projecting {selectedZone.name} across the next {duration} hours…</div></div></div>}
        {status === "idle" && <div className="what-if-empty"><div className="current-status-strip"><div><span className="panel-kicker">Current status · {selectedZone.name}</span><strong>{currentScore}<small>/100</small></strong><RiskChip risk={riskTone(currentScore)}>{currentLevel}</RiskChip></div><div className="current-status-meta"><span>Rain now</span><b>{currentRainfall} mm / 3h</b><span>Gauge</span><b>{selectedZone.level}</b></div></div><div className="result-empty"><div><div className="empty-mark"><SlidersHorizontal size={22} /></div><h3>Project the next few hours</h3><p>Set how long rain continues, then compare the projected score with {selectedZone.name}'s current status.</p></div></div></div>}
        {status === "done" && result && <div className="result-card"><div className="panel-kicker">Current vs what-if · {selectedZone.name}</div><div className="comparison-grid"><div className="comparison-card current"><span>Current status</span><strong>{result.currentScore}<small>/100</small></strong><RiskChip risk={riskTone(result.currentScore)}>{result.currentLevel}</RiskChip><p>Based on the latest monitored conditions.</p></div><div className="comparison-arrow"><ChevronRight size={18} /><span>{duration}h</span></div><div className={`comparison-card projected ${riskTone(result.projectedScore)}`}><span>If rain continues</span><strong>{result.projectedScore}<small>/100</small></strong><RiskChip risk={riskTone(result.projectedScore)}>{result.projectedLevel}</RiskChip><p>Projected change <b className="delta">+{result.delta} pts</b></p></div></div><div className="scenario-meter"><div className="meter-label"><span>Risk movement</span><b>{result.currentScore} → {result.projectedScore}</b></div><div className="meter-track"><i style={{ left: `${result.currentScore}%`, width: `${result.delta}%` }} /></div></div><div className="result-grid"><div className="mini-factor"><span>Rainfall window</span><strong>{duration}h continued</strong></div><div className="mini-factor"><span>Rainfall load</span><strong>{rainfall} mm</strong></div><div className="mini-factor"><span>Capacity state</span><strong>{drainage}</strong></div><div className="mini-factor"><span>Terrain</span><strong>{terrain}</strong></div></div><div className="result-callout"><strong>Operational read:</strong> {result.projectedScore > 74 ? `If the rain holds for ${duration} hours, ${selectedZone.name} moves into high operational risk. Keep crews staged and verify drainage capacity before the next update.` : result.projectedScore > 48 ? `If the rain holds for ${duration} hours, ${selectedZone.name} remains in watch status. Keep a crew staged and watch the next gauge update.` : `${selectedZone.name} remains low risk in this scenario. Routine patrol is appropriate while the next rainfall band is evaluated.`}</div></div>}
      </section></div>
  </div>;
}

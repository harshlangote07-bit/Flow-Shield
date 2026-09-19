import { useEffect, useMemo, useState } from "react";
import { Link, Route, Router, Switch, useLocation } from "wouter";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  CloudRain,
  Droplets,
  Eye,
  FileCheck2,
  Gauge,
  Info,
  Layers,
  Map,
  MapPin,
  MessageSquareWarning,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Waves,
  X,
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
import RainfallRadarPage from "./pages/RainfallRadarPage";

const ZONES = [
  {
    id: "harbor",
    name: "Harbor East",
    short: "Harbor",
    risk: "high",
    score: 82,
    x: "32%",
    y: "32%",
    trend: "+14 pts",
    subtitle: "Low-lying waterfront",
    rainfall: "58 mm / 3h",
    level: "2.4 m",
  },
  {
    id: "market",
    name: "Old Market",
    short: "Market",
    risk: "medium",
    score: 64,
    x: "62%",
    y: "44%",
    trend: "+8 pts",
    subtitle: "Historic basin",
    rainfall: "42 mm / 3h",
    level: "1.7 m",
  },
  {
    id: "north",
    name: "Northbank",
    short: "Northbank",
    risk: "low",
    score: 31,
    x: "75%",
    y: "22%",
    trend: "-3 pts",
    subtitle: "Elevated district",
    rainfall: "28 mm / 3h",
    level: "0.8 m",
  },
  {
    id: "junction",
    name: "Canal Junction",
    short: "Junction",
    risk: "high",
    score: 76,
    x: "49%",
    y: "72%",
    trend: "+11 pts",
    subtitle: "Constricted channel",
    rainfall: "51 mm / 3h",
    level: "2.1 m",
  },
];

const ALERTS = [
  {
    id: "a1",
    severity: "high",
    title: "Harbor East threshold exceeded",
    body: "Gauge FE-04 is 18 cm above the amber trigger and rising.",
    time: "8 min ago",
    zone: "Harbor East",
    action: "Dispatch drainage crew to Pier 4 access.",
  },
  {
    id: "a2",
    severity: "medium",
    title: "Rainfall band moving inland",
    body: "Forecast cell is tracking toward Old Market within 90 minutes.",
    time: "26 min ago",
    zone: "Old Market",
    action: "Stage pumps at Market Street underpass.",
  },
  {
    id: "a3",
    severity: "low",
    title: "Northbank risk easing",
    body: "River level projection revised down after upstream reading.",
    time: "44 min ago",
    zone: "Northbank",
    action: "Keep routine patrol; no escalation required.",
  },
];

const TREND_DATA = [
  { time: "06:00", harbor: 39, market: 26, junction: 34 },
  { time: "08:00", harbor: 45, market: 31, junction: 41 },
  { time: "10:00", harbor: 52, market: 38, junction: 48 },
  { time: "12:00", harbor: 61, market: 45, junction: 57 },
  { time: "14:00", harbor: 72, market: 54, junction: 66 },
  { time: "16:00", harbor: 82, market: 64, junction: 76 },
  { time: "18:00", harbor: 88, market: 72, junction: 83 },
];

const NAV = [
  {
    href: "/",
    label: "Command center",
    icon: CircleGauge,
  },
  {
    href: "/map",
    label: "Risk map",
    icon: Map,
  },
  {
    href: "/analysis",
    label: "Risk analysis",
    icon: SlidersHorizontal,
  },
  {
    href: "/drainage",
    label: "Drainage watch",
    icon: Droplets,
  },
  {
    href: "/alerts",
    label: "Alerts & forecast",
    icon: Bell,
  },
  {
    href: "/official",
    label: "Official portal",
    icon: ShieldCheck,
  },
];

function RiskChip({ risk, children }) {
  return <span className={`risk-chip ${risk}`}>{children || risk}</span>;
}

/* =========================================================
   APPLICATION SHELL
========================================================= */

function Shell({ children, officialUser, onLogout }) {
  const [location, setLocation] = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    onLogout();
    setLocation("/official-login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" data-testid="link-brand">
          <div className="brand-mark" aria-hidden="true" />

          <div className="brand-copy">
            <div className="brand-name">FloodGuard</div>
            <span className="brand-sub">field intelligence</span>
          </div>
        </Link>

        <div className="nav-section">Operations</div>

        <nav className="nav-list" aria-label="Primary navigation">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? location === "/" : location.startsWith(href);

            return (
              <Link
                href={href}
                key={href}
                className={`nav-link ${active ? "active" : ""}`}
                data-testid={`link-nav-${label
                  .toLowerCase()
                  .replaceAll(" ", "-")}`}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* =================================================
            PROFILE IS ONLY VISIBLE AFTER OFFICIAL LOGIN
        ================================================= */}

        {officialUser && (
          <div className="sidebar-bottom">
            <div className="operator">
              <div className="avatar">
                {officialUser.name
                  ?.split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div className="operator-copy">
                <div className="operator-name">{officialUser.name}</div>

                <div className="operator-role">{officialUser.role}</div>

                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginTop: "8px",
                  }}
                >
                  <Link
                    href="/profile"
                    className="button button-quiet button-small"
                    style={{
                      padding: "5px 8px",
                      fontSize: "10px",
                    }}
                  >
                    <User size={11} />
                    Profile
                  </Link>

                  <button
                    type="button"
                    className="button button-quiet button-small"
                    style={{
                      padding: "5px 8px",
                      fontSize: "10px",
                    }}
                    onClick={handleLogout}
                    data-testid="button-sign-out"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <Radio size={13} />

            <span>Live operations</span>

            <ChevronRight size={13} />

            <strong>
              {location === "/official-login"
                ? "Official sign in"
                : location === "/profile"
                  ? "Profile"
                  : NAV.find((n) => n.href === location)?.label || "FloodGuard"}
            </strong>
          </div>

          <div className="status-strip">
            <div className="live-status">
              <i className="live-dot" />
              Monitoring live
            </div>

            <div className="time-stamp">
              {now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              local
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE HEADING
========================================================= */

function PageHeading({ eyebrow, title, subtitle, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>

        <h1>{title}</h1>

        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>

      {action}
    </div>
  );
}

/* =========================================================
   MAP
========================================================= */

function MapCanvas({ selectedId, onSelect, compact = false }) {
  return (
    <div className={`map-canvas ${compact ? "" : "map-page-canvas"}`}>
      <div className="map-river" />
      <div className="map-road" />

      <span
        className="map-label"
        style={{
          left: "15%",
          top: "20%",
        }}
      >
        West quay
      </span>

      <span
        className="map-label"
        style={{
          left: "67%",
          top: "59%",
        }}
      >
        Civic core
      </span>

      <span
        className="map-label"
        style={{
          left: "23%",
          top: "83%",
        }}
      >
        South canal
      </span>

      {ZONES.map((zone) => (
        <button
          key={zone.id}
          type="button"
          className={`zone ${zone.risk} ${
            selectedId === zone.id ? "selected" : ""
          }`}
          style={{
            left: zone.x,
            top: zone.y,
          }}
          onClick={() => onSelect(zone.id)}
          aria-label={`Select ${zone.name}`}
          data-testid={`button-zone-${zone.id}`}
        >
          <span>
            {zone.short} · {zone.score}
          </span>
        </button>
      ))}

      <div className="map-overlay">
        <strong>Storm cell: moving east</strong>

        <span>Updated 2 minutes ago · radar + gauge blend</span>
      </div>

      <div className="map-legend">
        <span className="legend-item">
          <i className="legend-dot high" />
          High
        </span>

        <span className="legend-item">
          <i className="legend-dot medium" />
          Watch
        </span>

        <span className="legend-item">
          <i className="legend-dot low" />
          Stable
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ setSelectedZone }) {
  const [, setLocation] = useLocation();

  const [selected, setSelected] = useState("harbor");

  const selectZone = (id) => {
    setSelected(id);
    setSelectedZone(id);
  };

  return (
    <div className="page">
      <PageHeading
        eyebrow="Tuesday · 16:40 local"
        title="Command center"
        subtitle="A live read on where water is moving, what is driving the risk, and which crews need a clear next step."
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

      <section className="metric-grid">
        <div className="metric-card alert">
          <div className="metric-label">
            City risk index
            <AlertTriangle size={15} className="alert-icon" />
          </div>

          <div className="metric-value">
            68
            <small>/100</small>
          </div>

          <div className="metric-trend up">↑ 9 points since 12:00</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Zones monitored
            <Activity size={15} />
          </div>

          <div className="metric-value">12</div>

          <div className="metric-trend">All feeds reporting</div>
        </div>

        <div className="metric-card warn">
          <div className="metric-label">
            Active alerts
            <Bell size={15} />
          </div>

          <div className="metric-value">03</div>

          <div className="metric-trend up">1 needs action now</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            Drainage readiness
            <CheckCircle2 size={15} />
          </div>

          <div className="metric-value">
            84
            <small>%</small>
          </div>

          <div className="metric-trend">↑ 6% crew checks</div>
        </div>
      </section>

      <section className="dashboard-grid section-gap">
        <div className="panel risk-map">
          <MapCanvas compact selectedId={selected} onSelect={selectZone} />
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Priority zones</div>

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
            {ZONES.slice(0, 3).map((zone) => (
              <button
                type="button"
                className="summary-row"
                key={zone.id}
                onClick={() => {
                  selectZone(zone.id);
                  setLocation("/map");
                }}
                data-testid={`button-priority-${zone.id}`}
              >
                <div>
                  <strong>{zone.name}</strong>

                  <small>
                    {zone.subtitle} · {zone.trend} today
                  </small>
                </div>

                <RiskChip risk={zone.risk}>
                  {zone.score} · {zone.risk === "medium" ? "watch" : zone.risk}
                </RiskChip>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bottom-grid section-gap">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Needs a decision</div>

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
            {ALERTS.map((alert) => (
              <Link
                href="/alerts"
                className="alert-row"
                key={alert.id}
                data-testid={`link-alert-${alert.id}`}
              >
                <i className={`alert-severity ${alert.severity}`} />

                <div>
                  <strong>{alert.title}</strong>

                  <p>{alert.body}</p>
                </div>

                <span className="alert-time">{alert.time}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Crew posture</div>

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
                <strong>East pump station</strong>

                <small>Pressure normal · checked 6 min ago</small>
              </div>

              <span className="drain-status">ready</span>
            </div>

            <div className="drain-item">
              <div className="drain-icon">
                <Waves size={15} />
              </div>

              <div>
                <strong>Market underpass</strong>

                <small>Grate clearance in progress</small>
              </div>

              <span className="drain-status warn">watch</span>
            </div>

            <div className="drain-item">
              <div className="drain-icon">
                <Check size={15} />
              </div>

              <div>
                <strong>Canal Junction gates</strong>

                <small>Remote control responding</small>
              </div>

              <span className="drain-status">ready</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   MAP PAGE
========================================================= */

function MapPage({ selectedZone, setSelectedZone }) {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState(selectedZone || "harbor");

  const zone = ZONES.find((item) => item.id === selected) || ZONES[0];
<<<<<<< HEAD
  const onSelect = (id) => { setSelected(id); setSelectedZone(id); };
  return <div className="page">
    <PageHeading eyebrow="Spatial intelligence" title="Flood risk map" subtitle="Select a zone to inspect the drivers behind its score. The map blends rainfall, river gauges, terrain, and drainage capacity." action={<div className="button button-quiet"><Layers size={14} /> 4 active layers</div>} />
    <div className="map-controls"><button className="control-pill active" type="button" data-testid="button-layer-risk">Risk surface</button><button
      className="control-pill"
      type="button"
      data-testid="button-layer-rain"
      onClick={() => navigate("/rainfall-radar")}
    >
      Rainfall radar
    </button><button className="control-pill" type="button" data-testid="button-layer-drainage">Drainage assets</button><span className="muted tiny" style={{ marginLeft: "auto" }}>Forecast horizon: 3 hours</span></div>
    <div className="map-layout"><div className="panel map-page-canvas"><MapCanvas selectedId={selected} onSelect={onSelect} /></div>
      <aside className="panel"><div className="detail-head"><div><div className="panel-kicker">Selected zone</div><strong>{zone.name}</strong><p>{zone.subtitle}</p></div><div className="score-ring">{zone.score}</div></div>
        <div className="factor"><div className="factor-line"><span>Rainfall intensity</span><span>{zone.rainfall}</span></div><div className="factor-bar"><i style={{ width: `${Math.min(100, zone.score - 5)}%` }} /></div><div className="factor-note">Heavy cell has remained over the catchment for 46 minutes.</div></div>
        <div className="factor"><div className="factor-line"><span>River / canal level</span><span>{zone.level}</span></div><div className="factor-bar"><i style={{ width: `${Math.min(100, zone.score - 13)}%` }} /></div><div className="factor-note">Gauge trend is rising faster than the last model run.</div></div>
        <div className="factor"><div className="factor-line"><span>Drainage capacity</span><span>{zone.id === "north" ? "72% free" : "38% free"}</span></div><div className="factor-bar"><i style={{ width: zone.id === "north" ? "28%" : "62%" }} /></div><div className="factor-note">Capacity is estimated from verified crew checks and pump telemetry.</div></div>
        <div className="recommendation"><strong>Recommended next step</strong><p>{zone.id === "harbor" ? "Dispatch a crew to Pier 4 and stage a mobile pump before the next rainfall pulse." : zone.id === "junction" ? "Inspect the south canal grates and confirm gate control before 17:15." : "Maintain patrol cadence and recheck the nearest gauge after the next radar sweep."}</p></div>
        <div className="detail-actions"><Link href="/drainage" className="button button-teal button-small" data-testid="link-zone-drainage">Review drainage <ArrowRight size={13} /></Link><Link href="/analysis" className="button button-quiet button-small" data-testid="link-zone-analysis">Recalculate</Link></div>
      </aside>
=======

  const onSelect = (id) => {
    setSelected(id);
    setSelectedZone(id);
  };

  return (
    <div className="page">
      <PageHeading
        eyebrow="Spatial intelligence"
        title="Flood risk map"
        subtitle="Select a zone to inspect the drivers behind its score. The map blends rainfall, river gauges, terrain, and drainage capacity."
        action={
          <div className="button button-quiet">
            <Layers size={14} />4 active layers
          </div>
        }
      />

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
        >
          Rainfall radar
        </button>

        <span
          className="muted tiny"
          style={{
            marginLeft: "auto",
          }}
        >
          Forecast horizon: 3 hours
        </span>
      </div>

      <div className="map-layout">
        <div className="panel map-page-canvas">
          <MapCanvas selectedId={selected} onSelect={onSelect} />
        </div>

        <aside className="panel">
          <div className="detail-head">
            <div>
              <div className="panel-kicker">Selected zone</div>

              <strong>{zone.name}</strong>

              <p>{zone.subtitle}</p>
            </div>

            <div className="score-ring">{zone.score}</div>
          </div>

          <div className="factor">
            <div className="factor-line">
              <span>Rainfall intensity</span>

              <span>{zone.rainfall}</span>
            </div>

            <div className="factor-bar">
              <i
                style={{
                  width: `${Math.min(100, zone.score - 5)}%`,
                }}
              />
            </div>

            <div className="factor-note">
              Heavy cell has remained over the catchment for 46 minutes.
            </div>
          </div>

          <div className="factor">
            <div className="factor-line">
              <span>River / canal level</span>

              <span>{zone.level}</span>
            </div>

            <div className="factor-bar">
              <i
                style={{
                  width: `${Math.min(100, zone.score - 13)}%`,
                }}
              />
            </div>

            <div className="factor-note">
              Gauge trend is rising faster than the last model run.
            </div>
          </div>

          <div className="factor">
            <div className="factor-line">
              <span>Drainage capacity</span>

              <span>{zone.id === "north" ? "72% free" : "38% free"}</span>
            </div>

            <div className="factor-bar">
              <i
                style={{
                  width: zone.id === "north" ? "28%" : "62%",
                }}
              />
            </div>

            <div className="factor-note">
              Capacity is estimated from verified crew checks and pump
              telemetry.
            </div>
          </div>

          <div className="recommendation">
            <strong>Recommended next step</strong>

            <p>
              {zone.id === "harbor"
                ? "Dispatch a crew to Pier 4 and stage a mobile pump before the next rainfall pulse."
                : zone.id === "junction"
                  ? "Inspect the south canal grates and confirm gate control before 17:15."
                  : "Maintain patrol cadence and recheck the nearest gauge after the next radar sweep."}
            </p>
          </div>

          <div className="detail-actions">
            <Link
              href="/drainage"
              className="button button-teal button-small"
              data-testid="link-zone-drainage"
            >
              Review drainage
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
        </aside>
      </div>
>>>>>>> 84b9c39 (added login page and removed unnecessary buttons)
    </div>
  );
}

/* =========================================================
   ANALYSIS PAGE
========================================================= */

function AnalysisPage() {
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
<<<<<<< HEAD
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
=======

  return (
    <div className="page">
      <PageHeading
        eyebrow="Decision support"
        title="What-if risk analysis"
        subtitle="Choose a region and see how its risk could change if the rain continues. Compare the current situation with a transparent local projection before committing crews."
        action={
          <div className="risk-chip info">
            <Info size={12} />
            Scenario simulator
          </div>
        }
      />

      <div className="analysis-layout">
        <form className="panel form-stack" onSubmit={calculate}>
          <div className="panel-header">
            <div>
              <div className="panel-kicker">What-if inputs</div>

              <h2>Choose a region</h2>
            </div>

            <CloudRain size={20} color="var(--orange)" />
          </div>

          <div className="field">
            <label htmlFor="region">Region</label>

            <select
              id="region"
              className="select"
              value={region}
              onChange={handleRegionChange}
              data-testid="select-region"
            >
              {ZONES.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} · current {zone.score}/100
                </option>
              ))}
            </select>

            <p className="form-help">
              The current score updates with the region so the comparison starts
              from a monitored zone.
            </p>
          </div>

          <div className="field">
            <label htmlFor="duration">
              If rain continues for{" "}
              <b>
                {duration} {duration === 1 ? "hour" : "hours"}
              </b>
            </label>

            <input
              id="duration"
              type="range"
              min="0"
              max="12"
              step="1"
              value={duration}
              onChange={(e) => {
                setDuration(Number(e.target.value));
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
              Projection window for the next rainfall band over{" "}
              {selectedZone.name}.
            </p>
          </div>

          <div className="field">
            <label htmlFor="rainfall">
              Current rainfall in last 3 hours <b>{rainfall} mm</b>
            </label>

            <input
              id="rainfall"
              type="range"
              min="0"
              max="120"
              value={rainfall}
              onChange={(e) => {
                setRainfall(Number(e.target.value));
                setResult(null);
                setStatus("idle");
              }}
              data-testid="input-rainfall"
            />

            <p className="form-help">
              Measured precipitation across the selected catchment.
            </p>
          </div>

          <div className="field">
            <label htmlFor="river">
              River / canal level <b>{river.toFixed(1)} m</b>
            </label>

            <input
              id="river"
              type="range"
              min="0"
              max="4"
              step=".1"
              value={river}
              onChange={(e) => setRiver(Number(e.target.value))}
              data-testid="input-river-level"
            />

            <p className="form-help">
              Current gauge reading relative to the local datum.
            </p>
          </div>

          <div className="field">
            <label htmlFor="drainage">Drainage capacity</label>

            <select
              id="drainage"
              className="select"
              value={drainage}
              onChange={(e) => setDrainage(e.target.value)}
              data-testid="select-drainage"
            >
              <option value="open">Open — pumps and grates clear</option>

              <option value="partial">
                Partial — some capacity unavailable
              </option>

              <option value="constrained">
                Constrained — known blockage or failure
              </option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="terrain">Terrain profile</label>

            <select
              id="terrain"
              className="select"
              value={terrain}
              onChange={(e) => setTerrain(e.target.value)}
              data-testid="select-terrain"
            >
              <option value="elevated">Elevated district</option>

              <option value="mixed">Mixed urban slope</option>

              <option value="basin">Low-lying basin</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              className="button button-primary"
              type="submit"
              disabled={status === "loading"}
              data-testid="button-calculate"
            >
              {status === "loading" ? (
                <>
                  <RefreshCw size={14} className="spin" />
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
              onClick={() => {
                setRegion("harbor");
                setDuration(3);
                setRainfall(58);
                setRiver(2.4);
                setDrainage("constrained");
                setTerrain("basin");
                setResult(null);
                setStatus("idle");
              }}
              data-testid="button-reset-analysis"
            >
              Reset
            </button>
          </div>
        </form>

        <section className="panel">
          {status === "loading" && (
            <div className="loading-state">
              <div className="loading-block">
                <div className="skeleton large" />
                <div className="skeleton" />
                <div className="skeleton" />

                <div className="loading-caption">
                  Projecting {selectedZone.name} across the next {duration}{" "}
                  hours…
                </div>
              </div>
            </div>
          )}

          {status === "idle" && (
            <div className="what-if-empty">
              <div className="current-status-strip">
                <div>
                  <span className="panel-kicker">
                    Current status · {selectedZone.name}
                  </span>

                  <strong>
                    {currentScore}
                    <small>/100</small>
                  </strong>

                  <RiskChip risk={riskTone(currentScore)}>
                    {currentLevel}
                  </RiskChip>
                </div>

                <div className="current-status-meta">
                  <span>Rain now</span>
                  <b>{currentRainfall} mm / 3h</b>

                  <span>Gauge</span>
                  <b>{selectedZone.level}</b>
                </div>
              </div>

              <div className="result-empty">
                <div>
                  <div className="empty-mark">
                    <SlidersHorizontal size={22} />
                  </div>

                  <h3>Project the next few hours</h3>

                  <p>
                    Set how long rain continues, then compare the projected
                    score with {selectedZone.name}
                    's current status.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === "done" && result && (
            <div className="result-card">
              <div className="panel-kicker">
                Current vs what-if · {selectedZone.name}
              </div>

              <div className="comparison-grid">
                <div className="comparison-card current">
                  <span>Current status</span>

                  <strong>
                    {result.currentScore}
                    <small>/100</small>
                  </strong>

                  <RiskChip risk={riskTone(result.currentScore)}>
                    {result.currentLevel}
                  </RiskChip>

                  <p>Based on the latest monitored conditions.</p>
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

                  <RiskChip risk={riskTone(result.projectedScore)}>
                    {result.projectedLevel}
                  </RiskChip>

                  <p>
                    Projected change{" "}
                    <b className="delta">+{result.delta} pts</b>
                  </p>
                </div>
              </div>

              <div className="scenario-meter">
                <div className="meter-label">
                  <span>Risk movement</span>

                  <b>
                    {result.currentScore} → {result.projectedScore}
                  </b>
                </div>

                <div className="meter-track">
                  <i
                    style={{
                      left: `${result.currentScore}%`,
                      width: `${result.delta}%`,
                    }}
                  />
                </div>
              </div>

              <div className="result-grid">
                <div className="mini-factor">
                  <span>Rainfall window</span>

                  <strong>{duration}h continued</strong>
                </div>

                <div className="mini-factor">
                  <span>Rainfall load</span>

                  <strong>{rainfall} mm</strong>
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
                <strong>Operational read:</strong>{" "}
                {result.projectedScore > 74
                  ? `If the rain holds for ${duration} hours, ${selectedZone.name} moves into high operational risk. Keep crews staged and verify drainage capacity before the next update.`
                  : result.projectedScore > 48
                    ? `If the rain holds for ${duration} hours, ${selectedZone.name} remains in watch status. Keep a crew staged and watch the next gauge update.`
                    : `${selectedZone.name} remains low risk in this scenario. Routine patrol is appropriate while the next rainfall band is evaluated.`}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
>>>>>>> 84b9c39 (added login page and removed unnecessary buttons)
}

/* =========================================================
   DRAINAGE PAGE
========================================================= */

function DrainagePage({ officialUser }) {
  const [tab, setTab] = useState("verified");

  const [reports, setReports] = useState([
    {
      id: "r1",
      location: "Pier 4 access road",
      report: "Water pooling across one lane; grate not visible.",
      source: "Resident report",
      time: "12 min ago",
      status: "Awaiting field check",
    },
    {
      id: "r2",
      location: "Market Street underpass",
      report: "Debris collecting along north drain.",
      source: "Resident report",
      time: "31 min ago",
      status: "Crew assigned",
    },
    {
      id: "r3",
      location: "South canal footbridge",
      report: "Flow is audible but channel remains clear.",
      source: "Resident report",
      time: "52 min ago",
      status: "Awaiting field check",
    },
  ]);

  const verify = (id) =>
    setReports((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Verified by crew",
            }
          : item,
      ),
    );

  return (
    <div className="page">
      <PageHeading
        eyebrow="Field operations"
        title="Drainage watch"
        subtitle="Keep public reports visible without confusing them for confirmed conditions. Verified status is reserved for a crew check or trusted asset telemetry."
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
              data-testid="button-public-report"
            >
              <MessageSquareWarning size={14} />
              Submit public report
            </button>

            <button
              className="button button-teal"
              type="button"
              onClick={() => setReports((r) => r)}
              data-testid="button-refresh-drainage"
            >
              <RefreshCw size={14} />
              Refresh feeds
            </button>
          </div>
        }
      />

      <div className="drainage-stats">
        <div className="mini-stat">
          <span>Assets online</span>
          <strong>47/49</strong>
          <em>96% reporting</em>
        </div>

        <div className="mini-stat">
          <span>Ready to dispatch</span>
          <strong>08</strong>
          <em>2 crews moving</em>
        </div>

        <div className="mini-stat">
          <span>Open reports</span>
          <strong>
            {reports.filter((r) => r.status !== "Verified by crew").length}
          </strong>
          <em>Needs confirmation</em>
        </div>

        <div className="mini-stat">
          <span>Last sync</span>
          <strong>2m</strong>
          <em>All channels current</em>
        </div>
      </div>

      <div className="panel">
        <div className="page-tabs">
          <button
            type="button"
            className={`tab ${tab === "verified" ? "active" : ""}`}
            onClick={() => setTab("verified")}
            data-testid="tab-verified"
          >
            Verified assets
          </button>

          <button
            type="button"
            className={`tab ${tab === "reports" ? "active" : ""}`}
            onClick={() => setTab("reports")}
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
              {reports.length}
            </span>
          </button>
        </div>

        {tab === "verified" ? (
          <div className="table-wrap">
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
                {[
                  [
                    "East pump station",
                    "Harbor East",
                    "Ready",
                    "6 min ago",
                    "Telemetry + crew",
                  ],
                  [
                    "Market underpass grate",
                    "Old Market",
                    "Restricted",
                    "14 min ago",
                    "Crew check",
                  ],
                  [
                    "Canal Junction gate 02",
                    "South canal",
                    "Ready",
                    "22 min ago",
                    "Remote telemetry",
                  ],
                  [
                    "Northbank outfall",
                    "Northbank",
                    "Ready",
                    "38 min ago",
                    "Crew check",
                  ],
                  [
                    "Pier 4 mobile pump",
                    "Harbor East",
                    "Staged",
                    "51 min ago",
                    "Crew check",
                  ],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td>
                      <strong>{row[0]}</strong>
                    </td>

                    <td>{row[1]}</td>

                    <td>
                      <RiskChip
                        risk={row[2] === "Restricted" ? "medium" : "low"}
                      >
                        {row[2]}
                      </RiskChip>
                    </td>

                    <td>{row[3]}</td>

                    <td>
                      <span className="source-label verified">
                        <FileCheck2
                          size={11}
                          style={{
                            verticalAlign: "middle",
                          }}
                        />{" "}
                        {row[4]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            {reports.map((item) => (
              <div className="report-card" key={item.id}>
                <div>
                  <strong>{item.location}</strong>

                  <p>{item.report}</p>

                  <div className="report-meta">
                    {item.source} · {item.time} · {item.status}
                  </div>
                </div>

                {item.status === "Verified by crew" ? (
                  <RiskChip risk="low">
                    <Check size={11} />
                    verified
                  </RiskChip>
                ) : (
                  officialUser && (
                    <button
                      className="button button-quiet button-small"
                      type="button"
                      onClick={() => verify(item.id)}
                      data-testid={`button-verify-${item.id}`}
                    >
                      <ClipboardCheck size={13} />
                      Mark verified
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ALERTS PAGE
========================================================= */

function AlertsPage({ acknowledged, setAcknowledged }) {
  const [selected, setSelected] = useState(ALERTS[0]);

  const isAck = acknowledged.includes(selected.id);

  return (
    <div className="page">
      <PageHeading
        eyebrow="Signal & forecast"
        title="Alerts and predictions"
        subtitle="A short operational timeline for the storm cell. Open an alert to see the recommended field action, then acknowledge it when someone owns the next step."
        action={
          <div className="risk-chip high">
            <AlertTriangle size={12} />1 urgent
          </div>
        }
      />

      <div className="alerts-layout">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Risk by zone</div>

              <h2>Next 12 hours</h2>
            </div>

            <span className="mono tiny muted">confidence band shown</span>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={TREND_DATA}
                margin={{
                  top: 8,
                  right: 8,
                  left: -20,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f07c3d" stopOpacity=".36" />

                    <stop offset="100%" stopColor="#f07c3d" stopOpacity=".03" />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="#d5e2df" strokeDasharray="3 3" />

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
                  dataKey="harbor"
                  name="Harbor East"
                  stroke="#bd4b46"
                  fill="url(#riskFill)"
                  strokeWidth={2}
                />

                <Area
                  type="monotone"
                  dataKey="market"
                  name="Old Market"
                  stroke="#c9991f"
                  fill="transparent"
                  strokeWidth={2}
                />

                <Area
                  type="monotone"
                  dataKey="junction"
                  name="Canal Junction"
                  stroke="#0d746d"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="timeline-list">
            {ALERTS.map((alert) => (
              <button
                key={alert.id}
                type="button"
                className={`timeline-item ${
                  selected.id === alert.id ? "selected" : ""
                }`}
                onClick={() => setSelected(alert)}
                data-testid={`button-alert-${alert.id}`}
              >
                <strong>
                  <i
                    className={`alert-severity ${alert.severity}`}
                    style={{
                      display: "inline-block",
                      marginRight: 7,
                    }}
                  />

                  {alert.title}
                </strong>

                <span>
                  {alert.zone} · {alert.time}
                </span>
              </button>
            ))}
          </div>
        </div>

        <aside className="panel alert-detail">
          <div className="panel-kicker">Alert detail</div>

          {selected ? (
            <>
              <div
                className="detail-head"
                style={{
                  marginTop: 7,
                }}
              >
                <div>
                  <strong>{selected.title}</strong>

                  <p>
                    {selected.zone} · reported {selected.time}
                  </p>
                </div>

                <RiskChip risk={selected.severity}>
                  {selected.severity}
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
                  {selected.body}
                </p>

                <div className="recommendation">
                  <strong>Suggested field action</strong>

                  <p>{selected.action}</p>
                </div>
              </div>

              <div className="detail-actions">
                {isAck ? (
                  <div
                    className="success-banner"
                    style={{
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    <CheckCircle2 size={15} />
                    Acknowledged by Mara Chen
                  </div>
                ) : (
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() =>
                      setAcknowledged((list) => [...list, selected.id])
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
              Select an alert to inspect its operational context.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* =========================================================
   OFFICIAL LOGIN
========================================================= */

function OfficialLogin({ onLogin }) {
  const [, setLocation] = useLocation();

  const [officialId, setOfficialId] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    /*
     * TEMPORARY FRONTEND DEMO AUTHENTICATION
     *
     * We will replace this with:
     *
     * POST /api/auth/login
     *
     * after the frontend flow is working.
     */

    window.setTimeout(() => {
      if (officialId === "OFF-001" && password === "FloodGuard123") {
        const user = {
          id: "OFF-001",
          name: "Mara Chen",
          role: "Duty coordinator",
          department: "City emergency management",
        };

        onLogin(user);

        setLoading(false);

        setLocation("/official");

        return;
      }

      setLoading(false);

      setError("Invalid official ID or password.");
    }, 500);
  };

  return (
    <div className="page">
      <div
        style={{
          maxWidth: "460px",
          margin: "70px auto",
        }}
      >
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Authorized access</div>

              <h2>Official sign in</h2>
            </div>

            <ShieldCheck size={22} color="var(--teal)" />
          </div>

          <p className="subtitle">
            Sign in with your authorized FloodGuard official account to access
            the official portal.
          </p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="official-login-id">Official ID</label>

              <input
                id="official-login-id"
                className="text-input"
                type="text"
                value={officialId}
                onChange={(event) => setOfficialId(event.target.value)}
                placeholder="Enter official ID"
                autoComplete="username"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="official-login-password">Password</label>

              <input
                id="official-login-password"
                className="text-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="recommendation">
                <strong>Sign in failed</strong>

                <p>{error}</p>
              </div>
            )}

            <button
              className="button button-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  Sign in
                </>
              )}
            </button>

            <div className="form-help">Authorized officials only.</div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   OFFICIAL PROFILE
========================================================= */

function ProfilePage({ officialUser }) {
  if (!officialUser) {
    return null;
  }

  const initials = officialUser.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="page">
      <PageHeading
        eyebrow="Account"
        title="Official profile"
        subtitle="Authenticated FloodGuard official account details."
        action={
          <div className="risk-chip low">
            <ShieldCheck size={12} />
            Authenticated
          </div>
        }
      />

      <div
        style={{
          maxWidth: "760px",
        }}
      >
        <div className="panel">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              marginBottom: "28px",
            }}
          >
            <div
              className="avatar"
              style={{
                width: "58px",
                height: "58px",
                fontSize: "18px",
              }}
            >
              {initials}
            </div>

            <div>
              <div className="panel-kicker">Official account</div>

              <h2
                style={{
                  marginBottom: "4px",
                }}
              >
                {officialUser.name}
              </h2>

              <p
                className="subtitle"
                style={{
                  margin: 0,
                }}
              >
                {officialUser.role}
              </p>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Official ID</label>

              <div className="text-input">{officialUser.id}</div>
            </div>

            <div className="field">
              <label>Role</label>

              <div className="text-input">{officialUser.role}</div>
            </div>

            <div className="field full">
              <label>Department</label>

              <div className="text-input">{officialUser.department}</div>
            </div>
          </div>

          <div
            className="recommendation"
            style={{
              marginTop: "22px",
            }}
          >
            <strong>Authority scope</strong>

            <p>
              This account can access the official portal and publish verified
              flood posture updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   OFFICIAL PORTAL
========================================================= */

function OfficialPage({ officialUser }) {
  const [form, setForm] = useState({
    zone: "Harbor East",
    level: "Warning",
    note: "Water levels continue to rise near Pier 4. Drainage crew is being staged.",
  });

  const [step, setStep] = useState("edit");

  const [audit, setAudit] = useState([
    {
      action: "Risk posture reviewed",
      who: "Mara Chen",
      when: "Today · 15:58",
    },
    {
      action: "Crew dispatch confirmed",
      who: "Luis Ortega",
      when: "Today · 15:41",
    },
    {
      action: "Public report triaged",
      who: "Mara Chen",
      when: "Today · 15:19",
    },
  ]);

  const update = (key, value) => {
    setForm((f) => ({
      ...f,
      [key]: value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    setStep("confirm");
  };

  const publish = () => {
    setStep("success");

    setAudit((items) => [
      {
        action: `Official posture set to ${form.level}`,
        who: officialUser?.name || "Official",
        when: "Just now",
      },
      ...items,
    ]);
  };

  return (
    <div className="page">
      <PageHeading
        eyebrow="Authorized access"
        title="Official portal"
        subtitle="Publish a verified zone update for partner agencies. Every change is previewed before it becomes part of the operational record."
        action={
          <div className="risk-chip low">
            <ShieldCheck size={12} />
            Authorized session
          </div>
        }
      />

      <div className="official-layout">
        <section className="panel official-form">
          {step === "success" && (
            <div className="success-banner">
              <CheckCircle2 size={17} />
              Update published. The operational record and partner feed now show
              the new posture.
            </div>
          )}

          {step === "confirm" && (
            <div className="confirm-card">
              <strong>Review before publishing</strong>

              <p>
                You are about to set <b>{form.zone}</b> to <b>{form.level}</b>.
                This will be visible to partner agencies as an official update.
              </p>

              <div className="detail-actions">
                <button
                  className="button button-primary button-small"
                  type="button"
                  onClick={publish}
                  data-testid="button-confirm-publish"
                >
                  <Send size={13} />
                  Confirm & publish
                </button>

                <button
                  className="button button-quiet button-small"
                  type="button"
                  onClick={() => setStep("edit")}
                  data-testid="button-edit-update"
                >
                  <X size={13} />
                  Go back
                </button>
              </div>
            </div>
          )}

          {step !== "success" && (
            <form onSubmit={submit}>
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">New official update</div>

                  <h2>Set the public posture</h2>
                </div>

                <MessageSquareWarning size={20} color="var(--orange)" />
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="official-zone">Zone</label>

                  <select
                    id="official-zone"
                    className="select"
                    value={form.zone}
                    onChange={(e) => update("zone", e.target.value)}
                    data-testid="select-official-zone"
                  >
                    {ZONES.map((zone) => (
                      <option key={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="official-level">Posture</label>

                  <select
                    id="official-level"
                    className="select"
                    value={form.level}
                    onChange={(e) => update("level", e.target.value)}
                    data-testid="select-official-level"
                  >
                    <option>Monitor</option>

                    <option>Advisory</option>

                    <option>Warning</option>

                    <option>Evacuation preparation</option>
                  </select>
                </div>

                <div className="field full">
                  <label htmlFor="official-note">Operator note</label>

                  <textarea
                    id="official-note"
                    className="text-input textarea"
                    value={form.note}
                    onChange={(e) => update("note", e.target.value)}
                    data-testid="input-official-note"
                  />
                </div>

                <label className="check-row full">
                  <input
                    type="checkbox"
                    required
                    data-testid="checkbox-official-review"
                  />
                  I have reviewed the latest gauge reading and field status for
                  this zone.
                </label>
              </div>

              <div className="form-actions">
                <button
                  className="button button-primary"
                  type="submit"
                  data-testid="button-preview-update"
                >
                  <FileCheck2 size={14} />
                  Preview official update
                </button>

                <button
                  className="button button-quiet"
                  type="button"
                  onClick={() => {
                    setForm({
                      zone: "Harbor East",
                      level: "Warning",
                      note: "Water levels continue to rise near Pier 4. Drainage crew is being staged.",
                    });

                    setStep("edit");
                  }}
                  data-testid="button-reset-official"
                >
                  Clear
                </button>
              </div>
            </form>
          )}
        </section>

        <aside className="panel audit-panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Chain of custody</div>

              <h2>Audit log</h2>
            </div>

            <ClipboardCheck size={18} color="var(--teal)" />
          </div>

          <div className="audit-list">
            {audit.map((item, index) => (
              <div className="audit-item" key={`${item.action}-${index}`}>
                <i className="audit-dot" />

                <div>
                  <strong>{item.action}</strong>

                  <span>
                    {item.who} · {item.when}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="recommendation"
            style={{
              marginTop: 16,
              background: "var(--teal-pale)",
              borderColor: "#acd6c8",
            }}
          >
            <strong
              style={{
                color: "var(--teal)",
              }}
            >
              Authority scope
            </strong>

            <p>City emergency management · Flood posture updates only</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* =========================================================
   NOT FOUND
========================================================= */

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

<<<<<<< HEAD
function RouterView({ selectedZone, setSelectedZone, acknowledged, setAcknowledged }) {
  return <Switch>
    <Route path="/"><Dashboard setSelectedZone={setSelectedZone} /></Route>
    <Route path="/map"><MapPage selectedZone={selectedZone} setSelectedZone={setSelectedZone} /></Route>
    <Route path="/rainfall-radar"><RainfallRadarPage /></Route>
    <Route path="/analysis"><AnalysisPage /></Route>
    <Route path="/drainage"><DrainagePage /></Route>
    <Route path="/alerts"><AlertsPage acknowledged={acknowledged} setAcknowledged={setAcknowledged} /></Route>
    <Route path="/official"><OfficialPage /></Route>
    <Route><NotFound /></Route>
  </Switch>;
=======
/* =========================================================
   REDIRECT UNAUTHENTICATED USERS
========================================================= */

function RedirectToLogin() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/official-login");
  }, [setLocation]);

  return null;
>>>>>>> 84b9c39 (added login page and removed unnecessary buttons)
}

/* =========================================================
   ROUTER
========================================================= */

function RouterView({
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
        <Dashboard setSelectedZone={setSelectedZone} />
      </Route>

      <Route path="/map">
        <MapPage
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
        />
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

      {/* LOGIN PAGE */}
      <Route path="/official-login">
        {officialUser ? (
          <RedirectToOfficial />
        ) : (
          <OfficialLogin onLogin={onLogin} />
        )}
      </Route>

      {/* PROTECTED OFFICIAL PORTAL */}
      <Route path="/official">
        {officialUser ? (
          <OfficialPage officialUser={officialUser} />
        ) : (
          <RedirectToLogin />
        )}
      </Route>

      {/* PROTECTED PROFILE */}
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

/* =========================================================
   REDIRECT LOGGED-IN USER AWAY FROM LOGIN
========================================================= */

function RedirectToOfficial() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/official");
  }, [setLocation]);

  return null;
}

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

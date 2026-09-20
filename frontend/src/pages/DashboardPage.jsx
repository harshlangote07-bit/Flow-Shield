import { useState } from "react";
import { Activity, AlertTriangle, ArrowRight, Bell, Check, CheckCircle2, Droplets, SlidersHorizontal, Waves } from "lucide-react";
import { Link, useLocation } from "wouter";

import PageHeading from "../components/PageHeading";
import RiskChip from "../components/RiskChip";
import MapCanvas from "../components/MapCanvas";
import { ZONES, ALERTS } from "../data/mockData";

/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardPage({ setSelectedZone }) {
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

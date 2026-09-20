import { useState } from "react";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
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
import { ALERTS, TREND_DATA } from "../data/mockData";

/* =========================================================
   ALERTS PAGE
========================================================= */

export default function AlertsPage({
  acknowledged,
  setAcknowledged,
}) {
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
                className={`timeline-item ${selected.id === alert.id ? "selected" : ""
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

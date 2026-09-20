import { useState } from "react";

import {
  Check,
  ClipboardCheck,
  FileCheck2,
  MessageSquareWarning,
  RefreshCw,
} from "lucide-react";

import PageHeading from "../components/PageHeading";
import RiskChip from "../components/RiskChip";


/* =========================================================
   DRAINAGE PAGE
========================================================= */

export default function DrainagePage({ officialUser }) {
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

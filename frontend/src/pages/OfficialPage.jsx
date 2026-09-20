import { useState } from "react";

import {
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  MessageSquareWarning,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

import PageHeading from "../components/PageHeading";
import { ZONES } from "../data/mockData";

/* =========================================================
   OFFICIAL PORTAL
========================================================= */

export default function OfficialPage({ officialUser }) {
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

import { ShieldCheck } from "lucide-react";

import PageHeading from "../components/PageHeading";

/* =========================================================
   OFFICIAL PROFILE
========================================================= */

export default function ProfilePage({ officialUser }) {
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

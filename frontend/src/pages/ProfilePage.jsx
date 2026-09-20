import { ShieldCheck } from "lucide-react";

import PageHeading from "../components/PageHeading";

/* =========================================================
   OFFICIAL PROFILE
========================================================= */

export default function ProfilePage({ officialUser }) {
  if (!officialUser) {
    return null;
  }

  const displayName =
    officialUser.name ||
    officialUser.email ||
    "Official";

  const initials =
    displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const officialId =
    officialUser.userId ||
    officialUser.id ||
    "Not available";

  const role =
    officialUser.role || "Official";

  const department =
    officialUser.department ||
    "Not specified";

  const email =
    officialUser.email ||
    "Not available";

  const assignedAreas =
    Array.isArray(
      officialUser.assignedAreas,
    )
      ? officialUser.assignedAreas
      : [];

  return (
    <div className="page">
      <PageHeading
        eyebrow="Account"
        title="Official profile"
        subtitle="Authenticated Flow Shield official account details."
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
          {/* =================================================
              IDENTITY
          ================================================= */}

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
              <div className="panel-kicker">
                Official account
              </div>

              <h2
                style={{
                  marginBottom: "4px",
                }}
              >
                {displayName}
              </h2>

              <p
                className="subtitle"
                style={{
                  margin: 0,
                }}
              >
                {role}
              </p>
            </div>
          </div>

          {/* =================================================
              ACCOUNT DETAILS
          ================================================= */}

          <div className="form-grid">
            <div className="field">
              <label>Official ID</label>

              <div className="text-input">
                {officialId}
              </div>
            </div>

            <div className="field">
              <label>Role</label>

              <div className="text-input">
                {role}
              </div>
            </div>

            <div className="field">
              <label>Email</label>

              <div className="text-input">
                {email}
              </div>
            </div>

            <div className="field">
              <label>Department</label>

              <div className="text-input">
                {department}
              </div>
            </div>
          </div>

          {/* =================================================
              ASSIGNED AREAS
          ================================================= */}

          <div
            className="recommendation"
            style={{
              marginTop: "22px",
            }}
          >
            <strong>
              Assigned areas
            </strong>

            {assignedAreas.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "10px",
                }}
              >
                {assignedAreas.map(
                  (area) => (
                    <span
                      key={area}
                      className="risk-chip low"
                    >
                      {area}
                    </span>
                  ),
                )}
              </div>
            ) : (
              <p>
                No specific area assignments are
                currently stored for this account.
              </p>
            )}
          </div>

          {/* =================================================
              AUTHORITY
          ================================================= */}

          <div
            className="recommendation"
            style={{
              marginTop: "14px",
            }}
          >
            <strong>
              Authority scope
            </strong>

            <p>
              This authenticated account can access
              the official portal and perform
              authorized operational updates according
              to its backend role and area assignment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
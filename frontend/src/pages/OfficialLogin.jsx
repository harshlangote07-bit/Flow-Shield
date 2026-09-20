import { useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";


/* =========================================================
   OFFICIAL LOGIN
========================================================= */

export default function OfficialLogin({ onLogin }) {
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

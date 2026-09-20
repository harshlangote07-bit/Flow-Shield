import { useState } from "react";

import {
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { useLocation } from "wouter";

import { loginOfficial } from "../services/api";

/* =========================================================
   OFFICIAL LOGIN
========================================================= */

export default function OfficialLogin({ onLogin }) {
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState(
    "official@flowshield.com",
  );

  const [password, setPassword] =
    useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response =
        await loginOfficial(
          email,
          password,
        );

      const token = response?.token;
      const user = response?.user;

      if (!token || !user) {
        throw new Error(
          "Login response did not contain a valid official session.",
        );
      }

      localStorage.setItem(
        "flowshield_official_token",
        token,
      );

      localStorage.setItem(
        "flowshield_official_user",
        JSON.stringify(user),
      );

      onLogin({
        ...user,
        token,
      });

      setLocation("/official");
    } catch (requestError) {
      console.error(
        "Official login error:",
        requestError,
      );

      setError(
        requestError?.message ||
          "Invalid email or password.",
      );
    } finally {
      setLoading(false);
    }
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
              <div className="panel-kicker">
                Authorized access
              </div>

              <h2>Official sign in</h2>
            </div>

            <ShieldCheck
              size={22}
              color="var(--teal)"
            />
          </div>

          <p className="subtitle">
            Sign in with your authorized Flow Shield
            official account to access the operational
            portal.
          </p>

          <form
            className="form-stack"
            onSubmit={handleSubmit}
          >
            <div className="field">
              <label htmlFor="official-login-email">
                Official email
              </label>

              <input
                id="official-login-email"
                className="text-input"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="official@flowshield.com"
                autoComplete="username"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="official-login-password">
                Password
              </label>

              <input
                id="official-login-password"
                className="text-input"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="recommendation">
                <strong>
                  Sign in failed
                </strong>

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
                  <RefreshCw
                    size={14}
                    className="spin"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  Sign in
                </>
              )}
            </button>

            <div className="form-help">
              Authorized officials only.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
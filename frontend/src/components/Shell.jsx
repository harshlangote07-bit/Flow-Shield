import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

import {
  Bell,
  CircleGauge,
  ChevronRight,
  Droplets,
  Map,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  User,
} from "lucide-react";

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

export default function Shell({ children, officialUser, onLogout }) {
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
                  : NAV.find((n) => n.href === location)?.label ||
                    "FloodGuard"}
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
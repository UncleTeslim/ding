import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../api/client";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function AppShell() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.me()
      .then(() => setChecking(false))
      .catch((err) => {
        if (isUnauthorized(err)) navigate("/login");
        else setChecking(false);
      });
  }, [navigate]);

  async function logout() {
    await api.logout().catch(() => {});
    navigate("/login");
  }

  if (checking) return <div className="empty">Loading...</div>;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo showWordmark />
        </div>

        <div className="workspace-switcher" aria-label="Current workspace">
          <span className="workspace-avatar">A</span>
          <span>
            <strong>Acme workspace</strong>
            <small>Production</small>
          </span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6.5 8 3.5 3.5L13.5 8" /></svg>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-label">Workspace</span>
          <NavLink to="/" end>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z" /></svg>
            Overview
          </NavLink>
          <NavLink to="/new">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Compose
          </NavLink>
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-actions">
            <ThemeToggle />
            <button className="sidebar-logout" onClick={logout}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4m6-4 4-4-4-4m4 4H9" /></svg>
              Log out
            </button>
          </div>
          <div className="user-card">
            <span className="user-avatar">AD</span>
            <span><strong>Admin</strong><small>Workspace owner</small></span>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="mobile-topbar">
          <Logo showWordmark />
          <div className="mobile-actions">
            <NavLink className="mobile-compose" to="/new">Compose</NavLink>
            <ThemeToggle />
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}

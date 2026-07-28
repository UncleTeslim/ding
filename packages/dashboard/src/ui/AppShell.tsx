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
      <header className="topbar">
        <Logo showWordmark />
        <nav className="nav">
          <NavLink to="/" end>Announcements</NavLink>
          <NavLink to="/new">Compose</NavLink>
        </nav>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ThemeToggle />
          <button className="ghost small" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

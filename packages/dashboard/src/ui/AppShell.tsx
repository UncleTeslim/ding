import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Logo } from "./Logo";

export function AppShell() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.listAnnouncements()
      .then(() => setChecking(false))
      .catch(() => navigate("/login"));
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
        <button className="ghost small" onClick={logout}>Log out</button>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../api/client";
import { Logo } from "./Logo";

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    api.me().then((user) => { setUsername(user.username); setChecking(false); })
      .catch((err) => { if (isUnauthorized(err)) navigate("/login"); else { setError("Could not verify your session. Refresh to try again."); setChecking(false); } });
  }, [navigate]);

  async function logout() {
    setLoggingOut(true);
    try { await api.logout(); navigate("/login"); }
    catch (err) { if (isUnauthorized(err)) navigate("/login"); else setError("Log out failed. Please try again."); }
    finally { setLoggingOut(false); }
  }

  if (checking) return <div className="empty" role="status">Loading your workspace…</div>;
  if (!username) return <div className="empty" role="alert">{error}</div>;
  const page = location.pathname === "/new" ? "New announcement" : location.pathname.startsWith("/edit/") ? "Edit announcement" : location.pathname === "/install" ? "Widget setup" : "Overview";
  return (
    <div className="app">
      <a className="dashboard-skip" href="#workspace-content">Skip to content</a>
      <aside className="sidebar">
        <Link className="sidebar-brand" to="/" aria-label="Ding overview"><Logo showWordmark /><span className="edition-badge">Community</span></Link>
        <div className="workspace-identity"><span className="workspace-avatar">D</span><div><strong>Your workspace</strong><span>Self-hosted Ding</span></div></div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-label">Publish</span>
          <NavLink to="/" end><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>Overview</NavLink>
          <Link to="/#announcements" onClick={() => { if (location.pathname === "/") document.getElementById("announcements")?.scrollIntoView(); }}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>Announcements</Link>
          <NavLink to="/new"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5 5 5M4 20l5-1L20 8l-4-4L5 15l-1 5Z" /></svg>Write an update</NavLink>
          <span className="nav-label nav-label-spaced">Connect</span>
          <NavLink to="/install"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16" /></svg>Widget setup</NavLink>
          <a href="https://dingwidget.com/docs/" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v15M3 4l9 1 9-1v15l-9 1-9-1V4Z" /></svg>Documentation <span className="external-arrow">↗</span></a>
        </nav>
        <div className="sidebar-hint"><span aria-hidden="true">↗</span><strong>A little update goes a long way.</strong><p>Tell your users what changed and why it matters.</p><Link to="/new">Write something useful →</Link></div>
        <div className="sidebar-foot"><div className="account-row"><span className="account-avatar">{username.slice(0, 1).toUpperCase()}</span><div><strong>{username}</strong><span>Administrator</span></div><button className="sidebar-logout" onClick={logout} disabled={loggingOut} aria-label="Log out"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4m6-4 4-4-4-4m4 4H9" /></svg></button></div></div>
      </aside>
      <div className="app-main">
        <header className="workspace-topbar"><div className="breadcrumb"><Link to="/">Workspace</Link><span>/</span><strong>{page}</strong></div><a href="https://github.com/UncleTeslim/ding/issues" target="_blank" rel="noreferrer">Feedback <span>↗</span></a></header>
        <header className="mobile-topbar"><Link to="/" aria-label="Ding overview"><Logo showWordmark /></Link><div className="mobile-actions"><NavLink to="/install">Setup</NavLink><NavLink className="mobile-compose" to="/new">Compose</NavLink><button className="mobile-logout" onClick={logout} disabled={loggingOut}>Log out</button></div></header>
        <main className="content" id="workspace-content">{error ? <div className="error" role="alert">{error}</div> : null}<Outlet /></main>
      </div>
    </div>
  );
}

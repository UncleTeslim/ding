import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../api/client";

import type { Announcement, DailyPoint } from "../types";
import { formatShortDate, parseTimestamp } from "../utils/date";

function relativeTime(value: string | null): string {
  if (!value) return "-";
  const diff = Date.now() - parseTimestamp(value).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 30) return formatShortDate(value);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

type Filter = "all" | "published" | "draft";

function ArrowUpRight() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5m-7 0h7v7" /></svg>;
}

function MoreIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="4" cy="10" r="1" /><circle cx="10" cy="10" r="1" /><circle cx="16" cy="10" r="1" /></svg>;
}

export function Announcements() {
  const navigate = useNavigate();
  const location = useLocation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [activity, setActivity] = useState<"views" | "clicks">("views");
  const [analyticsError, setAnalyticsError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    setAnalyticsError(false);
    try {
      const [res, dailyRes] = await Promise.all([
        api.listAnnouncements(),
        api.dailyAnalytics().catch((err) => {
          if (isUnauthorized(err)) throw err;
          setAnalyticsError(true);
          return { daily: [] as DailyPoint[] };
        })
      ]);
      setAnnouncements(res.announcements);
      setDaily(dailyRes.daily);
    } catch (err) {
      if (isUnauthorized(err)) navigate("/login");
      else setError(err instanceof Error ? err.message : "Could not load announcements");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!loading && location.hash === "#announcements") {
      document.getElementById("announcements")?.scrollIntoView();
    }
  }, [loading, location.hash]);

  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      if (isUnauthorized(err)) navigate("/login");
      else setError(err instanceof Error ? err.message : "Could not save your change. Try again.");
    } finally { setBusy(false); }
  }

  async function toggle(announcement: Announcement) {
    const status = announcement.status === "published" ? "draft" : "published";
    await mutate(() => api.updateAnnouncement(announcement.id, { status, published_at: status === "published" ? new Date().toISOString() : announcement.published_at }));
  }

  async function remove(announcement: Announcement) {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    await mutate(() => api.deleteAnnouncement(announcement.id));
  }

  async function bulkRemove() {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} selected announcement(s)? This cannot be undone.`)) return;
    await mutate(() => api.bulkDelete([...selectedIds]));
  }

  async function clearAnalytics() {
    if (!confirm("Clear all analytics? View and click counts will be reset to zero. This cannot be undone.")) return;
    await mutate(() => api.clearAnalytics());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const published = announcements.filter((a) => a.status === "published").length;
  const totalViews = announcements.reduce((sum, a) => sum + a.analytics.views, 0);
  const totalClicks = announcements.reduce((sum, a) => sum + a.analytics.clicks, 0);
  const overallCtr = totalViews ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;
  const drafts = announcements.filter((a) => a.status === "draft").sort((a, b) => parseTimestamp(b.updated_at).getTime() - parseTimestamp(a.updated_at).getTime());
  const chartMax = Math.max(...daily.map((p) => p[activity]), 2);
  const weekViews = daily.reduce((sum, p) => sum + p.views, 0);
  const weekClicks = daily.reduce((sum, p) => sum + p.clicks, 0);
  const topAnnouncement = [...announcements]
    .filter((a) => a.status === "published" && a.analytics.views > 0)
    .sort((a, b) => b.analytics.views - a.analytics.views)[0];

  const filteredAnnouncements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return announcements.filter((a) => {
      const matchesFilter = filter === "all" || a.status === filter;
      const matchesQuery = !normalizedQuery || `${a.title} ${a.body} ${a.tag ?? ""}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [announcements, filter, query]);

  return (
    <section className="dashboard-page">
      <div className="page-header dashboard-header">
        <div><span className="eyebrow">Your publishing workspace</span><h1>Keep your users in the loop.</h1><p>Every release has a story. Make sure yours gets heard.</p></div>
        <Link className="primary link-button header-cta" to="/new"><span aria-hidden="true">+</span> New announcement</Link>
      </div>

      {error ? <div className="error" role="alert">{error} <button className="text-button" onClick={load}>Try again</button></div> : null}
      {loading ? <div className="loading-workspace" role="status"><span className="loading-line" /><h2>Loading your workspace</h2><p>Fetching announcements and reader activity.</p></div> : !error || announcements.length > 0 ? <>
      <div className="workspace-summary" aria-label="Publishing summary">
        <span><i className="live-indicator" /><strong>{published}</strong> published</span>
        <span><i className="draft-indicator" /><strong>{drafts.length}</strong> in drafts</span>
        <span className="summary-context">Your self-hosted workspace</span>
      </div>
      <div className="overview-layout">
        <section className="reach-panel" aria-labelledby="reach-title">
          <div className="reach-heading"><div><h2 id="reach-title">Reader activity</h2><p>Daily reach across your announcements</p></div><span className="period-chip">Last 7 days · UTC</span></div>
          <div className="reach-metrics">
            <button className={activity === "views" ? "reach-metric selected" : "reach-metric"} aria-pressed={activity === "views"} onClick={() => setActivity("views")}><span>Daily readers</span><strong>{analyticsError ? "—" : weekViews.toLocaleString()}</strong><small>Summed across 7 days</small></button>
            <button className={activity === "clicks" ? "reach-metric selected" : "reach-metric"} aria-pressed={activity === "clicks"} onClick={() => setActivity("clicks")}><span>Daily engaged readers</span><strong>{analyticsError ? "—" : weekClicks.toLocaleString()}</strong><small>Expanded an update</small></button>
            <div className="reach-metric lifetime"><span>Click-through rate</span><strong>{totalViews ? `${overallCtr}%` : "—"}</strong><small>All retained events</small></div>
          </div>
          {analyticsError ? <div className="activity-unavailable" role="status"><strong>Reader activity couldn't load.</strong><p>Your announcements are still available.</p><button className="text-button" onClick={load}>Retry activity</button></div> : <>
            <div className="activity-chart" aria-label={activity === "views" ? "Daily readers over the last seven days" : "Daily engaged readers over the last seven days"}>
              <div className="chart-grid" aria-hidden="true"><span>{chartMax}</span><span>{Math.round(chartMax / 2)}</span><span>0</span></div>
              <div className="chart-bars">{daily.map((point) => <div className="chart-day" key={point.date}>
                <div className="chart-track"><div className="activity-bar" style={{ height: `${point[activity] / chartMax * 100}%` }}><span>{point[activity]}</span></div></div>
                <span>{new Date(`${point.date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}</span>
              </div>)}</div>
              {!daily.some((point) => point[activity] > 0) ? <div className="chart-zero">{activity === "views" ? "Your next reader starts the story." : "No expanded updates in this period."}</div> : null}
            </div>
            <details className="metric-explanation"><summary>How is activity counted?</summary><p>Each day counts distinct hashed IP addresses across announcements, using UTC dates. The total adds daily counts; it is not unique people across the week. Clicks are “Read more” expansions. CTR uses all retained per-announcement events.</p><table><caption>Daily activity (UTC)</caption><thead><tr><th scope="col">Date</th><th scope="col">Readers</th><th scope="col">Engaged</th></tr></thead><tbody>{daily.map((p) => <tr key={p.date}><th scope="row">{p.date}</th><td>{p.views}</td><td>{p.clicks}</td></tr>)}</tbody></table></details>
          </>}
        </section>
        <aside className="publishing-rail">
          <section className="draft-queue"><div className="rail-heading"><h2>Up next</h2><span>{drafts.length} drafts</span></div>{drafts.length ? <div className="draft-items">{drafts.slice(0, 3).map((draft) => <Link key={draft.id} to={`/edit/${draft.id}`}><span className="draft-symbol" aria-hidden="true">▤</span><span><strong>{draft.title}</strong><small>Edited {relativeTime(draft.updated_at)}</small></span><ArrowUpRight /></Link>)}</div> : <div className="queue-empty"><span aria-hidden="true">↗</span><h3>Room for your next idea.</h3><p>Save a draft now. Share it when it's ready.</p><Link to="/new">Write an announcement →</Link></div>}{drafts.length ? <button className="queue-link" onClick={() => { setFilter("draft"); document.getElementById("announcements")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }}>View all drafts →</button> : null}</section>
          <section className="reader-favorite"><span className="eyebrow">Most viewed · retained history</span>{topAnnouncement ? <><h3>{topAnnouncement.title}</h3><p><strong>{topAnnouncement.analytics.views.toLocaleString()}</strong> views <span>·</span> {topAnnouncement.analytics.ctr.toFixed(1)}% CTR</p><Link to={`/edit/${topAnnouncement.id}`}>Open announcement <ArrowUpRight /></Link></> : <><h3>Good updates find their people.</h3><p>Your most-viewed published update will appear here.</p><Link to="/install">Connect your widget <ArrowUpRight /></Link></>}</section>
        </aside>
      </div>
      {!announcements.length ? <div className="empty empty-dashboard" id="announcements"><span className="empty-bell" aria-hidden="true">↗</span><h2>What should your users know?</h2><p>Write your first announcement, preview it, then publish it to your app.</p><Link className="primary link-button" to="/new">Write your first announcement</Link><Link className="empty-install" to="/install">Need to connect your app? Get the embed code →</Link></div> : null}
      </> : null}

      {!loading && announcements.length ? (
        <section className="announcements-section" id="announcements">
          <div className="section-heading">
            <div><h2>Announcements</h2><span>{announcements.length} total</span></div>
            <div className="announcement-tools">
              <label className="search-box">
                <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
                <span className="sr-only">Search announcements</span>
                <input value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIds(new Set()); }} placeholder="Search updates" />
              </label>
              <div className="filter-tabs" aria-label="Filter announcements">
                {(["all", "published", "draft"] as Filter[]).map((item) => (
                  <button key={item} className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => { setFilter(item); setSelectedIds(new Set()); }}>{item === "all" ? "All" : item === "draft" ? "Drafts" : "Published"}</button>
                ))}
              </div>
            </div>
          </div>

          {selectedIds.size > 0 ? (
            <div className="bulk-bar" role="region" aria-label="Bulk actions">
              <span className="bulk-count">{selectedIds.size} selected</span>
              <button className="danger-text" onClick={bulkRemove} disabled={busy}>Delete selected</button>
            </div>
          ) : null}

          <div className="announcement-list surface">
            <div className="list-head">
              <label className="select-all"><input type="checkbox" aria-label="Select all announcements" onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredAnnouncements.map((a) => a.id)) : new Set())} checked={filteredAnnouncements.length > 0 && filteredAnnouncements.every((a) => selectedIds.has(a.id))} /><span>Update</span></label>
              <span>Engagement</span><span>Published</span><span className="sr-only">Actions</span>
            </div>
            {filteredAnnouncements.length ? filteredAnnouncements.map((announcement) => (
              <article key={announcement.id} className="announcement-row" onClick={() => navigate(`/edit/${announcement.id}`)}>
                <div className="announcement-main">
                  <input aria-label={`Select ${announcement.title}`} type="checkbox" checked={selectedIds.has(announcement.id)} onChange={() => toggleSelected(announcement.id)} onClick={(e) => e.stopPropagation()} />
                  <span className={`announcement-marker ${announcement.status}`} />
                  <div>
                    <div className="announcement-title-line">
                      <Link to={`/edit/${announcement.id}`} className="announcement-title" onClick={(e) => e.stopPropagation()}>{announcement.title}</Link>
                      <span className={`status ${announcement.status}`}>{announcement.status}</span>
                      {announcement.tag ? <span className="tag-chip">{announcement.tag}</span> : null}
                    </div>
                    <p>{announcement.body.slice(0, 120)}{announcement.body.length > 120 ? "…" : ""}</p>
                  </div>
                </div>
                <div className="engagement-cell">
                  <strong>{announcement.analytics.views.toLocaleString()}</strong>
                  <span>{announcement.analytics.views ? `${announcement.analytics.views} views · ${announcement.analytics.clicks.toLocaleString()} clicks · ${announcement.analytics.ctr.toFixed(1)}% CTR` : "No views yet"}</span>
                </div>
                <div className="date-cell" title={formatShortDate(announcement.published_at)}>
                  <strong>{relativeTime(announcement.published_at)}</strong>
                  <span>{announcement.status === "published" ? "Live" : "Not published"}</span>
                </div>
                <details className="row-menu" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.currentTarget.open = false;
                    e.currentTarget.querySelector("summary")?.focus();
                  }
                }}>
                  <summary aria-label={`Actions for ${announcement.title}`}><MoreIcon /></summary>
                  <div>
                    <Link to={`/edit/${announcement.id}`}>Edit</Link>
                    <button onClick={() => toggle(announcement)} disabled={busy}>{announcement.status === "published" ? "Unpublish" : "Publish"}</button>
                    <button className="danger-text" onClick={() => remove(announcement)} disabled={busy}>Delete</button>
                  </div>
                </details>
              </article>
            )) : (
              <div className="no-results"><strong>No updates found</strong><span>Try another search or status filter.</span><button onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button></div>
            )}
          </div>
          <div className="list-footer"><span>Showing {filteredAnnouncements.length} of {announcements.length} announcements</span><details className="analytics-tools"><summary>Analytics options</summary><button className="danger-text" disabled={busy || (!totalViews && !totalClicks)} onClick={clearAnalytics}>Clear all analytics</button></details></div>
        </section>
      ) : null}
    </section>
  );
}

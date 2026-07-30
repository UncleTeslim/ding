import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../api/client";
import { useCountUp } from "../hooks/useCountUp";
import { Sparkline } from "../ui/Sparkline";
import type { Announcement, DailyPoint } from "../types";
import { formatShortDate } from "../utils/date";

function relativeTime(value: string | null): string {
  if (!value) return "-";
  const diff = Date.now() - new Date(value).getTime();
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [res, dailyRes] = await Promise.all([
        api.listAnnouncements(),
        api.dailyAnalytics().catch(() => ({ daily: [] as DailyPoint[] }))
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

  async function toggle(announcement: Announcement) {
    const status = announcement.status === "published" ? "draft" : "published";
    await api.updateAnnouncement(announcement.id, { status, published_at: status === "published" ? new Date().toISOString() : announcement.published_at });
    await load();
  }

  async function remove(announcement: Announcement) {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    await api.deleteAnnouncement(announcement.id);
    await load();
  }

  async function bulkRemove() {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} announcement${selectedIds.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    await api.bulkDelete([...selectedIds]);
    setSelectedIds(new Set());
    await load();
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const published = announcements.filter((announcement) => announcement.status === "published").length;
  const drafts = announcements.length - published;
  const totalViews = announcements.reduce((sum, announcement) => sum + announcement.analytics.views, 0);
  const totalClicks = announcements.reduce((sum, announcement) => sum + announcement.analytics.clicks, 0);
  const overallCtr = totalViews ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

  const animatedPublished = useCountUp(published);
  const animatedDrafts = useCountUp(drafts);
  const viewSeries = daily.map((point) => point.views);
  const weekViews = daily.reduce((sum, point) => sum + point.views, 0);
  const weekClicks = daily.reduce((sum, point) => sum + point.clicks, 0);
  const topAnnouncement = [...announcements]
    .filter((announcement) => announcement.status === "published")
    .sort((a, b) => b.analytics.views - a.analytics.views)[0];
  const filteredAnnouncements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return announcements.filter((announcement) => {
      const matchesFilter = filter === "all" || announcement.status === filter;
      const matchesQuery = !normalizedQuery || `${announcement.title} ${announcement.body} ${announcement.tag ?? ""}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [announcements, filter, query]);

  return (
    <section className="dashboard-page">
      <div className="page-header dashboard-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Your changelog, at a glance.</h1>
          <p>See what is resonating and keep your next update moving.</p>
        </div>
        <Link className="primary link-button header-cta" to="/new">
          <span>New announcement</span>
          <ArrowUpRight />
        </Link>
      </div>

      <div className="signal-grid">
        <article className="signal-card">
          <div className="signal-topline">
            <div>
              <span className="signal-kicker"><i /> Live signal</span>
              <h2>Reach this week</h2>
            </div>
            <span className="signal-period">Last 7 days</span>
          </div>
          <div className="signal-total">
            <strong>{weekViews.toLocaleString()}</strong>
            <span>views across your changelog</span>
          </div>
          <div className="signal-chart" aria-label={`${weekViews} views over the last 7 days`}>
            {viewSeries.length > 1 && weekViews > 0 ? <Sparkline data={viewSeries} width={560} height={104} /> : (
              <div className="chart-placeholder"><span>Activity will appear here as readers discover your updates.</span></div>
            )}
          </div>
          <div className="signal-footer">
            <span><small>Interactions</small><strong>{weekClicks.toLocaleString()}</strong></span>
            <span><small>Overall click rate</small><strong>{totalViews ? `${overallCtr}%` : "—"}</strong></span>
            <span><small>Published</small><strong>{published}</strong></span>
          </div>
        </article>

        <div className="dashboard-sidecards">
          <article className="metric spotlight-metric">
            <div className="metric-heading"><span>Published</span><i className="metric-icon metric-icon-purple">↗</i></div>
            <strong>{animatedPublished}</strong>
            <p>{published === 1 ? "update is" : "updates are"} live for your users</p>
          </article>
          <article className="metric">
            <div className="metric-heading"><span>Drafts</span><i className="metric-icon metric-icon-amber">✦</i></div>
            <strong>{animatedDrafts}</strong>
            <p>{drafts ? "Waiting for their finishing touch" : "Everything is shipped"}</p>
          </article>
          <article className="top-story-card">
            <span className="eyebrow">Top performer</span>
            {topAnnouncement ? (
              <>
                <h3>{topAnnouncement.title}</h3>
                <div className="top-story-stats">
                  <span><strong>{topAnnouncement.analytics.views}</strong> views</span>
                  <span><strong>{topAnnouncement.analytics.ctr.toFixed(1)}%</strong> CTR</span>
                </div>
                <Link to={`/edit/${topAnnouncement.id}`}>View announcement <ArrowUpRight /></Link>
              </>
            ) : (
              <><h3>Your standout update will appear here.</h3><Link to="/new">Create your first <ArrowUpRight /></Link></>
            )}
          </article>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="empty dashboard-loading">Gathering your latest signals...</div> : null}
      {!loading && announcements.length === 0 ? (
        <div className="empty empty-dashboard">
          <span className="empty-bell">◌</span>
          <h2>It is quiet here—for now.</h2>
          <p>Turn your next product improvement into an update your users will notice.</p>
          <Link className="primary link-button" to="/new">Write your first announcement</Link>
        </div>
      ) : null}

      {!loading && announcements.length ? (
        <section className="announcements-section">
          <div className="section-heading">
            <div><h2>Announcements</h2><span>{announcements.length} total</span></div>
            <div className="announcement-tools">
              <label className="search-box">
                <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
                <span className="sr-only">Search announcements</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search updates" />
              </label>
              <div className="filter-tabs" aria-label="Filter announcements">
                {(["all", "published", "draft"] as Filter[]).map((item) => (
                  <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "All" : item === "draft" ? "Drafts" : "Published"}</button>
                ))}
              </div>
            </div>
          </div>

          {selectedIds.size > 0 ? (
            <div className="bulk-bar">
              <span>{selectedIds.size} selected</span>
              <button className="danger-text" onClick={bulkRemove}>Delete selected</button>
            </div>
          ) : null}

          <div className="announcement-list surface">
            <div className="list-head">
              <label className="select-all"><input type="checkbox" aria-label="Select all announcements" onChange={(event) => setSelectedIds(event.target.checked ? new Set(filteredAnnouncements.map((announcement) => announcement.id)) : new Set())} checked={filteredAnnouncements.length > 0 && filteredAnnouncements.every((announcement) => selectedIds.has(announcement.id))} /><span>Update</span></label>
              <span>Engagement</span><span>Published</span><span className="sr-only">Actions</span>
            </div>
            {filteredAnnouncements.length ? filteredAnnouncements.map((announcement) => (
              <article key={announcement.id} className="announcement-row" onClick={() => navigate(`/edit/${announcement.id}`)}>
                <div className="announcement-main">
                  <input aria-label={`Select ${announcement.title}`} type="checkbox" checked={selectedIds.has(announcement.id)} onChange={() => toggleSelected(announcement.id)} onClick={(event) => event.stopPropagation()} />
                  <span className={`announcement-marker ${announcement.status}`} />
                  <div>
                    <div className="announcement-title-line">
                      <h3>{announcement.title}</h3>
                      <span className={`status ${announcement.status}`}>{announcement.status}</span>
                      {announcement.tag ? <span className="tag-chip">{announcement.tag}</span> : null}
                    </div>
                    <p>{announcement.body.slice(0, 120)}{announcement.body.length > 120 ? "…" : ""}</p>
                  </div>
                </div>
                <div className="engagement-cell">
                  <strong>{announcement.analytics.views.toLocaleString()}</strong>
                  <span>{announcement.analytics.views ? `${announcement.analytics.ctr.toFixed(1)}% click rate` : "No views yet"}</span>
                </div>
                <div className="date-cell" title={formatShortDate(announcement.published_at)}>
                  <strong>{relativeTime(announcement.published_at)}</strong>
                  <span>{announcement.status === "published" ? "Live" : "Not published"}</span>
                </div>
                <details className="row-menu" onClick={(event) => event.stopPropagation()}>
                  <summary aria-label={`Actions for ${announcement.title}`}><MoreIcon /></summary>
                  <div>
                    <Link to={`/edit/${announcement.id}`}>Edit</Link>
                    <button onClick={() => toggle(announcement)}>{announcement.status === "published" ? "Unpublish" : "Publish"}</button>
                    <button className="danger-text" onClick={() => remove(announcement)}>Delete</button>
                  </div>
                </details>
              </article>
            )) : (
              <div className="no-results"><strong>No updates found</strong><span>Try another search or status filter.</span><button onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button></div>
            )}
          </div>
        </section>
      ) : null}
    </section>
  );
}

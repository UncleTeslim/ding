import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useCountUp } from "../hooks/useCountUp";
import { Sparkline } from "../ui/Sparkline";
import type { Announcement, DailyPoint } from "../types";

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function relativeTime(value: string | null): string {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 30) return formatDate(value);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function ctrClass(ctr: number): string {
  if (ctr >= 30) return "ctr-high";
  if (ctr >= 15) return "ctr-mid";
  return "";
}

export function Announcements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      if (err instanceof Error && err.message === "Unauthorized") navigate("/login");
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

  const published = announcements.filter((a) => a.status === "published").length;
  const drafts = announcements.length - published;
  const totalViews = announcements.reduce((sum, a) => sum + a.analytics.views, 0);
  const totalClicks = announcements.reduce((sum, a) => sum + a.analytics.clicks, 0);
  const overallCtr = totalViews ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

  const animatedPublished = useCountUp(published);
  const animatedDrafts = useCountUp(drafts);
  const animatedViews = useCountUp(totalViews);
  const animatedCtr = useCountUp(overallCtr);

  const viewSeries = daily.map((d) => d.views);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Announcements</h1>
          <p>Write clearly, publish carefully, and see what readers open.</p>
        </div>
        <Link className="primary link-button" to="/new">New announcement</Link>
      </div>

      <div className="metric-grid">
        <div className="metric">
          <span>Published</span>
          <strong>{animatedPublished}</strong>
        </div>
        <div className="metric">
          <span>Drafts</span>
          <strong>{animatedDrafts}</strong>
        </div>
        <div className="metric metric-with-spark">
          <span>Total views</span>
          <strong>{animatedViews}</strong>
          {viewSeries.length > 1 ? <Sparkline data={viewSeries} /> : null}
        </div>
        <div className="metric">
          <span>Overall CTR</span>
          <strong className={ctrClass(overallCtr)}>{totalViews ? `${animatedCtr.toFixed(1)}%` : "-"}</strong>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="empty">Loading...</div> : null}
      {!loading && announcements.length === 0 ? (
        <div className="empty">
          <p>You haven't published anything yet. Write your first announcement.</p>
          <Link className="primary link-button" to="/new">Write announcement</Link>
        </div>
      ) : null}

      {!loading && announcements.length ? (
        <div className="table-wrap surface">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Title</th>
                <th>Tag</th>
                <th>Date</th>
                <th>Views</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement) => (
                <tr key={announcement.id} className="clickable-row" onClick={() => navigate(`/edit/${announcement.id}`)}>
                  <td><span className={`status ${announcement.status}`}>{announcement.status}</span></td>
                  <td className="title-cell">
                    <div>{announcement.title}</div>
                    <span>{announcement.body.slice(0, 110)}{announcement.body.length > 110 ? "..." : ""}</span>
                  </td>
                  <td>{announcement.tag || "-"}</td>
                  <td title={formatDate(announcement.published_at)}>{relativeTime(announcement.published_at)}</td>
                  <td>{announcement.analytics.views}</td>
                  <td>{announcement.analytics.clicks}</td>
                  <td className={ctrClass(announcement.analytics.ctr)}>{announcement.analytics.views ? `${announcement.analytics.ctr.toFixed(1)}%` : "-"}</td>
                  <td>
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/edit/${announcement.id}`}>Edit</Link>
                      <button className="text-button" onClick={() => toggle(announcement)}>{announcement.status === "published" ? "Unpublish" : "Publish"}</button>
                      <button className="danger-text" onClick={() => remove(announcement)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

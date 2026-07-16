import { createHash } from "node:crypto";
import { config } from "../config.js";
import { getDb } from "../db/connection.js";
import type { AnalyticsSummary } from "../types.js";

export function hashIp(ip: string) {
  return createHash("sha256").update(`${ip}:${config.DING_IP_SALT}`).digest("hex");
}

export function recordAnalyticsEvent(announcementId: string, eventType: "view" | "click", ip: string) {
  const db = getDb();
  const exists = db
    .prepare("SELECT 1 FROM announcements WHERE id = ? AND status = 'published'")
    .get(announcementId);
  if (!exists) return;

  db.prepare(
    "INSERT INTO analytics_events (announcement_id, event_type, ip_hash) VALUES (?, ?, ?)"
  ).run(announcementId, eventType, hashIp(ip));
}

export function getAnalyticsMap() {
  const rows = getDb()
    .prepare(
      `SELECT announcement_id, event_type, COUNT(DISTINCT ip_hash || '|' || date(created_at)) as count
       FROM analytics_events
       GROUP BY announcement_id, event_type`
    )
    .all() as Array<{ announcement_id: string; event_type: "view" | "click"; count: number }>;

  const map = new Map<string, AnalyticsSummary>();
  for (const row of rows) {
    const current = map.get(row.announcement_id) ?? { views: 0, clicks: 0, ctr: 0 };
    if (row.event_type === "view") current.views = row.count;
    if (row.event_type === "click") current.clicks = row.count;
    current.ctr = current.views === 0 ? 0 : Number(((current.clicks / current.views) * 100).toFixed(1));
    map.set(row.announcement_id, current);
  }

  return map;
}

export function getDailyBreakdown(days = 7): Array<{ date: string; views: number; clicks: number }> {
  const cutoff = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const rows = getDb()
    .prepare(
      `SELECT date(created_at) as date, event_type, COUNT(DISTINCT ip_hash) as count
       FROM analytics_events
       WHERE created_at >= ?
       GROUP BY date(created_at), event_type
       ORDER BY date(created_at)`
    )
    .all(cutoff) as Array<{ date: string; event_type: "view" | "click"; count: number }>;

  const byDate = new Map<string, { views: number; clicks: number }>();
  for (const row of rows) {
    const entry = byDate.get(row.date) ?? { views: 0, clicks: 0 };
    if (row.event_type === "view") entry.views = row.count;
    if (row.event_type === "click") entry.clicks = row.count;
    byDate.set(row.date, entry);
  }

  const result: Array<{ date: string; views: number; clicks: number }> = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = byDate.get(dateStr) ?? { views: 0, clicks: 0 };
    result.push({ date: dateStr, ...entry });
  }
  return result;
}

export function cleanupOldAnalytics() {
  getDb()
    .prepare("DELETE FROM analytics_events WHERE created_at < datetime('now', '-12 months')")
    .run();
}

import { getDb } from "../../db/connection.js";
import type { AnalyticsSummary } from "../../types.js";

export type AnalyticsEventType = "view" | "click";

type AnalyticsCountRow = {
  announcement_id?: string;
  event_type: AnalyticsEventType;
  count: number;
};

export function insertDailyEvent(announcementId: string, eventType: AnalyticsEventType, ipHash: string) {
  return getDb()
    .prepare("INSERT OR IGNORE INTO analytics_events (announcement_id, event_type, ip_hash) VALUES (?, ?, ?)")
    .run(announcementId, eventType, ipHash);
}

export function getAnalyticsByAnnouncement() {
  const rows = getDb()
    .prepare(
      `SELECT announcement_id, event_type, COUNT(DISTINCT ip_hash || '|' || date(created_at)) as count
       FROM analytics_events
       GROUP BY announcement_id, event_type`
    )
    .all() as Array<AnalyticsCountRow & { announcement_id: string }>;

  const map = new Map<string, AnalyticsSummary>();
  for (const row of rows) {
    const current = map.get(row.announcement_id) ?? { views: 0, clicks: 0, ctr: 0 };
    applyCount(current, row.event_type, row.count);
    map.set(row.announcement_id, current);
  }

  return map;
}

export function deleteEventsOlderThan(retention: string) {
  return getDb()
    .prepare("DELETE FROM analytics_events WHERE created_at < datetime('now', ?)")
    .run(retention);
}

export function findDailyEventCounts(sinceDate: string) {
  return getDb()
    .prepare(
      `SELECT date(created_at) as date, event_type, COUNT(DISTINCT ip_hash) as count
       FROM analytics_events
       WHERE created_at >= ?
       GROUP BY date(created_at), event_type
       ORDER BY date(created_at)`
    )
    .all(sinceDate) as Array<{ date: string; event_type: AnalyticsEventType; count: number }>;
}

function applyCount(summary: AnalyticsSummary, eventType: AnalyticsEventType, count: number) {
  if (eventType === "view") summary.views = count;
  if (eventType === "click") summary.clicks = count;
  summary.ctr = summary.views === 0 ? 0 : Number(((summary.clicks / summary.views) * 100).toFixed(1));
}

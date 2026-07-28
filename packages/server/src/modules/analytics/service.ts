import { createHmac } from "node:crypto";
import { config } from "../../config.js";
import type { Announcement } from "../../types.js";
import { existsPublishedAnnouncement } from "../announcements/repository.js";
import {
  deleteEventsOlderThan,
  findDailyEventCounts,
  getAnalyticsByAnnouncement,
  insertDailyEvent,
  type AnalyticsEventType
} from "./repository.js";

export type { AnalyticsEventType } from "./repository.js";

export function hashIp(ip: string) {
  return createHmac("sha256", config.DING_IP_SALT).update(ip).digest("hex");
}

export function recordAnalyticsEvent(announcementId: string, eventType: AnalyticsEventType, ip: string) {
  if (!existsPublishedAnnouncement(announcementId)) return;
  insertDailyEvent(announcementId, eventType, hashIp(ip));
}

export function getAnalyticsMap() {
  return getAnalyticsByAnnouncement();
}

export function addAnalyticsToAnnouncements(announcements: Announcement[]) {
  const analytics = getAnalyticsMap();
  return announcements.map((announcement) => ({
    ...announcement,
    analytics: analytics.get(announcement.id) ?? { views: 0, clicks: 0, ctr: 0 }
  }));
}

export function getPublishedAnnouncementAnalytics(announcements: Announcement[]) {
  const analytics = getAnalyticsMap();
  const byAnnouncement = announcements
    .filter((announcement) => announcement.status === "published")
    .map((announcement) => ({
      announcement_id: announcement.id,
      title: announcement.title,
      ...(analytics.get(announcement.id) ?? { views: 0, clicks: 0, ctr: 0 })
    }));

  const totalViews = byAnnouncement.reduce((sum, item) => sum + item.views, 0);
  const totalClicks = byAnnouncement.reduce((sum, item) => sum + item.clicks, 0);

  return {
    summary: {
      total_views: totalViews,
      total_clicks: totalClicks,
      overall_ctr: totalViews === 0 ? 0 : Number(((totalClicks / totalViews) * 100).toFixed(1))
    },
    by_announcement: byAnnouncement
  };
}

export function cleanupOldAnalytics() {
  deleteEventsOlderThan("-12 months");
}

export function getDailyBreakdown(days = 7): Array<{ date: string; views: number; clicks: number }> {
  const cutoff = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const rows = findDailyEventCounts(cutoff);
  const byDate = new Map<string, { views: number; clicks: number }>();

  for (const row of rows) {
    const entry = byDate.get(row.date) ?? { views: 0, clicks: 0 };
    if (row.event_type === "view") entry.views = row.count;
    if (row.event_type === "click") entry.clicks = row.count;
    byDate.set(row.date, entry);
  }

  const result: Array<{ date: string; views: number; clicks: number }> = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const entry = byDate.get(dateStr) ?? { views: 0, clicks: 0 };
    result.push({ date: dateStr, ...entry });
  }

  return result;
}

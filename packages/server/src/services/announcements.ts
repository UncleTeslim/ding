import { getDb } from "../db/connection.js";
import type { Announcement, AnnouncementStatus } from "../types.js";
import { getAnalyticsMap } from "./analytics.js";

export type AnnouncementInput = {
  title?: string;
  body?: string;
  tag?: string | null;
  status?: AnnouncementStatus;
  published_at?: string | null;
};

export function listPublished(limit = 50) {
  return getDb()
    .prepare(
      `SELECT id, title, body, tag, published_at
       FROM announcements
       WHERE status = 'published'
       ORDER BY datetime(published_at) DESC
       LIMIT ?`
    )
    .all(limit);
}

export function listAdmin() {
  const analytics = getAnalyticsMap();
  const rows = getDb()
    .prepare(
      `SELECT * FROM announcements
       ORDER BY CASE status WHEN 'draft' THEN 0 ELSE 1 END,
                datetime(COALESCE(published_at, updated_at)) DESC`
    )
    .all() as Announcement[];

  return rows.map((announcement) => ({
    ...announcement,
    analytics: analytics.get(announcement.id) ?? { views: 0, clicks: 0, ctr: 0 }
  }));
}

export function createAnnouncement(input: Required<AnnouncementInput>) {
  const publishedAt = input.status === "published" ? input.published_at ?? new Date().toISOString() : input.published_at;
  const result = getDb()
    .prepare(
      `INSERT INTO announcements (title, body, tag, status, published_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(input.title, input.body, input.tag, input.status, publishedAt);

  return getDb().prepare("SELECT * FROM announcements WHERE rowid = ?").get(result.lastInsertRowid);
}

export function updateAnnouncement(id: string, input: AnnouncementInput) {
  const existing = getDb().prepare("SELECT * FROM announcements WHERE id = ?").get(id) as Announcement | undefined;
  if (!existing) return undefined;

  const nextStatus = input.status ?? existing.status;
  const statusChangedToPublished = existing.status !== "published" && nextStatus === "published";
  const publishedAt =
    input.published_at !== undefined
      ? input.published_at
      : statusChangedToPublished
        ? new Date().toISOString()
        : existing.published_at;

  getDb()
    .prepare(
      `UPDATE announcements
       SET title = ?, body = ?, tag = ?, status = ?, published_at = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(
      input.title ?? existing.title,
      input.body ?? existing.body,
      input.tag === undefined ? existing.tag : input.tag,
      nextStatus,
      publishedAt,
      id
    );

  return getDb().prepare("SELECT * FROM announcements WHERE id = ?").get(id);
}

export function deleteAnnouncement(id: string) {
  getDb().prepare("DELETE FROM announcements WHERE id = ?").run(id);
}

export function seedDevAnnouncement() {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) as count FROM announcements").get() as { count: number };
  if (count.count > 0) return;

  db.prepare(
    `INSERT INTO announcements (title, body, tag, status, published_at)
     VALUES (?, ?, ?, 'published', datetime('now'))`
  ).run(
    "Welcome to Ding",
    "This is your first published announcement. Edit or replace it from the admin dashboard.",
    "Announcement"
  );
}

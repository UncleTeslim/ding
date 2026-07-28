import { getDb } from "../../db/connection.js";
import type { Announcement } from "../../types.js";
import type { AnnouncementInput } from "./service.js";

export function findPublishedAnnouncements(limit: number) {
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

export function findAllAnnouncements() {
  return getDb()
    .prepare(
      `SELECT * FROM announcements
       ORDER BY CASE status WHEN 'draft' THEN 0 ELSE 1 END,
                datetime(COALESCE(published_at, updated_at)) DESC`
    )
    .all() as Announcement[];
}

export function findAnnouncement(id: string) {
  return getDb().prepare("SELECT * FROM announcements WHERE id = ?").get(id) as Announcement | undefined;
}

export function existsPublishedAnnouncement(id: string) {
  return Boolean(
    getDb()
      .prepare("SELECT 1 FROM announcements WHERE id = ? AND status = 'published'")
      .get(id)
  );
}

export function insertAnnouncement(input: Required<AnnouncementInput>) {
  const result = getDb()
    .prepare(
      `INSERT INTO announcements (title, body, tag, status, published_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(input.title, input.body, input.tag, input.status, input.published_at);

  return getDb().prepare("SELECT * FROM announcements WHERE rowid = ?").get(result.lastInsertRowid) as Announcement;
}

export function updateAnnouncementRecord(id: string, input: Required<AnnouncementInput>) {
  getDb()
    .prepare(
      `UPDATE announcements
       SET title = ?, body = ?, tag = ?, status = ?, published_at = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(input.title, input.body, input.tag, input.status, input.published_at, id);

  return findAnnouncement(id);
}

export function deleteAnnouncementRecord(id: string) {
  getDb().prepare("DELETE FROM announcements WHERE id = ?").run(id);
}

export function countAnnouncements() {
  return getDb().prepare("SELECT COUNT(*) as count FROM announcements").get() as { count: number };
}

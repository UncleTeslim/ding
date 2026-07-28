import type { Announcement, AnnouncementStatus } from "../../types.js";
import {
  countAnnouncements,
  deleteAnnouncementRecord,
  findAllAnnouncements,
  findPublishedAnnouncements,
  findAnnouncement,
  insertAnnouncement,
  updateAnnouncementRecord
} from "./repository.js";

export type AnnouncementInput = {
  title?: string;
  body?: string;
  tag?: string | null;
  status?: AnnouncementStatus;
  published_at?: string | null;
};

export function listPublished(limit = 50) {
  return findPublishedAnnouncements(limit);
}

export function listAdmin() {
  return findAllAnnouncements();
}

export function getAnnouncement(id: string) {
  return findAnnouncement(id);
}

export function createAnnouncement(input: Required<AnnouncementInput>) {
  const publishedAt = input.status === "published" ? input.published_at ?? new Date().toISOString() : input.published_at;
  return insertAnnouncement({ ...input, published_at: publishedAt });
}

export function updateAnnouncement(id: string, input: AnnouncementInput) {
  const existing = findAnnouncement(id);
  if (!existing) return undefined;

  const next = mergeAnnouncement(existing, input);
  return updateAnnouncementRecord(id, next);
}

export function deleteAnnouncement(id: string) {
  deleteAnnouncementRecord(id);
}

export function seedDevAnnouncement() {
  if (countAnnouncements().count > 0) return;

  createAnnouncement({
    title: "Welcome to Ding",
    body: "This is your first published announcement. Edit or replace it from the admin dashboard.",
    tag: "Announcement",
    status: "published",
    published_at: new Date().toISOString()
  });
}

function mergeAnnouncement(existing: Announcement, input: AnnouncementInput): Required<AnnouncementInput> {
  const nextStatus = input.status ?? existing.status;
  const statusChangedToPublished = existing.status !== "published" && nextStatus === "published";
  const publishedAt =
    input.published_at !== undefined
      ? input.published_at
      : statusChangedToPublished
        ? new Date().toISOString()
        : existing.published_at;

  return {
    title: input.title ?? existing.title,
    body: input.body ?? existing.body,
    tag: input.tag === undefined ? existing.tag : input.tag,
    status: nextStatus,
    published_at: publishedAt
  };
}

import { runMigrations } from "../db/migrate.js";
import { seedDevAnnouncement } from "../modules/announcements/service.js";

export function initializeStorage() {
  runMigrations();
  seedDevAnnouncement();
}

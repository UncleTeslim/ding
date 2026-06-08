import Database from "better-sqlite3";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { config } from "../config.js";

let db: Database.Database | undefined;

export function getDb() {
  if (!db) {
    mkdirSync(dirname(config.DING_DB_PATH), { recursive: true });
    db = new Database(config.DING_DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }

  return db;
}

export function closeDb() {
  db?.close();
  db = undefined;
}

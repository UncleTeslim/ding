import { createHash } from "node:crypto";
import { getDb } from "../../db/connection.js";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isTokenRevoked(tokenHash: string) {
  return Boolean(
    getDb()
      .prepare("SELECT 1 FROM revoked_tokens WHERE token_hash = ? AND expires_at > ?")
      .get(tokenHash, Math.floor(Date.now() / 1000))
  );
}

export function revokeToken(tokenHash: string, expiresAtSeconds: number) {
  getDb()
    .prepare("INSERT OR IGNORE INTO revoked_tokens (token_hash, expires_at) VALUES (?, ?)")
    .run(tokenHash, expiresAtSeconds);
}

export function deleteExpiredRevocations() {
  getDb()
    .prepare("DELETE FROM revoked_tokens WHERE expires_at <= ?")
    .run(Math.floor(Date.now() / 1000));
}
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

async function loadFreshApp() {
  vi.resetModules();
  process.env.DING_DB_PATH = join(mkdtempSync(join(tmpdir(), "ding-test-")), "ding.db");
  process.env.DING_ADMIN_USERNAME = "admin";
  process.env.DING_ADMIN_PASSWORD_HASH = bcrypt.hashSync("password", 4);
  process.env.DING_JWT_SECRET = "test-secret-test-secret";
  process.env.DING_IP_SALT = "test-salt-test-salt";
  process.env.DING_BASE_URL = "http://localhost:3000";
  const appModule = await import("./app.js");
  const dbModule = await import("./db/connection.js");
  return { app: appModule.createApp(), getDb: dbModule.getDb, closeDb: dbModule.closeDb };
}

describe("server", () => {
  let closeDb: () => void;

  beforeEach(() => {
    closeDb?.();
  });

  it("returns published announcements only", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    fresh.getDb()
      .prepare("INSERT INTO announcements (title, body, status, published_at) VALUES (?, ?, 'draft', null)")
      .run("Draft", "Body");

    const res = await request(fresh.app).get("/api/announcements").expect(200);
    expect(res.body.announcements).toHaveLength(1);
    expect(res.body.announcements[0].title).toBe("Welcome to Ding");
  });

  it("protects admin endpoints", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    await request(fresh.app).get("/api/admin/announcements").expect(401);
  });

  it("sets hardened browser security headers", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const res = await request(fresh.app).get("/health").expect(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["permissions-policy"]).toContain("camera=()");
  });

  it("logs in and creates an announcement", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const agent = request.agent(fresh.app);
    await agent.post("/api/auth/login").send({ username: "admin", password: "password" }).expect(200);
    const created = await agent
      .post("/api/admin/announcements")
      .send({ title: "Ship it", body: "Body", tag: "New Feature", status: "published", published_at: null })
      .expect(201);
    expect(created.body.announcement.title).toBe("Ship it");
  });

  it("records analytics with hashed IP", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const announcement = fresh.getDb().prepare("SELECT id FROM announcements WHERE status = 'published' LIMIT 1").get() as { id: string };
    await request(fresh.app).post("/api/analytics/view").send({ announcement_id: announcement.id }).expect(204);
    const row = fresh.getDb().prepare("SELECT ip_hash FROM analytics_events LIMIT 1").get() as { ip_hash: string };
    expect(row.ip_hash).toHaveLength(64);
  });
});

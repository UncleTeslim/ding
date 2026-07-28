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
  process.env.DING_TRUST_PROXY = "false";
  process.env.NODE_ENV = "test";
  const appModule = await import("./app.js");
  const storageModule = await import("./bootstrap/storage.js");
  const dbModule = await import("./db/connection.js");
  storageModule.initializeStorage();
  return { app: appModule.createApp({ staticAssets: false }), getDb: dbModule.getDb, closeDb: dbModule.closeDb };
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

  it("returns a single admin announcement", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const agent = request.agent(fresh.app);
    await agent.post("/api/auth/login").send({ username: "admin", password: "password" }).expect(200);
    const existing = fresh.getDb().prepare("SELECT id FROM announcements LIMIT 1").get() as { id: string };

    const res = await agent.get(`/api/admin/announcements/${existing.id}`).expect(200);

    expect(res.body.announcement.id).toBe(existing.id);
  });

  it("updates an announcement", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const agent = request.agent(fresh.app);
    await agent.post("/api/auth/login").send({ username: "admin", password: "password" }).expect(200);
    const created = await agent
      .post("/api/admin/announcements")
      .send({ title: "Original", body: "Original body", tag: "News", status: "published", published_at: null })
      .expect(201);
    const id = (created.body.announcement as { id: string }).id;
    const updated = await agent
      .put(`/api/admin/announcements/${id}`)
      .send({ title: "Updated Title", body: "Updated body" })
      .expect(200);
    expect(updated.body.announcement.title).toBe("Updated Title");
    expect(updated.body.announcement.body).toBe("Updated body");
    const list = await agent.get("/api/admin/announcements").expect(200);
    const found = (list.body.announcements as Array<{ id: string; title: string }>).find((announcement) => announcement.id === id);
    expect(found?.title).toBe("Updated Title");
  });

  it("deletes an announcement", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const agent = request.agent(fresh.app);
    await agent.post("/api/auth/login").send({ username: "admin", password: "password" }).expect(200);
    const created = await agent
      .post("/api/admin/announcements")
      .send({ title: "ToDelete", body: "Body", tag: null, status: "draft", published_at: null })
      .expect(201);
    const id = (created.body.announcement as { id: string }).id;
    await agent.delete(`/api/admin/announcements/${id}`).expect(204);
    const list = await agent.get("/api/admin/announcements").expect(200);
    expect((list.body.announcements as Array<{ id: string }>).find((announcement) => announcement.id === id)).toBeUndefined();
  });

  it("returns 404 for missing announcement on update", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const agent = request.agent(fresh.app);
    await agent.post("/api/auth/login").send({ username: "admin", password: "password" }).expect(200);
    await agent
      .put("/api/admin/announcements/non-existent-id")
      .send({ title: "Whatever" })
      .expect(404);
  });

  it("logs out and loses access", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const agent = request.agent(fresh.app);
    await agent.post("/api/auth/login").send({ username: "admin", password: "password" }).expect(200);
    await agent.get("/api/admin/announcements").expect(200);
    await agent.post("/api/auth/logout").expect(200);
    await agent.get("/api/admin/announcements").expect(401);
  });

  it("returns current user via /me", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const agent = request.agent(fresh.app);
    await agent.post("/api/auth/login").send({ username: "admin", password: "password" }).expect(200);
    const me = await agent.get("/api/auth/me").expect(200);
    expect(me.body.username).toBe("admin");
    await request(fresh.app).get("/api/auth/me").expect(401);
  });

  it("records analytics with hashed IP", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const announcement = fresh.getDb().prepare("SELECT id FROM announcements WHERE status = 'published' LIMIT 1").get() as { id: string };
    await request(fresh.app).post("/api/analytics/view").send({ announcement_id: announcement.id }).expect(204);
    const row = fresh.getDb().prepare("SELECT ip_hash FROM analytics_events LIMIT 1").get() as { ip_hash: string };
    expect(row.ip_hash).toHaveLength(64);
  });

  it("aggregates analytics and returns daily breakdown", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const agent = request.agent(fresh.app);
    await agent.post("/api/auth/login").send({ username: "admin", password: "password" }).expect(200);
    const created = await agent
      .post("/api/admin/announcements")
      .send({ title: "Tracked", body: "Body", tag: "News", status: "published", published_at: null })
      .expect(201);
    const id = (created.body.announcement as { id: string }).id;

    await request(fresh.app).post("/api/analytics/view").send({ announcement_id: id }).expect(204);
    await request(fresh.app).post("/api/analytics/click").send({ announcement_id: id }).expect(204);

    const res = await agent.get("/api/admin/analytics").expect(200);
    expect(res.body.summary.total_views).toBeGreaterThanOrEqual(1);
    expect(res.body.summary.total_clicks).toBeGreaterThanOrEqual(1);
    const daily = await agent.get("/api/admin/analytics/daily").expect(200);
    expect(daily.body.daily).toHaveLength(7);
  });

  it("bulk deletes multiple drafts", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const agent = request.agent(fresh.app);
    await agent.post("/api/auth/login").send({ username: "admin", password: "password" }).expect(200);
    const create = (title: string) =>
      agent.post("/api/admin/announcements").send({ title, body: "Body", status: "draft", published_at: null }).expect(201);
    const a1 = await create("Bulk1");
    const a2 = await create("Bulk2");
    const id1 = (a1.body.announcement as { id: string }).id;
    const id2 = (a2.body.announcement as { id: string }).id;
    const res = await agent.post("/api/admin/announcements/bulk-delete").send({ ids: [id1, id2] }).expect(200);
    expect(res.body.deleted).toBe(2);
    const list = await agent.get("/api/admin/announcements").expect(200);
    expect((list.body.announcements as Array<{ id: string }>).find((announcement) => announcement.id === id1)).toBeUndefined();
    expect((list.body.announcements as Array<{ id: string }>).find((announcement) => announcement.id === id2)).toBeUndefined();
  });

  it("rejects bulk delete without auth", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    await request(fresh.app).post("/api/admin/announcements/bulk-delete").send({ ids: ["x"] }).expect(401);
  });

  it("ignores spoofed forwarded IP headers unless a trusted proxy is configured", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const analytics = await import("./modules/analytics/service.js");
    const announcement = fresh.getDb().prepare("SELECT id FROM announcements WHERE status = 'published' LIMIT 1").get() as { id: string };

    await request(fresh.app)
      .post("/api/analytics/view")
      .set("X-Forwarded-For", "203.0.113.55")
      .send({ announcement_id: announcement.id })
      .expect(204);

    const row = fresh.getDb().prepare("SELECT ip_hash FROM analytics_events LIMIT 1").get() as { ip_hash: string };
    expect(row.ip_hash).not.toBe(analytics.hashIp("203.0.113.55"));
  });

  it("deduplicates analytics per IP, announcement, event, and day", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const announcement = fresh.getDb().prepare("SELECT id FROM announcements WHERE status = 'published' LIMIT 1").get() as { id: string };

    await request(fresh.app).post("/api/analytics/view").send({ announcement_id: announcement.id }).expect(204);
    await request(fresh.app).post("/api/analytics/view").send({ announcement_id: announcement.id }).expect(204);

    const row = fresh.getDb().prepare("SELECT COUNT(*) as count FROM analytics_events").get() as { count: number };
    expect(row.count).toBe(1);
  });

  it("drops malformed analytics IDs before they reach storage", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;

    await request(fresh.app)
      .post("/api/analytics/view")
      .send({ announcement_id: "not-a-valid-id" })
      .expect(204);

    const row = fresh.getDb().prepare("SELECT COUNT(*) as count FROM analytics_events").get() as { count: number };
    expect(row.count).toBe(0);
  });

  it("rejects oversized analytics payloads before validation", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;

    await request(fresh.app)
      .post("/api/analytics/view")
      .send({ announcement_id: "x".repeat(2000) })
      .expect(413);
  });

  it("does not let rotating X-Forwarded-For bypass the login rate limit", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;

    for (let i = 0; i < 10; i += 1) {
      await request(fresh.app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", `203.0.113.${i}`)
        .send({ username: "admin", password: "wrong" })
        .expect(401);
    }

    await request(fresh.app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", "203.0.113.200")
      .send({ username: "admin", password: "wrong" })
      .expect(429);
  });

  it("blocks cross-site admin mutations when Origin is present", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const agent = request.agent(fresh.app);
    await agent.post("/api/auth/login").send({ username: "admin", password: "password" }).expect(200);

    await agent
      .post("/api/admin/announcements")
      .set("Origin", "https://evil.example")
      .send({ title: "Blocked", body: "Body", tag: "New Feature", status: "published", published_at: null })
      .expect(403);
  });

  it("parses DING_TRUST_PROXY=false as disabled", async () => {
    vi.resetModules();
    process.env.DING_TRUST_PROXY = "false";
    process.env.NODE_ENV = "test";

    const configModule = await import("./config.js");
    expect(configModule.config.DING_TRUST_PROXY).toBe(false);
  });

  it("refuses production defaults for admin credentials and public URL", async () => {
    vi.resetModules();
    process.env.NODE_ENV = "production";
    delete process.env.DING_ADMIN_USERNAME;
    delete process.env.DING_ADMIN_PASSWORD_HASH;
    process.env.DING_JWT_SECRET = "a".repeat(64);
    process.env.DING_IP_SALT = "b".repeat(64);
    process.env.DING_BASE_URL = "http://localhost:3000";

    await expect(import("./config.js")).rejects.toThrow(/DING_ADMIN_USERNAME/);
  });

  it("refuses the known development password in production", async () => {
    vi.resetModules();
    process.env.NODE_ENV = "production";
    process.env.DING_ADMIN_USERNAME = "admin";
    process.env.DING_ADMIN_PASSWORD_HASH = bcrypt.hashSync("password", 4);
    process.env.DING_JWT_SECRET = "a".repeat(64);
    process.env.DING_IP_SALT = "b".repeat(64);
    process.env.DING_BASE_URL = "https://ding.example.com";

    await expect(import("./config.js")).rejects.toThrow(/DING_ADMIN_PASSWORD_HASH/);
  });

  it("requires HTTPS base URLs in production", async () => {
    vi.resetModules();
    process.env.NODE_ENV = "production";
    process.env.DING_ADMIN_USERNAME = "admin";
    process.env.DING_ADMIN_PASSWORD_HASH = bcrypt.hashSync("not-the-default", 4);
    process.env.DING_JWT_SECRET = "a".repeat(64);
    process.env.DING_IP_SALT = "b".repeat(64);
    process.env.DING_BASE_URL = "http://ding.example.com";

    await expect(import("./config.js")).rejects.toThrow(/DING_BASE_URL/);
  });
});

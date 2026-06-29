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
    const found = (list.body.announcements as Array<{ id: string; title: string }>).find((a) => a.id === id);
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
    expect((list.body.announcements as Array<{ id: string }>).find((a) => a.id === id)).toBeUndefined();
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

  it("aggregates analytics", async () => {
    const fresh = await loadFreshApp();
    closeDb = fresh.closeDb;
    const agent = request.agent(fresh.app);
    await agent.post("/api/auth/login").send({ username: "admin", password: "password" }).expect(200);
    const created = await agent
      .post("/api/admin/announcements")
      .send({ title: "Tracked", body: "Body", tag: "News", status: "published", published_at: null })
      .expect(201);
    const id = (created.body.announcement as { id: string }).id;
    const viewIps = ["1.1.1.1", "2.2.2.2", "3.3.3.3"];
    const clickIps = ["1.1.1.1", "2.2.2.2"];
    for (const ip of viewIps) {
      await request(fresh.app)
        .post("/api/analytics/view")
        .set("X-Forwarded-For", ip)
        .send({ announcement_id: id })
        .expect(204);
    }
    for (const ip of clickIps) {
      await request(fresh.app)
        .post("/api/analytics/click")
        .set("X-Forwarded-For", ip)
        .send({ announcement_id: id })
        .expect(204);
    }
    const res = await agent.get("/api/admin/analytics").expect(200);
    expect(res.body.summary.total_views).toBe(viewIps.length);
    expect(res.body.summary.total_clicks).toBe(clickIps.length);
    const entry = (
      res.body.by_announcement as Array<{
        announcement_id: string;
        views: number;
        clicks: number;
        ctr: number;
      }>
    ).find((a) => a.announcement_id === id);
    expect(entry).toBeDefined();
    expect(entry?.views).toBe(viewIps.length);
    expect(entry?.clicks).toBe(clickIps.length);
    expect(entry?.ctr).toBe(Number(((clickIps.length / viewIps.length) * 100).toFixed(1)));
    const daily = await agent.get("/api/admin/analytics/daily").expect(200);
    expect(daily.body.daily).toHaveLength(7);
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
});

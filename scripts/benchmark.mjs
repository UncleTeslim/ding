import autocannon from "autocannon";
import { createApp } from "../packages/server/dist/app.js";
import { getDb } from "../packages/server/dist/db/connection.js";
import bcrypt from "bcryptjs";

process.env.DING_DB_PATH = "./data/bench.db";
process.env.DING_ADMIN_USERNAME = "admin";
process.env.DING_ADMIN_PASSWORD_HASH = bcrypt.hashSync("password", 4);
process.env.DING_JWT_SECRET = "bench-secret-bench-secret-bench";
process.env.DING_IP_SALT = "bench-salt-bench-salt-bench";
process.env.DING_BASE_URL = "http://localhost:3999";
process.env.PORT = "3999";
process.env.NODE_ENV = "development";

const PORT = 3999;
let httpServer;

async function seed() {
  const db = getDb();
  const existing = db.prepare("SELECT COUNT(*) as c FROM announcements").get();
  if (existing.c > 0) return;
  const insert = db.prepare(
    "INSERT INTO announcements (title, body, tag, status, published_at) VALUES (?, ?, ?, 'published', ?)"
  );
  for (let i = 0; i < 10; i++) {
    insert.run(`Benchmark Announcement ${i}`, "Body content for benchmark test.", "News", new Date().toISOString());
  }
}

function runScenario(label, opts) {
  return new Promise((resolve) => {
    const instance = autocannon({ ...opts, title: label, connections: 50, duration: 10 }, (err, result) => {
      if (err) { console.error(`${label} failed:`, err); return resolve(null); }
      console.log(autocannon.printResult(result));
      resolve(result);
    });
    process.on("SIGINT", () => instance.stop());
  });
}

async function main() {
  const app = createApp();
  httpServer = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });
  await seed();

  console.log("\n=== GET /api/announcements (public read) ===");
  await runScenario("GET /api/announcements", { url: `http://localhost:${PORT}/api/announcements`, method: "GET" });

  console.log("\n=== GET /health (health check) ===");
  await runScenario("GET /health", { url: `http://localhost:${PORT}/health`, method: "GET" });

  const announcement = getDb().prepare("SELECT id FROM announcements WHERE status = 'published' LIMIT 1").get();
  if (announcement) {
    console.log("\n=== POST /api/analytics/view (analytics write) ===");
    await runScenario("POST /api/analytics/view", {
      url: `http://localhost:${PORT}/api/analytics/view`,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ announcement_id: announcement.id })
    });
  }

  httpServer.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  httpServer?.close();
  process.exit(1);
});
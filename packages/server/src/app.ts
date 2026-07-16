import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import cron from "node-cron";
import { pinoHttp } from "pino-http";
import { logger } from "./logger.js";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./db/connection.js";
import { runMigrations } from "./db/migrate.js";
import { adminRouter } from "./routes/admin.js";
import { analyticsRouter } from "./routes/analytics.js";
import { authRouter } from "./routes/auth.js";
import { publicRouter } from "./routes/public.js";
import { cleanupOldAnalytics } from "./services/analytics.js";
import { seedDevAnnouncement } from "./services/announcements.js";
import { securityHeaders } from "./middleware/security.js";
import { config } from "./config.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../..");

export function createApp() {
  runMigrations();
  seedDevAnnouncement();

  const app = express();
  app.set("trust proxy", config.DING_TRUST_PROXY ? 1 : false);
  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(pinoHttp({ logger }));

  app.use(express.json({ limit: "64kb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    try {
      getDb().prepare("SELECT 1").get();
      res.json({ ok: true, db: "connected" });
    } catch {
      res.status(503).json({ ok: false, db: "unavailable" });
    }
  });

  app.use("/api", cors({ origin: "*", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }), publicRouter);
  app.use("/api/analytics", cors({ origin: "*", methods: ["POST"], allowedHeaders: ["Content-Type"] }), analyticsRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);

  const widgetDist = join(repoRoot, "packages/widget/dist");
  const dashboardDist = join(repoRoot, "packages/dashboard/dist");
  const demoDir = join(repoRoot, "packages/server/public");

  if (existsSync(widgetDist)) {
    app.use(
      express.static(widgetDist, {
        immutable: false,
        setHeaders: (res, path) => {
          if (path.endsWith("widget.js")) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Cache-Control", "public, max-age=300");
          }
        }
      })
    );
  }
  if (existsSync(demoDir)) app.use("/demo", express.static(demoDir));
  if (existsSync(dashboardDist)) {
    app.use(express.static(dashboardDist));
    app.get("*", (_req, res) => res.sendFile(join(dashboardDist, "index.html")));
  }

  cron.schedule("0 2 * * *", cleanupOldAnalytics);

  return app;
}

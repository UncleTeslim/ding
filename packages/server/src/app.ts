import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { getDb } from "./db/connection.js";
import { adminRouter } from "./routes/admin.js";
import { analyticsRouter } from "./routes/analytics.js";
import { authRouter } from "./routes/auth.js";
import { publicRouter } from "./routes/public.js";
import { securityHeaders } from "./middleware/security.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { mountStaticAssets } from "./bootstrap/staticAssets.js";

export type CreateAppOptions = {
  staticAssets?: boolean;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  app.set("trust proxy", config.DING_TRUST_PROXY);
  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(pinoHttp({ logger }));

  app.use(cookieParser());
  app.use("/api/analytics", express.json({ limit: "1kb" }));
  app.use(express.json({ limit: "64kb" }));

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

  if (options.staticAssets ?? true) mountStaticAssets(app);

  return app;
}

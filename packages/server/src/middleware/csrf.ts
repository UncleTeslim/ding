import type { NextFunction, Request, Response } from "express";
import { config, isProduction } from "../config.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const localhostOrigins = new Set([
  "http://localhost",
  "http://127.0.0.1",
  "http://[::1]"
]);

function isLocalhostDevOrigin(origin: string) {
  if (isProduction) return false;
  try {
    const { protocol, hostname, port } = new URL(origin);
    if (protocol !== "http:" || !localhostOrigins.has(`${protocol}//${hostname}`)) return false;
    return port === "" || port === "3000" || port === "5173";
  } catch {
    return false;
  }
}

export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  if (safeMethods.has(req.method)) return next();

  const origin = req.get("origin");
  if (!origin) return next();

  try {
    const expected = new URL(config.DING_BASE_URL).origin;
    if (new URL(origin).origin === expected) return next();
    if (isLocalhostDevOrigin(origin)) return next();
  } catch {
    return res.status(403).json({ error: "Cross-site request blocked" });
  }

  res.status(403).json({ error: "Cross-site request blocked" });
}

export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  next();
}

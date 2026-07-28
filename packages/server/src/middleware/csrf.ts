import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  if (safeMethods.has(req.method)) return next();

  const origin = req.get("origin");
  if (!origin) return next();

  try {
    const expected = new URL(config.DING_BASE_URL).origin;
    if (new URL(origin).origin === expected) return next();
  } catch {
    return res.status(403).json({ error: "Cross-site request blocked" });
  }

  res.status(403).json({ error: "Cross-site request blocked" });
}

export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  next();
}

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { hashToken, isTokenRevoked } from "../modules/session/repository.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.ding_session;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, config.DING_JWT_SECRET, {
      algorithms: ["HS256"],
      audience: "ding-admin",
      issuer: "ding"
    }) as { sub: string; exp: number };
    if (isTokenRevoked(hashToken(token))) return res.status(401).json({ error: "Unauthorized" });
    res.locals.session = { exp: payload.exp };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

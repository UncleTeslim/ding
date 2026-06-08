import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.ding_session;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    jwt.verify(token, config.DING_JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

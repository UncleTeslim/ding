import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config, isProduction } from "../config.js";
import { loginLimiter } from "../middleware/rateLimit.js";
import { requireAuth } from "../middleware/auth.js";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(500)
});

export const authRouter = Router();

authRouter.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a username and password." });

  const usernameMatches = parsed.data.username === config.DING_ADMIN_USERNAME;
  const passwordMatches = await bcrypt.compare(parsed.data.password, config.DING_ADMIN_PASSWORD_HASH);
  if (!usernameMatches || !passwordMatches) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ sub: "admin" }, config.DING_JWT_SECRET, { expiresIn: "7d" });
  res.cookie("ding_session", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.json({ ok: true });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("ding_session", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict"
  });
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (_req, res) => {
  res.json({ username: config.DING_ADMIN_USERNAME });
});

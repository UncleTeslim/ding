import { Router } from "express";
import { listPublished } from "../services/announcements.js";

export const publicRouter = Router();

publicRouter.get("/announcements", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=30");
  res.json({ announcements: listPublished() });
});

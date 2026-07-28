import { Router } from "express";
import { listPublished } from "../modules/announcements/service.js";

export const publicRouter = Router();

publicRouter.get("/announcements", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=30");
  res.json({ announcements: listPublished() });
});

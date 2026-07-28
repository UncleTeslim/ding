import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { noStore, requireSameOrigin } from "../middleware/csrf.js";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  listAdmin,
  updateAnnouncement
} from "../modules/announcements/service.js";
import { createAnnouncementSchema, updateAnnouncementSchema } from "../modules/announcements/schemas.js";
import {
  addAnalyticsToAnnouncements,
  getDailyBreakdown,
  getPublishedAnnouncementAnalytics
} from "../modules/analytics/service.js";

export const adminRouter = Router();
adminRouter.use(noStore);
adminRouter.use(requireSameOrigin);
adminRouter.use(requireAuth);

adminRouter.get("/announcements", (_req, res) => {
  res.json({ announcements: addAnalyticsToAnnouncements(listAdmin()) });
});

adminRouter.get("/announcements/:id", (req, res) => {
  const announcement = getAnnouncement(req.params.id);
  if (!announcement) return res.status(404).json({ error: "Announcement not found" });
  res.json({ announcement });
});

adminRouter.post("/announcements", (req, res) => {
  const parsed = createAnnouncementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the announcement fields.", issues: parsed.error.flatten() });
  const announcement = createAnnouncement({
    ...parsed.data,
    tag: parsed.data.tag ?? null,
    published_at: parsed.data.published_at ?? null
  });
  res.status(201).json({ announcement });
});

adminRouter.put("/announcements/:id", (req, res) => {
  const parsed = updateAnnouncementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the announcement fields.", issues: parsed.error.flatten() });
  const announcement = updateAnnouncement(req.params.id, parsed.data);
  if (!announcement) return res.status(404).json({ error: "Announcement not found" });
  res.json({ announcement });
});

adminRouter.delete("/announcements/:id", (req, res) => {
  deleteAnnouncement(req.params.id);
  res.status(204).send();
});

adminRouter.get("/analytics", (_req, res) => {
  res.json(getPublishedAnnouncementAnalytics(listAdmin()));
});

adminRouter.get("/analytics/daily", (_req, res) => {
  res.json({ daily: getDailyBreakdown(7) });
});

adminRouter.post("/announcements/bulk-delete", (req, res) => {
  const parsed = z.object({
    ids: z.array(z.string()).min(1).max(100)
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid ids.", issues: parsed.error.flatten() });
  parsed.data.ids.forEach((id) => deleteAnnouncement(id));
  res.json({ deleted: parsed.data.ids.length });
});

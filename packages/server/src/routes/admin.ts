import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAdmin,
  updateAnnouncement
} from "../services/announcements.js";
import { getAnalyticsMap, getDailyBreakdown } from "../services/analytics.js";

const baseSchema = z.object({
  title: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(5000),
  tag: z.string().trim().max(50).nullable().optional(),
  status: z.enum(["draft", "published"]),
  published_at: z.string().datetime().nullable().optional()
}).refine((value) => !value.published_at || new Date(value.published_at) <= new Date(), {
  message: "Publication date cannot be in the future.",
  path: ["published_at"]
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  body: z.string().trim().min(1).max(5000).optional(),
  tag: z.string().trim().max(50).nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  published_at: z.string().datetime().nullable().optional()
}).refine((value) => !value.published_at || new Date(value.published_at) <= new Date(), {
  message: "Publication date cannot be in the future.",
  path: ["published_at"]
});

export const adminRouter = Router();
adminRouter.use(requireAuth);

adminRouter.get("/announcements", (_req, res) => {
  res.json({ announcements: listAdmin() });
});

adminRouter.post("/announcements", (req, res) => {
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the announcement fields.", issues: parsed.error.flatten() });
  const announcement = createAnnouncement({
    ...parsed.data,
    tag: parsed.data.tag ?? null,
    published_at: parsed.data.published_at ?? null
  });
  res.status(201).json({ announcement });
});

adminRouter.put("/announcements/:id", (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
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
  const announcements = listAdmin().filter((announcement) => announcement.status === "published");
  const analytics = getAnalyticsMap();
  const byAnnouncement = announcements.map((announcement) => ({
    announcement_id: announcement.id,
    title: announcement.title,
    ...(analytics.get(announcement.id) ?? { views: 0, clicks: 0, ctr: 0 })
  }));
  const totalViews = byAnnouncement.reduce((sum, item) => sum + item.views, 0);
  const totalClicks = byAnnouncement.reduce((sum, item) => sum + item.clicks, 0);
  res.json({
    summary: {
      total_views: totalViews,
      total_clicks: totalClicks,
      overall_ctr: totalViews === 0 ? 0 : Number(((totalClicks / totalViews) * 100).toFixed(1))
    },
    by_announcement: byAnnouncement
  });
});

adminRouter.get("/analytics/daily", (_req, res) => {
  res.json({ daily: getDailyBreakdown(7) });
});

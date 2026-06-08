import { Router } from "express";
import { z } from "zod";
import { analyticsLimiter } from "../middleware/rateLimit.js";
import { recordAnalyticsEvent } from "../services/analytics.js";

const eventSchema = z.object({
  announcement_id: z.string().min(1)
});

export const analyticsRouter = Router();

function handler(eventType: "view" | "click") {
  return (req: any, res: any) => {
    const parsed = eventSchema.safeParse(req.body);
    if (parsed.success) {
      const forwarded = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
      recordAnalyticsEvent(parsed.data.announcement_id, eventType, forwarded || req.ip || "unknown");
    }
    res.status(204).send();
  };
}

analyticsRouter.post("/view", analyticsLimiter, handler("view"));
analyticsRouter.post("/click", analyticsLimiter, handler("click"));

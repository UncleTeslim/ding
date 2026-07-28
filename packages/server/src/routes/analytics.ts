import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { analyticsLimiter } from "../middleware/rateLimit.js";
import { recordAnalyticsEvent, type AnalyticsEventType } from "../modules/analytics/service.js";

const eventSchema = z.object({
  announcement_id: z.string().regex(/^[a-f0-9]{16}$/)
});

export const analyticsRouter = Router();

type AnalyticsRequest = Request<unknown, unknown, z.infer<typeof eventSchema>>;

function validateEvent(req: Request, res: Response, next: NextFunction) {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(204).send();
  req.body = parsed.data;
  next();
}

function handler(eventType: AnalyticsEventType) {
  return (req: AnalyticsRequest, res: Response) => {
    recordAnalyticsEvent(req.body.announcement_id, eventType, req.ip || "unknown");
    res.status(204).send();
  };
}

analyticsRouter.post("/view", validateEvent, analyticsLimiter, handler("view"));
analyticsRouter.post("/click", validateEvent, analyticsLimiter, handler("click"));

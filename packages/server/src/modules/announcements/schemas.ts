import { z } from "zod";

const publicationDateRefinement = {
  message: "Publication date cannot be in the future.",
  path: ["published_at"]
};

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(5000),
  tag: z.string().trim().max(50).nullable().optional(),
  status: z.enum(["draft", "published"]),
  published_at: z.string().datetime().nullable().optional()
}).refine((value) => !value.published_at || new Date(value.published_at) <= new Date(), publicationDateRefinement);

export const updateAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  body: z.string().trim().min(1).max(5000).optional(),
  tag: z.string().trim().max(50).nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  published_at: z.string().datetime().nullable().optional()
}).refine((value) => !value.published_at || new Date(value.published_at) <= new Date(), publicationDateRefinement);

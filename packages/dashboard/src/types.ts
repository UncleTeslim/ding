export type AnnouncementStatus = "draft" | "published";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  tag: string | null;
  status: AnnouncementStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  analytics: {
    views: number;
    clicks: number;
    ctr: number;
  };
};

export type AnnouncementPayload = {
  title: string;
  body: string;
  tag: string | null;
  status: AnnouncementStatus;
  published_at: string | null;
};

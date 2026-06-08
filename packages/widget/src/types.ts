export type Trigger = "bell" | "banner" | "both";
export type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export type WidgetConfig = {
  apiBaseUrl: string;
  projectKey: string;
  position: Position;
  color: string;
  trigger: Trigger;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  tag?: string | null;
  published_at: string;
};

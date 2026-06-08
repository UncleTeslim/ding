import type { Announcement, WidgetConfig } from "./types";

export async function fetchAnnouncements(config: WidgetConfig): Promise<Announcement[]> {
  const res = await fetch(`${config.apiBaseUrl}/api/announcements`);
  if (!res.ok) throw new Error("Failed to fetch announcements");
  const body = await res.json();
  return Array.isArray(body.announcements) ? body.announcements : [];
}

export function postEvent(config: WidgetConfig, type: "view" | "click", announcementId: string) {
  fetch(`${config.apiBaseUrl}/api/analytics/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ announcement_id: announcementId }),
    keepalive: true
  }).catch(() => {});
}

import { postEvent } from "./api";
import type { Store } from "./storage";
import type { Announcement, WidgetConfig } from "./types";

export function markVisibleAsRead(
  config: WidgetConfig,
  store: Store,
  announcements: Announcement[],
  viewedIds: Set<string>
) {
  const ids = announcements.map((announcement) => announcement.id);
  store.setReadIds([...store.readIds(), ...ids]);

  for (const id of ids) {
    if (!viewedIds.has(id)) {
      viewedIds.add(id);
      postEvent(config, "view", id);
    }
  }
}

export function recordAnnouncementClick(config: WidgetConfig, announcementId: string) {
  postEvent(config, "click", announcementId);
}

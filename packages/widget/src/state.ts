import type { Announcement } from "./types";

export type WidgetState = {
  announcements: Announcement[];
  open: boolean;
  expanded: Set<string>;
  viewedIds: Set<string>;
};

export function createWidgetState(): WidgetState {
  return { announcements: [], open: false, expanded: new Set(), viewedIds: new Set() };
}

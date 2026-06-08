export type Store = {
  readIds(): string[];
  setReadIds(ids: string[]): void;
  isBannerDismissed(id: string): boolean;
  dismissBanner(id: string): void;
};

const memory = {
  readIds: [] as string[],
  dismissed: new Set<string>()
};

function canUseLocalStorage() {
  try {
    const key = "__ding_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function createStore(): Store {
  if (!canUseLocalStorage()) {
    return {
      readIds: () => memory.readIds,
      setReadIds: (ids) => {
        memory.readIds = ids;
      },
      isBannerDismissed: (id) => memory.dismissed.has(id),
      dismissBanner: (id) => {
        memory.dismissed.add(id);
      }
    };
  }

  return {
    readIds: () => {
      try {
        const value = window.localStorage.getItem("ding_read_ids");
        return value ? JSON.parse(value) : [];
      } catch {
        return [];
      }
    },
    setReadIds: (ids) => window.localStorage.setItem("ding_read_ids", JSON.stringify(Array.from(new Set(ids)))),
    isBannerDismissed: (id) => window.localStorage.getItem(`ding_dismissed_banner_${id}`) === "1",
    dismissBanner: (id) => window.localStorage.setItem(`ding_dismissed_banner_${id}`, "1")
  };
}

export function unreadCount(announcements: Array<{ id: string }>, readIds: string[]) {
  const read = new Set(readIds);
  return announcements.filter((announcement) => !read.has(announcement.id)).length;
}

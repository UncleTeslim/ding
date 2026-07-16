import { describe, expect, it, vi, beforeEach } from "vitest";
import { createRoot, injectStyles, render, markVisibleAsRead } from "./ui";
import { createStore } from "./storage";
import type { Announcement, WidgetConfig } from "./types";
import { postEvent } from "./api";

vi.mock("./api", () => ({
  postEvent: vi.fn(),
  fetchAnnouncements: vi.fn()
}));

const config: WidgetConfig = {
  apiBaseUrl: "http://localhost:3000",
  position: "bottom-right",
  color: "#6366f1",
  trigger: "bell"
};

const announcements: Announcement[] = [
  { id: "a", title: "Test", body: "Short body", tag: "Fix", published_at: "2026-01-01T00:00:00.000Z" }
];

function makeState(overrides: Partial<{ announcements: Announcement[]; open: boolean; expanded: Set<string>; viewedIds: Set<string> }> = {}) {
  return {
    announcements,
    open: false,
    expanded: new Set<string>(),
    viewedIds: new Set<string>(),
    ...overrides
  };
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.head.innerHTML = "";
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("createRoot", () => {
  it("creates #ding-root div appended to body", () => {
    const root = createRoot();
    expect(root.id).toBe("ding-root");
    expect(root.parentElement).toBe(document.body);
    expect(document.getElementById("ding-root")).toBe(root);
  });

  it("removes existing root first", () => {
    const first = createRoot();
    const second = createRoot();
    expect(second).not.toBe(first);
    expect(document.querySelectorAll("#ding-root")).toHaveLength(1);
    expect(first.parentElement).toBeNull();
  });
});

describe("injectStyles", () => {
  it("creates #ding-styles style element in head", () => {
    injectStyles(config);
    const style = document.getElementById("ding-styles");
    expect(style).not.toBeNull();
    expect(style?.tagName).toBe("STYLE");
    expect(document.head.contains(style)).toBe(true);
    expect(style?.textContent).toContain("--ding-primary");
  });

  it("does not duplicate on second call", () => {
    injectStyles(config);
    injectStyles(config);
    expect(document.querySelectorAll("#ding-styles")).toHaveLength(1);
  });
});

describe("render", () => {
  it("renders bell button when trigger is bell", () => {
    const root = createRoot();
    const store = createStore();
    render(root, config, store, makeState(), () => {}, () => {});
    expect(root.querySelector(".ding-bell")).not.toBeNull();
  });

  it("renders bell button when trigger is both", () => {
    const root = createRoot();
    const store = createStore();
    render(root, { ...config, trigger: "both" }, store, makeState(), () => {}, () => {});
    expect(root.querySelector(".ding-bell")).not.toBeNull();
  });

  it("does not render bell when trigger is banner only", () => {
    const root = createRoot();
    const store = createStore();
    render(root, { ...config, trigger: "banner" }, store, makeState(), () => {}, () => {});
    expect(root.querySelector(".ding-bell")).toBeNull();
  });

  it("renders badge with unread count", () => {
    const root = createRoot();
    const store = createStore();
    render(root, config, store, makeState(), () => {}, () => {});
    const badge = root.querySelector(".ding-badge");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("1");
  });

  it("renders panel section always without hidden attribute", () => {
    const root = createRoot();
    const store = createStore();
    render(root, config, store, makeState(), () => {}, () => {});
    const panel = root.querySelector(".ding-panel");
    expect(panel).not.toBeNull();
    expect(panel?.hasAttribute("hidden")).toBe(false);
  });

  it("renders announcement list with titles", () => {
    const root = createRoot();
    const store = createStore();
    render(root, config, store, makeState(), () => {}, () => {});
    const titles = root.querySelectorAll(".ding-title");
    expect(titles).toHaveLength(1);
    expect(titles[0]?.textContent).toBe("Test");
  });

  it("renders at most 20 announcements in the panel", () => {
    const root = createRoot();
    const store = createStore();
    const many: Announcement[] = Array.from({ length: 25 }, (_, i) => ({
      id: `a${i}`,
      title: `Announcement ${i}`,
      body: "Short body",
      tag: "Fix",
      published_at: `2026-06-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`
    }));
    render(root, config, store, makeState({ announcements: many }), () => {}, () => {});
    expect(root.querySelectorAll(".ding-announcement")).toHaveLength(20);
  });

  it("renders Read more button when body > 150 chars", () => {
    const root = createRoot();
    const store = createStore();
    const longAnnouncement: Announcement = {
      id: "long",
      title: "Long",
      body: "x".repeat(151),
      tag: "Fix",
      published_at: "2026-01-01T00:00:00.000Z"
    };
    render(root, config, store, makeState({ announcements: [longAnnouncement] }), () => {}, () => {});
    expect(root.querySelector(".ding-read-more")).not.toBeNull();
  });

  it("does not render Read more button when body is short", () => {
    const root = createRoot();
    const store = createStore();
    render(root, config, store, makeState(), () => {}, () => {});
    expect(root.querySelector(".ding-read-more")).toBeNull();
  });
});

describe("markVisibleAsRead", () => {
  const items: Announcement[] = [
    { id: "a", title: "A", body: "body", tag: "Fix", published_at: "2026-01-01T00:00:00.000Z" },
    { id: "b", title: "B", body: "body", tag: "Fix", published_at: "2026-01-01T00:00:00.000Z" }
  ];

  it("fires view events for all announcements on first call", () => {
    const store = createStore();
    const viewedIds = new Set<string>();
    markVisibleAsRead(config, store, items, viewedIds);
    expect(postEvent).toHaveBeenCalledTimes(2);
    expect(postEvent).toHaveBeenCalledWith(config, "view", "a");
    expect(postEvent).toHaveBeenCalledWith(config, "view", "b");
    expect(viewedIds.has("a")).toBe(true);
    expect(viewedIds.has("b")).toBe(true);
  });

  it("does not fire view events again on second call with same viewedIds", () => {
    const store = createStore();
    const viewedIds = new Set<string>();
    markVisibleAsRead(config, store, items, viewedIds);
    vi.clearAllMocks();
    markVisibleAsRead(config, store, items, viewedIds);
    expect(postEvent).not.toHaveBeenCalled();
  });
});

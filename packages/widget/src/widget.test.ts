import { describe, expect, it, vi } from "vitest";
import { readConfig } from "./config";
import { renderMarkdown, truncateText } from "./markdown";
import { createStore, unreadCount } from "./storage";

describe("widget config", () => {
  it("reads data attributes with defaults", () => {
    const script = document.createElement("script");
    script.src = "https://ding.test/widget.js";
    script.dataset.position = "top-left";
    script.dataset.trigger = "both";
    script.dataset.color = "#112233";
    const config = readConfig(script);
    expect(config.apiBaseUrl).toBe("https://ding.test");
    expect(config.position).toBe("top-left");
    expect(config.trigger).toBe("both");
    expect(config.color).toBe("#112233");
  });
});

describe("storage", () => {
  it("calculates unread counts", () => {
    expect(unreadCount([{ id: "a" }, { id: "b" }], ["a"])).toBe(1);
  });

  it("falls back when localStorage throws", () => {
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const store = createStore();
    store.setReadIds(["a"]);
    expect(store.readIds()).toEqual(["a"]);
    store.dismissBanner("a");
    expect(store.isBannerDismissed("a")).toBe(true);
    vi.restoreAllMocks();
  });
});

describe("markdown", () => {
  it("renders safe basic markdown", () => {
    expect(renderMarkdown("Hello **world**")).toContain("<strong>world</strong>");
    expect(renderMarkdown("<script>alert(1)</script>")).not.toContain("<script>");
  });

  it("truncates long text", () => {
    expect(truncateText("a".repeat(151))).toHaveLength(153);
  });
});

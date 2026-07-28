import { describe, expect, it, vi } from "vitest";
import { currentScript, readConfig } from "./config";
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

  it("uses safe defaults for invalid attributes", () => {
    const script = document.createElement("script");
    script.src = "/widget.js";
    script.dataset.position = "invalid";
    script.dataset.trigger = "invalid";
    script.dataset.color = "red";
    const config = readConfig(script);
    expect(config.position).toBe("bottom-right");
    expect(config.trigger).toBe("bell");
    expect(config.color).toBe("#6366f1");
  });

  it("finds the widget script when document.currentScript is unavailable", () => {
    const script = document.createElement("script");
    script.src = "/widget.js";
    document.body.append(script);
    expect(currentScript()).toBe(script);
  });

  it("returns no script when neither source is present", () => {
    document.querySelectorAll("script").forEach((script) => script.remove());
    expect(currentScript()).toBeNull();
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

  it("renders lists, emphasis, links, and ignores blank lines", () => {
    const html = renderMarkdown("- **one**\n- *two*\n\nSee [docs](https://example.com)");
    expect(html).toContain("<ul><li><strong>one</strong></li><li><em>two</em></li></ul>");
    expect(html).toContain('href="https://example.com"');
  });

  it("returns normalized short text unchanged", () => {
    expect(truncateText("  hello   world  ", 150)).toBe("hello world");
  });
});

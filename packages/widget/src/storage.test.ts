import { afterEach, describe, expect, it, beforeEach } from "vitest";
import { createStore, unreadCount } from "./storage";
import type { Announcement } from "./types";

const announcements: Announcement[] = [
  { id: "a", title: "A", body: "body", tag: "Fix", published_at: "2026-01-01T00:00:00.000Z" },
  { id: "b", title: "B", body: "body", tag: "Fix", published_at: "2026-01-01T00:00:00.000Z" }
];

beforeEach(() => {
  window.localStorage.clear();
});

describe("createStore", () => {
  it("returns empty readIds initially", () => {
    const store = createStore();
    expect(store.readIds()).toEqual([]);
  });

  it("persists read ids", () => {
    const store = createStore();
    store.setReadIds(["a", "b"]);
    expect(store.readIds()).toEqual(["a", "b"]);
  });

  it("deduplicates read ids", () => {
    const store = createStore();
    store.setReadIds(["a", "b", "a"]);
    expect(store.readIds()).toEqual(["a", "b"]);
  });

  it("returns false for undismissed banner", () => {
    const store = createStore();
    expect(store.isBannerDismissed("a")).toBe(false);
  });

  it("persists banner dismissal", () => {
    const store = createStore();
    store.dismissBanner("a");
    expect(store.isBannerDismissed("a")).toBe(true);
  });
});

describe("createStore with localStorage disabled", () => {
  let orig: Storage;

  beforeEach(() => {
    orig = window.localStorage;
    window.localStorage = new Proxy(orig, {
      get: () => { throw new Error("localStorage unavailable"); }
    });
  });

  afterEach(() => {
    window.localStorage = orig;
  });

  it("falls back to in-memory store", () => {
    const store = createStore();
    store.setReadIds(["a"]);
    expect(store.readIds()).toEqual(["a"]);
  });

  it("banner dismissals work in memory", () => {
    const store = createStore();
    store.dismissBanner("b");
    expect(store.isBannerDismissed("b")).toBe(true);
  });
});

describe("unreadCount", () => {
  it("returns total when no read ids", () => {
    expect(unreadCount(announcements, [])).toBe(2);
  });

  it("returns 0 when all read", () => {
    expect(unreadCount(announcements, ["a", "b"])).toBe(0);
  });

  it("returns correct partial count", () => {
    expect(unreadCount(announcements, ["a"])).toBe(1);
  });

  it("ignores unknown read ids", () => {
    expect(unreadCount(announcements, ["unknown"])).toBe(2);
  });
});

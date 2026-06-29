// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchAnnouncements, postEvent } from "./api";
import type { WidgetConfig } from "./types";

const config: WidgetConfig = {
  apiBaseUrl: "http://localhost:3000",
  position: "bottom-right",
  color: "#6366f1",
  trigger: "bell"
};

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn();
});

describe("fetchAnnouncements", () => {
  it("returns the array from body.announcements on success", async () => {
    const announcements = [
      { id: "a", title: "A", body: "body", published_at: "2024-01-01" }
    ];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ announcements })
    });

    const result = await fetchAnnouncements(config);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/announcements"
    );
    expect(result).toEqual(announcements);
  });

  it("throws 'Failed to fetch announcements' on non-ok response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({})
    });

    await expect(fetchAnnouncements(config)).rejects.toThrow(
      "Failed to fetch announcements"
    );
  });

  it("returns an empty array when body.announcements is not an array", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ announcements: "nope" })
    });

    const result = await fetchAnnouncements(config);

    expect(result).toEqual([]);
  });
});

describe("postEvent", () => {
  it("calls fetch with the correct URL, method, headers, body, and keepalive", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

    postEvent(config, "view", "abc123");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/analytics/view",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcement_id: "abc123" }),
        keepalive: true
      }
    );
  });

  it("swallows errors and does not throw", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("network")
    );

    expect(() => postEvent(config, "click", "abc123")).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});

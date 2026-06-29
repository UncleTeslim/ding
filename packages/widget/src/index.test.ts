import { describe, expect, it, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = "";
  document.head.innerHTML = "";
  vi.restoreAllMocks();
});

function setupScript(trigger = "bell") {
  const script = document.createElement("script");
  script.src = "/widget.js";
  script.dataset.position = "bottom-right";
  script.dataset.color = "#6366f1";
  script.dataset.trigger = trigger;
  document.body.appendChild(script);
}

function mockFetchSuccess(announcements: { id: string; title: string; body: string; tag?: string; published_at: string }[] = []) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ announcements })
  }) as unknown as typeof fetch;
}

const sampleAnnouncements = [
  { id: "a", title: "First", body: "Body A", tag: "Fix", published_at: "2026-06-01T00:00:00.000Z" },
  { id: "b", title: "Second", body: "Body B", tag: "New Feature", published_at: "2026-06-02T00:00:00.000Z" }
];

describe("widget boot", () => {
  it("creates ding-root on boot", async () => {
    setupScript();
    mockFetchSuccess(sampleAnnouncements);
    await import("./index");
    await new Promise((r) => setTimeout(r, 50));
    expect(document.getElementById("ding-root")).toBeTruthy();
  });

  it("fetches announcements and renders bell with badge", async () => {
    setupScript();
    mockFetchSuccess(sampleAnnouncements);
    await import("./index");
    await new Promise((r) => setTimeout(r, 50));
    const bell = document.querySelector(".ding-bell");
    expect(bell).toBeTruthy();
    const badge = document.querySelector(".ding-badge");
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toBe("2");
  });

  it("does not boot without a script tag", async () => {
    mockFetchSuccess(sampleAnnouncements);
    await import("./index");
    await new Promise((r) => setTimeout(r, 50));
    expect(document.getElementById("ding-root")).toBeFalsy();
  });

  it("handles fetch failure gracefully", async () => {
    setupScript();
    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;
    await import("./index");
    await new Promise((r) => setTimeout(r, 50));
    expect(document.getElementById("ding-root")).toBeTruthy();
  });

  it("renders announcements in panel list", async () => {
    setupScript();
    mockFetchSuccess(sampleAnnouncements);
    await import("./index");
    await new Promise((r) => setTimeout(r, 50));
    const titles = document.querySelectorAll(".ding-title");
    expect(titles).toHaveLength(2);
    expect(titles[0]?.textContent).toBe("First");
  });
});

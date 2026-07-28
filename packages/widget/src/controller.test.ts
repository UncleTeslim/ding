import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWidgetController } from "./controller";
import { fetchAnnouncements } from "./api";
import { markVisibleAsRead, recordAnnouncementClick } from "./events";
import { render } from "./ui";
import type { Store } from "./storage";
import type { WidgetState } from "./state";
import type { WidgetConfig } from "./types";

vi.mock("./api", () => ({ fetchAnnouncements: vi.fn() }));
vi.mock("./events", () => ({
  markVisibleAsRead: vi.fn(),
  recordAnnouncementClick: vi.fn()
}));
vi.mock("./ui", () => ({ render: vi.fn() }));

const config: WidgetConfig = {
  apiBaseUrl: "http://localhost:3000",
  position: "bottom-right",
  color: "#6366f1",
  trigger: "bell"
};

const announcement = {
  id: "a",
  title: "A",
  body: "body",
  published_at: "2026-01-01T00:00:00.000Z"
};

function makeStore(): Store {
  return {
    readIds: vi.fn(() => []),
    setReadIds: vi.fn(),
    isBannerDismissed: vi.fn(() => false),
    dismissBanner: vi.fn()
  };
}

function makeState(): WidgetState {
  return { announcements: [], open: false, expanded: new Set(), viewedIds: new Set() };
}

function makeRoot() {
  const root = document.createElement("div");
  root.innerHTML = '<div class="ding-panel"></div><div class="ding-backdrop"></div>';
  document.body.append(root);
  return root;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  document.body.innerHTML = "";
  Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 0;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("createWidgetController", () => {
  it("loads announcements and refreshes the view", async () => {
    vi.mocked(fetchAnnouncements).mockResolvedValue([announcement]);
    const root = makeRoot();
    const state = makeState();
    const controller = createWidgetController(root, config, makeStore(), state);

    await controller.load();

    expect(state.announcements).toEqual([announcement]);
    expect(render).toHaveBeenCalled();
  });

  it("swallows load failures and logs a warning", async () => {
    vi.mocked(fetchAnnouncements).mockRejectedValue(new Error("network"));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const controller = createWidgetController(makeRoot(), config, makeStore(), makeState());

    await controller.load();

    expect(warning).toHaveBeenCalledWith("[Ding] Failed to fetch announcements.");
  });

  it("opens, expands, dismisses, and closes through rendered actions", async () => {
    vi.mocked(fetchAnnouncements).mockResolvedValue([announcement]);
    const root = makeRoot();
    const state = makeState();
    state.announcements = [announcement];
    const store = makeStore();
    const controller = createWidgetController(root, config, store, state);
    await controller.load();
    const actions = vi.mocked(render).mock.calls.at(-1)?.[4] as {
      togglePanel: (event?: Event) => void;
      dismissBanner: (id: string) => void;
      expandAnnouncement: (id: string) => void;
    };

    const event = { stopPropagation: vi.fn() } as unknown as Event;
    actions.togglePanel(event);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(state.open).toBe(true);
    expect(markVisibleAsRead).toHaveBeenCalledWith(config, store, state.announcements, state.viewedIds);

    actions.expandAnnouncement("a");
    expect(state.expanded.has("a")).toBe(true);
    expect(recordAnnouncementClick).toHaveBeenCalledWith(config, "a");
    actions.dismissBanner("a");
    expect(store.dismissBanner).toHaveBeenCalledWith("a");

    actions.togglePanel();
    actions.togglePanel();
    vi.advanceTimersByTime(200);
    expect(state.open).toBe(false);
  });

  it("animates the panel on open and supports polling and document listeners", async () => {
    vi.mocked(fetchAnnouncements).mockResolvedValue([]);
    const root = makeRoot();
    const state = makeState();
    const controller = createWidgetController(root, config, makeStore(), state);
    controller.attachDocumentListeners();
    controller.startPolling();

    // Trigger a render so the controller's actions are available.
    await controller.load();
    const loadedActions = vi.mocked(render).mock.calls.at(-1)?.[4] as { togglePanel: () => void };
    loadedActions.togglePanel();
    expect(root.querySelector(".ding-panel")?.classList.contains("ding-panel-open")).toBe(true);

    // Clicks inside the widget are ignored; clicks elsewhere close it.
    root.querySelector(".ding-panel")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(state.open).toBe(true);
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(state.open).toBe(false);

    loadedActions.togglePanel();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(state.open).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    vi.advanceTimersByTime(200);
    expect(state.open).toBe(false);

    vi.advanceTimersByTime(60_000);
    expect(fetchAnnouncements).toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    const calls = vi.mocked(fetchAnnouncements).mock.calls.length;
    vi.advanceTimersByTime(60_000);
    expect(vi.mocked(fetchAnnouncements).mock.calls.length).toBe(calls);

    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
    expect(fetchAnnouncements).toHaveBeenCalled();
    controller.stopPolling();
  });
});

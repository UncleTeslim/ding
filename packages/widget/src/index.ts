import { fetchAnnouncements } from "./api";
import { currentScript, readConfig } from "./config";
import { createStore } from "./storage";
import { createRoot, injectStyles, markVisibleAsRead, render, type WidgetState } from "./ui";

function boot() {
  const script = currentScript();
  if (!script) return;

  const config = readConfig(script);
  const store = createStore();
  const state: WidgetState = { announcements: [], open: false, expanded: new Set() };
  let interval: number | undefined;

  injectStyles(config);
  const root = createRoot();

  const refresh = () => render(root, config, store, state, togglePanel, refresh);

  async function load(showBanner = true) {
    try {
      state.announcements = await fetchAnnouncements(config);
      refresh();
    } catch {
      console.warn("[Ding] Failed to fetch announcements.");
    }
  }

  function togglePanel(event?: Event) {
    event?.stopPropagation();
    state.open = !state.open;
    if (state.open) markVisibleAsRead(config, store, state.announcements);
    refresh();
  }

  document.addEventListener("click", (event) => {
    if (!state.open) return;
    if (event.target instanceof Node && root.contains(event.target)) return;
    state.open = false;
    refresh();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.open) {
      state.open = false;
      refresh();
    }
  });

  function startPolling() {
    window.clearInterval(interval);
    interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load(false);
    }, 60_000);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      load(false);
      startPolling();
    } else {
      window.clearInterval(interval);
    }
  });

  load();
  startPolling();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}

export { readConfig } from "./config";
export { renderMarkdown, truncateText } from "./markdown";
export { createStore, unreadCount } from "./storage";

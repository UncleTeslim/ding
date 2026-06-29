import { fetchAnnouncements } from "./api";
import { currentScript, readConfig } from "./config";
import { createStore } from "./storage";
import { createRoot, injectStyles, markVisibleAsRead, render, type WidgetState } from "./ui";

function boot() {
  const script = currentScript();
  if (!script) return;

  const config = readConfig(script);
  const store = createStore();
  const state: WidgetState = { announcements: [], open: false, expanded: new Set(), viewedIds: new Set() };
  let interval: number | undefined;

  injectStyles(config);
  const root = createRoot();

  let justOpened = false;
  let animatingClose = false;

  const refresh = () => {
    render(root, config, store, state, togglePanel, refresh);
    const panel = root.querySelector<HTMLElement>(".ding-panel");
    const backdrop = root.querySelector<HTMLElement>(".ding-backdrop");
    if (state.open && !animatingClose) {
      if (justOpened) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            panel?.classList.add("ding-panel-open");
            backdrop?.classList.add("ding-backdrop-show");
          });
        });
        justOpened = false;
      } else {
        panel?.classList.add("ding-panel-open");
        backdrop?.classList.add("ding-backdrop-show");
      }
    }
  };

  async function load(showBanner = true) {
    try {
      state.announcements = await fetchAnnouncements(config);
      refresh();
    } catch {
      console.warn("[Ding] Failed to fetch announcements.");
    }
  }

  function openPanel() {
    state.open = true;
    justOpened = true;
    if (state.open) markVisibleAsRead(config, store, state.announcements, state.viewedIds);
    refresh();
  }

  function closePanel() {
    if (!state.open || animatingClose) return;
    animatingClose = true;
    root.querySelector(".ding-panel")?.classList.remove("ding-panel-open");
    root.querySelector(".ding-backdrop")?.classList.remove("ding-backdrop-show");
    setTimeout(() => {
      state.open = false;
      animatingClose = false;
      refresh();
    }, 200);
  }

  function togglePanel(event?: Event) {
    event?.stopPropagation();
    if (state.open) closePanel();
    else openPanel();
  }

  document.addEventListener("click", (event) => {
    if (!state.open) return;
    if (event.target instanceof Node && root.contains(event.target)) return;
    closePanel();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.open) {
      closePanel();
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

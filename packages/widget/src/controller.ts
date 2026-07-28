import { fetchAnnouncements } from "./api";
import { markVisibleAsRead, recordAnnouncementClick } from "./events";
import type { Store } from "./storage";
import { render } from "./ui";
import type { WidgetState } from "./state";
import type { WidgetConfig } from "./types";

const pollingMs = 60_000;
const closeAnimationMs = 200;

export function createWidgetController(
  root: HTMLElement,
  config: WidgetConfig,
  store: Store,
  state: WidgetState
) {
  let interval: number | undefined;
  let justOpened = false;
  let animatingClose = false;

  const refresh = () => {
    render(root, config, store, state, actions);
    syncPanelAnimation();
  };

  const actions = {
    togglePanel(event?: Event) {
      event?.stopPropagation();
      if (state.open) closePanel();
      else openPanel();
    },
    dismissBanner(announcementId: string) {
      store.dismissBanner(announcementId);
      refresh();
    },
    expandAnnouncement(announcementId: string) {
      state.expanded.add(announcementId);
      recordAnnouncementClick(config, announcementId);
      refresh();
    },
    refresh
  };

  async function load() {
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
    markVisibleAsRead(config, store, state.announcements, state.viewedIds);
    refresh();
  }

  function closePanel() {
    if (!state.open || animatingClose) return;
    animatingClose = true;
    root.querySelector(".ding-panel")?.classList.remove("ding-panel-open");
    root.querySelector(".ding-backdrop")?.classList.remove("ding-backdrop-show");
    window.setTimeout(() => {
      state.open = false;
      animatingClose = false;
      refresh();
    }, closeAnimationMs);
  }

  function syncPanelAnimation() {
    const panel = root.querySelector<HTMLElement>(".ding-panel");
    const backdrop = root.querySelector<HTMLElement>(".ding-backdrop");
    if (!state.open || animatingClose) return;

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

  function startPolling() {
    window.clearInterval(interval);
    interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, pollingMs);
  }

  function stopPolling() {
    window.clearInterval(interval);
  }

  function attachDocumentListeners() {
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

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void load();
        startPolling();
      } else {
        stopPolling();
      }
    });
  }

  return { attachDocumentListeners, load, startPolling, stopPolling };
}

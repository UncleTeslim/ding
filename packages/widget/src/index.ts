import { currentScript, readConfig } from "./config";
import { createStore } from "./storage";
import { createWidgetController } from "./controller";
import { createWidgetState } from "./state";
import { createRoot, injectStyles } from "./ui";

function boot() {
  const script = currentScript();
  if (!script) return;

  const config = readConfig(script);
  const store = createStore();
  const state = createWidgetState();

  injectStyles(config);
  const root = createRoot();
  const controller = createWidgetController(root, config, store, state);

  controller.attachDocumentListeners();
  void controller.load();
  controller.startPolling();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}

export { readConfig } from "./config";
export { renderMarkdown, truncateText } from "./markdown";
export { createStore, unreadCount } from "./storage";

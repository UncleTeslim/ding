import { postEvent } from "./api";
import { renderMarkdown, truncateText } from "./markdown";
import type { Store } from "./storage";
import { unreadCount } from "./storage";
import type { Announcement, WidgetConfig } from "./types";

export type WidgetState = {
  announcements: Announcement[];
  open: boolean;
  expanded: Set<string>;
};

const rootId = "ding-root";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function positionStyle(position: string) {
  const [vertical, horizontal] = position.split("-");
  return `${vertical}: 20px; ${horizontal}: 20px;`;
}

export function injectStyles(config: WidgetConfig) {
  if (document.getElementById("ding-styles")) return;
  const style = document.createElement("style");
  style.id = "ding-styles";
  style.textContent = `
    :root { --ding-primary:${config.color}; --ding-bg:#fff; --ding-text:#111827; --ding-muted:#6b7280; --ding-border:#e5e7eb; --ding-badge:#ef4444; --ding-radius:8px; --ding-shadow:0 12px 30px rgba(15,23,42,.18); --ding-font:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; --ding-z:99999; }
    #ding-root, #ding-root * { box-sizing:border-box; font-family:var(--ding-font); letter-spacing:0; }
    .ding-trigger { position:fixed; z-index:var(--ding-z); }
    .ding-bell { width:44px; height:44px; border:1px solid var(--ding-border); border-radius:999px; background:var(--ding-bg); color:var(--ding-text); box-shadow:var(--ding-shadow); cursor:pointer; display:grid; place-items:center; }
    .ding-bell svg { width:21px; height:21px; }
    .ding-badge { position:absolute; top:-5px; right:-5px; min-width:19px; height:19px; padding:0 5px; border-radius:999px; background:var(--ding-badge); color:#fff; font-size:12px; line-height:19px; text-align:center; font-weight:700; }
    .ding-panel { position:fixed; z-index:var(--ding-z); width:min(390px, calc(100vw - 32px)); max-height:min(620px, calc(100vh - 96px)); background:var(--ding-bg); color:var(--ding-text); border:1px solid var(--ding-border); border-radius:var(--ding-radius); box-shadow:var(--ding-shadow); overflow:hidden; display:flex; flex-direction:column; }
    .ding-panel[hidden] { display:none; }
    .ding-panel-header { display:flex; align-items:center; justify-content:space-between; padding:16px; border-bottom:1px solid var(--ding-border); }
    .ding-panel-header h2 { margin:0; font-size:18px; line-height:1.2; }
    .ding-icon-button { border:0; background:transparent; color:var(--ding-muted); font-size:22px; cursor:pointer; width:32px; height:32px; }
    .ding-list { overflow:auto; padding:4px 0; }
    .ding-announcement { padding:16px; border-bottom:1px solid var(--ding-border); }
    .ding-meta { display:flex; gap:10px; align-items:center; margin-bottom:8px; color:var(--ding-muted); font-size:12px; }
    .ding-tag { color:var(--ding-primary); font-weight:700; }
    .ding-title { margin:0 0 8px; font-size:15px; line-height:1.35; }
    .ding-body { color:#374151; font-size:14px; line-height:1.55; }
    .ding-body p { margin:0 0 8px; }
    .ding-body ul { margin:0 0 8px 18px; padding:0; }
    .ding-body a { color:var(--ding-primary); }
    .ding-read-more { border:0; background:transparent; color:var(--ding-primary); font-weight:700; padding:0; cursor:pointer; font-size:14px; }
    .ding-empty { padding:28px 16px; color:var(--ding-muted); text-align:center; font-size:14px; }
    .ding-banner { position:fixed; top:12px; left:50%; transform:translateX(-50%); z-index:var(--ding-z); width:min(680px, calc(100vw - 24px)); display:flex; align-items:center; gap:12px; padding:10px 12px; border:1px solid var(--ding-border); border-radius:var(--ding-radius); background:var(--ding-bg); box-shadow:var(--ding-shadow); color:var(--ding-text); }
    .ding-banner-text { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; }
    .ding-banner-open { border:0; border-radius:6px; background:var(--ding-primary); color:#fff; padding:7px 10px; cursor:pointer; font-weight:700; font-size:13px; }
    @media (max-width: 520px) { .ding-banner { align-items:flex-start; } .ding-banner-text { white-space:normal; } }
  `;
  document.head.append(style);
}

export function createRoot() {
  document.getElementById(rootId)?.remove();
  const root = document.createElement("div");
  root.id = rootId;
  document.body.append(root);
  return root;
}

export function render(root: HTMLElement, config: WidgetConfig, store: Store, state: WidgetState, onToggle: () => void, onRefresh: () => void) {
  const count = unreadCount(state.announcements, store.readIds());
  const latest = state.announcements[0];
  const showBell = config.trigger === "bell" || config.trigger === "both";
  const showBanner = (config.trigger === "banner" || config.trigger === "both") && latest && count > 0 && !store.isBannerDismissed(latest.id);
  const panelPosition = config.position.includes("right") ? "right:20px;" : "left:20px;";
  const panelVertical = config.position.startsWith("top") ? "top:76px;" : "bottom:76px;";

  root.innerHTML = `
    ${showBell ? `<div class="ding-trigger" style="${positionStyle(config.position)}"><button class="ding-bell" aria-label="What's new" data-ding-open><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>${count ? `<span class="ding-badge">${count}</span>` : ""}</button></div>` : ""}
    ${showBanner ? `<div class="ding-banner" role="alert" aria-live="polite"><span class="ding-banner-text">What's new: ${escapeHtml(latest.title)}</span><button class="ding-banner-open" data-ding-open>See what's new</button><button class="ding-icon-button" aria-label="Dismiss" data-ding-dismiss>&times;</button></div>` : ""}
    <section class="ding-panel" role="dialog" aria-modal="true" aria-label="Changelog" style="${panelPosition}${panelVertical}" ${state.open ? "" : "hidden"}>
      <div class="ding-panel-header"><h2>What's new</h2><button class="ding-icon-button" aria-label="Close" data-ding-close>&times;</button></div>
      <div class="ding-list">${state.announcements.length ? state.announcements.map((announcement) => announcementHtml(announcement, state.expanded.has(announcement.id))).join("") : `<div class="ding-empty">No announcements yet.</div>`}</div>
    </section>
  `;

  root.querySelectorAll("[data-ding-open]").forEach((button) => button.addEventListener("click", onToggle));
  root.querySelector("[data-ding-close]")?.addEventListener("click", onToggle);
  root.querySelector("[data-ding-dismiss]")?.addEventListener("click", () => {
    if (latest) store.dismissBanner(latest.id);
    onRefresh();
  });
  root.querySelectorAll<HTMLElement>("[data-ding-read-more]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.dingReadMore;
      if (!id) return;
      state.expanded.add(id);
      postEvent(config, "click", id);
      onRefresh();
    });
  });
}

function announcementHtml(announcement: Announcement, expanded: boolean) {
  const body = expanded ? renderMarkdown(announcement.body) : `${escapeHtml(truncateText(announcement.body))} ${announcement.body.length > 150 ? `<button class="ding-read-more" data-ding-read-more="${escapeHtml(announcement.id)}">Read more</button>` : ""}`;
  return `
    <article class="ding-announcement">
      <div class="ding-meta">${announcement.tag ? `<span class="ding-tag">${escapeHtml(announcement.tag)}</span>` : ""}<time datetime="${escapeHtml(announcement.published_at)}">${formatDate(announcement.published_at)}</time></div>
      <h3 class="ding-title">${escapeHtml(announcement.title)}</h3>
      <div class="ding-body">${body}</div>
    </article>
  `;
}

export function markVisibleAsRead(config: WidgetConfig, store: Store, announcements: Announcement[]) {
  const ids = announcements.map((announcement) => announcement.id);
  store.setReadIds([...store.readIds(), ...ids]);
  for (const id of ids) postEvent(config, "view", id);
}

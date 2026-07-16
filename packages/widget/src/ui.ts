import { postEvent } from "./api";
import { renderMarkdown, truncateText } from "./markdown";
import type { Store } from "./storage";
import { unreadCount } from "./storage";
import type { Announcement, WidgetConfig } from "./types";

export type WidgetState = {
  announcements: Announcement[];
  open: boolean;
  expanded: Set<string>;
  viewedIds: Set<string>;
};

const rootId = "ding-root";
const MAX_VISIBLE = 20;

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
    :root { --ding-primary:${config.color}; --ding-bg:oklch(1 0 0); --ding-text:oklch(0.207 0.034 264); --ding-muted:oklch(0.553 0.048 256); --ding-border:oklch(0.929 0.013 257); --ding-badge:oklch(0.637 0.237 25); --ding-radius:12px; --ding-shadow:0 12px 30px oklch(0.208 0.042 265 / 0.18); --ding-font:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; --ding-z:99999; }
    #ding-root, #ding-root * { box-sizing:border-box; font-family:var(--ding-font); letter-spacing:0; font-synthesis:none; -webkit-font-smoothing:antialiased; }
    .ding-trigger { position:fixed; z-index:var(--ding-z); }
    .ding-bell { width:44px; height:44px; border:1px solid var(--ding-border); border-radius:999px; background:var(--ding-bg); color:var(--ding-text); box-shadow:var(--ding-shadow); cursor:pointer; display:grid; place-items:center; transition:transform 200ms ease; }
    .ding-bell:hover { transform:scale(1.08); }
    .ding-bell:active { transform:scale(0.96); }
    .ding-bell svg { width:21px; height:21px; }
    .ding-badge { position:absolute; top:-5px; right:-5px; min-width:19px; height:19px; padding:0 5px; border-radius:999px; background:var(--ding-badge); color:oklch(1 0 0); font-size:12px; line-height:19px; text-align:center; font-weight:700; font-variant-numeric:tabular-nums; animation:ding-badge-pop 300ms ease-out; }
    @keyframes ding-badge-pop { 0% { transform:scale(0); } 60% { transform:scale(1.2); } 100% { transform:scale(1); } }
    .ding-backdrop { position:fixed; inset:0; background:oklch(0 0 0 / 0.2); z-index:calc(var(--ding-z) - 1); opacity:0; pointer-events:none; transition:opacity 200ms ease; }
    .ding-backdrop.ding-backdrop-show { opacity:1; pointer-events:auto; }
    .ding-panel { position:fixed; z-index:var(--ding-z); width:min(390px, calc(100vw - 32px)); max-height:min(620px, calc(100vh - 96px)); background:var(--ding-bg); color:var(--ding-text); border:1px solid var(--ding-border); border-radius:var(--ding-radius); box-shadow:var(--ding-shadow); overflow:hidden; display:flex; flex-direction:column; opacity:0; transform:translateY(8px) scale(0.98); pointer-events:none; transition:opacity 200ms ease, transform 200ms cubic-bezier(0.34,1.56,0.64,1); }
    .ding-panel.ding-panel-open { opacity:1; transform:none; pointer-events:auto; }
    .ding-panel-header { display:flex; align-items:center; justify-content:space-between; padding:16px; border-bottom:1px solid var(--ding-border); }
    .ding-panel-header h2 { margin:0; font-size:18px; line-height:1.2; letter-spacing:-0.01em; text-wrap:balance; }
    .ding-icon-button { border:0; background:transparent; color:var(--ding-muted); font-size:22px; cursor:pointer; width:36px; height:36px; display:grid; place-items:center; border-radius:8px; transition:background 160ms ease; }
    .ding-icon-button:hover { background:oklch(0.929 0.013 257 / 0.5); }
    .ding-icon-button:active { transform:scale(0.96); }
    .ding-list { overflow:auto; padding:4px 0; }
    .ding-announcement { padding:16px; border-bottom:1px solid var(--ding-border); }
    .ding-meta { display:flex; gap:10px; align-items:center; margin-bottom:8px; color:var(--ding-muted); font-size:12px; font-variant-numeric:tabular-nums; }
    .ding-tag { color:var(--ding-primary); font-weight:700; letter-spacing:0.02em; }
    .ding-title { margin:0 0 8px; font-size:15px; line-height:1.35; text-wrap:balance; }
    .ding-body { color:oklch(0.376 0.04 257); font-size:14px; line-height:1.6; text-wrap:pretty; }
    .ding-body p { margin:0 0 8px; }
    .ding-body ul { margin:0 0 8px 18px; padding:0; }
    .ding-body a { color:var(--ding-primary); text-decoration:underline; text-underline-position:from-font; text-decoration-thickness:from-font; }
    .ding-body-expanded { animation:ding-fade-in 300ms ease; }
    @keyframes ding-fade-in { from { opacity:0; } to { opacity:1; } }
    .ding-read-more { border:0; background:transparent; color:var(--ding-primary); font-weight:700; padding:0; cursor:pointer; font-size:14px; }
    .ding-empty { padding:28px 16px; color:var(--ding-muted); text-align:center; font-size:14px; text-wrap:pretty; }
    .ding-banner { position:fixed; top:12px; left:50%; transform:translateX(-50%); z-index:var(--ding-z); width:min(680px, calc(100vw - 24px)); display:flex; align-items:center; gap:12px; padding:10px 12px; border:1px solid var(--ding-border); border-radius:var(--ding-radius); background:var(--ding-bg); box-shadow:var(--ding-shadow); color:var(--ding-text); }
    .ding-banner-text { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; }
    .ding-banner-open { border:0; border-radius:8px; background:var(--ding-primary); color:oklch(1 0 0); padding:8px 12px; cursor:pointer; font-weight:700; font-size:13px; transition:transform 120ms ease; }
    .ding-banner-open:active { transform:scale(0.96); }
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
    ${showBanner ? `<div class="ding-banner" role="alert" aria-live="polite"><span class="ding-banner-text">${escapeHtml(latest.title)}</span><button class="ding-banner-open" data-ding-open>Read what's new</button><button class="ding-icon-button" aria-label="Dismiss" data-ding-dismiss>&times;</button></div>` : ""}
    <div class="ding-backdrop" data-ding-close></div>
    <section class="ding-panel" role="dialog" aria-modal="true" aria-label="Changelog" style="${panelPosition}${panelVertical}">
      <div class="ding-panel-header"><h2>What's new</h2><button class="ding-icon-button" aria-label="Close" data-ding-close>&times;</button></div>
      <div class="ding-list">${state.announcements.length ? state.announcements.slice(0, MAX_VISIBLE).map((announcement) => announcementHtml(announcement, state.expanded.has(announcement.id))).join("") : `<div class="ding-empty">No announcements yet.</div>`}</div>
    </section>
  `;

  root.querySelectorAll("[data-ding-open]").forEach((button) => button.addEventListener("click", onToggle));
  root.querySelectorAll("[data-ding-close]").forEach((button) => button.addEventListener("click", onToggle));
  root.querySelector("[data-ding-dismiss]")?.addEventListener("click", () => {
    store.dismissBanner(latest.id);
    onRefresh();
  });
  root.querySelectorAll<HTMLElement>("[data-ding-read-more]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.dingReadMore;
      if (!id) return;
      const announcement = state.announcements.find((a) => a.id === id);
      if (!announcement) return;
      state.expanded.add(id);
      postEvent(config, "click", id);
      const bodyEl = button.closest(".ding-announcement")?.querySelector(".ding-body");
      if (bodyEl) {
        bodyEl.innerHTML = renderMarkdown(announcement.body);
        bodyEl.classList.add("ding-body-expanded");
      }
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

export function markVisibleAsRead(config: WidgetConfig, store: Store, announcements: Announcement[], viewedIds: Set<string>) {
  const ids = announcements.map((announcement) => announcement.id);
  store.setReadIds([...store.readIds(), ...ids]);
  for (const id of ids) {
    if (!viewedIds.has(id)) {
      viewedIds.add(id);
      postEvent(config, "view", id);
    }
  }
}

import type { Position, Trigger, WidgetConfig } from "./types";

const positions: Position[] = ["bottom-right", "bottom-left", "top-right", "top-left"];
const triggers: Trigger[] = ["bell", "banner", "both"];

function validHex(value: string | null) {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#6366f1";
}

export function readConfig(script: HTMLScriptElement): WidgetConfig {
  const src = new URL(script.src, window.location.href);
  const position = script.dataset.position as Position;
  const trigger = script.dataset.trigger as Trigger;

  return {
    apiBaseUrl: src.origin,
    position: positions.includes(position) ? position : "bottom-right",
    color: validHex(script.dataset.color ?? null),
    trigger: triggers.includes(trigger) ? trigger : "bell"
  };
}

export function currentScript() {
  return document.currentScript instanceof HTMLScriptElement
    ? document.currentScript
    : document.querySelector<HTMLScriptElement>("script[src*='widget.js']");
}

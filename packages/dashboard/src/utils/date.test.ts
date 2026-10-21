import { describe, expect, it } from "vitest";
import { parseTimestamp } from "./date";

describe("server timestamps", () => {
  it("treats zone-less SQLite timestamps as UTC", () => {
    expect(parseTimestamp("2026-10-20 12:30:00").toISOString()).toBe("2026-10-20T12:30:00.000Z");
  });
  it("preserves explicit ISO offsets", () => {
    expect(parseTimestamp("2026-10-20T13:30:00+01:00").toISOString()).toBe("2026-10-20T12:30:00.000Z");
  });
});

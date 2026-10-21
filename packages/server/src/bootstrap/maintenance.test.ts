import { afterEach, describe, expect, it, vi } from "vitest";
import { msUntilHour, startMaintenanceTasks } from "./maintenance.js";

afterEach(() => {
  vi.useRealTimers();
});

describe("msUntilHour", () => {
  it("returns ms until the target hour later today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T01:00:00"));
    const result = msUntilHour(3);
    expect(result).toBe(2 * 60 * 60 * 1000);
  });

  it("returns ms until the target hour tomorrow when it has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T04:00:00"));
    const result = msUntilHour(3);
    expect(result).toBe(23 * 60 * 60 * 1000);
  });

  it("returns ms until the target hour on the next day when it is exactly the hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T03:00:00"));
    const result = msUntilHour(3);
    expect(result).toBe(24 * 60 * 60 * 1000);
  });
});

describe("startMaintenanceTasks", () => {
  it("runs a task on the initial delay then repeats on the interval", () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const tasks = startMaintenanceTasks([{ name: "test", run, intervalMs: 1000, initialDelayMs: 500 }]);

    vi.advanceTimersByTime(499);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(run).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1000);
    expect(run).toHaveBeenCalledTimes(3);

    tasks.forEach((task) => task.stop());
  });

  it("defaults the initial delay to the interval", () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const tasks = startMaintenanceTasks([{ name: "test", run, intervalMs: 1000 }]);

    vi.advanceTimersByTime(999);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledTimes(1);

    tasks.forEach((task) => task.stop());
  });

  it("stops a task so it no longer runs", () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const tasks = startMaintenanceTasks([{ name: "test", run, intervalMs: 1000, initialDelayMs: 100 }]);

    vi.advanceTimersByTime(100);
    expect(run).toHaveBeenCalledTimes(1);
    tasks.forEach((task) => task.stop());
    vi.advanceTimersByTime(5000);
    expect(run).toHaveBeenCalledTimes(1);
  });
});
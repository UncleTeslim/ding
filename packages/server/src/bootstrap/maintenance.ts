export type MaintenanceTask = {
  name: string;
  run: () => void;
  intervalMs: number;
  initialDelayMs?: number;
};

export type RunningMaintenanceTask = {
  name: string;
  stop: () => void;
};

export function msUntilHour(hour: number) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function setTimeoutSafe(fn: () => void, ms: number) {
  const timer = setTimeout(fn, ms);
  timer.unref?.();
  return timer;
}

export function startMaintenanceTasks(tasks: MaintenanceTask[]): RunningMaintenanceTask[] {
  return tasks.map((task) => {
    let timer: NodeJS.Timeout;
    const tick = () => {
      task.run();
      timer = setTimeoutSafe(tick, task.intervalMs);
    };
    timer = setTimeoutSafe(tick, task.initialDelayMs ?? task.intervalMs);

    return {
      name: task.name,
      stop: () => clearTimeout(timer)
    };
  });
}

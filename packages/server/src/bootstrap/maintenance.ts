export type MaintenanceTask = {
  name: string;
  run: () => void;
  intervalMs: number;
};

export type RunningMaintenanceTask = {
  name: string;
  stop: () => void;
};

export function startMaintenanceTasks(tasks: MaintenanceTask[]): RunningMaintenanceTask[] {
  return tasks.map((task) => {
    const timer = setInterval(task.run, task.intervalMs);
    timer.unref?.();

    return {
      name: task.name,
      stop: () => clearInterval(timer)
    };
  });
}

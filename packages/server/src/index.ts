import { createApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { startMaintenanceTasks } from "./bootstrap/maintenance.js";
import { initializeStorage } from "./bootstrap/storage.js";
import { cleanupOldAnalytics } from "./modules/analytics/service.js";

const dayMs = 24 * 60 * 60 * 1000;

initializeStorage();
const maintenanceTasks = startMaintenanceTasks([
  { name: "analytics-retention", run: cleanupOldAnalytics, intervalMs: dayMs }
]);
const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, baseUrl: config.DING_BASE_URL }, "Ding listening");
});

function shutdown() {
  maintenanceTasks.forEach((task) => task.stop());
  server.close(() => {
    logger.info("Ding stopped");
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

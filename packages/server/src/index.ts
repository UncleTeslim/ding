import pino from "pino";
import { createApp } from "./app.js";
import { config } from "./config.js";

const logger = pino();
const app = createApp();

app.listen(config.PORT, () => {
  logger.info(`Ding listening on http://localhost:${config.PORT}`);
});

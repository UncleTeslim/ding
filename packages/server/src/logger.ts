import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: ["req.headers.cookie", "req.headers.authorization", "res.headers[\"set-cookie\"]"],
    censor: "[Redacted]"
  }
});

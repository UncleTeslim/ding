import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logger } from "./logger.js";

const envSchema = z.object({
  DING_ADMIN_USERNAME: z.string().min(1).default("admin"),
  DING_ADMIN_PASSWORD_HASH: z.string().min(1).default(bcrypt.hashSync("password", 10)),
  DING_JWT_SECRET: z.string().min(16).default("development-only-secret-change-me"),
  DING_IP_SALT: z.string().min(16).default("development-only-ip-salt-change-me"),
  DING_BASE_URL: z.string().url().default("http://localhost:3000"),
  DING_DB_PATH: z.string().default("./data/ding.db"),
  DING_TRUST_PROXY: z.coerce.boolean().default(true),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.string().default("development")
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  logger.error(parsed.error.flatten(), "Invalid configuration");
  process.exit(1);
}
export const config = parsed.data;
export const isProduction = config.NODE_ENV === "production";

const weakDevelopmentValues = ["development-only-secret-change-me", "development-only-ip-salt-change-me"];

if (isProduction) {
  const unsafe = [
    ["DING_JWT_SECRET", config.DING_JWT_SECRET],
    ["DING_IP_SALT", config.DING_IP_SALT]
  ].filter(([, value]) => weakDevelopmentValues.includes(value) || value.length < 48);

  if (unsafe.length) {
    logger.error({ vars: unsafe.map(([name]) => name) }, "Unsafe production configuration");
    process.exit(1);
  }
}

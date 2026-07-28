import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logger } from "./logger.js";

const isProductionEnv = process.env.NODE_ENV === "production";

const requiredInProduction = (name: string, fallback: string) =>
  isProductionEnv
    ? z.string({ required_error: `${name} is required in production.` }).trim().min(1)
    : z.string().trim().min(1).default(fallback);

const trustProxySchema = z.preprocess((value) => {
  if (value === undefined || value === "") return false;
  if (typeof value === "boolean") return value ? "loopback" : false;
  if (typeof value !== "string") return value;

  const normalized = value.trim().toLowerCase();
  if (normalized === "false") return false;
  if (normalized === "true") return "loopback";
  if (["loopback", "linklocal", "uniquelocal"].includes(normalized)) return normalized;
  return value;
}, z.union([z.literal(false), z.literal("loopback"), z.literal("linklocal"), z.literal("uniquelocal")]));

const envSchema = z.object({
  DING_ADMIN_USERNAME: requiredInProduction("DING_ADMIN_USERNAME", "admin"),
  DING_ADMIN_PASSWORD_HASH: isProductionEnv
    ? z.string({ required_error: "DING_ADMIN_PASSWORD_HASH is required in production." }).min(50)
    : z.string().min(1).default(() => bcrypt.hashSync("password", 10)),
  DING_JWT_SECRET: requiredInProduction("DING_JWT_SECRET", "development-only-secret-change-me"),
  DING_IP_SALT: requiredInProduction("DING_IP_SALT", "development-only-ip-salt-change-me"),
  DING_BASE_URL: z.string().url().default("http://localhost:3000"),
  DING_DB_PATH: z.string().default("./data/ding.db"),
  DING_TRUST_PROXY: trustProxySchema.default(false),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  logger.error(parsed.error.flatten(), "Invalid configuration");
  throw parsed.error;
}

export const config = parsed.data;
export const isProduction = config.NODE_ENV === "production";

const weakDevelopmentValues = [
  "development-only-secret-change-me",
  "development-only-ip-salt-change-me",
  "replace-with-a-64-character-random-secret",
  "replace-with-a-64-character-random-salt"
];

if (isProduction) {
  const unsafe = [
    ["DING_JWT_SECRET", config.DING_JWT_SECRET],
    ["DING_IP_SALT", config.DING_IP_SALT]
  ].filter(([, value]) => weakDevelopmentValues.includes(value) || value.length < 48);

  const baseUrl = new URL(config.DING_BASE_URL);
  if (baseUrl.protocol !== "https:") {
    unsafe.push(["DING_BASE_URL", config.DING_BASE_URL]);
  }

  if (bcrypt.compareSync("password", config.DING_ADMIN_PASSWORD_HASH)) {
    unsafe.push(["DING_ADMIN_PASSWORD_HASH", config.DING_ADMIN_PASSWORD_HASH]);
  }

  if (unsafe.length) {
    const names = unsafe.map(([name]) => name);
    logger.error({ vars: names }, "Unsafe production configuration");
    throw new Error(`Unsafe production configuration: ${names.join(", ")} must be set to production-safe values.`);
  }
}

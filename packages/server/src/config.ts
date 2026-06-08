import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";

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

export const config = envSchema.parse(process.env);
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

  if (unsafe.length) {
    throw new Error(
      `Unsafe production configuration: ${unsafe.map(([name]) => name).join(", ")} must be unique random values.`
    );
  }
}

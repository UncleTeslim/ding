import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });

const username = (await rl.question("Admin username [admin]: ")) || "admin";
const password = await rl.question("Admin password: ");
const baseUrlInput = await rl.question("Public HTTPS base URL [https://ding.example.com]: ");
rl.close();

if (!password.trim()) {
  throw new Error("Admin password is required.");
}

const baseUrl = (baseUrlInput || "https://ding.example.com").trim();
if (!/^https:\/\/.+/i.test(baseUrl)) {
  throw new Error("DING_BASE_URL must be an HTTPS URL.");
}

const env = [
  `DING_ADMIN_USERNAME=${username}`,
  `DING_ADMIN_PASSWORD_HASH=${bcrypt.hashSync(password, 12)}`,
  `DING_JWT_SECRET=${randomBytes(48).toString("hex")}`,
  `DING_IP_SALT=${randomBytes(48).toString("hex")}`,
  `DING_BASE_URL=${baseUrl}`,
  "DING_DB_PATH=./data/ding.db",
  "DING_TRUST_PROXY=false",
  "PORT=3000",
  "NODE_ENV=production",
  ""
].join("\n");

writeFileSync(".env", env, { encoding: "utf8" });
console.log(".env written.");

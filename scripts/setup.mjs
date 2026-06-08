import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = readline.createInterface({ input, output });

function quoteEnv(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

const usernameInput = (await rl.question("Admin username [admin]: ")).trim();
if (usernameInput.startsWith("cp ") || usernameInput.includes(".env")) {
  rl.close();
  throw new Error("That prompt expects a username, for example admin. Run shell commands before npm run setup, not inside it.");
}

const username = usernameInput || "admin";
const password = await rl.question("Admin password: ");
const baseUrlInput = (await rl.question("Public base URL [http://localhost:3000]: ")).trim();
const baseUrl = baseUrlInput || "http://localhost:3000";
rl.close();

if (!password.trim()) {
  throw new Error("Admin password is required.");
}

const env = [
  `DING_ADMIN_USERNAME=${quoteEnv(username)}`,
  `DING_ADMIN_PASSWORD_HASH=${quoteEnv(bcrypt.hashSync(password, 12))}`,
  `DING_JWT_SECRET=${quoteEnv(randomBytes(48).toString("hex"))}`,
  `DING_IP_SALT=${quoteEnv(randomBytes(48).toString("hex"))}`,
  `DING_BASE_URL=${quoteEnv(baseUrl)}`,
  "DING_DB_PATH=./data/ding.db",
  "DING_TRUST_PROXY=true",
  "PORT=3000",
  "NODE_ENV=production",
  ""
].join("\n");

writeFileSync(".env", env, { encoding: "utf8" });
console.log(".env written.");

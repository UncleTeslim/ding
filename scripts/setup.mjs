import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { pathToFileURL } from "node:url";

export function validatePublicUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Public URL must be a valid HTTPS URL, such as https://ding.example.com.");
  }

  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Public URL must be an HTTPS origin without credentials, a query string, or a hash.");
  }

  return url.origin;
}

export async function runSetup({ inputStream = input, outputStream = output, envPath = ".env" } = {}) {
  const rl = readline.createInterface({ input: inputStream, output: outputStream });

  const username = (await rl.question("Admin username [admin]: ")) || "admin";
  const password = await rl.question("Admin password: ");
  const publicUrlInput = await rl.question("Public HTTPS URL (for example, https://ding.example.com): ");
  rl.close();

  if (!password.trim()) {
    throw new Error("Admin password is required.");
  }

  const publicUrl = validatePublicUrl(publicUrlInput);

  const env = [
    `DING_ADMIN_USERNAME=${username}`,
    `DING_ADMIN_PASSWORD_HASH=${bcrypt.hashSync(password, 12)}`,
    `DING_JWT_SECRET=${randomBytes(48).toString("hex")}`,
    `DING_IP_SALT=${randomBytes(48).toString("hex")}`,
    `DING_BASE_URL=${publicUrl}`,
    "DING_DB_PATH=./data/ding.db",
    "DING_TRUST_PROXY=false",
    "PORT=3000",
    "NODE_ENV=production",
    ""
  ].join("\n");

  writeFileSync(envPath, env, { encoding: "utf8" });
  outputStream.write(`.env written for ${publicUrl}. Review it before starting Docker Compose.\n`);
  return { publicUrl, env };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runSetup();
}

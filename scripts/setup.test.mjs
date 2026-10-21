import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { formatEnvValue, runSetup, validatePublicUrl } from "./setup.mjs";

test("normalizes a valid public HTTPS origin", () => {
  assert.equal(validatePublicUrl("https://ding.example.com/"), "https://ding.example.com");
});

test("rejects non-HTTPS public URLs", () => {
  assert.throws(() => validatePublicUrl("http://localhost:3000"), /HTTPS origin/);
});

test("rejects URLs containing a path, credentials, query, or hash", () => {
  assert.throws(() => validatePublicUrl("https://admin:secret@ding.example.com/app?debug=1#top"), /HTTPS origin/);
});

test("formats dotenv values as literal-safe single-quoted values", () => {
  assert.equal(formatEnvValue("admin"), "'admin'");
  assert.equal(formatEnvValue("https://ding.example.com"), "'https://ding.example.com'");
  assert.equal(formatEnvValue("value with 'quotes'"), "'value with \\'quotes\\''");
});

test("setup preserves an existing environment file and refuses to rotate its credentials", async () => {
  const directory = mkdtempSync(join(tmpdir(), "ding-setup-"));
  const envPath = join(directory, ".env");
  try {
    writeFileSync(envPath, "DING_JWT_SECRET='existing-secret'\n");
    await assert.rejects(runSetup({ envPath }), /already exists/);
    assert.equal(readFileSync(envPath, "utf8"), "DING_JWT_SECRET='existing-secret'\n");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

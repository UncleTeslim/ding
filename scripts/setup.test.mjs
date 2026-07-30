import assert from "node:assert/strict";
import test from "node:test";
import { formatEnvValue, validatePublicUrl } from "./setup.mjs";

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

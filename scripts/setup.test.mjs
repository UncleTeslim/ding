import assert from "node:assert/strict";
import test from "node:test";
import { validatePublicUrl } from "./setup.mjs";

test("normalizes a valid public HTTPS origin", () => {
  assert.equal(validatePublicUrl("https://ding.example.com/"), "https://ding.example.com");
});

test("rejects non-HTTPS public URLs", () => {
  assert.throws(() => validatePublicUrl("http://localhost:3000"), /HTTPS origin/);
});

test("rejects URLs containing a path, credentials, query, or hash", () => {
  assert.throws(() => validatePublicUrl("https://admin:secret@ding.example.com/app?debug=1#top"), /HTTPS origin/);
});

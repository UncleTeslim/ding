import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSize } from "gzip-size";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = process.argv[2] ?? join(rootDir, "dist", "widget.js");
const budget = Number.parseInt(process.env.WIDGET_SIZE_BUDGET ?? "25000", 10);

const raw = await readFile(bundlePath);
const size = await gzipSize(raw);

console.log(`widget.js gzipped: ${(size / 1024).toFixed(2)}KB (${size} bytes) / budget ${budget} bytes`);

if (size > budget) {
  console.error(`FAIL: widget bundle exceeds ${budget} bytes gzipped.`);
  process.exit(1);
}
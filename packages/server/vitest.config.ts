import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Only instrument TypeScript source. SQL migrations are runtime assets,
      // not JavaScript modules, and V8's remapper cannot parse them.
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/index.ts", "src/**/*.test.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    }
  }
});

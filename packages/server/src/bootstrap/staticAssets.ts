import express, { type Express } from "express";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../../..");

export function mountStaticAssets(app: Express) {
  const widgetDist = join(repoRoot, "packages/widget/dist");
  const dashboardDist = join(repoRoot, "packages/dashboard/dist");
  const demoDir = join(repoRoot, "packages/server/public");

  if (existsSync(widgetDist)) {
    app.use(
      express.static(widgetDist, {
        immutable: false,
        setHeaders: (res, path) => {
          if (path.endsWith("widget.js")) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Cache-Control", "public, max-age=300");
          }
        }
      })
    );
  }

  if (existsSync(demoDir)) app.use("/demo", express.static(demoDir));

  if (existsSync(dashboardDist)) {
    app.use(express.static(dashboardDist));
    app.get("*", (_req, res) => res.sendFile(join(dashboardDist, "index.html")));
  }
}

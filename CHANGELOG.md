# Changelog

## 0.1.1

- Widget now caps visible announcements at 20 (MAX_VISIBLE) to protect DOM size.
- Added shared pino logger and pino-http request logging middleware.
- Added `DING_BASE_URL` env var for proxy-aware base URL configuration.
- Added F-12 bulk delete endpoint (`POST /api/admin/announcements/bulk-delete`) with dashboard checkboxes UI.
- Added vitest coverage config with 80% thresholds (lines/functions/statements) and 70% branches for server + widget packages.
- Added `npm run coverage` and `npm run benchmark` scripts.
- Added `scripts/benchmark.mjs` with autocannon load scenarios (public read, health, analytics write).
- Fixed duplicate export bug in `config.ts`.
- Updated `.github/workflows/ci.yml` to run coverage gate in CI.

## 0.1.0

- Initial Ding vertical MVP implementation.

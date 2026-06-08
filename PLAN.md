# Ding Vertical MVP Sprint Plan

## Summary
Build Ding as a greenfield monorepo in vertical sprints, proving the embed flow first, then expanding into admin publishing, analytics, deployment, polish, and open source launch readiness.

Sprint strategy: each sprint should leave the product runnable and demonstrable end to end. First milestone proves: server serves announcements, widget script loads from a host page, and a user can open/read a published announcement.

## Key Decisions
- V1 will not support an external full changelog link.
- V1 will not support private draft preview URLs; admin editor preview is enough.
- If `localStorage` is unavailable, the widget still works with volatile in-memory read/dismiss state.
- The banner displays the latest announcement title.
- Programmatic announcement publishing API is deferred to v1.1.
- Single-tenant only; `data-project-key` remains informational in v1.
- SQLite is the only v1 database.

## Sprint Plan

### Sprint 0: Foundation
- Initialize monorepo with `packages/server`, `packages/widget`, and `packages/dashboard`.
- Add TypeScript, npm workspaces, shared scripts, lint/build/test basics.
- Add `.env.example`, `README.md` skeleton, `CONTRIBUTING.md`, `LICENSE`, and initial `CHANGELOG.md`.
- Implement server boot, health check, static file serving, config validation, and SQLite migration runner.
- Acceptance: `npm install`, `npm run build`, and `npm run dev` work locally.

### Sprint 1: Embed MVP
- Implement `announcements` table and seed/dev create path.
- Add public `GET /api/announcements`, returning published announcements newest first.
- Build vanilla widget bundle that reads script `data-*` attributes, fetches announcements, renders bell trigger, panel, markdown body, and unread badge.
- Add demo host HTML page for local verification.
- Acceptance: a script tag loads `widget.js`, renders the widget, opens the panel, and shows one published announcement.

### Sprint 2: Admin Publishing
- Add admin auth with env-configured username, bcrypt password hash, JWT cookie, login/logout routes, and protected admin middleware.
- Add admin CRUD endpoints for create, edit, publish/unpublish, delete.
- Build dashboard login, announcement list, new/edit form, markdown preview, tag selector, date field, and draft/publish actions.
- Acceptance: a PM can log in, create a draft, publish it, edit it, and see the widget update within the poll cycle.

### Sprint 3: Analytics
- Add `analytics_events` table, IP hashing with salt, public view/click endpoints, and rate limiting.
- Widget records view events when the panel opens and click events when “Read more” expands.
- Admin list shows views, clicks, and CTR inline.
- Add nightly cleanup for analytics older than 12 months.
- Acceptance: opening/expanding announcements updates aggregate analytics without storing raw IPs.

### Sprint 4: Widget Completeness
- Add banner trigger mode, dismiss behavior, trigger config: `bell`, `banner`, `both`.
- Add position config, color config, outside-click close, Escape close, visibility-aware polling, silent fetch failure handling, and localStorage fallback.
- Harden widget styles with `ding-` prefixes and no third-party scripts/fonts/CDNs.
- Add widget unit tests for config parsing, unread state, storage fallback, polling, badge, banner dismissal, and fetch failure.
- Acceptance: widget works in the local demo across all trigger/position modes and remains under 25KB gzipped.

### Sprint 5: Deployment And Launch Readiness
- Add production Dockerfile and `docker-compose.yml`.
- Serve built dashboard and widget from the API server.
- Add setup helper for generating bcrypt password hash, JWT secret, and IP salt.
- Add GitHub Actions: install, build, server tests, widget tests, widget bundle-size check.
- Expand README with quick start, Docker setup, env reference, embed snippet, reverse proxy notes, and troubleshooting.
- Acceptance: fresh clone can run locally, Docker Compose can run the full app, and CI validates build/tests/bundle size.

## Public Interfaces
- Widget embed:
```html
<script
  src="https://your-ding-instance.com/widget.js"
  data-project-key="your-project-key"
  data-position="bottom-right"
  data-color="#6366f1"
  data-trigger="both"
  async
></script>
```

- Public API:
  - `GET /api/announcements`
  - `POST /api/analytics/view`
  - `POST /api/analytics/click`
  - `GET /health`

- Auth/admin API:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/admin/announcements`
  - `POST /api/admin/announcements`
  - `PUT /api/admin/announcements/:id`
  - `DELETE /api/admin/announcements/:id`
  - `GET /api/admin/analytics`

## Test Plan
- Server integration tests for auth, announcement CRUD, public announcement filtering/order, analytics recording, rate limiting, and migration order.
- Widget tests with jsdom for config, rendering, localStorage behavior, unread count, polling, banner dismissal, and graceful network/storage failure.
- Build checks for all packages.
- CI fails if `widget.js` exceeds 25KB gzipped.
- Manual acceptance after each sprint using the local demo host page and admin dashboard.

## Assumptions
- The current workspace is empty, so implementation starts from a new repository structure.
- V1 targets a single self-hosted instance with one admin credential pair.
- Admin dashboard browser support is Chrome/Firefox first.
- Admin UI can use larger dependencies; widget bundle remains dependency-sensitive.
- Documentation site, SSO, API tokens, webhooks, external changelog links, and draft preview URLs are out of v1.

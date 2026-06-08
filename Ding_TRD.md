# Ding — Technical Requirements Document (TRD)

**Version:** 1.0  
**Author:** Teslim Kazeem  
**Status:** Draft  
**Last Updated:** April 2026  
**Product:** Ding — Open Source Self-Hostable Embeddable Changelog Widget

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Database Schema](#5-database-schema)
6. [API Specification](#6-api-specification)
7. [Widget Specification](#7-widget-specification)
8. [Admin Dashboard Specification](#8-admin-dashboard-specification)
9. [Authentication and Security](#9-authentication-and-security)
10. [Analytics Implementation](#10-analytics-implementation)
11. [Deployment](#11-deployment)
12. [Configuration Reference](#12-configuration-reference)
13. [Testing Requirements](#13-testing-requirements)
14. [Performance Benchmarks](#14-performance-benchmarks)
15. [Open Source Project Requirements](#15-open-source-project-requirements)

---

## 1. System Overview

Ding consists of three components that work together:

1. **The Widget** — A self-contained vanilla JavaScript file embedded in the host product via a `<script>` tag. It renders the bell icon, the "What's new" banner, the announcement panel, and manages the read/unread state in localStorage. It communicates with the Ding API server via HTTP.

2. **The API Server** — A Node.js/Express server that exposes public endpoints (fetching announcements, recording analytics events) and authenticated admin endpoints (CRUD for announcements, reading analytics). It reads from and writes to a SQLite database.

3. **The Admin Dashboard** — A React single-page application served by the API server. It provides the UI for writing, publishing, and managing announcements, and for viewing analytics.

All three components are packaged together and deployed as a single Docker Compose stack.

```
┌─────────────────────────────────────────────────────┐
│                  Host Product                        │
│                                                      │
│   ┌──────────────────────────────────────────────┐  │
│   │           Ding Widget (vanilla JS)           │  │
│   │  - Bell icon / banner                        │  │
│   │  - Announcement panel                        │  │
│   │  - localStorage read/unread state            │  │
│   └──────────────┬───────────────────────────────┘  │
│                  │  HTTP (GET announcements,          │
│                  │  POST view/click events)           │
└──────────────────┼──────────────────────────────────┘
                   │
          ┌────────▼────────┐
          │   Ding Server   │
          │  (Node/Express) │
          │                 │
          │  Public API     │
          │  Admin API      │
          │  Static Files   │
          │  (Admin SPA +   │
          │   widget.js)    │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │     SQLite      │
          │   (better-      │
          │   sqlite3)      │
          └─────────────────┘
```

---

## 2. Architecture

### 2.1 Design Principles

**Single deployable unit.** The API server, admin dashboard, and widget script are all served from one process. No microservices. No separate build pipelines to synchronise. The deployer runs one Docker Compose command and gets everything.

**SQLite as the database.** For the expected load of a self-hosted changelog tool (thousands to tens of thousands of widget loads per day), SQLite is more than sufficient. It eliminates a separate database process, simplifies backup to a single file copy, and reduces the barrier to self-hosting. PostgreSQL support can be added in a future version.

**Stateless API, stateful widget.** The API server holds no session state for widget users. Read/unread state lives entirely in localStorage on the client. The server only stores aggregate analytics events.

**Widget is a compiled static asset.** The widget JavaScript is compiled and bundled at build time, then served as a static file by the API server. The host product loads it via a `<script>` tag. This means updates to the widget require a server update — there is no CDN distribution in v1.

**Admin session uses HTTP-only cookies.** After login, the server sets an HTTP-only session cookie containing a signed JWT. This protects against XSS-based token theft while keeping the session mechanism simple.

### 2.2 Request Flows

**Widget load flow:**
1. Host product HTML loads, browser parses `<script src="https://your-ding-instance.com/widget.js" data-project-key="xxx">`.
2. Widget JS executes asynchronously. Reads `data-*` attributes for configuration.
3. Widget calls `GET /api/announcements` to fetch published announcements.
4. Widget reads localStorage to determine which announcements have been seen.
5. Widget renders bell icon and/or banner with unread badge count.
6. Widget starts 60-second polling interval for new announcements.

**Panel open flow:**
1. User clicks bell icon or banner.
2. Widget renders announcement panel with cached announcement data.
3. Widget posts a view event to `POST /api/analytics/view` for each announcement visible in the panel.
4. Widget writes announcement IDs to localStorage as read.
5. Badge count updates to zero.

**Read more flow:**
1. User clicks "Read more" on an announcement.
2. Announcement body expands inline.
3. Widget posts a click event to `POST /api/analytics/click`.

**Publish flow:**
1. Publisher logs into admin dashboard.
2. Publisher writes announcement, clicks Publish.
3. Dashboard sends `POST /api/admin/announcements` with announcement data.
4. Server inserts record into database with `status = 'published'`.
5. Next widget poll (within 60 seconds) fetches the new announcement.
6. Badge count increments for users who have not seen it.

---

## 3. Technology Stack

### 3.1 Widget

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript (compiled to ES2017 JS) | Type safety during development, wide browser support after compilation |
| Bundler | esbuild | Fast, produces minimal output, handles TypeScript natively |
| CSS | Inline styles + CSS custom properties | No external stylesheet dependency; custom properties allow colour theming |
| Markdown rendering | marked.js (bundled) | Lightweight, battle-tested, safe with appropriate options |
| HTTP client | Native `fetch` API | No dependency needed, supported in all target browsers |
| State | localStorage only | No cookies, no session storage |

**Bundle size target: under 25KB gzipped.** This is a hard constraint. Every dependency added to the widget must be justified against this budget.

### 3.2 API Server

| Concern | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS | Stable, well-supported, available in all Docker base images |
| Framework | Express 4 | Minimal, well-understood, large ecosystem, easy to maintain solo |
| Database driver | better-sqlite3 | Synchronous API, excellent performance, no async complexity for SQLite |
| Migrations | db-migrate or hand-rolled on startup | Simple migration table tracking applied migrations |
| Authentication | JWT (jsonwebtoken) + HTTP-only cookie | Stateless session, XSS-safe |
| Password hashing | bcrypt | Standard, well-tested |
| Input validation | zod | TypeScript-first, clear error messages |
| Rate limiting | express-rate-limit | Simple, in-memory, sufficient for single-instance deployment |
| Static file serving | Express static middleware | Serves admin dashboard SPA and widget.js |
| Logging | pino | Structured JSON logging, low overhead |

### 3.3 Admin Dashboard

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 18 | Mainstream, well-documented, easy to get help with |
| Build tool | Vite | Fast dev server, simple production build |
| Routing | React Router v6 | Standard for React SPAs |
| Styling | Tailwind CSS | Utility-first, fast to build with, easy to maintain solo |
| Markdown editor | CodeMirror 6 with markdown mode | Lightweight, extensible, good UX |
| Markdown preview | marked.js | Shared with widget for consistent rendering |
| HTTP client | fetch (native) | No dependency needed |
| State management | React useState / useContext | No Redux needed at this scale |

### 3.4 Infrastructure

| Concern | Choice | Rationale |
|---|---|---|
| Containerisation | Docker + Docker Compose | Standard self-hosting delivery mechanism |
| Base image | node:20-alpine | Minimal size, security-hardened |
| Database storage | Docker volume mounted to host filesystem | Persistent SQLite file survives container restarts |
| Reverse proxy | Deployer's choice (Caddy, Nginx, Traefik) — documented for each | Not included in Docker Compose — deployer handles TLS |

---

## 4. Repository Structure

```
ding/
├── packages/
│   ├── widget/                  # Vanilla JS widget
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point, reads data attributes
│   │   │   ├── api.ts           # API calls (fetch announcements, post events)
│   │   │   ├── ui.ts            # DOM manipulation, panel render
│   │   │   ├── storage.ts       # localStorage read/unread management
│   │   │   ├── poll.ts          # 60-second polling logic
│   │   │   └── types.ts         # Shared TypeScript types
│   │   ├── build.js             # esbuild config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── server/                  # Node/Express API server
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point, Express app setup
│   │   │   ├── db/
│   │   │   │   ├── connection.ts    # SQLite connection singleton
│   │   │   │   └── migrations/      # SQL migration files
│   │   │   │       ├── 001_initial.sql
│   │   │   │       └── 002_analytics.sql
│   │   │   ├── routes/
│   │   │   │   ├── public.ts    # GET /api/announcements
│   │   │   │   ├── admin.ts     # Admin CRUD routes
│   │   │   │   ├── analytics.ts # POST /api/analytics/*
│   │   │   │   └── auth.ts      # POST /api/auth/login|logout
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts      # JWT verification middleware
│   │   │   │   └── rateLimit.ts # Rate limiter config
│   │   │   ├── services/
│   │   │   │   ├── announcements.ts
│   │   │   │   └── analytics.ts
│   │   │   └── types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── dashboard/               # React admin SPA
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── Announcements.tsx   # List + inline analytics
│       │   │   ├── NewAnnouncement.tsx
│       │   │   └── EditAnnouncement.tsx
│       │   ├── components/
│       │   │   ├── AnnouncementForm.tsx
│       │   │   ├── MarkdownEditor.tsx
│       │   │   ├── MarkdownPreview.tsx
│       │   │   ├── TagSelector.tsx
│       │   │   └── AnalyticsBadge.tsx
│       │   └── api/
│       │       └── client.ts    # Typed fetch wrapper
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.js
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
├── CONTRIBUTING.md
├── LICENSE                      # MIT
└── package.json                 # Root workspace (npm workspaces)
```

---

## 5. Database Schema

All tables are in a single SQLite database file (`ding.db`) stored in the Docker volume.

### 5.1 announcements

```sql
CREATE TABLE announcements (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  tag         TEXT,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at DATETIME,
  created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_published_at ON announcements(published_at DESC);
```

**Notes:**
- `id` is a random hex string (not sequential integer) to prevent enumeration.
- `tag` is a free text field — the default tags are enforced in application logic, not the schema.
- `published_at` is set to the current time when status changes to 'published'. If backdated, it is set to the date the publisher specified.
- `body` stores raw markdown. Rendering happens client-side.

### 5.2 analytics_events

```sql
CREATE TABLE analytics_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  ip_hash         TEXT NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_analytics_announcement ON analytics_events(announcement_id);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
```

**Notes:**
- `ip_hash` is SHA-256 of the raw IP address. The raw IP is never stored.
- Cascade delete ensures analytics data is removed if an announcement is deleted.
- Deduplication is enforced at query time, not storage time — all events are stored; counting is deduplicated by ip_hash + date window.

### 5.3 migrations

```sql
CREATE TABLE migrations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  filename    TEXT NOT NULL UNIQUE,
  applied_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);
```

The server checks this table on startup and applies any SQL files in `db/migrations/` that are not yet recorded here. Migrations are applied in filename order (001, 002, etc.).

### 5.4 sessions

Sessions are managed via signed JWTs stored in HTTP-only cookies. There is no sessions table. JWT expiry (7 days) handles session invalidation. Logout is handled by clearing the cookie client-side and the server setting an expired cookie.

---

## 6. API Specification

All endpoints use JSON request and response bodies. All admin endpoints require a valid session cookie.

Base URL: `https://your-ding-instance.com`

### 6.1 Public Endpoints

#### GET /api/announcements

Returns all published announcements, newest first. Used by the widget on load and on each poll cycle.

**Request:** No parameters, no authentication.

**Response 200:**
```json
{
  "announcements": [
    {
      "id": "a1b2c3d4e5f6a7b8",
      "title": "Dark mode is here",
      "body": "We've shipped **dark mode**. Toggle it in Settings → Appearance.",
      "tag": "New Feature",
      "published_at": "2026-04-12T09:00:00.000Z"
    }
  ]
}
```

**Behaviour:**
- Returns maximum 50 announcements (hard limit, not configurable).
- Only returns announcements with `status = 'published'`.
- Sorted by `published_at DESC`.
- Response is cached with `Cache-Control: public, max-age=30` to reduce server load under polling.

#### POST /api/analytics/view

Records that the widget panel was opened and an announcement was visible.

**Request body:**
```json
{
  "announcement_id": "a1b2c3d4e5f6a7b8"
}
```

**Response 204:** No content.

**Behaviour:**
- Rate limited: 10 requests per IP per announcement per hour (express-rate-limit, keyed by IP + announcement_id).
- If announcement_id does not exist, returns 204 silently (do not expose announcement existence to public).
- IP is hashed before storage. Raw IP is discarded.

#### POST /api/analytics/click

Records that a user clicked "Read more" on an announcement.

**Request body:**
```json
{
  "announcement_id": "a1b2c3d4e5f6a7b8"
}
```

**Response 204:** No content.

**Behaviour:** Same as /api/analytics/view.

### 6.2 Authentication Endpoints

#### POST /api/auth/login

**Request body:**
```json
{
  "username": "admin",
  "password": "yourpassword"
}
```

**Response 200:**
```json
{
  "ok": true
}
```

Sets an HTTP-only cookie named `ding_session` containing a signed JWT with 7-day expiry.

**Response 401:**
```json
{
  "error": "Invalid credentials"
}
```

**Behaviour:**
- Username and password are compared against environment variables `DING_ADMIN_USERNAME` and `DING_ADMIN_PASSWORD_HASH`.
- Login attempts rate-limited to 10 per IP per hour to prevent brute force.
- On success, JWT payload: `{ sub: "admin", iat: <unix>, exp: <unix+7days> }`.

#### POST /api/auth/logout

**Request:** Cookie required (but not validated — any logout request clears the cookie).

**Response 200:**
```json
{
  "ok": true
}
```

Sets `ding_session` cookie with immediate expiry.

### 6.3 Admin Endpoints

All admin endpoints require the `ding_session` cookie to be present and valid. Return 401 if missing or invalid.

#### GET /api/admin/announcements

Returns all announcements (published and draft) with analytics summary.

**Response 200:**
```json
{
  "announcements": [
    {
      "id": "a1b2c3d4e5f6a7b8",
      "title": "Dark mode is here",
      "body": "We've shipped **dark mode**.",
      "tag": "New Feature",
      "status": "published",
      "published_at": "2026-04-12T09:00:00.000Z",
      "created_at": "2026-04-11T14:00:00.000Z",
      "updated_at": "2026-04-12T09:00:00.000Z",
      "analytics": {
        "views": 342,
        "clicks": 89,
        "ctr": 26.0
      }
    }
  ]
}
```

#### POST /api/admin/announcements

Create a new announcement.

**Request body:**
```json
{
  "title": "Dark mode is here",
  "body": "We've shipped **dark mode**.",
  "tag": "New Feature",
  "status": "draft",
  "published_at": null
}
```

**Validation (zod):**
- `title`: string, min 1, max 100
- `body`: string, min 1, max 5000 (raw markdown)
- `tag`: string, optional, max 50
- `status`: enum ['draft', 'published']
- `published_at`: ISO datetime string or null. If status is 'published' and published_at is null, defaults to now.

**Response 201:**
```json
{
  "announcement": { ...full announcement object }
}
```

#### PUT /api/admin/announcements/:id

Update an existing announcement.

**Request body:** Same as POST, all fields optional. Only provided fields are updated.

**Response 200:**
```json
{
  "announcement": { ...full updated announcement object }
}
```

**Behaviour:**
- If `status` changes to 'published' and `published_at` is not provided, sets `published_at` to now.
- If `status` changes to 'draft', does not clear `published_at` (preserves history).
- Always updates `updated_at` to now.

#### DELETE /api/admin/announcements/:id

Delete an announcement and its analytics data.

**Response 204:** No content.

**Behaviour:**
- Cascade delete handles analytics_events.
- Both published and draft announcements can be deleted.

#### GET /api/admin/analytics

Returns aggregate analytics across all published announcements.

**Response 200:**
```json
{
  "summary": {
    "total_views": 4821,
    "total_clicks": 1203,
    "overall_ctr": 24.9
  },
  "by_announcement": [
    {
      "announcement_id": "a1b2c3d4e5f6a7b8",
      "title": "Dark mode is here",
      "views": 342,
      "clicks": 89,
      "ctr": 26.0
    }
  ]
}
```

**Deduplication query logic:**
```sql
SELECT 
  announcement_id,
  COUNT(DISTINCT ip_hash || date(created_at)) as deduplicated_count,
  event_type
FROM analytics_events
GROUP BY announcement_id, event_type
```

---

## 7. Widget Specification

### 7.1 Embed Code

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

### 7.2 Configuration Attributes

| Attribute | Type | Default | Options | Description |
|---|---|---|---|---|
| data-project-key | string | required | — | Identifies the Ding instance. Currently informational (v1 is single-tenant). |
| data-position | string | bottom-right | bottom-right, bottom-left, top-right, top-left | Position of the bell icon |
| data-color | string | #6366f1 | Any valid hex | Primary colour (badge, button accent) |
| data-trigger | string | bell | bell, banner, both | Which trigger(s) to show |

### 7.3 Widget Initialisation Sequence

```
1. Script tag parsed by browser
2. widget.js loads asynchronously (does not block render)
3. DOMContentLoaded fires (or immediately if DOM already loaded)
4. Widget reads data-* attributes from script tag
5. Widget injects CSS custom properties into document root
6. Widget creates and appends bell icon DOM element to body
7. Widget creates and appends panel DOM element to body (hidden)
8. Widget calls GET /api/announcements
9. Widget receives announcement list
10. Widget reads localStorage key "ding_read_ids" (JSON array of read IDs)
11. Widget calculates unread count (announcements not in read_ids)
12. Widget renders unread badge (if count > 0)
13. If trigger includes 'banner' and there are unread announcements:
    Widget checks localStorage key "ding_dismissed_banner_[latest_id]"
    If not dismissed, renders banner with latest announcement title
14. Widget starts polling interval (60 seconds)
```

### 7.4 localStorage Keys

| Key | Type | Purpose |
|---|---|---|
| ding_read_ids | JSON array of strings | Announcement IDs the user has seen |
| ding_dismissed_banner_[id] | boolean string ("1") | Whether the banner for a specific announcement was dismissed |

### 7.5 Widget DOM Structure

```html
<!-- Bell icon trigger -->
<div id="ding-trigger" style="position: fixed; [position vars];">
  <button id="ding-bell" aria-label="What's new">
    <!-- Bell SVG icon -->
    <span id="ding-badge">3</span>  <!-- Hidden if 0 -->
  </button>
</div>

<!-- What's new banner -->
<div id="ding-banner" role="alert" aria-live="polite">
  <span id="ding-banner-text">What's new: Dark mode is here</span>
  <button id="ding-banner-open">See what's new</button>
  <button id="ding-banner-dismiss" aria-label="Dismiss">✕</button>
</div>

<!-- Announcement panel -->
<div id="ding-panel" role="dialog" aria-modal="true" aria-label="Changelog" hidden>
  <div id="ding-panel-header">
    <h2>What's new</h2>
    <button id="ding-panel-close" aria-label="Close">✕</button>
  </div>
  <div id="ding-panel-list">
    <!-- Announcement items injected here -->
    <article class="ding-announcement">
      <header>
        <span class="ding-tag">New Feature</span>
        <time datetime="2026-04-12">12 Apr 2026</time>
      </header>
      <h3 class="ding-announcement-title">Dark mode is here</h3>
      <div class="ding-announcement-body ding-truncated">
        We've shipped dark mode. Toggle it in...
        <button class="ding-read-more">Read more</button>
      </div>
    </article>
  </div>
</div>
```

### 7.6 CSS Custom Properties

The widget injects these custom properties into `:root` at initialisation. The deployer's `data-color` value sets `--ding-primary`.

```css
:root {
  --ding-primary: #6366f1;          /* Configurable via data-color */
  --ding-background: #ffffff;
  --ding-text: #111827;
  --ding-text-muted: #6b7280;
  --ding-border: #e5e7eb;
  --ding-badge-bg: #ef4444;
  --ding-badge-text: #ffffff;
  --ding-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --ding-radius: 8px;
  --ding-font: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --ding-z-index: 99999;
}
```

All widget styles use `ding-` prefixed class names and are scoped to avoid conflicts with host product styles.

### 7.7 Polling Behaviour

- On load: immediate fetch.
- Poll interval: 60 seconds using `setInterval`.
- On tab hidden (`document.visibilityState === 'hidden'`): polling pauses.
- On tab visible again: immediate fetch + resume interval.
- On fetch failure (network error or non-2xx): log to console (warn level), continue polling. Widget does not show an error state to the user.
- On fetch success with new announcements (IDs not seen before): update unread badge. Do not auto-open panel or show banner for new announcements detected via poll (only on page load).

---

## 8. Admin Dashboard Specification

### 8.1 Routes

| Path | Component | Description |
|---|---|---|
| /login | Login | Username/password form |
| / | Announcements | List all announcements with analytics |
| /new | NewAnnouncement | Create form |
| /edit/:id | EditAnnouncement | Edit form |

All routes except `/login` are protected by an auth check. Unauthenticated requests redirect to `/login`.

### 8.2 Announcements List Page

Displays a table with columns: Status badge (Published/Draft), Title, Tag, Date, Views, Clicks, CTR, Actions (Edit, Unpublish/Publish toggle, Delete).

- Drafts appear above published announcements.
- Published announcements are sorted by `published_at DESC`.
- Inline CTR is formatted as a percentage with one decimal place. Zero state shows "—" not "0%".
- Delete requires a confirmation dialog ("Delete this announcement? This cannot be undone.").

### 8.3 Announcement Form (New and Edit)

Layout: Two-column on desktop (editor left, preview right). Single column on mobile.

**Fields:**
- Title: text input, character counter showing X/100.
- Body: CodeMirror editor with markdown syntax highlighting. Live preview updates on every keystroke with a 200ms debounce.
- Tag: dropdown with options (New Feature, Fix, Improvement, Announcement) plus an "Add custom tag" input that adds to the dropdown for this session.
- Date: date picker, defaults to today. Label: "Publication date".
- Status: toggle (Draft / Publish now). When set to "Publish now", date field locks to today unless manually changed.

**Actions:**
- "Save draft" button: always visible. Saves without changing status.
- "Publish" button: publishes immediately. Asks for confirmation if already published (to prevent accidental re-publish with a new date).
- "Cancel" button: returns to list. If unsaved changes exist, shows a browser-native confirm dialog.

### 8.4 Authentication State

The dashboard checks for a valid session on every page load by calling `GET /api/admin/announcements`. If the response is 401, it redirects to `/login`. The session cookie is HTTP-only so the dashboard cannot read it directly — the 401 response is the signal.

---

## 9. Authentication and Security

### 9.1 Admin Authentication

**Credentials storage:** At deployment time, the operator sets:
- `DING_ADMIN_USERNAME` — plaintext username (e.g. "admin")
- `DING_ADMIN_PASSWORD_HASH` — bcrypt hash of the password

A setup helper script (`npm run setup`) prompts for a username and password, hashes the password, and writes both to `.env`. This avoids the operator needing to understand bcrypt hashing manually.

**Session mechanism:**
- On successful login, server signs a JWT with `DING_JWT_SECRET` (set in `.env`).
- JWT payload: `{ sub: "admin", iat, exp }`.
- JWT is set as an HTTP-only, Secure (in production), SameSite=Strict cookie.
- Cookie name: `ding_session`.
- Expiry: 7 days.

**Auth middleware:**
```typescript
function requireAuth(req, res, next) {
  const token = req.cookies['ding_session'];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, process.env.DING_JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

### 9.2 CORS Configuration

The API server sets CORS headers to allow the widget to call the API from the host product's domain.

```typescript
app.use(cors({
  origin: '*',                    // Widget can be embedded on any domain
  methods: ['GET', 'POST'],       // Only what the public API needs
  allowedHeaders: ['Content-Type']
}));
```

Admin routes are excluded from the wildcard CORS policy — they use `SameSite=Strict` cookies which enforce same-origin behaviour natively.

### 9.3 Rate Limiting

```typescript
// Analytics endpoints
const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,      // 1 hour
  max: 10,                        // 10 events per IP per hour per route
  keyGenerator: (req) => {
    return req.ip + req.body.announcement_id;
  }
});

// Login endpoint
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,      // 1 hour
  max: 10,                        // 10 attempts per IP
});
```

### 9.4 Input Sanitisation

- All admin inputs are validated by zod schemas before reaching the database.
- Markdown body is stored as raw markdown. It is rendered client-side by marked.js with `sanitize: true` option (strips HTML from markdown input).
- No raw SQL string interpolation — all database queries use parameterised statements via better-sqlite3's prepared statement API.

### 9.5 Security Headers

Applied to all responses via a middleware:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

The admin dashboard SPA gets a stricter CSP. The widget.js endpoint gets relaxed CORS as described above.

---

## 10. Analytics Implementation

### 10.1 IP Hashing

```typescript
import { createHash } from 'crypto';

function hashIP(ip: string): string {
  return createHash('sha256')
    .update(ip + process.env.DING_IP_SALT)
    .digest('hex');
}
```

`DING_IP_SALT` is a random string set in `.env` at deployment time. This ensures the hash is not reversible even if an attacker knows the hashing algorithm. The salt is never stored outside `.env`.

### 10.2 Deduplication Query

Views and clicks are deduplicated per announcement per ip_hash per calendar day:

```sql
SELECT 
  announcement_id,
  event_type,
  COUNT(*) as raw_count,
  COUNT(DISTINCT ip_hash || '|' || date(created_at)) as deduped_count
FROM analytics_events
WHERE announcement_id = ?
GROUP BY announcement_id, event_type
```

### 10.3 CTR Calculation

```
CTR = (deduped_clicks / deduped_views) * 100
```

If views = 0, CTR = 0 (no division by zero).

### 10.4 Data Cleanup Job

A cleanup job runs once per day at 02:00 UTC (using `node-cron`):

```typescript
cron.schedule('0 2 * * *', () => {
  db.prepare(`
    DELETE FROM analytics_events 
    WHERE created_at < datetime('now', '-12 months')
  `).run();
});
```

---

## 11. Deployment

### 11.1 Docker Compose

```yaml
version: '3.8'

services:
  ding:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ding-data:/app/data
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  ding-data:
```

### 11.2 Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
RUN npm ci
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./
COPY --from=builder /app/packages/dashboard/dist ./public
COPY --from=builder /app/packages/widget/dist/widget.js ./public/widget.js
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 11.3 Environment Variables Reference

| Variable | Required | Description | Example |
|---|---|---|---|
| DING_ADMIN_USERNAME | Yes | Admin dashboard username | admin |
| DING_ADMIN_PASSWORD_HASH | Yes | bcrypt hash of admin password | $2b$12$... |
| DING_JWT_SECRET | Yes | Random string for JWT signing | 64+ character random string |
| DING_IP_SALT | Yes | Salt for IP hashing | 64+ character random string |
| DING_BASE_URL | Yes | Public URL of the Ding instance | https://ding.yourdomain.com |
| DING_DB_PATH | No | Path to SQLite file inside container | /app/data/ding.db |
| NODE_ENV | No | production in prod | production |
| PORT | No | Port to listen on | 3000 |

### 11.4 Reverse Proxy (Nginx example)

Documented in README. Deployers handle TLS themselves. Recommended setup: Caddy (automatic HTTPS) or Nginx with Certbot.

```nginx
server {
    server_name ding.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The `X-Real-IP` header is used by the server for rate limiting and IP hashing when behind a reverse proxy.

### 11.5 Health Check Endpoint

```
GET /health
```

Returns `200 { "ok": true, "db": "connected" }` if the server and database are running. Returns `503` if the database is not accessible. Used by Docker health check and external uptime monitoring.

### 11.6 Upgrade Path

1. Pull the new image: `docker compose pull`
2. Restart: `docker compose up -d`
3. Server runs pending migrations automatically on startup.
4. Zero downtime is not guaranteed — brief restart gap is acceptable for a self-hosted tool.

---

## 12. Configuration Reference

See section 11.3 for environment variables.

See section 7.2 for widget embed attributes.

All configuration that affects runtime behaviour is done via environment variables. There is no config file (`.yaml`, `.json`, etc.) — this is a deliberate choice to keep self-hosting simple.

---

## 13. Testing Requirements

### 13.1 Server Tests

Framework: **Vitest** with **supertest** for HTTP testing.

| Test | Type | Required |
|---|---|---|
| GET /api/announcements returns only published announcements | Integration | Yes |
| GET /api/announcements returns correct order (newest first) | Integration | Yes |
| POST /api/admin/announcements requires auth | Integration | Yes |
| POST /api/admin/announcements validates input (missing title, body over limit, invalid status) | Unit | Yes |
| POST /api/analytics/view stores event with hashed IP | Integration | Yes |
| POST /api/analytics/view rate limiting blocks after 10 requests | Integration | Yes |
| Analytics deduplication query returns correct counts | Unit | Yes |
| Migration runner applies migrations in order | Unit | Yes |
| Auth middleware rejects missing/expired/tampered JWT | Unit | Yes |

### 13.2 Widget Tests

Framework: **Vitest** with **jsdom**.

| Test | Type | Required |
|---|---|---|
| Widget reads data-* attributes correctly | Unit | Yes |
| Widget calculates unread count from localStorage | Unit | Yes |
| Widget renders badge with correct count | Unit | Yes |
| Widget marks announcements as read on panel open | Unit | Yes |
| Widget handles fetch failure silently | Unit | Yes |
| Widget does not break if localStorage is unavailable | Unit | Yes |
| Widget polls on correct interval | Unit | Yes |
| Banner dismissed state persisted in localStorage | Unit | Yes |

### 13.3 Coverage Target

- Server: 80% line coverage minimum.
- Widget: 80% line coverage minimum.
- Admin dashboard: no coverage requirement for v1 (UI testing deferred).

### 13.4 CI Pipeline

GitHub Actions workflow on every PR to main:

1. Install dependencies
2. Build all packages
3. Run server tests
4. Run widget tests
5. Check bundle size of widget.js (fail if over 25KB gzipped)

---

## 14. Performance Benchmarks

### 14.1 Widget Bundle

| Metric | Target | Measurement Method |
|---|---|---|
| Bundle size (gzipped) | < 25KB | CI check with `gzip-size-cli` |
| Time to interactive (widget) | < 500ms on 4G | Chrome DevTools throttled test |
| Announcement fetch time | < 200ms p95 | Server-side logging |

### 14.2 Server Load

SQLite is sufficient for the expected load profile. The following benchmarks should be validated before launch using **autocannon**:

| Scenario | Target |
|---|---|
| GET /api/announcements under 100 concurrent connections | < 200ms p95 |
| POST /api/analytics/view under 50 concurrent connections | < 300ms p95 |
| Admin dashboard full page load | < 2 seconds on standard connection |

### 14.3 Database Size

For reference: 1,000 announcements + 365 days of analytics events at 10,000 widget loads/day ≈ 50-100MB SQLite file. Well within practical limits.

---

## 15. Open Source Project Requirements

Ding is an open source project. Technical excellence alone is not enough — the project must be welcoming and easy to contribute to.

### 15.1 Required Files at Launch

| File | Contents |
|---|---|
| README.md | What Ding is, a screenshot, quick-start (3 commands), full configuration reference, embed code example, link to CONTRIBUTING |
| CONTRIBUTING.md | How to run locally, PR process, issue labels, code style guide |
| LICENSE | MIT licence |
| .env.example | All environment variables with descriptions and safe example values |
| CHANGELOG.md | Maintained from day one — used to dogfood Ding itself |
| .github/ISSUE_TEMPLATE/ | Bug report template, feature request template |
| .github/pull_request_template.md | PR template with checklist |

### 15.2 Local Development Setup

Running Ding locally should require:

```bash
git clone https://github.com/teslimkazeem/ding
cd ding
cp .env.example .env
npm install
npm run dev
```

`npm run dev` starts the API server with hot reload (via tsx --watch) and the Vite dev server for the admin dashboard in parallel. The widget is served from the API server in development mode as a non-minified build.

### 15.3 GitHub Repository Requirements

- Description: "Open source self-hosted changelog widget for your web app. Replaces Beamer and Headway."
- Topics: `changelog`, `self-hosted`, `open-source`, `product-management`, `widget`, `javascript`
- Releases: Tagged semver releases (v1.0.0) with Docker Hub images published automatically via GitHub Actions.
- Docker Hub: `teslimkazeem/ding:latest` and `teslimkazeem/ding:1.0.0`.

### 15.4 Documentation Site

Deferred to v1.1. v1 documentation lives in the README only.

---

*End of Technical Requirements Document*

**Document version:** 1.0  
**Next review:** After v1.0 launch

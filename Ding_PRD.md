# Ding — Product Requirements Document (PRD)

**Version:** 1.0  
**Author:** Teslim Kazeem  
**Status:** Draft  
**Last Updated:** April 2026  
**Product:** Ding — Open Source Self-Hostable Embeddable Changelog Widget

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Non-Goals](#3-goals-and-non-goals)
4. [Target Users](#4-target-users)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [User Experience Requirements](#8-user-experience-requirements)
9. [Analytics Requirements](#9-analytics-requirements)
10. [Success Metrics](#10-success-metrics)
11. [Constraints and Assumptions](#11-constraints-and-assumptions)
12. [Out of Scope for v1](#12-out-of-scope-for-v1)
13. [Open Questions](#13-open-questions)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

Ding is an open source, self-hostable embeddable changelog widget. It allows product teams to announce updates, new features, and fixes directly inside their web application — without sending users to a separate page, without a third-party SaaS subscription, and without user data leaving their own infrastructure.

Users embed a single JavaScript snippet into their product. A bell icon (and optionally a "What's new" banner) appears in the UI. When the product team publishes a new announcement via the Ding admin dashboard, users see a notification badge. Clicking opens a panel listing recent updates with titles, descriptions, dates, and optional tags. The product team sees view counts and click-through rates per announcement in the admin dashboard.

Ding replaces Beamer, Headway, and Announcekit for teams that cannot justify $50-200 per month for a notification widget, want to keep user interaction data on their own servers, or require a self-hosted solution for compliance or security reasons.

**The product is entirely free. There is no paid tier. The entire codebase is open source under the MIT licence.**

---

## 2. Problem Statement

### 2.1 The Core Problem

Product teams that ship regularly need a way to tell users what has changed. The options available in 2026 are:

- **Email newsletters** — Low visibility, easy to ignore, disconnected from the product moment.
- **In-app modals** — Intrusive, dismissed immediately, not reusable.
- **Blog posts or external changelog pages** — Users never visit them unless explicitly directed.
- **Third-party changelog widgets (Beamer, Headway, Announcekit)** — Solve the problem but cost $50-200/month, send user interaction data to third-party servers, and cannot be self-hosted.

The third-party tools work well but are inaccessible to indie developers, early-stage startups, and companies with data residency requirements. There is no serious open source alternative.

### 2.2 Why Now

The self-hosted software movement is accelerating. Tools like Plausible Analytics, Umami, Matomo, PostHog, and Coolify have demonstrated that developers will choose a self-hosted open source alternative over a SaaS product if the quality is comparable and the setup is straightforward. Changelog widgets are the next obvious category.

Additionally, GDPR enforcement has intensified scrutiny of third-party JavaScript embedded in products. Every third-party script is a potential data processor that requires a DPA. Self-hosting eliminates this concern entirely.

### 2.3 The Gap

There is no well-maintained, well-documented, genuinely embeddable open source changelog widget. Existing attempts are either abandoned GitHub repositories with no documentation, static markdown changelog generators that do not embed into apps, or RSS feed readers repurposed for this use case.

---

## 3. Goals and Non-Goals

### 3.1 Goals

**Goal 1: Make self-hosted changelogs trivially easy to embed.**
A developer should be able to go from zero to a working changelog widget in their product within 30 minutes, including server setup.

**Goal 2: Give product teams a clean admin interface for writing and publishing announcements.**
Non-technical team members (PMs, marketers) should be able to publish announcements without touching the codebase or a config file.

**Goal 3: Give product teams basic, honest analytics.**
View counts and click-through rates per announcement. No more, no less. Stored on the team's own server.

**Goal 4: Be genuinely framework-agnostic.**
The widget must work in React apps, Vue apps, Angular apps, plain HTML sites, and anything else that can load a JavaScript file.

**Goal 5: Be a credible open source project.**
Good documentation, a clear contributing guide, an active GitHub presence, and a reputation that earns stars and forks from the developer community.

### 3.2 Non-Goals (v1)

- No AI-generated content or AI summarisation of announcements.
- No email notifications or digest emails.
- No user accounts or login for end users of the widget.
- No per-user read tracking (only per-browser view tracking via localStorage).
- No managed cloud hosting or SaaS offering.
- No native mobile SDK (iOS/Android).
- No Slack or Teams integration.
- No multi-language / i18n support.
- No custom domain support.
- No multi-workspace or multi-product support within one instance.
- No white-label or custom branding beyond CSS variable overrides.

---

## 4. Target Users

Ding has two distinct user types within the same team.

### 4.1 The Publisher (Primary User)

**Who they are:** A product manager, founder, developer, or marketing person responsible for communicating product updates to users.

**What they need:** A simple interface to write an announcement (title, body, optional tag, optional date), publish it, and see whether users are reading it.

**Technical level:** Low to medium. Should not need to edit code to publish announcements.

**Pain they have today:** Either paying $100+/month for Beamer, or shipping updates with no in-app communication at all.

### 4.2 The Deployer (Secondary User)

**Who they are:** A developer or technical founder who installs Ding on their infrastructure and embeds the widget in their product.

**What they need:** Clear setup documentation, a Docker-based deployment path, and a widget embed snippet that works without configuration beyond a project key.

**Technical level:** High. Comfortable with Docker, environment variables, and basic server administration.

**Pain they have today:** No good self-hosted option exists. Rolling their own changelog widget takes days and produces something with no admin UI.

### 4.3 The Widget User (End User — Not a Customer)

**Who they are:** A user of a product that has Ding embedded in it.

**What they need:** A non-intrusive way to see what has changed in the product they use. Quick to read, easy to dismiss, does not interrupt their workflow.

**Technical level:** Irrelevant — the widget requires no technical knowledge to use.

---

## 5. User Stories

### 5.1 Publisher Stories

**P1 — Writing an announcement**
As a publisher, I want to write a new announcement with a title, body text, optional tag (e.g. "New Feature", "Fix", "Improvement"), and publication date, so that my users know what has changed in the product.

**Acceptance criteria:**
- Title field: required, max 100 characters.
- Body field: required, supports basic markdown (bold, italic, links, bullet lists), max 1,000 characters rendered.
- Tag field: optional, selectable from a predefined list (New Feature, Fix, Improvement, Announcement) with the option to add custom tags.
- Date field: defaults to today, can be backdated, cannot be set in the future (future scheduling is out of scope for v1).
- Draft state: announcements can be saved as drafts before publishing.
- Published state: announcements become visible in the widget immediately upon publishing.

**P2 — Editing an announcement**
As a publisher, I want to edit a published announcement, so that I can fix errors without unpublishing and republishing.

**Acceptance criteria:**
- Edits to a published announcement are reflected in the widget within 60 seconds (next widget poll cycle).
- Edit history is not exposed to widget users — they see only the current version.

**P3 — Unpublishing an announcement**
As a publisher, I want to unpublish an announcement, so that I can remove something that was published in error.

**Acceptance criteria:**
- Unpublished announcements disappear from the widget immediately on next poll.
- Unpublished announcements remain in the admin dashboard as drafts.

**P4 — Viewing analytics**
As a publisher, I want to see how many times each announcement was viewed and how many users clicked through to read the full announcement, so that I can understand what updates my users care about.

**Acceptance criteria:**
- Each announcement shows: total views (widget panel opened while announcement was visible), click-through count (announcement expanded or "Read more" clicked), and click-through rate as a percentage.
- Analytics update in near real-time (within 5 minutes).
- Analytics are not broken down by individual user — aggregate only.

**P5 — Managing admin access**
As a deployer, I want to set an admin password during setup so that only my team can access the dashboard.

**Acceptance criteria:**
- Admin dashboard is protected by a username/password set via environment variable at deployment time.
- No self-service account creation — credentials are set by the deployer.
- Session persists for 7 days before requiring re-login.

### 5.2 Deployer Stories

**D1 — Deploying Ding**
As a deployer, I want to run Ding on my own server using Docker so that I can self-host the entire product without depending on external services.

**Acceptance criteria:**
- A single `docker-compose.yml` file brings up the full stack (API server, admin dashboard, SQLite database).
- Setup requires only editing a `.env` file with admin credentials and a base URL.
- The entire setup process takes under 30 minutes for a developer familiar with Docker.

**D2 — Embedding the widget**
As a deployer, I want to embed the Ding widget in my product by adding a single script tag to my HTML, so that I do not need to modify my application's build process.

**Acceptance criteria:**
- A single `<script>` tag with a `data-project-key` attribute is all that is required to embed the widget.
- The widget initialises automatically on page load.
- The widget does not block page rendering (loads asynchronously).
- The widget works in React, Vue, Angular, Svelte, and plain HTML without any framework-specific configuration.

**D3 — Configuring the widget appearance**
As a deployer, I want to configure the widget's position, colours, and trigger style via data attributes or a small configuration object, so that the widget fits my product's design.

**Acceptance criteria:**
- Position configurable: bottom-right (default), bottom-left, top-right, top-left.
- Primary colour configurable via a hex value (used for notification badge and button accent).
- Trigger style configurable: bell icon only, "What's new" banner only, or both.
- Configuration is set via data attributes on the script tag — no JavaScript configuration object required, though one is also supported.

### 5.3 Widget User Stories

**W1 — Seeing new announcements**
As a widget user, I want to see a notification badge when there are announcements I have not read, so that I know something has changed without being interrupted.

**Acceptance criteria:**
- A red badge with an unread count appears on the bell icon when there are unread announcements.
- Badge disappears after the user opens the widget panel (all announcements marked as read in localStorage).
- "What's new" banner (if enabled) appears at the top of the viewport and can be dismissed with an X button.
- Banner does not reappear after dismissal until a new announcement is published.

**W2 — Reading announcements**
As a widget user, I want to open the changelog panel and read recent announcements without leaving the page I am on, so that I can stay in my workflow.

**Acceptance criteria:**
- Panel opens as a slide-in overlay anchored to the widget button position.
- Panel shows the 20 most recent published announcements, sorted newest first.
- Each announcement shows: tag (if set), title, date (formatted as "12 Apr 2026"), and truncated body (first 150 characters with a "Read more" link).
- "Read more" expands the full announcement inline — does not navigate away.
- Panel is scrollable for longer lists.
- Panel closes on click outside or on pressing Escape.

**W3 — Dismissing the banner**
As a widget user, I want to dismiss the "What's new" banner with a single click, so that it does not obstruct my screen.

**Acceptance criteria:**
- An X button is visible on the banner at all times.
- Dismissing the banner sets a flag in localStorage so it does not reappear for the same announcement.

---

## 6. Functional Requirements

### 6.1 Admin Dashboard

| ID | Requirement | Priority |
|---|---|---|
| F-01 | Admin login with username/password (set via env var at deploy time) | Must Have |
| F-02 | Create announcement (title, body, tag, date) | Must Have |
| F-03 | Save announcement as draft | Must Have |
| F-04 | Publish announcement immediately | Must Have |
| F-05 | Edit published or draft announcement | Must Have |
| F-06 | Unpublish (revert to draft) a published announcement | Must Have |
| F-07 | Delete a draft announcement | Must Have |
| F-08 | List all announcements with status (published/draft), date, view count | Must Have |
| F-09 | View per-announcement analytics (views, click-throughs, CTR) | Must Have |
| F-10 | Markdown preview while writing announcement body | Should Have |
| F-11 | Custom tag creation (in addition to default tags) | Should Have |
| F-12 | Bulk delete draft announcements | Could Have |

### 6.2 Widget (Client-Side)

| ID | Requirement | Priority |
|---|---|---|
| F-13 | Renders bell icon trigger at configured position | Must Have |
| F-14 | Renders "What's new" banner trigger (if configured) | Must Have |
| F-15 | Shows unread count badge on bell icon | Must Have |
| F-16 | Opens slide-in panel on trigger click | Must Have |
| F-17 | Displays announcements list (newest first, max 20) | Must Have |
| F-18 | Renders announcement body as markdown | Must Have |
| F-19 | Truncates body at 150 chars with "Read more" expansion | Must Have |
| F-20 | Marks announcements as read in localStorage on panel open | Must Have |
| F-21 | Banner dismissal persisted in localStorage | Must Have |
| F-22 | Polls for new announcements every 60 seconds | Must Have |
| F-23 | Configurable position via data attribute | Must Have |
| F-24 | Configurable primary colour via data attribute | Should Have |
| F-25 | Panel closes on outside click or Escape key | Must Have |
| F-26 | Widget loads asynchronously, does not block render | Must Have |
| F-27 | Works without third-party cookies | Must Have |

### 6.3 API (Backend)

| ID | Requirement | Priority |
|---|---|---|
| F-28 | GET /api/announcements — returns published announcements (public) | Must Have |
| F-29 | POST /api/admin/announcements — create announcement (authenticated) | Must Have |
| F-30 | PUT /api/admin/announcements/:id — edit announcement (authenticated) | Must Have |
| F-31 | DELETE /api/admin/announcements/:id — delete announcement (authenticated) | Must Have |
| F-32 | POST /api/analytics/view — record a view event (public, rate-limited) | Must Have |
| F-33 | POST /api/analytics/click — record a click event (public, rate-limited) | Must Have |
| F-34 | GET /api/admin/analytics — return aggregated analytics (authenticated) | Must Have |
| F-35 | POST /api/auth/login — authenticate admin (returns session token) | Must Have |
| F-36 | POST /api/auth/logout — invalidate session | Must Have |

---

## 7. Non-Functional Requirements

### 7.1 Performance

- Widget JavaScript bundle must be under 25KB gzipped. This is a hard constraint — every KB added to a host product's page is a cost.
- Widget must initialise and render within 500ms on a standard broadband connection.
- API response time for GET /api/announcements must be under 200ms at p95 for an instance serving up to 10,000 widget loads per day.
- The admin dashboard may load slower (under 2 seconds) — this is an internal tool.

### 7.2 Reliability

- The widget must fail silently if the Ding server is unreachable. The host product must not break if Ding is down.
- All API endpoints must return appropriate HTTP error codes. The widget must handle 4xx and 5xx responses gracefully.

### 7.3 Security

- Admin dashboard must be protected by authentication on every route. No unauthenticated access to any admin endpoint.
- Analytics endpoints (view and click tracking) must be rate-limited to prevent artificial inflation. Rate limit: 10 events per IP per announcement per hour.
- The widget script served from the Ding server must include appropriate CORS headers to allow embedding in host domains.
- Admin credentials must never be stored in plaintext. Passwords hashed with bcrypt.
- No third-party scripts, fonts, or CDN dependencies in the widget bundle. Every byte must be self-contained.

### 7.4 Privacy

- No cookies set by the widget. Read/unread state stored in localStorage only.
- No personally identifiable information collected or stored. Analytics events record only: announcement ID, timestamp, and a hashed IP address (for deduplication only — not stored raw).
- No cross-site tracking of any kind.
- GDPR-compatible by design: no personal data processing, no data processor agreement required for the widget.

### 7.5 Maintainability

- The codebase must be readable by a developer unfamiliar with the project within one hour.
- All environment configuration via a single `.env` file. No configuration scattered across multiple files.
- Database schema migrations must be handled automatically on server start.
- The project must include a `CONTRIBUTING.md` from day one.

### 7.6 Compatibility

- Widget must support the last 2 major versions of Chrome, Firefox, Safari, and Edge.
- Widget must not use ES2020+ syntax without transpilation. Target: ES2017 or a transpiled bundle.
- Admin dashboard: Chrome and Firefox only (last 2 major versions). Safari support is a should-have.

---

## 8. User Experience Requirements

### 8.1 Widget Design Principles

**Principle 1: Invisible until needed.**
The widget must not compete for attention with the host product. The bell icon is the smallest credible trigger. The "What's new" banner appears once per new announcement and is dismissible immediately.

**Principle 2: In-context, not redirecting.**
All changelog content must be readable inside the widget panel. No links that navigate away from the host product unless the publisher explicitly includes an external link in the announcement body.

**Principle 3: Fast to read.**
Announcements must communicate their value in under 10 seconds. The truncation at 150 characters enforces this. Publishers should be encouraged (in documentation) to write titles that stand alone.

**Principle 4: Polite, not pushy.**
No auto-opening panels. No sound. No animated shimmer on the badge. The badge is enough.

### 8.2 Admin Dashboard Design Principles

**Principle 1: One job, done well.**
The admin dashboard does one thing: manage announcements. It must not accumulate features that distract from this.

**Principle 2: Preview before publish.**
The markdown preview must be visible alongside the editor at all times on desktop, so publishers see exactly what users will see before publishing.

**Principle 3: Analytics at a glance.**
The announcement list view shows view count and CTR inline. No separate analytics page to navigate to.

### 8.3 Tone and Copy

- UI copy must be plain English. No jargon, no product management vocabulary.
- Error messages must say what happened and what to do. Not "An error occurred."
- Empty states must be helpful. An empty announcement list should say "You haven't published anything yet. Write your first announcement." with a button.

---

## 9. Analytics Requirements

Ding collects minimal, privacy-safe analytics stored entirely on the self-hosted server.

### 9.1 Events Tracked

| Event | Trigger | Data Stored |
|---|---|---|
| View | Widget panel opened, announcement visible in viewport | Announcement ID, timestamp, hashed IP |
| Click | "Read more" expanded on an announcement | Announcement ID, timestamp, hashed IP |

### 9.2 Deduplication

- A view event for the same announcement from the same hashed IP is counted once per 24-hour window.
- A click event for the same announcement from the same hashed IP is counted once per 24-hour window.
- This prevents a single user reloading the page from inflating counts.

### 9.3 What is Not Tracked

- Individual user identity.
- Session duration or time spent reading.
- Device type, browser, or operating system.
- Geographic location.
- Referrer URL.

### 9.4 Data Retention

- Analytics events older than 12 months are automatically deleted by a scheduled cleanup job running nightly.
- Publishers can manually clear all analytics data from the admin dashboard.

---

## 10. Success Metrics

### 10.1 Adoption Metrics (Measured by GitHub and community signals)

| Metric | Target (6 months post-launch) |
|---|---|
| GitHub stars | 500 |
| GitHub forks | 50 |
| Unique deployers (inferred from Docker Hub pulls) | 200 |
| Community issues opened | 30+ (signal of real usage) |

### 10.2 Product Quality Metrics

| Metric | Target |
|---|---|
| Widget bundle size | Under 25KB gzipped |
| Setup time (median, self-reported) | Under 30 minutes |
| Open issues older than 30 days | Under 10 |
| Documentation completeness | 100% of features documented at launch |

### 10.3 What We Are Not Measuring

- Revenue (there is none).
- Monthly active users (we have no visibility into production deployments).
- Retention (same reason).

---

## 11. Constraints and Assumptions

### 11.1 Constraints

- No budget for infrastructure. The project must be runnable on a free or near-free tier (Railway free tier, Fly.io hobby plan, or a $5 VPS).
- Single maintainer at launch. Architecture must be simple enough to maintain solo.
- No paid dependencies. Every library used must be MIT, Apache 2.0, or equivalent.
- SQLite as the only supported database in v1. PostgreSQL support can be added later via a configuration option.

### 11.2 Assumptions

- The primary adopters are developers who are comfortable with Docker. Non-technical setup is not a v1 goal.
- Most Ding instances will serve under 50,000 widget loads per day. SQLite is sufficient for this load.
- Publishers will write announcements in English. Internationalisation is not a v1 requirement.
- The host product is a web application. Desktop apps, mobile apps, and native contexts are out of scope.

---

## 12. Out of Scope for v1

The following are explicitly deferred and documented here to prevent scope creep during v1 development.

- Email digest of announcements sent to users
- Per-user read tracking (beyond localStorage)
- User segmentation (show different announcements to different user groups)
- Scheduled future publishing
- Webhook notifications when an announcement is published
- Zapier or Make integration
- REST API access for external tools to push announcements
- Multi-product or multi-workspace support
- Custom fonts or full theme customisation beyond colour
- White-label / remove Ding branding
- Native mobile SDK
- Import from existing changelog tools (Beamer, Headway)
- SSO or OAuth for admin login
- Two-factor authentication for admin
- PostgreSQL or MySQL support
- CDN-hosted widget script (users must serve from their own instance)

---

## 13. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| OQ-1 | Should the widget support a "link to full changelog page" option for teams that also maintain an external changelog? | Teslim | Open |
| OQ-2 | Should draft announcements be previewable via a private URL before publishing? | Teslim | Open |
| OQ-3 | What should happen if localStorage is unavailable (private browsing, storage blocked)? Widget should still function — badge count just won't persist. Confirm this is acceptable. | Teslim | Open |
| OQ-4 | Should the "What's new" banner show the latest announcement title, or a generic "Updates available" message? | Teslim | Open |
| OQ-5 | Should there be a public API endpoint to push announcements programmatically (e.g. from a CI/CD pipeline)? Deferred to v1.1 but worth confirming. | Teslim | Open |

---

## 14. Appendix

### 14.1 Competitive Landscape

| Product | Price | Self-Hostable | Open Source |
|---|---|---|---|
| Beamer | $49-199/month | No | No |
| Headway | $29-99/month | No | No |
| Announcekit | $49-149/month | No | No |
| Changelogfy | $19-79/month | No | No |
| Ding | Free | Yes | Yes (MIT) |

### 14.2 Licence

MIT Licence. Anyone can use, modify, distribute, and fork Ding for any purpose, including commercial use, without restriction, provided the licence notice is retained.

### 14.3 Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | April 2026 | Teslim Kazeem | Initial draft |

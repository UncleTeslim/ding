# Changelog

## 0.1.0-rc.1 — first supported release candidate

The earlier `0.1.0`, `0.1.1`, and `0.2.0` headings were development milestones, not tagged supported releases. This candidate consolidates those changes into the first supported release line. The stable `0.1.0` release will follow after the launch checks are complete.

- Initial Ding self-hosted in-app announcements MVP.
- Added drafts, tags, Markdown preview, bulk delete, and per-announcement views, clicks, and click-through rates.
- Added a small framework-agnostic browser widget with bell/banner modes, read state, and a 20-announcement display cap.
- Added authentication, server-side session revocation, CSRF protection, rate limits, and security-focused request logging.
- Updated Vite and compatible dependencies to clear high and critical npm audit findings; nine moderate findings remain in the full dependency tree.
- Added proxy-aware base URL and client-IP handling for correct analytics deduplication.
- Changed analytics deduplication to a rolling 24-hour window and scheduled retention and token-revocation cleanup for 03:00 local time.
- Added the dashboard action to clear analytics.
- Added a 25 KB gzipped widget budget that fails CI when exceeded; current bundle size is 4.42 KB gzipped.
- Improved dashboard keyboard focus, error announcements, and pending/saving feedback.
- Added widget rendering, dismissal, read-state, maintenance, and analytics tests, plus coverage and benchmark scripts.
- Added Docker deployment, health checks, persistence, backup/recovery guidance, and pinned-image release instructions.
- Added GitHub Actions CI and tag-driven GHCR/GitHub prerelease publication.

# Changelog

## Unreleased — preparing 0.1.0

`0.1.0` is planned as the first supported stable release. Earlier numbered development milestones and evaluation candidates did not establish a supported stable release. Check GitHub Releases for artifacts that are actually available to install.

- Reworked the publishing dashboard around reader activity, drafts, search/filtering and widget setup.
- Updated installation, publishing, framework embedding, API and recovery documentation to match the running product.
- Included the production setup helper in the Docker image so credentials can be generated without host Node.js; existing `.env` files are protected from overwrite.

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

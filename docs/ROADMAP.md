# Roadmap

This roadmap starts from the current v1 MVP. The goal is to move Ding from a working product into a credible public beta.

## Phase 1: Beta Readiness

- Run full manual QA on desktop and mobile.
- Test the widget inside plain HTML, React, Vue, and one real product shell.
- Complete Docker clean-room testing on a fresh machine.
- Add screenshots and a short demo GIF to the README.
- Add a simple sample app under `examples/html`.
- Confirm production setup with Caddy and Nginx.

## Phase 2: Product Finish

- Add a clear analytics reset action in the admin dashboard.
- Improve form validation messages so publishers know exactly what to fix.
- Add a markdown help drawer beside the editor.
- Add a compact widget preview inside the dashboard.
- Add loading and saving states for every dashboard mutation.

## Phase 3: Reliability and Operations

- Add request logging fields for route, status, latency, and request ID.
- Add database backup guidance with a tested SQLite backup command.
- Add a Docker Hub publish workflow.
- Add release notes automation for tagged releases.
- Run basic load tests for announcements and analytics endpoints.

## Phase 4: Public Launch

- Publish v1.0.0 on GitHub.
- Publish Docker images.
- Create a concise launch post.
- Invite 3 to 5 early users to install Ding and report friction.
- Triage beta feedback into bug fixes, documentation fixes, and v1.1 candidates.

## v1.1 Candidates

- Programmatic publishing with API tokens.
- Public changelog page.
- Optional draft preview links.
- Import from Markdown.
- More admin roles only if real users ask for it.

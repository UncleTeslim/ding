# Contributing to Ding

Start with an issue describing the problem or a focused pull request. Product code and public operating guides live in this repository; the marketing/documentation website has its own private source repository.

## Local setup

Use Node.js 22.12+ on the 22.x line or a current Node.js 24 release, npm and Git. See [local development](docs/LOCAL_DEVELOPMENT.md) for native-package requirements and troubleshooting.

```bash
git clone https://github.com/UncleTeslim/ding.git
cd ding
npm ci
cp .env.example .env
npm run build
npm run dev
```

Open `http://localhost:5173` for the dashboard with live reload. The API/widget and last built dashboard run on `http://localhost:3000`. Development credentials are `admin` / `password`. Keep an existing `.env` rather than replacing it.

## Validate a change

```bash
npm run build
npm run typecheck
npm test
npm run coverage
npm run check:size
```

Coverage gates apply to server and widget code. The widget's enforced budget is 25 KB gzipped; run the size command for the current result instead of copying a stale measurement.

## Pull requests

- Keep the change focused and explain the user-visible result.
- Add regression coverage for meaningful behavior changes.
- Keep widget runtime dependencies small and avoid loading third-party resources.
- Update the relevant guide when a command, response, option or deployment step changes.
- Report the checks you actually ran and any limitations.
- Keep internal planning, credentials, databases, cookies and rehearsal artifacts out of commits.

## Documentation ownership

Public guides under `docs/` are the canonical source for matching website pages. Update those here; website maintainers run their `docs:sync` command and commit the generated pages separately. Fix commands and code examples alongside the feature, including expected output and recovery paths.

## Security and design

Use TypeScript for product code. Prefer small modules with plain data flow. Make errors actionable, preserve drafts when requests fail, and retain confirmation for destructive actions. Test keyboard and narrow-screen behavior when changing the UI.

Report vulnerabilities privately through the [security policy](SECURITY.md), rather than opening a public issue with exploit details.

<p align="center">
  <img src="assets/logo.svg" alt="Ding" width="260">
</p>

# Ding

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT">
  <img src="https://img.shields.io/badge/bundle-under%206%20KB%20gzipped-6366f1" alt="Bundle size">
</p>

Ding is an open source, self-hosted changelog widget for web applications. It gives product teams a clean admin dashboard for publishing updates, and gives users a small in-app widget for reading what changed without leaving the product.

It is built for teams that want the usefulness of Beamer or Headway, but prefer to own their infrastructure, their data, and their costs.

## What Ding Includes

- A framework-agnostic JavaScript widget served from your own instance
- A private admin dashboard for writing and publishing announcements
- Aggregate view and click analytics
- SQLite storage with automatic migrations
- Docker-based deployment
- No third-party scripts, fonts, cookies, or external analytics in the widget

## Quick Start

```bash
cp .env.example .env
npm install
npm run build
npm run dev
```

Open the admin dashboard:

```txt
http://localhost:3000
```

The development credentials in `.env.example` are:

```txt
Username: admin
Password: password
```

For production, run:

```bash
npm run setup
```

This interactively creates a `.env` file with a bcrypt password hash, JWT secret, IP hashing salt, and the public HTTPS URL used by the deployment. Review the generated file before starting the service.

## Embed Code

Paste this into the product where you want Ding to appear:

```html
<script
  src="https://your-ding-instance.com/widget.js"
  data-position="bottom-right"
  data-color="#6366f1"
  data-trigger="both"
  async
></script>
```

For local testing, use:

```html
<script
  src="http://localhost:3000/widget.js"
  data-position="bottom-right"
  data-color="#155eef"
  data-trigger="both"
  async
></script>
```

## Widget Configuration

| Attribute | Default | Options |
| --- | --- | --- |
| `data-position` | `bottom-right` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `data-color` | `#6366f1` | Any 6-digit hex colour |
| `data-trigger` | `bell` | `bell`, `banner`, `both` |

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DING_ADMIN_USERNAME` | Yes | Admin dashboard username |
| `DING_ADMIN_PASSWORD_HASH` | Yes | Bcrypt hash of the admin password |
| `DING_JWT_SECRET` | Yes | Secret used to sign admin session cookies |
| `DING_IP_SALT` | Yes | Salt used before hashing IP addresses |
| `DING_BASE_URL` | Yes in production | Public HTTPS origin used for CSRF and canonical URL checks |
| `DING_DB_PATH` | No | SQLite file path. Defaults to `./data/ding.db` |
| `DING_TRUST_PROXY` | No | Defaults to `false`. Use `true` only when the immediate proxy hop is trusted; `true` maps to Express' `loopback` trust setting. |
| `PORT` | No | Server port. Defaults to `3000` |
| `NODE_ENV` | No | Use `production` in production |

In production, Ding refuses missing admin credentials, weak development secrets, the known development password, and non-HTTPS `DING_BASE_URL` values. Set `DING_BASE_URL` to the public HTTPS origin before deploying.

## Docker

```bash
npm run setup
docker compose up --build
```

The setup prompt requires the public HTTPS origin. The container listens on port `3000` and stores the embedded SQLite database in the persistent `ding-data` Docker volume. No separate database service is required.

## Architecture

Ding ships as one deployable service:

- `packages/server`: Express API, auth, migrations, analytics, static file serving
- `packages/widget`: Vanilla TypeScript widget compiled to a small browser script
- `packages/dashboard`: React admin dashboard built with Vite

The server serves the dashboard, the public widget script, the public API, and protected admin APIs from one process.
Server startup, static assets, maintenance jobs, repositories, and domain services live in separate modules so API routes stay focused on HTTP concerns.

## Security and Privacy

- Admin sessions use HTTP-only cookies
- Passwords are stored as bcrypt hashes
- Widget read state stays in the browser through `localStorage`
- Analytics store announcement ID, timestamp, and keyed IP hash
- Raw IP addresses are not stored
- Production rejects missing admin credentials, weak JWT/IP secrets, the known development password, and non-HTTPS base URLs
- The widget can be embedded cross-origin, while admin routes remain same-origin
- Backups should be taken from the SQLite file or Docker volume before upgrades
- Operational procedures are documented in [deployment](docs/DEPLOYMENT.md), [backup and restore](docs/BACKUP_AND_RESTORE.md), [upgrades](docs/UPGRADING.md), and [troubleshooting](docs/TROUBLESHOOTING.md)

Read [SECURITY.md](SECURITY.md) for security guidance and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production setup.

Read the [docs](https://dingwidget.com/docs/) for detailed setup, configuration, API reference, and deployment guides.

## Development

```bash
npm run dev
npm run build
npm test
npm run check:size
```

The widget bundle must remain under 6 KB gzipped. The current build is approximately 5.4 KB gzipped.

## License

MIT

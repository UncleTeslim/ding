<p align="center">
  <img src="assets/logo.svg" alt="Ding" width="260">
</p>

# Ding

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

Open the local widget demo:

```txt
http://localhost:3000/demo/
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

This creates a `.env` file with a bcrypt password hash, JWT secret, and IP hashing salt.

## Embed Code

Paste this into the product where you want Ding to appear:

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

For local testing, use:

```html
<script
  src="http://localhost:3000/widget.js"
  data-project-key="local"
  data-position="bottom-right"
  data-color="#155eef"
  data-trigger="both"
  async
></script>
```

## Widget Configuration

| Attribute | Default | Options |
| --- | --- | --- |
| `data-project-key` | required | Any string. Informational in v1 because Ding is single-tenant. |
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
| `DING_BASE_URL` | Yes | Public URL of the Ding instance |
| `DING_DB_PATH` | No | SQLite file path. Defaults to `./data/ding.db` |
| `DING_TRUST_PROXY` | No | Set to `true` when Ding is behind a reverse proxy |
| `PORT` | No | Server port. Defaults to `3000` |
| `NODE_ENV` | No | Use `production` in production |

In production, Ding refuses weak development secrets for `DING_JWT_SECRET` and `DING_IP_SALT`.

## Docker

```bash
cp .env.example .env
npm run setup
docker compose up --build
```

The container listens on port `3000` and stores SQLite data in the `ding-data` volume.

## Architecture

Ding ships as one deployable service:

- `packages/server`: Express API, auth, migrations, analytics, static file serving
- `packages/widget`: Vanilla TypeScript widget compiled to a small browser script
- `packages/dashboard`: React admin dashboard built with Vite

The server serves the dashboard, the public widget script, the public API, and protected admin APIs from one process.

## Security and Privacy

- Admin sessions use HTTP-only cookies
- Passwords are stored as bcrypt hashes
- Widget read state stays in the browser through `localStorage`
- Analytics store announcement ID, timestamp, and salted IP hash
- Raw IP addresses are not stored
- Production rejects weak JWT and IP salt values
- The widget can be embedded cross-origin, while admin routes remain same-origin

Read [SECURITY.md](SECURITY.md) for security guidance and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production setup.

Read [docs/ROADMAP.md](docs/ROADMAP.md) for the next product milestones.

## Development

```bash
npm run dev
npm run build
npm test
npm run check:size
```

The widget bundle must remain under 25KB gzipped. The current build is far below that limit.

## License

MIT

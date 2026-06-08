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

## Choose Your Setup

Use **Docker quick start** if you want to run Ding like a self-hosted product.

Use **local development** if you want to work on the codebase.

Do not run `cp .env.example .env` and `npm run setup` together. They are for different paths.

## Docker Quick Start

Prerequisite: Docker Desktop must be running before you start.

```bash
npm install
npm run setup
docker compose up --build
```

The setup script creates a `.env` file for Docker. It will ask three questions:

```txt
Admin username [admin]: admin
Admin password: your-password
Public base URL [http://localhost:3000]: http://localhost:3000
```

When the container is running, open:

```txt
http://localhost:3000
```

Log in with the username and password you entered during setup.

To see the widget inside a sample host page, open:

```txt
http://localhost:3000/demo/
```

## Local Development

Use this path when you want to edit Ding itself.

```bash
cp .env.example .env
npm install
npm run build
npm run dev
```

Development credentials from `.env.example`:

```txt
Username: admin
Password: password
```

Useful development commands:

```bash
npm run build
npm test
npm run check:size
npm audit
```

The widget bundle must remain under 25KB gzipped.

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

## Common First-Run Issues

### Docker says the Linux engine pipe cannot be found

Start Docker Desktop and wait until it reports that the engine is running. Then run:

```bash
docker compose up --build
```

### Docker warns that a random variable is not set

Regenerate `.env` with the current setup script:

```bash
rm .env
npm run setup
```

On PowerShell:

```powershell
Remove-Item .env
npm run setup
```

### The setup prompt looks stuck

It is waiting for answers. Type the value only, not a shell command.

Good:

```txt
Admin username [admin]: admin
```

Wrong:

```txt
Admin username [admin]: cp .env.example .env
```

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

## License

MIT

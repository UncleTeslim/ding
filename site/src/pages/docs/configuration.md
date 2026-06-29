---
layout: ../../layouts/Docs.astro
title: "Configuration"
description: "Environment variables and widget configuration reference."
---

# Configuration

Ding is configured through environment variables on the server side and data attributes on the widget side.

## Server configuration

Set these in your `.env` file or in the environment where Ding runs.

### Required

| Variable | Description |
| --- | --- |
| `DING_ADMIN_USERNAME` | Admin dashboard login username |
| `DING_ADMIN_PASSWORD_HASH` | Bcrypt hash of the admin password |
| `DING_JWT_SECRET` | Secret used to sign admin session cookies |
| `DING_IP_SALT` | Salt used before hashing IP addresses |

### Optional

| Variable | Default | Description |
| --- | --- | --- |
| `DING_DB_PATH` | `./data/ding.db` | Path to the SQLite database file |
| `DING_TRUST_PROXY` | not set | Set to `true` when Ding is behind a reverse proxy |
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | not set | Use `production` in production |

### Production notes

- Run `npm run setup` to generate a `.env` file with secure values
- Ding refuses weak development secrets for `DING_JWT_SECRET` and `DING_IP_SALT` in production
- Set `DING_TRUST_PROXY=true` when using Caddy, Nginx, Traefik, or a cloud proxy
- Use `NODE_ENV=production` to enable secure cookie flags and production behaviour

### Example .env

```txt
DING_ADMIN_USERNAME=admin
DING_ADMIN_PASSWORD_HASH=$2b$10$...
DING_JWT_SECRET=a-random-generated-secret
DING_IP_SALT=another-random-salt
DING_DB_PATH=/app/data/ding.db
DING_TRUST_PROXY=true
PORT=3000
NODE_ENV=production
```

## Widget configuration

The widget is configured through HTML `data-` attributes on the script tag.

| Attribute | Default | Description |
| --- | --- | --- |
| `data-position` | `bottom-right` | Widget position on screen |
| `data-color` | `#6366f1` | Accent colour for the widget UI |
| `data-trigger` | `bell` | One of `bell`, `banner`, or `both` |

### data-position

Controls where the widget appears on the page:

- `bottom-right`
- `bottom-left`
- `top-right`
- `top-left`

### data-color

Any valid 6-digit hex colour, for example:

```
#6366f1 (indigo)
#155eef (blue)
#dc2626 (red)
#059669 (green)
```

### data-trigger

- `bell` — A bell icon in the corner that opens a panel
- `banner` — A top banner showing the latest announcement
- `both` — Both bell and banner

## Production checklist

- HTTPS is configured at the reverse proxy level
- `NODE_ENV=production` is set
- Secrets were generated with `npm run setup`, not copied from `.env.example`
- The database is backed up regularly
- The widget embed URL points to the production server, not localhost

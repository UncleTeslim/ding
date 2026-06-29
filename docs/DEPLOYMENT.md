# Deployment Guide

This guide describes a practical production deployment for Ding.

## 1. Prepare the Environment

Clone the repository on your server:

```bash
git clone https://github.com/teslimkazeem/ding
cd ding
```

Create production secrets:

```bash
npm install
npm run setup
```

Review the generated `.env` file:

```txt
DING_ADMIN_USERNAME=admin
DING_ADMIN_PASSWORD_HASH=...
DING_JWT_SECRET=...
DING_IP_SALT=...
DING_BASE_URL=https://ding.example.com
DING_DB_PATH=/app/data/ding.db
DING_TRUST_PROXY=true
PORT=3000
NODE_ENV=production
```

Use a real HTTPS URL for `DING_BASE_URL`.

## 2. Run with Docker Compose

```bash
docker compose up --build -d
```

Check health:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "ok": true, "db": "connected" }
```

## 3. Configure a Reverse Proxy

Ding expects HTTPS to be handled by your reverse proxy.

### Caddy

```caddyfile
ding.example.com {
  reverse_proxy localhost:3000
}
```

### Nginx

```nginx
server {
  server_name ding.example.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 4. Embed the Widget

After the instance is reachable over HTTPS, embed:

```html
<script
  src="https://ding.example.com/widget.js"
  data-project-key="production"
  data-position="bottom-right"
  data-color="#155eef"
  data-trigger="both"
  async
></script>
```

## 5. Backups

Ding stores data in SQLite. Back up the Docker volume or the database file at the path configured by `DING_DB_PATH`.

A simple backup routine is enough for most v1 deployments:

```bash
docker compose stop
cp /path/to/ding.db /path/to/backups/ding-$(date +%Y-%m-%d).db
docker compose up -d
```

For busier installations, use SQLite online backup tooling or snapshot the volume at the infrastructure layer.

## 6. Upgrades

```bash
git pull
docker compose up --build -d
```

Migrations run automatically on startup.

## 7. Operational Checks

- Confirm `/health` returns `ok`.
- Confirm the admin dashboard loads.
- Confirm `/widget.js` returns JavaScript.
- Confirm the widget appears in a test page.
- Confirm announcements remain after container restart.

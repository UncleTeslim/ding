# Deployment Guide

This guide describes a practical production deployment for Ding. Ding runs as one application container and stores its embedded SQLite database in a persistent Docker volume; no separate database service is required.

## 1. Prepare the Environment

Clone the repository on your server:

```bash
git clone https://github.com/UncleTeslim/ding
cd ding
```

Create production secrets:

```bash
npm install
npm run setup
```

The setup command asks for the admin credentials and the public HTTPS URL. Do not start production until the generated `.env` has been reviewed.

Review the generated `.env` file:

```txt
DING_ADMIN_USERNAME=admin
DING_ADMIN_PASSWORD_HASH=...
DING_JWT_SECRET=...
DING_IP_SALT=...
DING_BASE_URL=https://ding.example.com
DING_DB_PATH=/app/data/ding.db
DING_TRUST_PROXY=false
PORT=3000
NODE_ENV=production
```

## 2. Run with Docker Compose

```bash
docker compose up --build -d --wait
```

By default, Compose publishes Ding on `127.0.0.1:3000`, so it is reachable to a local reverse proxy but not directly exposed to the public internet. Check health:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "ok": true, "db": "connected" }
```

## 3. Configure a Reverse Proxy

Ding expects HTTPS to be handled by your reverse proxy.

Set `DING_BASE_URL` to the public HTTPS origin that users and browsers should trust. The server rejects non-HTTPS values in production.

Keep `DING_TRUST_PROXY=false` unless the immediate connection into Express comes from a trusted local/private proxy hop. If you do enable it, `true` is treated as `loopback`; `loopback`, `linklocal`, and `uniquelocal` are also accepted.

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
  data-position="bottom-right"
  data-color="#155eef"
  data-trigger="both"
  async
></script>
```

## 5. Backups

Ding stores data in SQLite. Back up the persistent Docker volume before upgrades. See [Backup and Restore](BACKUP_AND_RESTORE.md) for tested volume commands and recovery checks.

## 6. Restore

See [Backup and Restore](BACKUP_AND_RESTORE.md). Always stop Ding before replacing a SQLite file and verify `/health` and the dashboard after starting it again.

## 7. Upgrades

See [Upgrading](UPGRADING.md). Back up the database before applying a new release; migrations run automatically on startup.

## 8. Operational Checks

- Confirm `/health` returns `ok`.
- Confirm the admin dashboard loads.
- Confirm `/widget.js` returns JavaScript.
- Confirm the widget appears in a test page.
- Confirm announcements remain after container restart.
- Confirm `DING_BASE_URL` matches the public HTTPS origin.
- Review `docker compose logs ding` if any check fails.

## 9. Troubleshooting

See [Troubleshooting](TROUBLESHOOTING.md) for startup, reverse proxy, login, widget, volume, and migration issues.

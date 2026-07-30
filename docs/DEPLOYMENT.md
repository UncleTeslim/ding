# Deployment Guide

> **Ding docs:** [Home](README.md) · **Deployment** · [Backup and restore](BACKUP_AND_RESTORE.md) · [Upgrading](UPGRADING.md) · [Troubleshooting](TROUBLESHOOTING.md)

This guide describes a practical production deployment for Ding. Ding runs as one application container and stores its embedded SQLite database in a persistent Docker volume; no separate database service is required.

The Docker workflow is the same on Linux, macOS, and Windows with Docker Desktop. For a public production server, a small Linux VPS is the simplest choice. macOS and Windows are useful for local testing; only ordinary shell commands such as `mkdir` and `cp` differ.

## What you are setting up

- Ding runs in one Docker container.
- Docker keeps the SQLite database in the `ding-data` volume.
- The container listens on port `3000`.
- A reverse proxy such as Caddy or Nginx provides the public HTTPS address and forwards traffic to Ding.

For a local test, you can stop after the health check. For a live deployment, complete the reverse-proxy section before logging in or embedding the widget.

## 1. Prepare the Environment

Install Docker Engine and the Docker Compose plugin on Linux, or Docker Desktop on macOS/Windows. Install Node.js 20 or newer and npm to run `npm run setup`.

On Linux, make sure the Docker daemon is running. On macOS and Windows, start Docker Desktop and wait until it reports that Docker is running. An error mentioning `dockerDesktopLinuxEngine` means the Docker daemon is not reachable.

Clone the repository on the machine that will run Ding:

```bash
git clone https://github.com/UncleTeslim/ding
cd ding
```

Create production secrets:

```bash
npm install
npm run setup
```

The setup command asks for the admin credentials and the public HTTPS URL. It writes values in single-quoted `.env` form, for example `DING_ADMIN_USERNAME='admin'`. This is intentional: Docker Compose treats single-quoted values literally, which preserves the `$` characters in Ding's bcrypt password hash. Do not commit or share `.env`.

If you are testing locally without a public HTTPS name, use `.env.example` and `npm run dev` instead. `npm run setup` is intentionally production-only and requires an HTTPS origin.

Review the generated `.env` file:

```txt
DING_ADMIN_USERNAME='admin'
DING_ADMIN_PASSWORD_HASH='...'
DING_JWT_SECRET='...'
DING_IP_SALT='...'
DING_BASE_URL='https://ding.example.com'
DING_DB_PATH='./data/ding.db'
DING_TRUST_PROXY='false'
PORT='3000'
NODE_ENV='production'
```

## 2. Start Ding with Docker Compose

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

The database is in the named `ding-data` volume. Do not add `:ro` to `/app/data`; SQLite needs to write the database and its temporary companion files. The default Compose file leaves the container root filesystem writable for compatibility across Docker Desktop and Linux. The image still runs as the unprivileged `node` user, drops Linux capabilities, and uses a temporary filesystem for `/tmp`.

Useful checks:

```bash
docker compose ps
docker compose logs --tail=200 ding
```

On PowerShell, the same Docker commands work. Use `curl.exe` if PowerShell's `curl` alias produces different output.

## 3. Configure a Reverse Proxy on a Live Server

The reverse proxy is configured on the live server, outside Ding's container. It listens publicly on ports 80/443, obtains or uses the TLS certificate, and forwards requests to Ding's private listener at `127.0.0.1:3000`. These settings do not go in `.env`, `Dockerfile`, or `docker-compose.yml`.

Point the DNS record for `ding.example.com` at the server first and allow inbound TCP ports 80 and 443 through the firewall. Then install one reverse proxy. Caddy is the shortest setup because it obtains and renews Let's Encrypt certificates automatically.

Set `DING_BASE_URL` to the exact public HTTPS address users will open. The server rejects non-HTTPS values in production.

Keep `DING_TRUST_PROXY=false` for the normal same-server setup. This setting tells Ding whether to trust address and protocol headers from another service in front of it; only enable it when that service is trusted. `true` means the local machine, and `loopback`, `linklocal`, and `uniquelocal` are also accepted.

### Caddy

On a Linux server, put this in `/etc/caddy/Caddyfile`:

```caddyfile
ding.example.com {
  reverse_proxy localhost:3000
}
```

Then validate and reload Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

If Caddy runs as another Docker Compose service instead of on the host, proxy to `http://ding:3000` on a shared Docker network; `localhost:3000` would refer to the proxy container itself.

### Nginx

On a Linux server, save this as `/etc/nginx/sites-available/ding`, enable it, test it, and reload Nginx:

```nginx
server {
  listen 80;
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

```bash
sudo ln -s /etc/nginx/sites-available/ding /etc/nginx/sites-enabled/ding
sudo nginx -t
sudo systemctl reload nginx
```

Use your certificate manager (for example, Certbot with the Nginx plugin) to add HTTPS for `ding.example.com`, then reload Nginx. On a managed host, use the provider's load balancer or proxy configuration instead; the target remains the private Ding listener.

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

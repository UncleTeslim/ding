# Production installation

Run one Ding instance for your product, then embed its widget in the apps where users should see your updates. The dashboard, API and widget share one service; SQLite stores announcements, analytics and revoked sessions on disk.

## Before you start

- A Linux server or container host with Docker Engine and Compose v2. Docker Desktop also works for local rehearsals.
- Git, internet access for the build/image pull, and persistent storage mounted at `/app/data`.
- A domain/subdomain such as `updates.example.com`, with DNS pointing to your server.
- An HTTPS reverse proxy. This guide uses Caddy installed on the host; an existing Nginx or provider-managed HTTPS proxy also works.

Use [Docker's installation guide](https://docs.docker.com/engine/install/) and [Caddy's installation guide](https://caddyserver.com/docs/install) for your operating system. Confirm Docker is running with `docker info` and Compose is available with `docker compose version`.

The steps below use Bash on the server. Host Node.js is optional: the Docker setup command generates credentials inside the image.

## 1. Get the source and choose an image

```bash
git clone https://github.com/UncleTeslim/ding.git
cd ding
```

### Build the current source

This path works before a release is published:

```bash
docker build -t ding:local .
```

For repeatable deployments, record `git rev-parse HEAD` or check out the release tag you intend to build. Building a new version does not migrate your running database until you start that version.

### Use a published image

If [GitHub Releases](https://github.com/UncleTeslim/ding/releases) lists an available version, check its image tag and supported architecture, then pull that exact image. Do not assume an example version exists or that ARM images are published.

```bash
docker pull 'ghcr.io/uncleteslim/ding:<published-version>'
```

Replace `<published-version>` with the published tag without its leading `v`. For the setup command below, substitute this image for `ding:local`. A digest reference, `ghcr.io/uncleteslim/ding@sha256:<digest>`, also pins an image.

## 2. Generate production configuration

Run setup only for a new installation. It refuses to overwrite `.env`; do not regenerate secrets when upgrading an existing instance.

```bash
docker run --rm -it \
  --user "$(id -u):$(id -g)" \
  --mount "type=bind,source=$PWD,target=/setup" \
  --workdir /setup --entrypoint node \
  ding:local /app/scripts/setup.mjs
```

The command mounts only this checkout as `/setup`. Enter your admin username, a strong password other than `password`, and the **public HTTPS origin**, for example `https://updates.example.com`. Do not include a path such as `/dashboard`. The current password prompt displays typed characters; use a private terminal.

On Windows with Docker Desktop, run this from PowerShell in the checkout:

```powershell
docker run --rm -it --mount "type=bind,source=${PWD},target=/setup" --workdir /setup --entrypoint node ding:local /app/scripts/setup.mjs
```

Alternatively, with Node.js installed, run `npm ci --omit=dev --ignore-scripts` followed by `npm run setup`. This installs the setup helper's dependencies; Docker still builds the running app separately.

Setup writes a bcrypt hash, random secrets and production settings to `.env`. Preserve its single quotes: they keep `$` characters in bcrypt hashes literal when Compose reads the file. Keep `.env` private and save a secure copy separately from the server.

For a published image, add this line to `.env`, using the same exact version/digest you pulled:

```dotenv
DING_IMAGE='ghcr.io/uncleteslim/ding:<published-version>'
```

For a source build, leave `DING_IMAGE` unset so Compose uses `ding:local`. Leave the container `PORT=3000`; changing the public/host port is separate. See [configuration](CONFIGURATION.md).

## 3. Start and check Ding

```bash
docker compose up -d --no-build --wait
curl --fail http://127.0.0.1:3000/health
docker compose ps
```

Expected health response:

```json
{"ok":true,"db":"connected"}
```

Compose binds `127.0.0.1:3000` on the host and mounts the named `ding-data` volume at `/app/data`. Keep that volume and the same Compose project/directory name when replacing containers. Do not use `docker compose down -v` for maintenance; it deletes the database volume.

The internal HTTP listener is useful for health checks. Use the HTTPS origin for production login because the session cookie is `Secure`.

## 4. Make the instance reachable over HTTPS

Point the DNS A record (and AAAA only if your host serves IPv6) at your server. Allow inbound TCP 80/443 and keep port 3000 private.

For Caddy installed on the **host**, edit `/etc/caddy/Caddyfile`:

```text
updates.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

Replace the hostname, then validate and reload:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl --fail https://updates.example.com/health
```

With DNS and ports configured, [Caddy obtains and renews HTTPS certificates](https://caddyserver.com/docs/automatic-https). If a proxy runs in a container on Ding's network, its upstream is `ding:3000`, not `localhost:3000`.

For an existing Nginx deployment, use an HTTPS virtual host with a valid certificate and this location block:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

This single-proxy example replaces incoming client-address headers. Add the location block to your existing TLS configuration; it is not a complete Nginx/HTTPS installation. See [Nginx HTTPS configuration](https://nginx.org/en/docs/http/configuring_https_servers.html).

Set `DING_BASE_URL` to the exact origin used in the browser. Keep `DING_TRUST_PROXY=false` unless you have configured and verified a trusted proxy boundary. `true` means loopback trust, not trust of every proxy. Docker networking can present a host proxy as a bridge address; do not broaden trust just to remove an error. See [configuration](CONFIGURATION.md#proxy-trust-and-client-addresses).

## 5. Publish and embed

Open `https://updates.example.com`, log in, and follow [publishing your first update](PUBLISHING.md). Visit **Widget setup** for a snippet to add to your app; it generates code but does not verify installation.

Use your app on a separate HTTPS origin to verify the real embed. The Ding admin dashboard does not install the widget into your app automatically. See [framework examples and CSP](EMBEDDING.md).

## 6. Verify the full installation

- Log in through HTTPS, save a draft and publish an announcement.
- Confirm `https://updates.example.com/api/announcements` includes the published update and excludes drafts.
- Load your app, open the widget, expand the update, and check that analytics arrive in the dashboard.
- Run `docker compose restart ding`; verify the **same announcement**, not just a successful health response.
- Log out and confirm the dashboard requires login again.
- [Create a backup and restore it into a separate instance](BACKUP_AND_RESTORE.md).

Keep current backups, monitor disk space, and follow [upgrading](UPGRADING.md) for a new version.

## Other deployment options

A container platform can run the same image if it supplies a persistent volume at `/app/data`, production environment variables, port `3000`, HTTPS, and a `/health` health check. Set `DING_DB_PATH=/app/data/ding.db`. Use one replica for the embedded SQLite database; do not run several replicas against one database file.

Cloudflare Pages can serve a static website, but Pages/Workers cannot run this Node/SQLite container unchanged. The website URL and your Ding instance URL serve different roles.

The server can also run directly under Node.js after a source build: `node packages/server/dist/index.js`. You then provide a process supervisor, persistent working directory/database, environment, HTTPS proxy and restart policy yourself. Docker is the maintained installation path.

If a step fails, use [troubleshooting](TROUBLESHOOTING.md) before changing the database or deleting volumes.

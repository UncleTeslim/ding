# Production installation

Run one Ding instance for your product, then embed its widget in the apps where users should see your updates. The dashboard, API and widget share one service; SQLite stores announcements, analytics and revoked sessions on disk.

## Before you start

- A Linux server or container host with Docker Engine and Compose v2. Docker Desktop also works for local rehearsals.
- Git, internet access for the build/image pull, and persistent storage mounted at `/app/data`.
- A domain/subdomain such as `updates.example.com`, with DNS pointing to your server.
- An HTTPS reverse proxy. This guide uses Caddy installed on the host; an existing Nginx or provider-managed HTTPS proxy also works.

Use [Docker's installation guide](https://docs.docker.com/engine/install/) and [Caddy's installation guide](https://caddyserver.com/docs/install) for your operating system. Confirm Docker is running with `docker info` and Compose is available with `docker compose version`.

The steps below use Bash on the server. Host Node.js is optional: the Docker setup command generates credentials inside the image.

## 1. Get the Docker image and Compose file

For a fresh evaluation install, run these commands on the machine that will host Ding. This example uses the published release candidate `v0.1.0-rc.2`. The checkout supplies the matching Compose file and the image supplies the compiled application.

```sh
git clone --branch v0.1.0-rc.2 https://github.com/UncleTeslim/ding.git
cd ding
docker pull ghcr.io/uncleteslim/ding:0.1.0-rc.2
```

<a id="build-the-current-source"></a>

If you prefer to build from source, clone the revision you want, enter its `ding` folder and run `docker build -t ding:local .` instead of pulling the image. Use `ding:local` as the image name in step 2.

<a id="2-generate-production-configuration"></a>

## 2. Create your configuration once

From the `ding` folder, **run one of the following commands**. Pick the shell where you are typing. If you connected to a Linux server from Windows using SSH, use the Linux command on that server. If you are using Docker Desktop directly from PowerShell, use the Windows command.

### Linux or macOS terminal (Bash)

```bash
docker run --rm -it --user "$(id -u):$(id -g)" --mount "type=bind,source=$PWD,target=/setup" --workdir /setup --entrypoint node ghcr.io/uncleteslim/ding:0.1.0-rc.2 /app/scripts/setup.mjs
```

### Windows PowerShell

```powershell
docker run --rm -it --mount "type=bind,source=${PWD},target=/setup" --workdir /setup --entrypoint node ghcr.io/uncleteslim/ding:0.1.0-rc.2 /app/scripts/setup.mjs
```

Both commands start a temporary setup container. Enter an admin username, a strong password and the public HTTPS origin where you will open Ding, such as `https://updates.example.com`. Type the password in a private terminal because the prompt displays it.

When setup finishes, the container exits and your configuration is in `.env` beside `docker-compose.yml`. The mount gives the helper access to that folder as `/setup`. The Bash command also gives your user ownership of the file. Setup refuses to overwrite an existing configuration. For an existing instance, follow [Upgrading](UPGRADING.md).

**If you pulled the published image**, open the generated `.env` in a text editor and add this line so Compose starts the same image:

```dotenv
DING_IMAGE='ghcr.io/uncleteslim/ding:0.1.0-rc.2'
```

If you built `ding:local`, Compose already uses that name by default. Keep the other generated values and their quotes, back up the file privately, and continue to step 3.

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

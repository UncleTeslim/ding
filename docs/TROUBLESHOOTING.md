# Troubleshooting

Start in the directory containing Ding's Compose file and `.env`:

```bash
docker compose ps
docker compose logs --tail=100 ding
curl --fail http://127.0.0.1:3000/health
```

Use `curl.exe` on PowerShell. When requesting help, remove credentials, cookies, database files and `.env` contents from anything you share.

## Docker cannot connect

Start Docker Engine or Docker Desktop and run `docker info`. On Windows, an error mentioning `dockerDesktopLinuxEngine` means Docker's Linux engine is unavailable or inaccessible; it is separate from a Ding application error.

## Setup says `.env` already exists

Setup protects existing credentials from being replaced. For an existing instance, edit `.env` rather than running setup again. For a genuinely new installation, move any old configuration to a secure backup before generating a fresh one. The production prompt requires an HTTPS origin, not an HTTP localhost URL.

## The image cannot be pulled or built

Confirm the image/version actually exists in [Releases](https://github.com/UncleTeslim/ding/releases) and its package is public. Placeholder tags and a planned stable `0.1.0` are not evidence that an image has been published. If no release exists, use the [source build](DEPLOYMENT.md#build-the-current-source).

The published architecture must match your host. The release workflow currently builds for its default Linux runner platform; do not assume it publishes an ARM image. Build locally on the target architecture if needed.

For build failures, read the first error, check network access to npm/Docker Hub, and run from the repository root. See [local development](LOCAL_DEVELOPMENT.md#a-missing-rollup-native-package-on-linux) for the Linux Rollup optional-binary issue outside Docker.

## The container is unhealthy

Read startup logs before retrying. Common causes are invalid production configuration, a non-writable database mount, or a port mismatch.

Production requires a non-development password, separate JWT/IP secrets of at least 48 characters, and an HTTPS `DING_BASE_URL`. Preserve the generated dotenv single quotes so Compose does not interpolate `$` in the bcrypt hash.

After editing `.env`, recreate the container:

```bash
docker compose up -d --no-build --wait
```

A plain `restart` reuses the old environment. Don't print the full resolved Compose configuration in a public issue: it can contain credentials.

## HTTPS works but login fails

Open the **Ding HTTPS origin** for login, not its internal HTTP port or the marketing website. Production cookies are `Secure`. The hostname/scheme/port in `DING_BASE_URL` must match the origin in the browser; no path suffix is supported.

`403 Cross-site request blocked` usually means an origin mismatch. During source development, use localhost/127.0.0.1 on port 3000 or 5173. A Vite fallback to port 5174 is outside the default allowlist.

`429` after repeated attempts is the login rate limit, not a wrong-password response. Wait for the limit to expire; don't reset the production database to recover access.

## Proxy or analytics address issues

Keep port 3000 private and configure the proxy to forward the correct host/protocol. `DING_TRUST_PROXY=true` only trusts loopback addresses; a Docker bridge is a different address range. See [proxy trust](CONFIGURATION.md#proxy-trust-and-client-addresses) before changing it.

With trust disabled behind a proxy, users may share the proxy's IP for rate limits and analytics. Analytics also deliberately deduplicate repeat opens for 24 hours. Daily hashed-IP counts and per-announcement event totals measure different things.

## The widget is missing or stale

- Check the browser Network panel: `/widget.js` must return JavaScript and `/api/announcements` must return JSON from your Ding origin.
- Publish an announcement; drafts are private and banner-only mode has nothing to display with an empty feed.
- Use HTTPS for Ding when the app uses HTTPS; mixed HTTP content is blocked.
- Check the browser console for CSP, connection or extension-blocking errors. Allow the Ding origin for scripts/connections and account for its inline styles.
- Include the script once in the app's persistent document/root. Duplicate scripts can create duplicate widgets/listeners.
- Existing pages poll roughly once a minute while visible; responses can be cached for 30 seconds. Refresh the host page when testing.
- If a reverse proxy/CDN caches `/api/*` longer than the app's headers, remove that cache rule. Never cache admin/auth responses.

For framework-specific placement, see [embedding](EMBEDDING.md).

## Database permission errors or missing data

Keep `/app/data` writable by the image's `node` user and mounted to persistent storage. Do not use a read-only volume. A bind mount or restored file with the wrong owner can cause `attempt to write a readonly database`.

Check the Compose project/directory name and volume before assuming data was deleted: a different project can create a new empty volume. Do not run `down -v` or prune volumes while diagnosing this. If the original volume was deleted, use a verified [backup](BACKUP_AND_RESTORE.md).

## Migration errors

Stop repeated startup attempts, preserve the database and read the first migration failure. Restore a pre-upgrade backup with the matching previous application if recovery is needed; see [upgrading](UPGRADING.md).

## Get help

Open a [bug report](https://github.com/UncleTeslim/ding/issues/new?template=bug_report.md) with the Ding version/commit, OS/architecture, Docker/Compose versions, relevant redacted logs and the failing step. For suspected vulnerabilities, follow the private route in the [security policy](../SECURITY.md).

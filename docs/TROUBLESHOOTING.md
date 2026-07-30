# Troubleshooting

Start with the service state and recent logs:

```bash
docker compose ps
docker compose logs --tail=200 ding
curl -i http://127.0.0.1:3000/health
```

## Ding exits immediately after setup

Check the generated `.env`. Production requires:

- A non-default admin password hash.
- A long `DING_JWT_SECRET`.
- A long `DING_IP_SALT`.
- An HTTPS `DING_BASE_URL`.

The setup command asks for the public HTTPS URL. If you edited `.env` manually, confirm that it has no quotes or trailing comments in values.

## `DING_BASE_URL` or CSRF errors

`DING_BASE_URL` must exactly match the public origin users access, including the scheme and hostname. It should not include a path, query string, or trailing application route.

If Ding is behind a reverse proxy:

- Forward `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`.
- Keep `DING_TRUST_PROXY=false` unless the immediate proxy hop is trusted.
- If enabling proxy trust, use the narrowest supported value.
- Ensure the proxy sends HTTPS to the browser and Ding's base URL also uses HTTPS.

## Login loops or secure cookies are missing

Production cookies are marked `Secure`. Access the dashboard through HTTPS, not the container's plain HTTP port. Keep port `3000` bound to localhost and terminate TLS at Caddy, Nginx, Traefik, or another trusted reverse proxy.

## Port 3000 is already in use

Find the process using the port, or change the host side of the Compose mapping while keeping the container port at `3000`:

```yaml
ports:
  - "127.0.0.1:3100:3000"
```

Update your reverse proxy and health-check commands accordingly.

## Database unavailable or permission denied

Confirm the volume is mounted and the container is running as the non-root `node` user:

```bash
docker compose ps
docker volume ls
docker compose logs --tail=200 ding
```

Do not mount `/app/data` read-only. If using a host bind mount, make the directory writable by the container user. Do not delete the volume while troubleshooting.

## Data disappeared after a restart

Check that the Compose volume is still present. `docker compose down` is safe; `docker compose down -v` removes the database volume. If the volume was deleted, restore the latest verified backup.

## Widget does not appear

Check the browser network panel and confirm:

- The `widget.js` URL points to the Ding instance.
- The Ding instance is reachable over HTTPS.
- `/api/announcements` returns a successful response.
- At least one announcement is published.
- The host page's CSP allows the Ding script and API origin.
- The embed attributes use supported values.

The widget is intentionally cross-origin, while admin APIs are same-origin.

## Migration errors

Read the first migration error in the logs and stop repeated restarts. Preserve the database before attempting recovery. Verify that the application image contains the migration files and that the volume is writable. For an upgrade-related failure, follow the rollback and restore procedure in [Upgrading](UPGRADING.md).

## Need more help

When opening an issue, include:

- Ding release or Git commit.
- Docker and Docker Compose versions.
- Operating system and architecture.
- The relevant `docker compose ps` output.
- The relevant logs with secrets and credentials removed.
- Whether the deployment uses a named volume or bind mount.

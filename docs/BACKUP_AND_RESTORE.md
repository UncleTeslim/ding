# Backup and Restore

Ding uses an embedded SQLite database stored in the persistent `ding-data` Docker volume. The database is not a separate container. Treat the volume as the source of truth for announcements and analytics.

## Before a backup

Create a local backup directory and stop Ding cleanly. A clean stop lets SQLite checkpoint its write-ahead log before the file is copied.

```bash
mkdir -p backups
docker compose stop ding
```

Copy the database out of the stopped container:

```bash
docker compose cp -a ding:/app/data/ding.db "./backups/ding-$(date +%Y-%m-%d).db"
docker compose start ding
```

On PowerShell, use a fixed or generated filename instead of the Unix `date` expression:

```powershell
New-Item -ItemType Directory -Force backups | Out-Null
docker compose stop ding
docker compose cp -a ding:/app/data/ding.db .\backups\ding-2026-07-30.db
docker compose start ding
```

Keep multiple dated backups. Store at least one copy outside the server that runs Ding.

## Verify a backup

After restarting, check the service:

```bash
curl --fail http://127.0.0.1:3000/health
docker compose ps
```

Confirm that the backup file exists and is non-empty. Periodically perform a restore drill on a separate Ding instance; a backup that has never been restored is not a verified backup.

## Restore a backup

Stop Ding and copy the selected file back into the volume:

```bash
docker compose stop ding
docker compose cp -a "./backups/ding-2026-07-30.db" ding:/app/data/ding.db
docker compose start ding
```

Then verify:

```bash
curl --fail http://127.0.0.1:3000/health
docker compose logs --tail=100 ding
```

Open the dashboard and confirm that announcements and analytics are present.

## Important volume warnings

- `docker compose down` keeps the named volume.
- `docker compose down -v` deletes the named volume and its SQLite database.
- Removing the repository directory does not remove a named Docker volume, but deleting Docker volumes does.
- Do not copy the SQLite file while Ding is actively writing unless you use SQLite online-backup tooling or an infrastructure snapshot designed for SQLite WAL files.
- Keep the pre-restore database as a separate backup until the restored instance has been validated.

## Bind-mounted storage

If you replace the named volume with a host bind mount, back up the host directory only after stopping Ding. Keep the directory writable by the container's `node` user and do not expose the database file through a web server.

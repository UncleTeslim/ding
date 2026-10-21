# Backup and restore

Ding stores announcements, analytics and revoked sessions in SQLite. In Compose, the database is `/app/data/ding.db` in the named `ding-data` volume. Back up the database **and** keep a separate secure copy of `.env` and your pinned image/version.

## Back up a stopped instance

Stop Ding cleanly so SQLite can finish its writes, then copy the database. This procedure has brief downtime:

```bash
mkdir -p backups
docker compose stop ding
docker compose cp ding:/app/data/ding.db ./backups/ding-backup.db
docker compose start ding
curl --fail http://127.0.0.1:3000/health
```

Use a new destination filename for each backup rather than overwriting your last known good copy. On PowerShell, create the folder with `New-Item -ItemType Directory -Force backups`; the Docker commands are the same, and use `curl.exe`.

Confirm the file is non-empty and the original announcements are still present after restart. Copy backups off the host and protect them like the application database. Do not copy a live SQLite file without an online-backup tool: uncheckpointed writes can live in companion files.

## Restore into a separate instance first

Use a separate checkout/directory or Compose project name, its own `.env`, a different host port and its own volume. Do not attach the test instance to the production volume. Use the same image version as the backup, or a version with a documented compatible upgrade path.

Create the destination container/volume **without starting Ding**:

```bash
docker compose create ding
```

For a default Docker volume, use a helper that runs as the image's `node` user to place a fresh backup in `/app/data`. These Bash commands also remove stale SQLite sidecars from the **stopped destination volume** before the replacement:

```bash
docker compose run --rm --no-deps --entrypoint sh \
  -v "$PWD/backups:/backups:ro" ding -c \
  'rm -f /app/data/ding.db-wal /app/data/ding.db-shm; cp /backups/ding-backup.db /app/data/ding.db'
docker compose up -d --no-build --wait
```

In PowerShell, replace the multiline helper with:

```powershell
docker compose run --rm --no-deps --entrypoint sh -v "${PWD}/backups:/backups:ro" ding -c 'rm -f /app/data/ding.db-wal /app/data/ding.db-shm; cp /backups/ding-backup.db /app/data/ding.db'
```

The helper preserves file ownership for the default non-root image. Avoid `docker compose cp -a` from a host-owned file into the container: archive mode can import a UID that Ding cannot write as. If you changed the container user or storage setup, verify permissions before starting.

Check `/health`, log in, and verify a known announcement **by its ID/title/body** and the expected analytics. Health alone does not prove the backup contains your data.

## Restore over an existing database

Restoring replaces data. First create and verify a backup of the existing destination database, then run `docker compose stop ding`. Keep Ding stopped throughout the helper copy above; do not restart it between replacing the database and removing old sidecars.

Start the same image version and verify the restored content. Reuse the matching `.env` when recovering the original instance; treat recovered sessions as sensitive and rotate the JWT secret if session invalidation is required.

## Storage and volume precautions

- `docker compose down` preserves named volumes; `docker compose down -v` deletes them.
- Compose project/directory names determine volume names. Starting from a new project name can create an empty database instead of reusing the old one.
- A host bind mount must remain writable by the container user.
- Keep at least one verified backup outside the server that runs Ding.

Before an upgrade, read [upgrading](UPGRADING.md). For permission or migration failures, use [troubleshooting](TROUBLESHOOTING.md).

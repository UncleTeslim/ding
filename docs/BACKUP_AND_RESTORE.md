# Backup and Restore

> [Ding docs](README.md) · [Deployment](DEPLOYMENT.md) · **Backup and restore** · [Upgrading](UPGRADING.md) · [Troubleshooting](TROUBLESHOOTING.md)

Ding stores announcements and analytics in one SQLite database inside the persistent `ding-data` Docker volume. The volume is the important data to protect; rebuilding the image does not replace it, but deleting the volume does.

The safest backup is a copy of the database while Ding is stopped. This avoids copying the database halfway through a write.

## Create a backup

Create a local backup directory and stop Ding cleanly:

```bash
mkdir -p backups
docker compose stop ding
```

Copy the database out of the stopped container, then start Ding again:

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

Use a new filename for every backup. Keep multiple dated backups, and store at least one copy outside the server that runs Ding.

## Check that the backup worked

After restarting, check the service:

```bash
curl --fail http://127.0.0.1:3000/health
docker compose ps
```

Confirm that the backup file exists and is non-empty. Open the dashboard after restarting Ding and check that existing announcements are still present.

Periodically test a restore on a separate Ding instance. A backup that has never been restored is not a verified backup.

## Restore a backup

Restoring replaces the current database. Keep the current database as a separate backup first, then stop Ding and copy the selected backup into the volume:

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

If Ding does not start after a restore, read the first error in the logs and check that the restored file is readable. Do not keep restarting a failing container without checking the logs.

## Important warnings

- `docker compose down` keeps the named volume.
- `docker compose down -v` deletes the named volume and its SQLite database.
- Removing the repository directory does not remove a named Docker volume, but deleting Docker volumes does.
- Do not copy the SQLite file while Ding is actively writing. The database may use small companion files during a write, so a live copy may be incomplete.
- Keep the pre-restore database as a separate backup until the restored instance has been validated.

## If you changed the storage setup

If you replace the named volume with a host folder, back up that folder only after stopping Ding. Keep it writable by the container's `node` user and never expose the database file through a web server.

# Upgrading Ding

Use a tagged release for production deployments when possible. Following `main` directly can include unfinished changes.

## Before upgrading

1. Read the release notes and migration notes.
2. Confirm that you can access the admin credentials and `.env` file.
3. Create and verify a database backup using [Backup and Restore](BACKUP_AND_RESTORE.md).
4. Record the current Ding version and Git commit.
5. Confirm that the Docker host has enough disk space for a new image and a temporary backup.

## Source deployment

From the Ding checkout:

```bash
git fetch --tags origin
git checkout <release-tag>
docker compose up --build -d --wait
```

Migrations run automatically during startup. Check the result:

```bash
curl --fail http://127.0.0.1:3000/health
docker compose ps
docker compose logs --tail=100 ding
```

Then open the dashboard and test the widget from a real host page.

## If an upgrade fails

Do not repeatedly restart a failing container before checking the logs:

```bash
docker compose logs --tail=200 ding
```

If the failure is application-only, return to the previous release tag and rebuild. If a migration changed the database and the previous application cannot read it, stop and restore the pre-upgrade database backup before rolling back the application.

```bash
git checkout <previous-release-tag>
docker compose down
docker compose up --build -d --wait
```

Database restores are described in [Backup and Restore](BACKUP_AND_RESTORE.md).

## After an upgrade

- Confirm `/health` returns `{ "ok": true, "db": "connected" }`.
- Confirm the admin dashboard loads and login works.
- Confirm existing announcements are present.
- Publish or edit a test announcement if appropriate.
- Confirm the widget loads from a host page.
- Check the logs for migration warnings or repeated database errors.

Never use `docker compose down -v` as part of a normal upgrade.

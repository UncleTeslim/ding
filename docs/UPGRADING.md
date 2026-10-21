# Upgrade Ding

Keep your database volume and configuration while replacing the application. Migrations run when the new version starts. The first supported version is planned as `0.1.0`; an upgrade between supported versions can only be validated once a successor exists. Follow any migration notes in the actual release you install.

## Before changing versions

1. Read the [release notes](https://github.com/UncleTeslim/ding/releases).
2. [Back up and verify the database](BACKUP_AND_RESTORE.md). Keep `.env` securely and do not rerun setup.
3. Record your current image tag/digest (or source commit), Compose project/directory name, and database volume.
4. Keep the previous image available for rollback and allow enough disk space for the backup and new image.

## Published-image installation

Edit `DING_IMAGE` in `.env` to the new **published** tag or digest. Then:

```bash
docker compose pull ding
docker compose up -d --no-build --wait
```

Do not add `--build`: it would build the checkout rather than use the release you selected. Keep the same project name and volume.

## Source-built installation

Use a clean checkout, fetch tags, and check out the desired published tag:

```bash
git fetch --tags origin
git checkout '<release-tag>'
docker build -t ding:local .
docker compose up -d --no-build --wait
```

Leave `DING_IMAGE` unset for `ding:local`. If you deliberately run development commits, update `main` with `git pull --ff-only origin main` before building and record the resulting commit. Do not mix that path with a pinned release image.

## Verify the result

```bash
curl --fail http://127.0.0.1:3000/health
docker compose ps
docker compose logs --tail=100 ding
```

Open the HTTPS dashboard, check the **same existing announcements and analytics**, and verify the widget from your app. A green health check alone does not establish data persistence or a successful migration.

## If the upgrade fails

Read the first failure in the logs and stop the container if migrations or database errors recur:

```bash
docker compose logs --tail=200 ding
docker compose stop ding
```

If the old application supports the database's current schema, select the recorded old image and run `docker compose up -d --no-build --wait`. For a source installation, check out the previous commit/tag and rebuild first.

If schema compatibility is unknown, restore the verified **pre-upgrade** database with the old image before starting it. Do not assume downgrading the image reverses migrations. Test the recovery separately when possible; follow [backup and restore](BACKUP_AND_RESTORE.md).

Never add `-v` to `docker compose down` during an upgrade or rollback: it deletes the database volume.

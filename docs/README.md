# Ding Documentation

Ding is a self-hosted service. These guides explain how to run it, protect its data, update it, and fix common problems.

## Choose a guide

- [Deploy Ding](DEPLOYMENT.md) — install Ding locally or on a live server.
- [Back up and restore](BACKUP_AND_RESTORE.md) — protect announcements and analytics.
- [Upgrade Ding](UPGRADING.md) — update the app without losing data.
- [Troubleshoot Ding](TROUBLESHOOTING.md) — find and fix common startup, database, proxy, and widget problems.
- [API reference](API.md) — integrate with Ding's HTTP endpoints.

## Recommended order

For a new live installation, read [Deploy Ding](DEPLOYMENT.md) first. Before changing or upgrading a working installation, read [Back up and restore](BACKUP_AND_RESTORE.md). If something goes wrong, start with [Troubleshoot Ding](TROUBLESHOOTING.md) and only then use the rollback steps in [Upgrade Ding](UPGRADING.md).

## A few terms in plain English

- A **container** is the running package that contains Ding.
- A **volume** is Docker-managed storage that keeps the database after the container is replaced.
- A **reverse proxy** is the public front door. It handles HTTPS and passes requests to Ding on port `3000`.
- A **migration** is a small database update that runs when a new Ding version starts.

The commands in these guides use Bash syntax unless a PowerShell version is shown. Docker commands are otherwise the same on Linux, macOS, and Windows Docker Desktop.

# Releasing Ding

> [Deployment](DEPLOYMENT.md) · [Upgrading](UPGRADING.md) · [Backup and restore](BACKUP_AND_RESTORE.md)

## Before the first release

`0.1.0` will establish the first supported-version baseline. Test upgrades when the next supported version is prepared.

1. Complete a production installation and recovery rehearsal before publishing a supported release.
2. Update the root and workspace package versions, changelog, and any migration notes.
3. Confirm the GitHub Actions workflow has permission to publish packages. Check the GHCR package visibility after the first run and make it public if the release is intended for public pulls.
4. Merge the release commit to the default branch and ensure CI passes.

## Publish a version

### Test a release candidate

Before the first supported release, publish a candidate such as `v0.1.0-rc.2` to verify the workflow and clean-machine install. The release is marked as a prerelease, and the image is published as `ghcr.io/uncleteslim/ding:0.1.0-rc.2`; it does not make stable `0.1.0` an official supported release.

```bash
git tag -a v0.1.0-rc.2 -m "Ding 0.1.0 release candidate 2"
git push origin v0.1.0-rc.2
```

The workflow accepts `-rc.N` prerelease tags and publishes only their exact versioned image tag. Verify the Actions run, prerelease status, GHCR visibility, and a clean-machine pull/install. Fixes require a new candidate tag, such as `v0.1.0-rc.3`; do not move or reuse a tag.

### Publish the supported release

When ready for the public launch, publish the first supported stable version:

```bash
git tag -a v0.1.0 -m "Ding 0.1.0"
git push origin v0.1.0
```

The tag workflow builds and publishes `ghcr.io/uncleteslim/ding:0.1.0`, then creates a stable GitHub release with generated notes. It accepts stable `vMAJOR.MINOR.PATCH` tags. Do not move or reuse a release tag; cut a new patch version for corrections. Verify the workflow run, release notes, image tag and package visibility on GitHub before announcing the release.

The current `0.1.0` package versions are candidates only. A release candidate does not make the stable `0.1.0` release supported.

## Install a published image

Follow [Production installation](DEPLOYMENT.md) to pull the exact image and generate a new production `.env` using its included setup helper. Preserve an existing instance's configuration. Set `DING_IMAGE` to the exact version actually published; the stable version below is an example, not a claim of availability:

```dotenv
DING_IMAGE=ghcr.io/uncleteslim/ding:0.1.0
```

Pull and start the pinned image without building from the checkout:

```bash
docker compose pull ding
docker compose up -d --no-build --wait
```

Check `/health`, log in, publish a test announcement, and load the widget from a separate HTTPS origin. Keep the exact version in `.env`; do not use a floating tag for a production install. Follow [Upgrading](UPGRADING.md) for backup, upgrade and rollback steps.

## Release follow-up

- Confirm the release and package are publicly accessible from a clean machine.
- Pull the exact version on a clean Docker host and perform the installation and recovery checks.
- Update deployment docs and screenshots to match the published artifact.
- Record the tag, image digest, workflow result and remaining compatibility notes in the launch review.

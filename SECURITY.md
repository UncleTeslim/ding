# Security policy

Ding is a single-instance, self-hosted service. Operators control its host, storage, HTTPS proxy and backups.

## Supported versions

There is no supported stable release yet. `0.1.0` is planned as the first supported version. Until then, fixes target `main`; prereleases are for evaluation and may require updates before production use. Once stable releases exist, consult their release notes for support and migration information.

## Report a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/UncleTeslim/ding/security/advisories/new) when available. If that route is unavailable, open an issue asking for a private reporting channel **without vulnerability details**. Do not post exploit details, credentials or a database publicly.

Include the affected version/commit, reproduction steps, deployment mode, impact and any mitigation through the private channel.

## Current protections

- One admin login with a bcrypt password hash; signed seven-day sessions in HTTP-only, `SameSite=Strict` cookies.
- Production cookies are `Secure`; HTTPS is required for normal authenticated use.
- Logout revokes a valid token server-side as well as clearing the cookie. Revocations persist in SQLite.
- Mutating auth/admin routes reject a foreign browser `Origin`; every admin route also requires authentication.
- Production rejects missing credentials, known development secrets/passwords, short JWT/IP secrets and non-HTTPS base URLs.
- Login and public analytics endpoints have in-memory rate limits.
- Public widget reads/events intentionally support cross-origin use without admin credentials.
- Analytics store keyed IP hashes rather than raw IPs; events deduplicate over a rolling 24-hour window and expire after 12 months.

## Operator responsibilities

Follow [production installation](docs/DEPLOYMENT.md), keep port 3000 private, and set `DING_BASE_URL` to the exact browser origin. Keep the generated `.env` and database backups private. Preserve single-quoted hashes in dotenv files.

Leave proxy trust disabled unless a verified proxy boundary requires it; see [configuration](docs/CONFIGURATION.md#proxy-trust-and-client-addresses). Maintain the host, proxy, container runtime and installed Ding version, and verify [backup restores](docs/BACKUP_AND_RESTORE.md).

## Scope and limits

There is one shared admin account, without per-user roles, MFA or SSO. Rate limits are per process; the current SQLite deployment is designed for one replica. Widget read state is browser-local, and IP-based analytics are approximate.

The widget uses local storage and injects inline styles. Its host application must supply an appropriate CSP. It does not currently accept a style nonce or provide an authenticated visitor identity.

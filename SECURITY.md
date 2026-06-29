# Security Policy

Ding is designed for self-hosted deployments where the operator controls the infrastructure and the data. Security work should therefore keep the deployment simple while removing avoidable risk.

## Supported Version

The current v1 line receives security fixes. Until the first tagged release, security fixes should target `main`.

## Reporting a Vulnerability

Please open a private security advisory on GitHub if available. If not, contact the maintainer directly before publishing details. Include:

- A clear description of the issue
- Steps to reproduce
- The affected route, package, or deployment mode
- Any known mitigation

Please avoid sharing exploit code publicly before a fix is available.

## Current Security Model

- Admin access is protected by username and password.
- The admin password is stored as a bcrypt hash.
- Sessions are signed JWTs stored in HTTP-only cookies.
- Cookies use `SameSite=Strict`.
- Cookies are marked `Secure` when `NODE_ENV=production`.
- Production refuses weak development values for `DING_JWT_SECRET` and `DING_IP_SALT`.
- Public widget endpoints are intentionally cross-origin.
- Admin APIs are same-origin and require the session cookie.
- Analytics store salted IP hashes, not raw IP addresses.

## Production Checklist

- Run `npm run setup` and keep the generated `.env` private.
- Set `NODE_ENV=production`.
- Put Ding behind HTTPS.
- Keep `DING_TRUST_PROXY=true` when using Caddy, Nginx, Traefik, Fly.io, Railway, or a similar proxy.
- Back up the SQLite database file or Docker volume.
- Do not reuse development secrets.
- Do not commit `.env`.

## Known Limitations

- V1 does not include SSO, MFA, or per-user admin accounts.
- V1 uses in-memory rate limiting, which is appropriate for a single-instance deployment.
- Logout clears the browser cookie, but JWTs remain cryptographically valid until expiry.
- Widget markdown supports a safe, small subset of markdown rather than arbitrary HTML.

These choices keep v1 self-hostable and understandable. They should be revisited if Ding grows into multi-admin or hosted deployments.

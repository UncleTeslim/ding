# Configuration

Use [production setup](DEPLOYMENT.md#2-generate-production-configuration) to create a new `.env`. For an existing instance, edit the current file and recreate the container with `docker compose up -d --no-build --wait`. A plain `docker compose restart` does not reload changed environment values.

## Server variables

| Variable | Default / production requirement |
| --- | --- |
| `DING_ADMIN_USERNAME` | Required in production; development defaults to `admin` |
| `DING_ADMIN_PASSWORD_HASH` | Required bcrypt password hash in production; the development `password` is rejected |
| `DING_JWT_SECRET` | Required production secret, at least 48 characters; setup generates 96 hex characters |
| `DING_IP_SALT` | Separate required production secret with the same minimum; used for keyed IP hashing |
| `DING_BASE_URL` | Required public HTTPS origin in production, e.g. `https://updates.example.com`; development defaults to `http://localhost:3000` |
| `DING_DB_PATH` | `./data/ding.db`, relative to the server working directory; `/app/data/ding.db` is the equivalent container path |
| `DING_TRUST_PROXY` | `false`; supported trusted ranges are described below |
| `PORT` | `3000`; keep this container port with the supplied Compose file and health check |
| `NODE_ENV` | `development` in source development; the Docker image uses `production` unless overridden |
| `DING_IMAGE` | Compose-only image selection, defaults to `ding:local`; set a published GHCR tag/digest for an image installation |

Production rejects development secrets, secrets shorter than 48 characters, the known development password and non-HTTPS base URLs. Use an origin without a path, query, credentials or fragment. Your browser's URL and `DING_BASE_URL` must agree for authenticated mutations.

Preserve single quotes around generated dotenv values. An unquoted bcrypt hash can be corrupted by Compose's `$` interpolation. `.env` contains credentials; do not commit it or paste it into an issue.

Keep a secure backup of `.env`. Changing the JWT secret invalidates existing sessions; changing the IP salt changes analytics deduplication identity. Do not rerun setup as part of an ordinary upgrade.

## Ports and storage

Compose publishes only `127.0.0.1:3000:3000`. If port 3000 on the **host** is busy, change the left-hand port, for example `127.0.0.1:3100:3000`, and point your proxy/local health checks at 3100. Leave container `PORT` and its health check at 3000.

A named volume mounts at `/app/data`. Keep the same Compose project/directory name to reuse it. Deleting a container or running `docker compose down` keeps this volume; adding `-v` deletes it. A bind mount must be writable by the container's `node` user.

## Proxy trust and client addresses

Start with `DING_TRUST_PROXY='false'`. Ding can still use a separately configured HTTPS origin and secure cookies; enabling proxy trust is not required just because a proxy exists.

Accepted values:

| Value | Meaning |
| --- | --- |
| `false` | Use the direct connection address |
| `true` or `loopback` | Trust loopback proxy addresses |
| `linklocal` | Trust link-local proxy addresses |
| `uniquelocal` | Trust private-network proxy addresses |

These are address ranges, not a count of proxy hops. `true` does not mean trust every proxy. CIDR lists and numeric hop counts are not accepted by the current configuration parser. Enable a range only when direct access is restricted and your proxy replaces untrusted forwarding headers.

With trust disabled behind a proxy, client IPs may collapse into one proxy address, so analytics/rate limits may group visitors together. On Railway, Ding uses a validated `X-Real-IP` only when the Railway environment is detected. Other deployments use Express's resolved address. Verify the actual network boundary before enabling broader trust.

For the common **host Caddy → loopback-published Docker port** setup, the immediate connection may appear as a private Docker bridge address. If only that trusted proxy/host can reach Ding, its network has no untrusted peers, and the proxy replaces incoming forwarding headers, `DING_TRUST_PROXY='uniquelocal'` can trust that hop. Recreate the container and verify the resulting client-address behavior before relying on counts. [Caddy replaces incoming forwarding headers by default](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#defaults); extra CDN/proxy hops need their own verified trust configuration. Keep `false` if those conditions are not established.

## Widget attributes

| Attribute | Default | Accepted values |
| --- | --- | --- |
| `data-trigger` | `bell` | `bell`, `banner`, `both` |
| `data-position` | `bottom-right` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `data-color` | `#6366f1` | A six-digit hex color such as `#155eef` |

Invalid attributes fall back to their defaults. The widget derives the API origin from its script URL. Serve it from the same origin as its API, without a path prefix. There is no separate project ID, API token or hosted endpoint to configure.

See [embedding](EMBEDDING.md) for framework examples and [publishing](PUBLISHING.md) for analytics definitions.

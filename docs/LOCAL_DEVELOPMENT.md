# Local development

Try Ding on your computer or change the source without a public domain. Use the [production guide](DEPLOYMENT.md) to expose an instance to other users.

## Requirements

- Git, npm, and Node.js **22.12 or newer on the 22.x line**, or a current Node.js 24 release. The current Vite build requires a recent Node runtime; early Node 20/22 releases are insufficient.
- A supported native `better-sqlite3` binary, or the compiler tools needed to build it if npm cannot download one.

The Docker build includes its own Node runtime and native build environment; it does not need host Node.

## Install and start

```bash
git clone https://github.com/UncleTeslim/ding.git
cd ding
npm ci
cp .env.example .env
npm run build
npm run dev
```

On PowerShell, replace `cp .env.example .env` with `Copy-Item .env.example .env`. For an existing checkout, preserve your `.env` instead of copying over it.

Do not run `npm run setup` for this HTTP development flow: that command generates production configuration and requires HTTPS.

| Address | Purpose |
| --- | --- |
| `http://localhost:5173` | Dashboard with Vite live reload; use this when editing the UI |
| `http://localhost:3000` | API, health, widget script and the last built dashboard |

Sign in with **admin / password** from `.env.example`. These credentials are for a private development instance only. If port 5173 is occupied, stop the other process: Vite's automatic fallback port is not in Ding's default development origin allowlist.

The initial build creates the assets that the server serves. During development, the widget build watches source changes; dashboard changes use Vite at port 5173. Rebuild to refresh the dashboard served on port 3000.

## Publish and test your embed

Create an announcement and publish it. Add the following to a page in your local app:

```html
<script src="http://localhost:3000/widget.js" data-trigger="both" async></script>
```

Use the local app's HTTP origin for this test. An HTTPS app must load an HTTPS Ding instance; browsers block mixed HTTP content. The widget contacts the origin in its `src`, not the marketing website.

## Commands

```bash
npm run build
npm run typecheck
npm test
npm run coverage
npm run check:size
```

`npm run dev` runs the API, dashboard dev server and widget watcher together. Stop them with Ctrl+C. Local data defaults to `data/ding.db`; don't point experiments at a production database.

## A missing Rollup native package on Linux

The current lockfile can omit a platform-specific Rollup binary. If a clean build reports `Cannot find module @rollup/rollup-linux-x64-gnu` on Linux x64 with glibc, restore the matching installed Rollup version without regenerating the lockfile:

```bash
ROLLUP_VERSION="$(node -p 'require("./node_modules/rollup/package.json").version')"
ROLLUP_ARCHIVE="$(npm pack "@rollup/rollup-linux-x64-gnu@$ROLLUP_VERSION" --silent)"
mkdir -p node_modules/@rollup/rollup-linux-x64-gnu
tar -xzf "$ROLLUP_ARCHIVE" --strip-components=1 -C node_modules/@rollup/rollup-linux-x64-gnu
rm "$ROLLUP_ARCHIVE"
npm run build
```

Those commands are specifically for Linux x64/glibc. The Dockerfile restores the correct package for its own architecture/libc, and CI handles the Linux runner. Do not install a Linux binary on Windows/macOS. For other platform failures, report the exact missing module and platform in an [issue](https://github.com/UncleTeslim/ding/issues).

For contribution expectations, see [contributing](../CONTRIBUTING.md).

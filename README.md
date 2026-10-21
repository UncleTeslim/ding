<p align="center">
  <img src="assets/logo.svg" alt="Ding" width="260">
</p>

# Ding

Ding is an open-source, self-hosted changelog widget. Write an update in your dashboard and publish it inside your app as a bell, a banner, or both. Your users can read it without leaving their work.

You run one Ding instance for your product. It serves the dashboard, widget and API, with SQLite in a persistent volume. Your users do not install Ding or need a Ding account.

[Documentation](https://www.dingwidget.com/docs/introduction/) · [Production installation](docs/DEPLOYMENT.md) · [Report a bug](https://github.com/UncleTeslim/ding/issues/new?template=bug_report.md)

## What you can do

- Write Markdown updates with tags, previews and drafts.
- Publish, edit, unpublish and delete announcements.
- Embed the widget in HTML, React, Next.js, Vue, Svelte or Angular apps.
- See aggregate views, expansions and click-through rates.
- Keep announcements and analytics on your infrastructure; widget read state stays in each visitor's browser.

The widget loads from your instance with no external fonts, trackers or runtime dependencies. The admin dashboard uses a secure session cookie; the widget uses local storage for read state.

## Run in production with Docker

You need Docker with Compose, Git, a persistent disk, and a domain/subdomain with HTTPS. The [production guide](docs/DEPLOYMENT.md) includes DNS, proxy setup, Windows commands and verification.

Build from source (works without a published release):

```bash
git clone https://github.com/UncleTeslim/ding.git
cd ding
docker build -t ding:local .
```

Generate your credentials inside the image. This Bash command runs as your host user and writes `.env` in the checkout:

```bash
docker run --rm -it \
  --user "$(id -u):$(id -g)" \
  --mount "type=bind,source=$PWD,target=/setup" \
  --workdir /setup --entrypoint node \
  ding:local /app/scripts/setup.mjs
```

Enter an admin username, a strong password and your public origin, such as `https://updates.example.com`. Run setup only for a new installation; it refuses to overwrite an existing `.env`. The current prompt displays typed input, so use a private terminal.

Start Ding:

```bash
docker compose up -d --no-build --wait
curl --fail http://127.0.0.1:3000/health
```

Expected: `{"ok":true,"db":"connected"}`. The port is bound to `127.0.0.1`, and `ding-data` preserves the database when the container is replaced.

Put an HTTPS reverse proxy in front of that listener. For host-installed Caddy, use:

```text
updates.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

Point DNS at your server and allow ports 80/443 before starting Caddy. See [the complete production guide](docs/DEPLOYMENT.md) for installation links and reload commands. Open your HTTPS origin to log in; production login is not supported over plain HTTP.

When a [versioned release](https://github.com/UncleTeslim/ding/releases) is available, use its published GHCR tag or digest instead of building. The guide explains both paths and does not require a floating `latest` image.

## Publish your first update

1. Open your Ding HTTPS URL and sign in with the credentials you created.
2. Choose **New announcement**, write a title/body, and save a draft or publish it.
3. Open **Widget setup** to generate the embed snippet. Replace the example origin with your Ding URL.
4. Add it once to your app's document or root layout:

```html
<script
  src="https://updates.example.com/widget.js"
  data-trigger="both"
  data-position="bottom-right"
  data-color="#155eef"
  async
></script>
```

Open your app and expand the announcement. Published updates appear in the widget; drafts remain private. Existing open pages refresh on the widget's polling cycle, normally within a minute plus the public API's short cache.

[Publishing guide](docs/PUBLISHING.md) · [Framework examples and CSP](docs/EMBEDDING.md) · [Configuration](docs/CONFIGURATION.md)

## Try it locally or contribute

Use [local development](docs/LOCAL_DEVELOPMENT.md) for a local demo or source changes. It covers Node requirements, development credentials, the two development ports, and Linux native-package troubleshooting.

```bash
npm ci
cp .env.example .env
npm run build
npm run dev
```

Open `http://localhost:5173` for the dashboard with live reload. The API and built dashboard are served at `http://localhost:3000`. Keep these development credentials and HTTP settings off the public internet.

## Operate your instance

- [Back up and restore](docs/BACKUP_AND_RESTORE.md) before upgrades; preserve both the database and the private `.env`.
- [Upgrade or roll back](docs/UPGRADING.md) without changing your volume/project name.
- [Troubleshoot](docs/TROUBLESHOOTING.md) startup, HTTPS, login and widget problems.
- [API reference](docs/API.md), [security policy](SECURITY.md), [contributing](CONTRIBUTING.md), and [changelog](CHANGELOG.md).

Ding currently runs as a single instance with one shared admin login. Public changelog pages, scheduled publishing, RSS, API tokens and a managed Cloud service are not available yet.

## License

[MIT](LICENSE)

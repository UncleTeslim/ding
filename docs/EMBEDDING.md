# Embed Ding in your app

Ding's widget is a browser script, so it works with any framework that can load a script. Deploy [your instance](DEPLOYMENT.md), [publish an announcement](PUBLISHING.md), then add its script once to your app's document or persistent root layout.

## HTML and Vite apps

Add this before `</body>` in your app's HTML. Replace the example origin with your Ding instance, not the marketing site:

```html
<script
  src="https://updates.example.com/widget.js"
  data-trigger="both"
  data-position="bottom-right"
  data-color="#155eef"
  async
></script>
```

For React, Vue or Svelte apps built with Vite, put it in the root `index.html`, outside the framework's mount element. For Angular, put it in `src/index.html`. A static HTML include avoids reinserting the widget during component renders or route navigation.

## Next.js App Router

Use [`next/script`](https://nextjs.org/docs/app/api-reference/components/script) in the persistent root layout. Keep your existing children, metadata and styles:

```tsx
// app/layout.tsx
import Script from 'next/script';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://updates.example.com/widget.js"
          strategy="afterInteractive"
          data-trigger="both"
          data-position="bottom-right"
          data-color="#155eef"
        />
      </body>
    </html>
  );
}
```

The script runs in the browser after hydration; it does not belong in a server-only module. For the Pages Router, put the same `Script` in `pages/_app.tsx` next to your page component. Do not load it separately on every page.

## SvelteKit

For SvelteKit, add the standard HTML script to `src/app.html`, before `</body>` and outside the Svelte mount container. Keep SvelteKit's existing placeholders. This loads once per document rather than on every route transition.

## Nuxt

Register the script once in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  app: {
    head: {
      script: [{
        src: 'https://updates.example.com/widget.js',
        async: true,
        'data-trigger': 'both',
        'data-position': 'bottom-right',
        'data-color': '#155eef',
      }],
    },
  },
});
```

For other server-rendered frameworks, use their document/root script mechanism. Do not access `document` while rendering on the server or inject a new copy from every component effect.

## Options and behavior

| Attribute | Default | Options |
| --- | --- | --- |
| `data-trigger` | `bell` | `bell`, `banner`, `both` |
| `data-position` | `bottom-right` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `data-color` | `#6366f1` | Six-digit hex color |

The bell opens a panel of published announcements. The banner shows the latest update and can be dismissed; `both` includes both interfaces. With no published announcements, banner mode has nothing to show; use the bell when testing an empty instance.

The script derives its API URL from its own origin. Serve `/widget.js` and `/api/announcements` at the same Ding origin; there is no supported subpath deployment or separate API-base attribute.

There is currently no public mount/unmount API. Removing a script tag does not remove an existing widget or its listeners. Load one widget per document and use a full reload to change its origin/options during testing.

## Content Security Policy

If your app uses CSP, allow your Ding origin in both `script-src` and `connect-src`. The current widget injects an inline style element, so your `style-src` must permit those styles. The widget does not currently accept a style nonce. Incorporate this into your application's policy rather than replacing the entire policy with an example.

The public API allows cross-origin reads/events without admin credentials. Never include an admin cookie, username, password or secret in the embed. Widget read/unread state is stored locally in each visitor's browser; it is not an authenticated user profile.

## Check it works

1. Confirm `https://updates.example.com/widget.js` returns JavaScript and `/api/announcements` returns JSON.
2. Publish an update in Ding, then visit your **app** and open/expand it in the widget.
3. Check the dashboard for view/expansion events. Counts are deduplicated; repeated opens need not add events.
4. Navigate between app routes and confirm you still have one widget.

For a local HTTP app, use `http://localhost:3000/widget.js`. An HTTPS app needs HTTPS for Ding too. Existing pages poll while visible, normally once per minute; the public API has a 30-second cache.

See [troubleshooting](TROUBLESHOOTING.md#the-widget-is-missing-or-stale) for CSP, empty data and duplicate widgets.

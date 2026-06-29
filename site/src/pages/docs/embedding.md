---
layout: ../../layouts/Docs.astro
title: "Embedding the Widget"
description: "Install the Ding widget in your web application with a single script tag."
---

# Embedding the Widget

The Ding widget is a small browser script that appears as a bell icon, a banner, or both. It loads asynchronously and never blocks page render.

## Basic usage

Paste this into your HTML:

```html
<script
  src="https://your-ding-instance.com/widget.js"
  data-position="bottom-right"
  data-color="#6366f1"
  data-trigger="both"
  async
></script>
```

Replace `https://your-ding-instance.com` with the actual URL of your Ding server.

## Widget options

| Attribute | Default | Description |
| --- | --- | --- |
| `data-position` | `bottom-right` | Widget position. One of `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `data-color` | `#6366f1` | Accent colour. Any 6-digit hex value |
| `data-trigger` | `bell` | Display mode. One of `bell`, `banner`, `both` |

## Display modes

**`bell`** — A small bell icon in the corner with a badge showing the number of unread announcements. Clicking it opens a panel.

**`banner`** — A banner at the top of the page with the latest announcement. No bell icon.

**`both`** — Both bell icon and banner. The banner shows the latest announcement. The bell shows all announcements in a panel.

## Local testing

```html
<script
  src="http://localhost:3000/widget.js"
  data-position="bottom-right"
  data-color="#155eef"
  data-trigger="both"
  async
></script>
```

## Framework examples

The widget is framework-agnostic. It works everywhere the same way: with a script tag.

### React (Next.js, Remix, Vite)

Add the script tag to your root layout component, typically inside `<head>`:

```tsx
// app/layout.tsx (Next.js App Router)
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script
          src="https://your-ding-instance.com/widget.js"
          data-position="bottom-right"
          data-color="#6366f1"
          data-trigger="both"
          async
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Vue (Nuxt, Vite)

Add the script to your `index.html` or use `useHead`:

```vue
// nuxt.config.ts or app.vue
useHead({
  script: [
    {
      src: 'https://your-ding-instance.com/widget.js',
      'data-position': 'bottom-right',
      'data-color': '#6366f1',
      'data-trigger': 'both',
      async: true,
    },
  ],
});
```

### Plain HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script
    src="https://your-ding-instance.com/widget.js"
    data-position="bottom-right"
    data-color="#6366f1"
    data-trigger="both"
    async
  ></script>
</head>
<body>
  <!-- your content -->
</body>
</html>
```

## Custom styling

The widget applies its own styles scoped to its container. It ships no external fonts, images, or third-party resources.

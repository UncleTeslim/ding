---
layout: ../../layouts/Docs.astro
title: "Quick Start"
description: "Get Ding running locally in two minutes."
---

# Quick Start

This guide walks you through running Ding on your local machine for development and testing.

## Prerequisites

- Node.js 20 or later
- npm

## Installation

```bash
git clone https://github.com/UncleTeslim/ding
cd ding
cp .env.example .env
npm install
npm run build
npm run dev
```

## Verify it works

Open the admin dashboard:

```
http://localhost:3000
```

Sign in with the development credentials:

```
Username: admin
Password: password
```

Open the local widget demo:

```
http://localhost:3000/demo/
```

## What you see

- **Dashboard** — create and publish announcements, view analytics
- **Widget** — a small bell icon in the bottom-right corner with your published announcements
- **Demo page** — a test page with the widget already embedded

## Next steps

- [Embed the widget](./embedding) in your own application
- [Configure](./configuration) Ding for your environment
- [Self-host](./self-hosting) Ding in production

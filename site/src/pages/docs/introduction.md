---
layout: ../../layouts/Docs.astro
title: "Introduction"
description: "What is Ding and why would you self-host it?"
---

# Introduction

Ding is an open source changelog widget for web applications. It gives product teams a private dashboard for writing and publishing announcements, and gives users a small widget inside the product for reading what changed.

## Why Ding?

Existing changelog services like Beamer and Headway work well, but they require sending your data to a third party. Your announcements, your analytics, and your users' read state all live on someone else's infrastructure.

Ding is built for teams that want the same kind of experience without the data leaving their control.

**Everything stays yours.** Announcements, analytics, and user data live on your own server. No third-party scripts, no cookies, no external tracking.

**One process, one deploy.** The server, dashboard, and API are one service. No separate frontend build, no microservices, no extra containers.

**Small widget.** The browser script is 4KB gzipped. It loads asynchronously and never blocks page render.

## Use cases

- SaaS products shipping weekly updates to users
- Internal tools where changelog communication matters
- Open source projects that want to announce features without a mailing list
- Teams migrating away from hosted changelog services

## Next steps

Read [Quick Start](../quick-start) to get Ding running locally, or [Embedding the Widget](../embedding) to install it in your application.

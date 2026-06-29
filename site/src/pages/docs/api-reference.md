---
layout: ../../layouts/Docs.astro
title: "API Reference"
description: "Complete API reference for the Ding server, including public, auth, and admin endpoints."
---

# API Reference

All responses use JSON unless the endpoint returns `204 No Content`.

## Public endpoints

### GET /api/announcements

Returns published announcements, newest first.

Response:

```json
{
  "announcements": [
    {
      "id": "a1b2c3d4e5f6a7b8",
      "title": "Dark mode is here",
      "body": "We've shipped **dark mode**.",
      "tag": "New Feature",
      "published_at": "2026-04-12T09:00:00.000Z"
    }
  ]
}
```

### POST /api/analytics/view

Records that an announcement was visible when the widget panel opened.

Request:

```json
{
  "announcement_id": "a1b2c3d4e5f6a7b8"
}
```

Returns `204 No Content`.

### POST /api/analytics/click

Records that a user expanded an announcement.

Request:

```json
{
  "announcement_id": "a1b2c3d4e5f6a7b8"
}
```

Returns `204 No Content`.

## Auth endpoints

### POST /api/auth/login

Authenticates an admin user and sets a session cookie.

Request:

```json
{
  "username": "admin",
  "password": "password"
}
```

Sets the `ding_session` HTTP-only cookie on success. Returns `204 No Content`.

### POST /api/auth/logout

Clears the `ding_session` cookie.

Returns `204 No Content`.

### GET /api/auth/me

Returns the current authenticated user.

Response when authenticated:

```json
{
  "username": "admin"
}
```

Returns `401 Unauthorized` when not authenticated.

## Admin endpoints

All admin endpoints require a valid `ding_session` cookie.

### GET /api/admin/announcements

Returns all announcements (drafts and published) with analytics data.

### POST /api/admin/announcements

Creates a new announcement.

Request:

```json
{
  "title": "Dark mode is here",
  "body": "We've shipped **dark mode**.",
  "tag": "New Feature",
  "status": "published",
  "published_at": null
}
```

### PUT /api/admin/announcements/:id

Updates an existing announcement. Send only the fields that changed.

### DELETE /api/admin/announcements/:id

Deletes an announcement and its associated analytics events.

### GET /api/admin/analytics

Returns aggregate analytics data.

Response:

```json
{
  "total_views": 142,
  "total_clicks": 38,
  "ctr": 26.76,
  "daily": [...],
  "by_announcement": [...]
}
```

# API Reference

All responses use JSON unless the endpoint returns `204 No Content`.

## Public Endpoints

### `GET /api/announcements`

Returns published announcements, newest first.

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

### `POST /api/analytics/view`

Records that an announcement was visible when the widget panel opened.

```json
{
  "announcement_id": "a1b2c3d4e5f6a7b8"
}
```

Returns `204`.

Malformed or unknown announcement IDs are ignored and also return `204`.

### `POST /api/analytics/click`

Records that a user expanded an announcement.

```json
{
  "announcement_id": "a1b2c3d4e5f6a7b8"
}
```

Returns `204`.

Malformed or unknown announcement IDs are ignored and also return `204`.

## Auth Endpoints

### `POST /api/auth/login`

```json
{
  "username": "admin",
  "password": "password"
}
```

Sets the `ding_session` HTTP-only cookie.

### `POST /api/auth/logout`

Clears the `ding_session` cookie.

## Admin Endpoints

All admin endpoints require a valid `ding_session` cookie.
Browser requests with a foreign `Origin` are rejected for mutating admin actions.

### `GET /api/admin/announcements`

Returns drafts and published announcements with analytics.

### `GET /api/admin/announcements/:id`

Returns a single announcement by ID.

### `POST /api/admin/announcements`

Creates an announcement.

```json
{
  "title": "Dark mode is here",
  "body": "We've shipped **dark mode**.",
  "tag": "New Feature",
  "status": "published",
  "published_at": null
}
```

### `PUT /api/admin/announcements/:id`

Updates an announcement. Send only the fields that changed.

### `DELETE /api/admin/announcements/:id`

Deletes an announcement and its analytics events.

### `GET /api/admin/analytics`

Returns aggregate views, clicks, and CTR.

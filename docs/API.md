# API reference

These endpoints describe the current server. Paths are relative to your Ding instance, for example `https://updates.example.com`. Successful responses are JSON unless noted; parser-level errors may use Express's default non-JSON error response. Announcement IDs are 16-character lowercase hexadecimal strings; dates are UTC and may be serialized as ISO timestamps or SQLite's `YYYY-MM-DD HH:mm:ss` UTC form.

The widget uses the public API. Admin endpoints use the dashboard session cookie; API tokens and a dedicated publishing automation API are not available.

## Health and static assets

| Method / path | Result |
| --- | --- |
| `GET /health` | `200 {"ok":true,"db":"connected"}`, or `503` if SQLite is unavailable |
| `GET /widget.js` | Browser widget JavaScript; cached for up to 300 seconds |

A successful health check proves connectivity to SQLite, not that a particular announcement survived a restart.

## Published announcements

### `GET /api/announcements`

Returns at most the 50 most recent published announcements, newest publication date first. Drafts are excluded. The widget panel displays up to 20 items from this feed. Responses carry `Cache-Control: public, max-age=30`.

```json
{
  "announcements": [
    {
      "id": "a1b2c3d4e5f6a7b8",
      "title": "Find invoices faster",
      "body": "Filter invoices by **date** in Billing.",
      "tag": "Improvement",
      "published_at": "2026-10-21 09:00:00"
    }
  ]
}
```

Read this endpoint from your app without sending admin credentials:

```bash
curl --fail https://updates.example.com/api/announcements
```

## Widget analytics

### `POST /api/analytics/view` and `POST /api/analytics/click`

Both accept:

```json
{"announcement_id":"a1b2c3d4e5f6a7b8"}
```

A view records feed exposure reported when the panel opens; a click represents expansion, not a link click. The current widget sends view events for its loaded feed, including entries beyond the panel's 20-item display limit, so a view is not proof an individual item was read. Valid requests return `204 No Content`. Requests with invalid/missing IDs in otherwise valid JSON, unknown IDs, or draft IDs are ignored and also return `204`; that status does not prove an event was stored.

Events deduplicate per announcement, event type and hashed IP over a rolling 24-hour window. The limiter allows 10 requests per hour per IP, announcement and event route; further requests return `429`. Event bodies have a 1 KB JSON limit. Malformed JSON can return `400`, and oversized bodies `413`.

Public reads and analytics support cross-origin use. Browser admin access remains tied to the instance origin.

## Authentication

| Method / path | Success | Common errors |
| --- | --- | --- |
| `POST /api/auth/login` | `200 {"ok":true}` plus `ding_session` cookie | `400` invalid input, `401` wrong credentials, `403` foreign browser origin, `429` rate limit |
| `GET /api/auth/me` | `200 {"username":"admin"}` | `401` unauthenticated |
| `POST /api/auth/logout` | `200 {"ok":true}`; clears cookie and revokes the valid token server-side | `403` foreign browser origin |

Login body:

```json
{"username":"your-admin-username","password":"your-admin-password"}
```

Sessions expire after seven days. The cookie is HTTP-only, `SameSite=Strict`, and `Secure` in production. Login is limited to 10 requests per IP per hour, including successful logins.

Authenticated endpoints send `Cache-Control: no-store`. Mutating auth/admin requests reject a foreign browser `Origin` with `403 {"error":"Cross-site request blocked"}`. Clients without an `Origin` still require valid credentials/session cookies. Do not expose these credentials in browser embeds or build a cross-origin admin frontend around them.

## Announcement administration

All routes below require `ding_session`.

| Method / path | Success |
| --- | --- |
| `GET /api/admin/announcements` | `200 {"announcements":[...]}`; drafts and published records, each with `analytics: {"views":0,"clicks":0,"ctr":0}` |
| `GET /api/admin/announcements/:id` | `200 {"announcement":{...}}`, or `404` |
| `POST /api/admin/announcements` | `201 {"announcement":{...}}` |
| `PUT /api/admin/announcements/:id` | `200 {"announcement":{...}}`, or `404` |
| `DELETE /api/admin/announcements/:id` | `204 No Content`; also removes associated analytics |
| `POST /api/admin/announcements/bulk-delete` | `200 {"deleted":2}` for `{"ids":["id1","id2"]}` |

The bulk result counts the submitted IDs, not necessarily existing records. It accepts 1–100 string IDs. Deletion endpoints do not return `404` for an absent ID.

Create body:

```json
{
  "title": "Find invoices faster",
  "body": "Filter invoices by **date** in Billing.",
  "tag": "Improvement",
  "status": "draft",
  "published_at": null
}
```

| Field | Validation |
| --- | --- |
| `title` | Required, trimmed, 1–100 characters |
| `body` | Required, trimmed, 1–5,000 characters |
| `tag` | Optional/null, trimmed, up to 50 characters |
| `status` | Required on create: `draft` or `published` |
| `published_at` | Optional/null, ISO date-time ending in `Z`; future dates rejected |

Updates accept any subset of those fields. Creating a published record with no date assigns the current time. When changing a draft to published, omit `published_at` to assign the current time; an explicit `null` on an update is stored as null. There is no future scheduler. Validation failures return `400` with `error` and `issues`. JSON bodies for these endpoints have a 64 KB limit.

## Admin analytics

### `GET /api/admin/analytics`

Returns retained events for currently published announcements:

```json
{
  "summary": {
    "total_views": 10,
    "total_clicks": 2,
    "overall_ctr": 20
  },
  "by_announcement": [
    {
      "announcement_id": "a1b2c3d4e5f6a7b8",
      "title": "Find invoices faster",
      "views": 10,
      "clicks": 2,
      "ctr": 20
    }
  ]
}
```

### `GET /api/admin/analytics/daily`

Returns `{"daily":[{"date":"2026-10-21","views":3,"clicks":1}]}` with seven date entries, including zero-activity dates. Counts are distinct hashed IPs per UTC date/event type across announcements. They are not per-announcement totals or weekly unique people.

### `DELETE /api/admin/analytics`

Clears **all** analytics events and returns `{"deleted":10}` with the removed event count. Announcements remain. This is destructive; make a backup if those events matter.

Events older than 12 months are removed by maintenance. CTR is a percentage, rounded to one decimal place, and zero when there are no views.

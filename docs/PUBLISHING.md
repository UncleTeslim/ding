# Publish your first update

You need a running [Ding instance](DEPLOYMENT.md) and access to its admin credentials. The admin URL is your instance origin, such as `https://updates.example.com`; it is not the Ding marketing website.

A fresh empty instance creates a **Welcome to Ding** sample announcement. Edit it or unpublish/delete it before adding the widget to your real app.

## Write and preview

1. Log in, then choose **New announcement**.
2. Add a title (up to 100 characters) and body (up to 5,000 characters).
3. Optionally add a tag, up to 50 characters, such as `Improvement` or `Fix`.
4. Use the Markdown preview to check the content. Ding supports a small safe subset of Markdown, including emphasis, lists and links; arbitrary HTML is not supported.
5. Save a draft if it needs review. Drafts are visible only in the dashboard.

Explain the user benefit first, then the change and any action they need to take. For example: “Find past invoices faster. You can now filter by date in Billing.”

## Publish, edit or unpublish

Publish when the update is ready. The public API returns up to 50 published announcements, newest first; the widget panel displays up to 20. A draft is never returned by the public list.

Use the announcement actions to edit or unpublish an existing update. Unpublishing returns it to a draft; deleting removes it and its analytics. Deletion requires confirmation in the dashboard.

Publishing is immediate. A publication date can be now or in the past; future dates are rejected. Scheduled publishing is not available.

## Install it in your app

Open **Widget setup** and enter your Ding origin, display mode, accent color and position. Copy the generated snippet into your app once. The page generates embed code locally; a successful copy is not an installation check.

Follow [embedding](EMBEDDING.md) for HTML and framework examples. Visit your app, open the bell and expand the new update. The dashboard itself does not automatically embed Ding into your app.

Existing open pages poll while visible, normally once per minute. The public announcements response also has a 30-second cache, so edits may take slightly longer to reach an already open page. Refresh the host page when checking a newly published update.

## Read the analytics

- A **view** is recorded for the feed loaded when the widget panel opens. The current widget reports its loaded feed even beyond the 20 displayed items, so this is not proof an individual update was read.
- A **click** records expansion of an announcement; it does not count clicks on links in its body.
- Repeated events are deduplicated per announcement, event type and hashed IP over a rolling 24-hour window.
- Per-announcement counts and CTR use retained events. Old events are removed after 12 months.
- The daily activity chart counts distinct hashed IPs per event type for each UTC date. Adding daily counts does not give weekly unique people, and these counts differ from per-announcement totals.

Read/unread state stays in the visitor's browser. IP-based counts are approximate; shared networks and changing IPs affect them. Analytics do not identify individual users.

**Analytics options** includes a reset action. Clearing analytics does not delete announcements, but it cannot be undone without a backup.

## Verify before sharing broadly

Check the published update from your actual app origin, including mobile. Make sure the correct title/body appears and analytics arrive. If the widget is missing or stale, use [troubleshooting](TROUBLESHOOTING.md#the-widget-is-missing-or-stale).

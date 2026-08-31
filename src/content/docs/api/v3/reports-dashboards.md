---
title: Reports, Dashboards, Bookmarks, and Recently-Viewed
description: Retrieve saved reports, dashboard charts, bookmarks, and recently-viewed items — full endpoint list from a production Chrome extension client.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-orange-low);color:var(--sl-color-orange-high)">Derived from client source — not yet live-verified</span></p>
<!-- verification-badge:end -->

Sourced from a full grep of a production Fusion Manage API client (`plm.js`, BOM Builder Fork extension). All bookmarks/recent-items/dashboard endpoints use the `/api/v3/users/@me/...` current-user pattern; reports are v1-only.

## Reports

| Operation | Endpoint |
|---|---|
| List all reports | `GET /api/rest/v1/reports` |
| Get a report | `GET /api/rest/v1/reports/{reportId}` |

No v3 reports endpoint exists in this client — reports appear to be v1-only.

## Dashboard charts

| Operation | Endpoint |
|---|---|
| List available charts | `GET /api/v3/users/@me/available-charts` |
| Get pinned dashboard charts | `GET /api/rest/v1/reports/dashboard` (a v1 endpoint despite living in the dashboard/chart group — normalizes a `null` `dashboardReportList` to `{ list: [] }`) |
| Set/unset a dashboard chart slot | `PUT` or `DELETE` `/api/v3/users/{userId}/dashboard-charts/{index}` — **note this requires the actual `userId`, not `@me`**. `DELETE` with body `{}` removes the chart at that slot; `PUT` with body `{ "chart": { "link": "..." } }` sets it. |

## Bookmarks

| Operation | Endpoint |
|---|---|
| List bookmarks | `GET /api/v3/users/@me/bookmarks` |
| Add a bookmark | `POST /api/v3/users/@me/bookmarks` — body `{ "dmsId": ..., "comment": "..." }` (comment optional) |
| Remove a bookmark | `DELETE /api/v3/users/@me/bookmarks/{dmsId}` |

:::tip[Confirmed live end-to-end — 2026-08-31]
Full add/list/remove cycle run against the calling user's own bookmarks and
reverted. One trap:

**Bookmarks are stored as "inbox items", and add and delete key off different
ids.** `POST` returns `201` with
`Location: /api/v3/inbox-items/{inboxItemId}` — but `DELETE` expects the
**`dmsId` of the bookmarked item**, not that inbox-item id:

```
POST   /api/v3/users/@me/bookmarks           {"dmsId": {dmsId}}
       -> 201, Location: /api/v3/inbox-items/{inboxItemId}
DELETE /api/v3/users/@me/bookmarks/{dmsId}   -> 204   ✅ (the dmsId, not the inbox-item id)
```

Following the `Location` id, which is the natural instinct, targets the wrong
resource. The listed bookmarks also carry `__self__: /api/v3/inbox-items/{id}`,
which reinforces the wrong id — key your delete off the `dmsId` you added.

Note the response's `__self__` resolves `@me` to the real user
(`/api/v3/users/{email}/bookmarks`), so `@me` is a genuine alias, not a separate
endpoint.
:::

## Recently-viewed and outstanding work

```
GET /api/v3/users/@me/recently-viewed
GET /api/v3/users/@me/outstanding-work
```

`outstanding-work` — confirmed live — is a personal worklist, not a saved report: it returns `count`, `recalculating` (a boolean — the list is computed asynchronously and may be stale while `true`), `lastRecalculateStarted`/`lastRecalculateUpdate` timestamps, and an `outstandingWork[]` array of pending action items assigned to the current user.

:::note
The reports, dashboard-chart, and bookmarks endpoints on this page have not been independently live-verified against a tenant yet — they're transcribed from production client code, not yet re-checked. `outstanding-work` **has** been confirmed live (2026-07-09).
:::

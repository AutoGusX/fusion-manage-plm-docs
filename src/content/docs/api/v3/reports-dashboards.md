---
title: Reports, Dashboards, Bookmarks, and Recently-Viewed
description: Retrieve saved reports, dashboard charts, bookmarks, and recently-viewed items — full endpoint list from a production Chrome extension client.
---

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

## Recently-viewed

```
GET /api/v3/users/@me/recently-viewed
```

:::note
None of the endpoints on this page have been independently live-verified against a tenant yet — they're transcribed from production client code, not yet re-checked. Treat them as high-confidence but unverified.
:::

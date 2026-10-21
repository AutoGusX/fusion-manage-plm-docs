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

No v3 reports endpoint exists in this client, and none was found on a live tenant (2026-10-21, see below): report data is v1-only.

## Dashboard charts

| Operation | Endpoint |
|---|---|
| List available charts | `GET /api/v3/users/@me/available-charts` |
| Get pinned dashboard charts | `GET /api/rest/v1/reports/dashboard` (a v1 endpoint despite living in the dashboard/chart group — normalizes a `null` `dashboardReportList` to `{ list: [] }`) |
| Set/unset a dashboard chart slot | `PUT` or `DELETE` `/api/v3/users/{userId}/dashboard-charts/{index}` — **note this requires the actual `userId`, not `@me`**. `DELETE` with body `{}` removes the chart at that slot; `PUT` with body `{ "chart": { "link": "..." } }` sets it. |

:::tip[Confirmed live — 2026-10-21: `available-charts` lists charts; the data is v1-only]
`GET /api/v3/users/@me/available-charts` → `200`, a bare array, one entry per chart the user may pin:

```json
[{
  "__self__": "/api/v3/users/{email}/available-charts/{reportId}",
  "report":    { "link": "/api/rest/v1/reports/{reportId}", "title": "Audits by Workflow State", "deleted": false },
  "owner":     { "link": "/api/v3/users/{email}", "title": "…", "email": "…" },
  "workspace": { "link": "/api/v3/workspaces/{ws}", "title": "Audits" },
  "type":      { "link": "/api/v3/chart-types/COLUMN", "title": "Column", "type": "COLUMN" },
  "title": "Audits by Workflow State"
}]
```

It carries **titles and chart types only** — `report.link` points back to the v1 report for the data. There is no
v3 path to a report's data: `/api/v3/reports`, `/api/v3/reports/{id}`, `/api/v3/reports/{id}/data`,
`/api/v3/charts/{id}`, `/api/v3/chart-types/COLUMN`, `/api/v3/users/@me/available-charts/{id}`,
`/api/v3/workspaces/{ws}/reports`, `/api/v3/workspaces/{ws}/charts` and `/api/v2/reports/{id}` all return `404`.
`GET /api/v3/users/@me/dashboard-charts` is also `404` (the documented `PUT`/`DELETE` on
`/api/v3/users/{userId}/dashboard-charts/{index}` was not exercised).
:::

:::caution[Confirmed live — 2026-10-21: v1 reports are not callable from a browser on another origin]
`GET /api/rest/v1/reports/{id}` works from a server (returns `reportDefinition` + `reportResult`), but **v1 sends no
`Access-Control-Allow-Origin` header at all** — not on the preflight (`200`, no `Access-Control-Allow-*`) and not on the
response — for any origin, the tenant's own included. Every `/api/v3/*` path answers the same preflight with
`Access-Control-Allow-Origin: *`. A web app on its own domain therefore can list charts (v3) but must read their data
through something same-origin (its own server or relay); Chrome extensions with host permissions are unaffected.
:::

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
Live-verified: `GET /api/rest/v1/reports`, `/reports/dashboard` and `/reports/{id}` (from a server, 2026-10-20/21), `GET /api/v3/users/@me/available-charts` (2026-10-21), the bookmarks cycle (2026-08-31) and `outstanding-work` (2026-07-09). Still transcribed from client code only: the `PUT`/`DELETE` dashboard-chart slot calls.
:::

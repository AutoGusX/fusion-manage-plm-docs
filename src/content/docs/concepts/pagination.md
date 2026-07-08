---
title: Pagination
description: The page/size, offset/limit, and combined limit/offset/page conventions used across different Fusion Manage list endpoints.
---

Fusion Manage does not use one consistent pagination convention — the parameter names depend on which endpoint (and which API version) you're calling. Check the specific endpoint's reference page rather than assuming one style applies everywhere.

## `page` / `size` (v1 list and search endpoints)

Used by v1 list and search endpoints, e.g. `GET /api/rest/v1/workspaces/{id}/items`.

| Parameter | Default | Description |
|---|---|---|
| `page` | `1` | Page number (1-indexed) |
| `size` | `100` | Items per page |

Response includes the total count alongside the page of results:

```json
{
  "list": [ /* ... */ ],
  "total": 1245,
  "page": 1,
  "pageSize": 100
}
```

## `offset` / `limit` (v3 workspace listing)

Used by `GET /api/v3/workspaces?offset=&limit=`. **Verified live:** the response includes `totalCount` plus `first`/`next`/`last` link objects (each with a `link` and `count`), not just the raw `items[]` array:

```json
{
  "offset": 0, "limit": 20, "totalCount": 119,
  "first": { "link": "/api/v3/workspaces?offset=0&limit=20", "count": 20 },
  "next": { "link": "/api/v3/workspaces?offset=20&limit=20", "count": 20 },
  "last": { "link": "/api/v3/workspaces?offset=100&limit=20", "count": 19 },
  "items": [ /* ... */ ]
}
```
This same `offset`/`limit` + `first`/`next`/`last` shape is also what the v3 search-results endpoint returns (see below) — likely a general v3 list-response convention, not specific to workspaces.

## `limit` / `offset` / `page` together (v3 search-results)

The v3 free-text search endpoint (`GET /api/v3/search-results`) accepts all three at once — `limit`, `offset`, **and** `page` as separate parameters, plus a `revision` parameter controlling whether to search latest-only, all revisions, or working/unreleased items. Don't assume `offset`/`limit` alone fully controls paging here — `page` is a distinct parameter, not derived from `offset`/`limit`.

:::note
The `offset`/`limit` + `first`/`next`/`last` shape above (v3 workspaces and v3 search) is confirmed live as of 2026-07-08. The v1 `page`/`size` convention is confirmed live too, but note that different v1 list endpoints nest results under different keys — `GET /api/rest/v1/workspaces` nests under `list.data[].data`, while `GET /api/rest/v1/workspaces/{id}/items` nests under `list.item[]`. Don't assume one v1 endpoint's response shape transfers to another.
:::

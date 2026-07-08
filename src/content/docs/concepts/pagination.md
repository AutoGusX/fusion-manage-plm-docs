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

Used by `GET /api/v3/workspaces?offset=&limit=`.

## `limit` / `offset` / `page` together (v3 search-results)

The v3 free-text search endpoint (`GET /api/v3/search-results`) accepts all three at once — `limit`, `offset`, **and** `page` as separate parameters, plus a `revision` parameter controlling whether to search latest-only, all revisions, or working/unreleased items. Don't assume `offset`/`limit` alone fully controls paging here — `page` is a distinct parameter, not derived from `offset`/`limit`.

:::caution[Needs live verification]
Three distinct pagination conventions coexist across the API surface (`page`+`size`, `offset`+`limit`, and `limit`+`offset`+`page` combined). This page enumerates what's been found in working code so far — always confirm the actual accepted parameters for a specific endpoint against a live tenant rather than assuming a convention transfers from one endpoint to another.
:::

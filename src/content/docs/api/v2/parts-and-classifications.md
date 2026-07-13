---
title: Parts and Classifications
description: Link a workspace to its root classifications and look up a workspace's classification-bound "part" record.
---

Sourced from a production Fusion Manage API client (`plm.js`, BOM Builder Fork extension).

## Get a workspace's root classifications

```
GET /api/v2/parts?referenceUrn={encoded referenceUrn}
```

Where `referenceUrn` is built from the tenant and workspace ID:
```
urn:adsk.plm:tenant.workspace:{TENANT_UPPERCASE}/{workspaceId}
```

:::tip[Confirmed live — 2026-07-13]
Returns `200` with a real, compact shape:
```json
{
  "parts": [
    {
      "id": 2,
      "referenceUrn": "urn:adsk.plm:tenant.workspace:{TENANT}/57",
      "classifications": { "description": "classifications", "link": "parts/2/classifications", "size": 1 },
      "data": { "PREFIX1": "000" },
      "ext": {},
      "__self__": "parts/2"
    }
  ],
  "sort": "id", "direction": "asc", "page": 1, "size": 1
}
```
Notably, `classifications.link` (`"parts/2/classifications"`) and `__self__` (`"parts/2"`) are **relative, not absolute** paths — unlike almost every other v3/v2 link in this API, they don't start with `/api/...`. Resolve them relative to `/api/v2/` yourself rather than assuming they're ready to use as-is.
:::

## Get a part's root classifications

```
GET /api/v2/parts/{partId}/classifications
```

Response: `{ "classifications": [ /* root classification refs */ ] }`. Each entry is a **root** classification — the top of a classification subtree that applies in this workspace. Feed a root's `id` into `GET /api/v2/classifications/{rootId}/graphs/adjacency-set` (see `api/v2/classifications`) to expand that specific subtree, instead of walking the tenant-wide tree from `rootId=1`.

## Why this matters

This two-step lookup (`referenceUrn` → part → root classifications) is how a client discovers *which* classification subtrees are relevant to a given workspace, rather than assuming every workspace uses the full tenant-wide classification tree. Skipping it and always expanding from `rootId=1` (the tenant-wide default) will work but returns far more than what's actually applicable to the workspace you care about.

:::note
`GET /api/v2/parts/{partId}/classifications` itself hasn't been independently re-tested yet — only the parts lookup above was confirmed live.
:::

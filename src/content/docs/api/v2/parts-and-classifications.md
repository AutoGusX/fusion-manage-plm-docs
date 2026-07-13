---
title: Parts and Classifications
description: Link a workspace to its root classifications and look up a workspace's classification-bound "part" record.
---

Sourced from a production Fusion Manage API client (`plm.js`, BOM Builder Fork extension) — not yet independently live-tested.

## Get a workspace's root classifications

```
GET /api/v2/parts?referenceUrn={encoded referenceUrn}
```

Where `referenceUrn` is built from the tenant and workspace ID:
```
urn:adsk.plm:tenant.workspace:{TENANT_UPPERCASE}/{workspaceId}
```

Response: `{ "parts": [ /* part records */ ] }`. This is the entry point that binds a *workspace* to the classification system — a workspace's "part" record is the anchor you use to discover which classifications apply there.

## Get a part's root classifications

```
GET /api/v2/parts/{partId}/classifications
```

Response: `{ "classifications": [ /* root classification refs */ ] }`. Each entry is a **root** classification — the top of a classification subtree that applies in this workspace. Feed a root's `id` into `GET /api/v2/classifications/{rootId}/graphs/adjacency-set` (see `api/v2/classifications`) to expand that specific subtree, instead of walking the tenant-wide tree from `rootId=1`.

## Why this matters

This two-step lookup (`referenceUrn` → part → root classifications) is how a client discovers *which* classification subtrees are relevant to a given workspace, rather than assuming every workspace uses the full tenant-wide classification tree. Skipping it and always expanding from `rootId=1` (the tenant-wide default) will work but returns far more than what's actually applicable to the workspace you care about.

:::note
Not yet independently live-verified — transcribed from a production client's code and comments, not re-checked against a live tenant.
:::

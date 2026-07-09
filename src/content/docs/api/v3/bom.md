---
title: BOM
description: BOM views, read/flatten/where-used, and add/update/remove rows on v3 — confirmed shapes from Autodesk's official Postman collection.
---

## BOM views

BOM view definitions live under a fixed view number, `views/5` (this appears constant across workspaces, not per-workspace like most other view numbers):

| Purpose | Endpoint |
|---|---|
| List BOM views for a workspace | `GET /api/v3/workspaces/{ws}/views/5` |
| Get a specific BOM view's definition | `GET /api/v3/workspaces/{ws}/views/5/viewdef/{bomViewId}` |
| Get that view's columns | `GET /api/v3/workspaces/{ws}/views/5/viewdef/{bomViewId}/fields` |

## Read

| Purpose | Endpoint | Notes |
|---|---|---|
| Hierarchical BOM | `GET /api/v3/workspaces/{ws}/items/{itemId}/bom?depth={n}&revisionBias=release&viewDefId={bomViewId}&rootId={itemId}` | `Accept: application/vnd.autodesk.plm.bom.bulk+json` |
| Flat BOM | `GET /api/v3/workspaces/{ws}/items/{itemId}/bom-items?depth={n}&revisionBias=release&viewDefId={bomViewId}&rootId={itemId}` | `Accept: application/vnd.autodesk.plm.bom.flat.bulk+json` |
| Where-used | `GET /api/v3/workspaces/{ws}/items/{itemId}/where-used?depth={n}` | |

`revisionBias=release` requests the latest released revision at each level rather than the working version — worth trying `revisionBias` variants if you need working-version BOMs instead.

:::tip[Confirmed live — 2026-07-08]
Verified directly against a real item in a live tenant (`GET /api/rest/v1/workspaces/{ws}/items?includeRelationships=true`): on the **v1** item endpoint, BOM children are embedded in `relations.entry[key="REL_BOM"].value.item[]` — there is no separate top-level `bom` field there. Each entry is a full nested item object, not just a reference. This is distinct from the dedicated v3 `bom`/`bom-items` endpoints above, which are the better choice for BOM-specific reads.
:::

## Write

Confirmed from Autodesk's official Postman collection (not yet independently live-tested — mutates real BOM structure):

**Add a row** — `POST /api/v3/workspaces/{ws}/items/{itemId}/bom-items`
```json
{
  "quantity": 1,
  "item": { "link": "/api/v3/workspaces/{ws}/items/{childItemId}" },
  "isPinned": false,
  "fields": [
    { "metaData": { "link": "/api/v3/workspaces/{ws}/views/5/viewdef/{bomViewId}/fields/{fieldId}" }, "value": "..." }
  ]
}
```

**Update a row** — `PATCH /api/v3/workspaces/{ws}/items/{itemId}/bom-items/{rowId}`, same body shape as add, with updated values.

**Remove a row** — `DELETE /api/v3/workspaces/{ws}/items/{itemId}/bom-items/{rowId}`

Note the BOM-row field shape (`{ "metaData": { "link": ... }, "value": ... }`) differs from the item-field shape used elsewhere (`{ "__self__": ..., "value": ... }`) — don't reuse one for the other.

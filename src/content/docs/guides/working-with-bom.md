---
title: Working with BOM
description: Read a BOM, add/update/remove a line, and run a where-used query.
---

Full endpoint reference lives in `api/v3/bom` — this page walks through the common sequence.

## 1. Find the BOM view

BOM views live under a fixed view number (`views/5`) on the parent item's workspace:
```
GET /api/v3/workspaces/{ws}/views/5
GET /api/v3/workspaces/{ws}/views/5/viewdef/{bomViewId}/fields
```
You'll need a `bomViewId` for the read calls below.

## 2. Read the BOM

```
GET /api/v3/workspaces/{ws}/items/{itemId}/bom?depth={n}&revisionBias=release&viewDefId={bomViewId}&rootId={itemId}
```
For a flat list instead of a hierarchy, use `bom-items` instead of `bom` with the same query params. Both need `Accept: application/vnd.autodesk.plm.bom.bulk+json` (hierarchical) or `application/vnd.autodesk.plm.bom.flat.bulk+json` (flat) — see `api/v3/bom`.

## 3. Add a line

```
POST /api/v3/workspaces/{ws}/items/{parentItemId}/bom-items
```
```json
{
  "quantity": 1,
  "item": { "link": "/api/v3/workspaces/{ws}/items/{childItemId}" },
  "isPinned": false
}
```
`201`, new row's URL in the `Location` header (e.g. `.../bom-items/{rowId}`). Confirmed live — the minimal body above (no `fields`) is enough; only add a `fields[]` entry (shaped `{ "metaData": { "link": ... }, "value": ... }` — note this is a *different* field shape from item creation) if you need to set a BOM-line-specific attribute like a reference designator.

## 4. Update or remove a line

```
PATCH /api/v3/workspaces/{ws}/items/{parentItemId}/bom-items/{rowId}   (same body shape as add)
DELETE /api/v3/workspaces/{ws}/items/{parentItemId}/bom-items/{rowId}
```
Both confirmed live, both return `204`.

## 5. Find where a part is used

```
GET /api/v3/workspaces/{ws}/items/{itemId}/where-used?depth={n}
```
Walks up the BOM tree instead of down — use this to answer "what assemblies contain this part" before changing or discontinuing it.

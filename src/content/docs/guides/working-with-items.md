---
title: Working with Items
description: Create, update, and archive an item end to end, using the confirmed v3 shapes and link-scoping rules.
---

Full endpoint reference (including the link-scoping gotchas) lives in `api/v3/items` and `api/v3/views-fields-tableaus` — this page walks through the sequence.

## 1. Find the workspace and its fields

Before creating anything, you need real section/field IDs for the target workspace:

```
GET /api/v3/workspaces/{ws}/sections
GET /api/v3/workspaces/{ws}/fields
```

Use `fields` (not the fields embedded in an existing item's detail response) to check `editability`, `derived`, and required-ness — see `api/v3/views-fields-tableaus`.

## 2. Create the item

```
POST /api/v3/workspaces/{ws}/items
```
```json
{
  "sections": [
    {
      "link": "/api/v3/workspaces/{ws}/sections/{sectionId}",
      "fields": [
        { "__self__": "/api/v3/workspaces/{ws}/views/{viewId}/fields/TITLE", "value": "New Item" }
      ]
    }
  ]
}
```
`201`, empty body, new item's URL in the `Location` header. Parse the workspace/dmsId from there.

**The two gotchas that will bite you if skipped** (see `api/v3/items` for the full detail):
- Field entries must be reduced to exactly `{ __self__, value }` — the richer object shape from `GET .../items/{id}` gets rejected.
- Links must be **workspace-scoped** on create (`/workspaces/{ws}/sections/{id}`), not item-scoped.

## 3. Update it

```
PATCH /api/v3/workspaces/{ws}/items/{itemId}
```
Same body shape as create, but now the links must be **item-scoped** — copy them verbatim from a `GET` on this same item, don't strip the `/items/{itemId}` segment. `PUT` also works and accepts either scoping if you'd rather not think about which form to use.

## 4. Clone from an existing item

There's no dedicated "clone" endpoint — cloning means: `GET` the source item's full detail, filter its fields down to the ones you want to carry over (respecting required/derived rules — see `api/v3/items`), normalize the links from item-scoped to workspace-scoped, and `POST` a fresh create. `api/v3/items` documents the exact link-normalization regex pattern used by a production clone feature.

## 5. Archive it (there's no hard delete)

```
PATCH /api/v3/workspaces/{ws}/items/{itemId}?deleted=true
Body: {}
```
`204`. To restore: same call with `?deleted=false`. `DELETE` returns `405` — Fusion Manage doesn't support hard-deleting items via this API.

---
title: Relationships and Affected Items
description: Item relationships, managed items, and change-order affected items via workspace views — including the unresolved views/2 vs views/11 direction conflict.
---

:::note[Coming soon]
This page is a placeholder. Content will cover `getItemRelationships`, `addItemRelationship`, `getAffectedItems`, and managed-items retrieval via numbered workspace "views."

**Primary sources to author from:** `plm.js` (BOM Builder Fork extension) and `client.py` (`get_item_managed_items`, `get_co_affected_items`).
:::

:::tip[Confirmed live — 2026-07-08]
Tested directly against a real tenant with real items and Change Orders:

| Call | Result |
|---|---|
| `views/2` on a plain item | `204` (valid, empty — no COs linked to this particular item) |
| `views/11` on the same plain item | `403 VIEW_WORKFLOW_ITEMS denied` |
| `views/11` on a real Change Order | `200`, populated `affectedItems[]` pointing to real parts |
| `views/2` on the same Change Order | `403 VIEW_ASSOCIATED_WORKFLOW denied` |

**Confirmed:** `views/2` = Change Orders linked to an item (item → CO direction). `views/11` = affected items listed on a Change Order (CO → item direction). A separate internal note claiming the opposite for `views/11` was incorrect, at least for this tenant.

Example response shape from `GET /api/v3/workspaces/{coWsId}/items/{coId}/views/11`:
```json
{
  "__self__": "/api/v3/workspaces/84/items/{coId}/views/11",
  "affectedItems": [
    {
      "__self__": "/api/v3/workspaces/84/items/{coId}/views/11/affected-items/{affectedItemId}",
      "item": { "link": "/api/v3/workspaces/57/items/{itemId}", "title": "..." },
      "workspace": { "link": "/api/v3/workspaces/57" }
    }
  ]
}
```
:::

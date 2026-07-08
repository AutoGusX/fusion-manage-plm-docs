---
title: BOM
description: Read, flatten, add, update, and remove BOM lines, plus where-used queries.
---

:::note[Coming soon]
This page is a placeholder. Content will cover `getBom`, `getBomFlat`, `addBomItem`, `updateBomItem`, `removeBomItem`, `getWhereUsed`, and `getWhereUsedParents`.

**Primary source to author from:** `plm.js` (BOM Builder Fork extension) BOM function group.
:::

:::tip[Confirmed live — 2026-07-08]
Verified directly against a real item in a live tenant (`GET /api/rest/v1/workspaces/{ws}/items?includeRelationships=true`): BOM children are indeed embedded in `relations.entry[key="REL_BOM"].value.item[]` on the parent item's v1 response — there is no separate top-level `bom` field on this endpoint. Each entry in that array is a full nested item object (its own `id`, `description`, `details`, etc.), not just a reference.
:::

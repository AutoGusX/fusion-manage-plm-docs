---
title: BOM
description: Read, flatten, add, update, and remove BOM lines, plus where-used queries.
---

:::note[Coming soon]
This page is a placeholder. Content will cover `getBom`, `getBomFlat`, `addBomItem`, `updateBomItem`, `removeBomItem`, `getWhereUsed`, and `getWhereUsedParents`.

**Primary source to author from:** `plm.js` (BOM Builder Fork extension) BOM function group.
:::

:::caution[Needs live verification]
For v1-shaped item responses, BOM data is embedded in `relations.entry[key="REL_BOM"].value.item[]`, not a top-level `bom` field — a documented source of "empty BOM" bugs. Confirm this still holds and document the exact shape here.
:::

---
title: Relationships and Affected Items
description: Item relationships, managed items, and change-order affected items via workspace views — including the unresolved views/2 vs views/11 direction conflict.
---

:::note[Coming soon]
This page is a placeholder. Content will cover `getItemRelationships`, `addItemRelationship`, `getAffectedItems`, and managed-items retrieval via numbered workspace "views."

**Primary sources to author from:** `plm.js` (BOM Builder Fork extension) and `client.py` (`get_item_managed_items`, `get_co_affected_items`).
:::

:::caution[Needs live verification — highest priority]
Sources directly conflict on view-number direction:
- `client.py`'s own code comment: `views/2` = Change Orders linked to an item (item → CO), `views/11` = affected items on a CO (CO → item).
- A separate internal note: "Related COs for a parts item come via `views/11`" — the opposite assignment.

Do not present either direction as authoritative until checked against a live tenant. Both views are also 403-prone when not enabled on a given workspace (treat as "not enabled," not a hard failure — see `concepts/errors`).
:::

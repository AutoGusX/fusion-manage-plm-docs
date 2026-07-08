---
title: Items
description: Create, read, update, archive, and clone items — including the documented v1/v3 create-and-update discrepancy.
---

:::note[Coming soon]
This page is a placeholder. Content will cover item CRUD (`createItem`, `editItem`, `getItemDetails`, `archiveItem`, `unarchiveItem`, `setItemOwner`), plus the field-inclusion rules for create/clone and the real server error codes documented for that flow.

**Primary sources to author from:** `plm.js` (BOM Builder Fork extension) for the endpoint list, `CLONE_FIELD_RULES.md` for create/clone field rules, and `api-reference.md` for the documented (but disputed) v3 create/update shape.
:::

:::caution[Needs live verification]
See `concepts/versioning` — docs describe `POST`/`PATCH` against v3 for create/update, but verified-working code uses v1 `POST`/`PUT` instead. Document both shapes here once re-checked against a live tenant.
:::

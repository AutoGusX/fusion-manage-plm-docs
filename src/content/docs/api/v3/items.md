---
title: Items
description: Create, read, update, archive, and clone items — including the documented v1/v3 create-and-update discrepancy.
---

:::note[Coming soon]
This page is a placeholder. Content will cover item CRUD (`createItem`, `editItem`, `getItemDetails`, `archiveItem`, `unarchiveItem`, `setItemOwner`), plus the field-inclusion rules for create/clone and the real server error codes documented for that flow.

**Primary sources to author from:** `plm.js` (BOM Builder Fork extension) for the endpoint list, `CLONE_FIELD_RULES.md` for create/clone field rules, and `api-reference.md` for the documented (but disputed) v3 create/update shape.
:::

:::caution[Live-tested but inconclusive — 2026-07-08]
Attempted against a live tenant, Items workspace (ws 57). Neither documented shape could be confirmed working in the time spent — this needs the Postman collection or official Autodesk docs to pin down the exact schema, not more trial and error.

- **v1 create** (`POST /api/rest/v1/workspaces/{ws}/items`): every payload shape tried — flat map with `TITLE`/`NUMBER`/`DESCRIPTION` keys, a `fields: [{fieldID, value}]` array, and lowercase `title`/`description` — returned the same `400`: `{"httpStatusCode":400,"error":[{"fieldId":"TITLE","message":"Title is required."}]}`, even when a `TITLE` value was included. The `TITLE` field does exist in this workspace's v1 metafields list, so the required body shape is something other than what was tried — possibly a nested structure not yet identified.
- **v3 create** (`POST /api/v3/workspaces/{ws}/items`): the `sections[].fields[].{__self__,value}` shape documented elsewhere returned a `500` with an opaque body: `{"errorCode":"UNKNOWN","message":"Unknown error.","errorClass":"APIError"}` — a fourth distinct error envelope shape seen in this API (see `concepts/errors`), unhelpful for diagnosing what was wrong with the request. The `__self__` field path used may have referenced the wrong view ID.

No test item was actually created by any of these attempts (verified via search afterward) — nothing needed cleanup. Whoever picks this up next should start from the Postman collection's actual working create request rather than reconstructing it from field metadata.
:::

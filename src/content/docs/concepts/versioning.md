---
title: "API Versions: v1, v2, and v3"
description: What v1, v2, and v3 actually mean in Fusion Manage, which one to use for which operation, and the known discrepancies between documentation and working code.
---

Fusion Manage exposes three API surfaces that are easy to conflate. This page is the reconciliation point every other page links back to — read it before trusting any single endpoint page.

## The three surfaces

- **v1** (`/api/rest/v1/...`) — the original REST API. Despite being "legacy," it is still load-bearing for: listing workspaces, structured-body item search (`searchDefinition`), picklist setups (`/setups/picklists`), the XML-bodied lifecycle-transition endpoint, and unassigning a user from a group (the one place v1 and v3 are mixed within a single user/group operation pair).
- **v3** (`/api/v3/...`) — the primary modern surface for nearly everything else: item CRUD, BOM, search, attachments, workflow transitions, tableaus, grid/project tabs, relationships, managed items, users/groups/roles, scripts, and most classification lookups.
- **v2** (`/api/v2/...`) — the CRUD surface for the classification/parts-attribute model (`/api/v2/classifications`, `/api/v2/parts`, `/api/v2/property-instances`, `/api/v2/properties`, `/api/v2/enumerations`). **Correction (2026-07-09):** an earlier pass claimed "no known v3 equivalent" for this subsystem — that's wrong. Autodesk's official Postman collection confirms `GET /api/v3/classifications/{id}/fields` exists as a v3 sibling for reading a classification's properties, even though the classification *tree* itself (create/read classes, link parent/child, create properties/enumerations) is still v2-only. Treat v2 as the write/CRUD surface and v3 as an additional read path for fields, not a full replacement.

A single workflow often mixes all three: e.g. searching for an item via v3 `/search-results`, then updating it via a v1 `PUT`.

:::tip[Confirmed live + official docs — base host]
**Resolved (2026-07-08, re-confirmed 2026-07-09).** Live-tested directly against a real tenant: both `GET /api/rest/v1/workspaces` and `GET /api/v3/workspaces` return `200` on `https://{tenant}.autodeskplm360.net/...` — **the same host for both v1 and v3.** Autodesk's own official Postman collection for this API independently confirms this: its `Base URL` collection variable defaults to `https://{tenant}.autodeskplm360.net/`, used unchanged for every v1 and v3 request in the collection. The `https://{tenant}.autodeskplm.com` host claimed by some older documentation should be treated as incorrect.
:::

:::tip[Confirmed live + official docs — create/update verb and version]
**Resolved (2026-07-08, corroborated 2026-07-09 by Autodesk's official Postman collection).** The v1 create/update path (`POST`/`PUT` against `/api/rest/v1/workspaces/{wsId}/items[/{itemId}]`) could not be reproduced against a live tenant — every v1 create payload shape tried returned `400 Title is required`, even with a `TITLE` value present.

The confirmed-working path is **v3-only**, and matches Autodesk's own official example almost exactly:
- **Create:** `POST /api/v3/workspaces/{wsId}/items` with `{ sections: [{ link, fields: [{ __self__, value }] }] }`. Live testing confirmed workspace-scoped links (`/workspaces/{ws}/sections/{id}`) work; Autodesk's own official example instead uses an item-scoped-style link with a placeholder item id (`/workspaces/{ws}/items/1/views/1/sections/{id}`) — both forms appear to be accepted, suggesting the server parses out the workspace/section/view/field IDs and ignores any item-id segment on create. A top-level `versionId`, `effectivity`, and `lifecycle: { title }` can also be set on create to land the new item directly in a given revision/lifecycle state instead of the default working version.
- **Update:** both `PATCH` and `PUT` work on `/api/v3/workspaces/{wsId}/items/{itemId}`, but `PATCH` requires **item-scoped** links while `PUT` accepts either item-scoped or workspace-scoped links. Autodesk's own official `PATCH` example uses item-scoped links, exactly matching what live testing found necessary.
- **Delete/Undelete:** `DELETE` is unsupported (`405`) — items are soft-deleted/restored via `PATCH .../items/{itemId}?deleted=true` / `?deleted=false`, confirmed by both live testing and Autodesk's official example (which explicitly includes both the delete and undelete calls).
- **A separate, distinct lifecycle-transition endpoint exists in v1**: `PUT /api/rest/v1/workspaces/{ws}/items/{id}/lifecycles/transitions/{transitionId}`, `Content-Type: application/xml`, body `<dmsVersionItem><release>G</release></dmsVersionItem>`. This is **not** the same as the JSON-bodied workflow-transition endpoint (`workflows/{workflowId}/transitions`) — "lifecycle transitions" govern revision/release state, "workflow transitions" govern workflow step. Not independently live-tested (it mutates an item's release state) — treat as high-confidence but unverified.

See `api/v3/items` for the full confirmed shapes and constraints.
:::

:::tip[Confirmed live — CO/item relationship view direction]
**Resolved (2026-07-08).** Live-tested against a real tenant with real items and Change Orders: `views/2` on a plain item returned `204` (valid, empty); `views/11` on the same item returned `403 VIEW_WORKFLOW_ITEMS denied`. Conversely, `views/11` on two different real Change Orders returned `200` with a populated `affectedItems[]` array pointing to real parts, while `views/2` on those same COs returned `403 VIEW_ASSOCIATED_WORKFLOW denied`. This confirms the `client.py` reading: **`views/2`** = Change Orders linked to an item (item → CO direction), **`views/11`** = affected items on a Change Order (CO → item direction). The other internal note claiming the opposite was incorrect for this tenant — see `api/v3/relationships-and-affected-items`.
:::

:::tip[Correction — v3 roles endpoint exists]
**Corrected (2026-07-09).** An earlier pass claimed `getRoles` was v1-only because the one production Chrome extension examined never called a v3 roles endpoint. That was a gap in the source, not a gap in the API: Autodesk's official Postman collection documents `GET /api/v3/roles?offset=&limit=`, and it's confirmed live (`200`, standard `offset`/`limit`/`totalCount`/`first`/`next`/`last` envelope) against a real tenant. The v1 `GET /api/rest/v1/roles` may still work too (not retested), but don't treat v3 as unavailable for roles.
:::

## Picklists: a real v1/v3 split

Picklist **setup and value retrieval** is v1-only: `GET /api/rest/v1/setups/picklists` (list all) and `GET /api/rest/v1/setups/picklists/{picklistId}` (values, with `offset`/`limit` as headers, not query params — an unusual convention worth double-checking against the target endpoint). Picklist **field-value lookups used while filling in an item field** go through v3: `GET /api/v3/lookups/{lookupId}` (e.g. `CUSTOM_LOOKUP_WS_CHANGE_APPROVAL_TEMPLATES`), returning the standard v3 paginated envelope. These are two different consumption paths for related data, not a version migration of the same endpoint.

## Legacy v1 patterns to treat as historical, not current guidance

Some older integrations use v1 endpoints that newer code has since moved off of, e.g. `views/11` for change-order affected items fetched via the older reusable-components pattern, or `where-used?depth=N` style params. Where a page notes something as "legacy (v1)," treat it as a historical example worth knowing about (older tenants or older integrations may still rely on it) rather than the recommended current approach.

---
title: Items
description: Create, update, and archive items on v3 — confirmed request shapes, link-scoping rules, and the PUT/PATCH asymmetry, verified live against a real tenant.
---

Read access (`GET /api/v3/workspaces/{ws}/items/{itemId}`) is covered in `concepts/versioning` and `api/v3/workspaces`. This page covers the write operations, which have several non-obvious, easy-to-get-wrong requirements confirmed by testing against a live tenant.

## Create

**Confirmed live and working (2026-07-08).** The verified, production-derived shape — sourced from the Better BOM Builder Chrome extension's `cloneSubassembly` code path (`builder.service.ts`), which is the only item-creation code actually exercised in production across that entire codebase (the richer v3 `createItem`/`editItem` functions in its `plm.js` client exist but are unreferenced dead code):

```
POST /api/v3/workspaces/{workspaceId}/items
```

```json
{
  "sections": [
    {
      "link": "/api/v3/workspaces/{workspaceId}/sections/{sectionId}",
      "fields": [
        { "__self__": "/api/v3/workspaces/{workspaceId}/views/{viewId}/fields/{fieldId}", "value": "..." }
      ]
    }
  ]
}
```

Verified end-to-end against a live tenant: `201 Created`, empty body, new item URL in the `Location` header (e.g. `.../api/v3/workspaces/{ws}/items/{newDmsId}`) — parse the new item's workspace/dmsId from there, not from a response body.

**Critical constraints (confirmed both by the extension's own code comments and by live testing):**
- Each field entry must be reduced to **exactly** `{ __self__, value }`. Sending the full field object as returned by `GET .../items/{id}` (with `title`, `type`, `isSystemField`, `fieldValidators`, etc.) causes the create endpoint to reject the request.
- Section and field `__self__`/`link` paths must be **workspace-scoped**, not item-scoped. If you're deriving them from an existing item's detail response (which returns item-scoped links like `/workspaces/{ws}/items/{srcId}/views/{v}/sections/{id}`), strip the `/items/{srcId}` segment before sending: `/workspaces/{ws}/items/{srcId}/views/{v}/sections/{id}` → `/workspaces/{ws}/sections/{id}`, and similarly for fields: `/workspaces/{ws}/items/{srcId}/views/{v}/fields/{name}` → `/workspaces/{ws}/views/{v}/fields/{name}`.
- A derived field (`derived: true` on its field metadata from `GET /workspaces/{ws}/fields`) should only be included if its `derivedFieldSource` field is also present in the payload — otherwise the server computes it itself. Sending a derived field without its source present returns `error.derived.invalidDerivedFieldValue`.
- Required-ness must be checked against `GET /api/v3/workspaces/{ws}/fields` (which carries `fieldValidators`), not against the view-1 fields embedded in an item's own detail response (which don't carry validator info).

The v1 flat field-map create (`POST /api/rest/v1/workspaces/{ws}/items`) described in some older documentation could not be made to work in live testing — every payload shape tried (flat map, `fields: [{fieldID, value}]` array, lowercase keys) returned `400 {"error":[{"fieldId":"TITLE","message":"Title is required."}]}` even with a `TITLE` value present, and no v1 create function exists in the extension codebase used to derive the shape above. Treat v1 create as unresolved/likely non-functional on this API version until proven otherwise.

## Update

**Confirmed live (2026-07-08) — v3 supports both `PATCH` and `PUT`, but with different link-scoping requirements:**

- **`PATCH /api/v3/workspaces/{ws}/items/{itemId}`** — requires **item-scoped** section/field links (i.e. the exact `__self__`/`link` values as returned by `GET` on that same item — do NOT strip the `/items/{itemId}` segment). Using workspace-scoped links (the create-style shape) returns `400 "Could not find section {id} in workspace {ws}"`. Confirmed working (`204 No Content`) with item-scoped links.
- **`PUT /api/v3/workspaces/{ws}/items/{itemId}`** — more permissive: confirmed working (`204`) with **both** workspace-scoped (create-style) and item-scoped link shapes.

Both verbs returned `204 No Content` on success with no response body — re-fetch the item to confirm the change. The v1 `PUT` update path described elsewhere was not tested against this tenant; the v3 behavior above is now the confirmed-working reference.

## Archive (soft delete)

**Confirmed live and working (2026-07-08).** There is no `DELETE` support (`405 Method Not Allowed`) — items are soft-deleted via:

```
PATCH /api/v3/workspaces/{ws}/items/{itemId}?deleted=true
Body: {}
```

Returns `204 No Content`. The item still exists and is `GET`-able afterward, now with `"deleted": true` at its top level. Unarchive presumably uses the same pattern with `?deleted=false` (not independently tested).

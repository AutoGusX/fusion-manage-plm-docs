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

The v1 flat field-map create (`POST /api/rest/v1/workspaces/{ws}/items`) described in some older documentation could not be made to work in live testing — every payload shape tried (flat map, `fields: [{fieldID, value}]` array, lowercase keys) returned `400 {"error":[{"fieldId":"TITLE","message":"Title is required."}]}` even with a `TITLE` value present, and no v1 create function exists in the extension codebase used to derive the shape above. Treat v1 create as non-functional on this API version.

:::note[Confirmed by Autodesk's official Postman collection — 2026-07-09]
Autodesk's own official collection independently confirms the shape above, with two additions:

- Its example uses an item-scoped-style link with a placeholder item id (`"link": "/api/v3/workspaces/57/items/1/views/1/sections/203"`) rather than the fully workspace-scoped form. Both forms are apparently accepted — the server likely ignores any item-id segment on create and only reads the workspace/section/view/field numeric IDs.
- An optional variant, **"Create New Item in Released status,"** sets top-level fields alongside `sections`:
  ```json
  {
    "versionId": "D",
    "effectivity": "2025-09-01T00:00:00+01:00",
    "lifecycle": { "title": "Production" },
    "sections": [ /* ... */ ]
  }
  ```
  This creates the item directly at a given revision letter, effectivity date, and lifecycle state instead of the default working version.
- Field values aren't always scalars — a picklist-type field's value is itself a link object: `{ "__self__": "...", "value": { "link": "/api/v3/workspaces/{ws}/items/{id}" } }`, and a multi-picklist field's value is an array of link objects: `{ "value": [{ "link": "..." }] }`.
:::

## Update

**Confirmed live (2026-07-08) — v3 supports both `PATCH` and `PUT`, but with different link-scoping requirements:**

- **`PATCH /api/v3/workspaces/{ws}/items/{itemId}`** — requires **item-scoped** section/field links (i.e. the exact `__self__`/`link` values as returned by `GET` on that same item — do NOT strip the `/items/{itemId}` segment). Using workspace-scoped links (the create-style shape) returns `400 "Could not find section {id} in workspace {ws}"`. Confirmed working (`204 No Content`) with item-scoped links.
- **`PUT /api/v3/workspaces/{ws}/items/{itemId}`** — more permissive: confirmed working (`204`) with **both** workspace-scoped (create-style) and item-scoped link shapes.

Both verbs returned `204 No Content` on success with no response body — re-fetch the item to confirm the change. Autodesk's own official `PATCH` example uses item-scoped links, exactly matching what live testing found necessary — this is a solid, doubly-confirmed reference.

## Archive / undelete (soft delete)

**Confirmed live and working (2026-07-08), independently confirmed by Autodesk's official Postman collection (2026-07-09).** There is no `DELETE` support (`405 Method Not Allowed`) — items are soft-deleted/restored via:

```
PATCH /api/v3/workspaces/{ws}/items/{itemId}?deleted=true    (delete)
PATCH /api/v3/workspaces/{ws}/items/{itemId}?deleted=false   (undelete)
Body: {}
```

Both return `204 No Content`. The item still exists and is `GET`-able afterward, with `"deleted": true`/`false` at its top level accordingly. The official collection documents both calls explicitly, confirming `?deleted=false` for undelete without needing to test it destructively.

## Lifecycle transitions (distinct from workflow transitions)

**From Autodesk's official Postman collection, not yet independently live-tested** (it mutates an item's release state, so wasn't exercised against a live tenant in this pass):

```
PUT /api/rest/v1/workspaces/{ws}/items/{itemId}/lifecycles/transitions/{transitionId}
Content-Type: application/xml

<dmsVersionItem>
<release>G</release>
</dmsVersionItem>
```

This is a **separate v1, XML-bodied endpoint** from the JSON-bodied workflow-transition endpoint on `api/v3/workflow` — "lifecycle transitions" move an item between revision/release states (the `<release>` letter), while "workflow transitions" move an item along its configured workflow steps. Don't conflate the two; they use different verbs, different hosts-paths, and different body formats.

To discover available transitions rather than guessing IDs: `GET /api/v3/workspaces/{ws}/transitions` (all lifecycle transitions defined on the workspace, `Accept: application/vnd.autodesk.plm.transitions.bulk+json`) or `GET /api/v3/workspaces/{ws}/items/{itemId}/workflows/1/transitions` (transitions available on this specific item right now).

## Related read endpoints

From Autodesk's official collection (not yet individually live-tested, but low-risk `GET`s worth knowing about):

| Purpose | Endpoint |
|---|---|
| Owners | `GET /api/v3/workspaces/{ws}/items/{itemId}/owners` |
| Change log | `GET /api/v3/workspaces/{ws}/items/{itemId}/logs?offset=&limit=&desc=timeStamp` |
| Revision history | `GET /api/v3/workspaces/{ws}/items/{itemId}/versions` |
| Related changes (COs linked to this item) | `GET /api/v3/workspaces/{ws}/items/{itemId}/views/2` — see `api/v3/relationships-and-affected-items` |
| Item detail tabs | `GET /api/v3/workspaces/{ws}/items/{itemId}/tabs` |
| A specific field's metadata | `GET /api/v3/workspaces/{ws}/views/{viewId}/fields/{fieldId}` |

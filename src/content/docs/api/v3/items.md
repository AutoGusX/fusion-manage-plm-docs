---
title: Items
description: Create, update, and archive items on v3 — confirmed request shapes, link-scoping rules, and the PUT/PATCH asymmetry, verified live against a real tenant.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->




Read access (`GET /api/v3/workspaces/{ws}/items/{itemId}`) is covered in [API Versions](/concepts/versioning/) and [Workspaces](/api/v3/workspaces/). This page covers the write operations, which have several non-obvious, easy-to-get-wrong requirements confirmed by testing against a live tenant.

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

```
PUT /api/rest/v1/workspaces/{ws}/items/{itemId}/lifecycles/transitions/{transitionId}
Content-Type: application/xml

<dmsVersionItem>
<release>A</release>
</dmsVersionItem>
```

This is a **separate v1, XML-bodied endpoint** from the JSON-bodied workflow-transition endpoint on [Workflow](/api/v3/workflow/) — "lifecycle transitions" move an item between revision/release states, while "workflow transitions" move an item along its configured workflow steps. Don't conflate the two; they use different verbs, different paths, and different body formats.

:::tip[Confirmed live — 2026-08-31]
Exercised end-to-end against a disposable item. It works, and returns **`200`** —
unlike the v3 workflow transition, which returns `303`.

The item's revision advanced from `[REV:w]` (working) to `[REV:1]`.

Four things worth knowing, all observed rather than assumed:

- **The XML body is required.** An empty body returns `400` — and the response is
  a **Tomcat HTML error page**, not JSON. A client that assumes JSON on this
  endpoint will fail while parsing the error rather than reporting it. This is
  the only endpoint found so far that does this.
- **The `<release>` value did not drive the result.** `<release>A</release>` on a
  transition configured with `incrementRelease: false` / `incrementVersion: true`
  produced `[REV:1]` — the transition's own configuration won. Whether the value
  is honoured by a release-incrementing transition was not established (see
  below), so treat `<release>` as "required to be present" rather than "sets the
  revision".
- **An invalid transition for the item's current state returns `409`**, not a
  validation message naming the problem.
- **Check what's actually available first:**
  `GET /api/rest/v1/workspaces/{ws}/items/{itemId}/lifecycles/transitions`
  returns `200` with `{"list": null}` when the item has no valid lifecycle
  transitions from its current state. That `null` is the signal — it is what
  explained the `409` above, since the freshly-transitioned item had no legal
  next move. There is no v3 equivalent (`/items/{id}/transitions` returns `404`).
:::

To discover transition IDs rather than guessing: `GET /api/v3/workspaces/{ws}/transitions` lists all lifecycle transitions defined on the workspace (send `Accept: application/vnd.autodesk.plm.transitions.bulk+json`, or you get a thin response — see [Workspaces](/api/v3/workspaces/)). Each entry carries `incrementRelease` and `incrementVersion`, which tell you what it will actually do. Note this is a *different* endpoint from `GET /api/v3/workspaces/{ws}/items/{itemId}/workflows/1/transitions`, which lists **workflow** transitions.

## Related read endpoints

From Autodesk's official collection (not yet individually live-tested, but low-risk `GET`s worth knowing about):

| Purpose | Endpoint |
|---|---|
| Owners | `GET /api/v3/workspaces/{ws}/items/{itemId}/owners` |
| Change log | `GET /api/v3/workspaces/{ws}/items/{itemId}/logs?offset=&limit=&desc=timeStamp` |
| Revision history | `GET /api/v3/workspaces/{ws}/items/{itemId}/versions` |
| Related changes (COs linked to this item) | `GET /api/v3/workspaces/{ws}/items/{itemId}/views/2` — see [Relationships and Affected Items](/api/v3/relationships-and-affected-items/) |
| Item detail tabs | `GET /api/v3/workspaces/{ws}/items/{itemId}/tabs` |
| A specific field's metadata | `GET /api/v3/workspaces/{ws}/views/{viewId}/fields/{fieldId}` |

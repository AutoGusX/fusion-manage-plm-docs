---
title: Relationships and Affected Items
description: Change-order affected items (Managed Items tab) and item-to-item relationships, via numbered workspace views — with the views/2 vs views/11 direction conclusively resolved.
---

## Managed Items tab (views/11) — affected items on a Change Order

:::tip[Confirmed live — 2026-07-08]
Tested directly against a real tenant with real items and Change Orders:

| Call | Result |
|---|---|
| `views/2` on a plain item | `204` (valid, empty — no COs linked to this particular item) |
| `views/11` on the same plain item | `403 VIEW_WORKFLOW_ITEMS denied` |
| `views/11` on a real Change Order | `200`, populated `affectedItems[]` pointing to real parts |
| `views/2` on the same Change Order | `403 VIEW_ASSOCIATED_WORKFLOW denied` |

**Confirmed:** `views/2` = Change Orders linked to an item (item → CO direction, see `api/v3/items`'s "Related Changes"). `views/11` = affected items listed on a Change Order (CO → item direction). A separate internal note claiming the opposite for `views/11` was incorrect, at least for this tenant. Autodesk's official Postman collection independently corroborates this: it labels the `views/11` GET "Get Managed Items" and the `views/2` GET "Get Item Related Changes," matching the directions above exactly.

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

**Read:**
- `GET /api/v3/workspaces/{coWs}/items/{coId}/views/11` — list managed/affected items (shown above)
- `GET /api/v3/workspaces/{coWs}/items/{coId}/views/11/fields` — tab's field/column definitions

**Write** (from Autodesk's official Postman collection, not yet independently live-tested):

- **Add** — `POST /api/v3/workspaces/{coWs}/items/{coId}/affected-items` (note: **not** nested under `views/11`), `Accept: application/vnd.autodesk.plm.affected.items.bulk+json`, body is a raw array of item links:
  ```json
  ["/api/v3/workspaces/57/items/{itemId}"]
  ```
- **Update** — `PUT /api/v3/workspaces/{coWs}/items/{coId}/views/11/affected-items/{itemId}`:
  ```json
  {
    "linkedFields": [
      { "__self__": "/api/v3/workspaces/{coWs}/views/11/fields/{fieldId}", "value": "..." }
    ],
    "targetTransition": { "link": "/api/v3/workflows/{workflowId}/transitions/{transitionId}" }
  }
  ```
- **Remove** — `DELETE /api/v3/workspaces/{coWs}/items/{coId}/views/11/affected-items/{itemId}`

Note the add endpoint's path doesn't match the read/update/remove endpoints' path (`affected-items` directly under the item, vs. `views/11/affected-items`) — this is confirmed from the official source, not a typo.

## Relationships tab (views/10) — item-to-item relationships

### Step 1 — discover valid relationship targets

```
GET /api/v3/workspaces/{ws}/views/10/related-workspaces
```

:::tip[Confirmed live — 2026-07-13]
Returns `200` with `{ "workspaces": [ { "link", "urn", "title", "type": "/relation" }, ... ] }` — the set of workspaces this workspace is actually configured to relate to. On the tenant tested, the Items workspace (57) is related to Requirements (143) and Supplier Packages (147) — **not** to itself, and not to Documents. Check this before attempting a write; guessing a workspace pair returns the `400` documented below.
:::

### Step 2 — read, add, update, remove

- **Read** — `GET /api/v3/workspaces/{ws}/items/{itemId}/views/10`
- **Add** — `POST /api/v3/workspaces/{ws}/items/{itemId}/views/10`, with a `content-location` header pointing at the specific item being related (`/api/v3/workspaces/{targetWs}/items/{targetItemId}/views/10/linkable-items/{targetItemId}`), body:
  ```json
  { "description": "Relationship created by API", "direction": { "type": "Bi-Directional" } }
  ```
  `direction.type` is also seen as `"Uni-Directional"`.
- **Update** — `PUT /api/v3/workspaces/{ws}/items/{itemId}/views/10/relationships/{relationshipId}`, same body shape.
- **Remove** — `DELETE /api/v3/workspaces/{ws}/items/{itemId}/views/10/relationships/{relationshipId}`

The `content-location` header pattern (pointing to a `linkable-items` or similar sub-resource) recurs elsewhere in this API — see `api/v3/views-fields-tableaus` for the Project tab, which uses the same convention for linking an existing item into a tab.

:::tip[Confirmed live end-to-end — 2026-07-13]
Full CRUD cycle tested against a real tenant, relating an Items-workspace item to a real Requirements-workspace item (a valid pair per step 1):

| Call | Result |
|---|---|
| `POST .../items/{itemId}/views/10` with `content-location` pointing at the target | `201`, `Location: .../views/10/relationships/{relationshipId}` |
| `GET .../items/{itemId}/views/10` afterward | `200`, an **array** of relationship objects (not wrapped in a `relationships` key) — each with `item`, `workspace`, `direction`, `description` |
| `PUT .../views/10/relationships/{relationshipId}` | `204` |
| `DELETE .../views/10/relationships/{relationshipId}` | `204` |

**The `relationshipId` in the URL is the target item's own dmsId**, not a separately-generated relationship ID — confirmed by the `Location` header and the read-back matching exactly.

**Earlier finding, now fully explained:** an add-relationship attempt between two items in the same workspace, or between workspaces with no configured relationship, returns `400 "Workspace X is not related to workspace Y"`. This isn't a bug or a permissions issue — it's the expected result of trying an unconfigured workspace pair. Always check step 1 first.
:::

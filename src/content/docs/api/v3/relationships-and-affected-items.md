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

- **Read** — `GET /api/v3/workspaces/{ws}/items/{itemId}/views/10`
- **Add** — `POST /api/v3/workspaces/{ws}/items/{itemId}/views/10`, with a `content-location` header pointing at the specific item being related (`/api/v3/workspaces/{targetWs}/items/{itemId}/views/10/linkable-items/{targetItemId}`), body:
  ```json
  { "description": "Relationship created by API", "direction": { "type": "Bi-Directional" } }
  ```
  `direction.type` is also seen as `"Uni-Directional"`.
- **Update** — `PUT /api/v3/workspaces/{ws}/items/{itemId}/views/10/relationships/{relationshipId}`, same body shape.
- **Remove** — `DELETE /api/v3/workspaces/{ws}/items/{itemId}/views/10/relationships/{relationshipId}`

The `content-location` header pattern (pointing to a `linkable-items` or similar sub-resource) recurs elsewhere in this API — see `api/v3/views-fields-tableaus` for the Project tab, which uses the same convention for linking an existing item into a tab.

:::caution[Confirmed live — 2026-07-13: relationships require a pre-configured workspace pair]
Attempted against a live tenant, twice: an add-relationship `POST` between two items in the **same** workspace (Items → Items) returned `400 "Workspace 57 is not related to workspace 57"`. A second attempt across workspaces (Items → Documents) returned `400 "Workspace 57 is not related to workspace 71"`.

**This confirms relationships are gated by tenant admin configuration** — a workspace pair must be explicitly set up as "related" before `POST .../views/10` will accept a relationship between items in that pair. Don't assume any two arbitrary workspaces (or even an item to another item in its own workspace) can be related without checking this first. Read (`GET .../views/10`) worked fine (`204`, empty) regardless — it's specifically the write path that enforces this.
:::

### Discovering which workspaces are configured as related

Found in a production client (not yet independently live-tested — the token available while researching this expired before it could be checked):

```
GET /api/v3/workspaces/{ws}/views/{view}/related-workspaces
```

Response: `{ "workspaces": [ /* ... */ ] }`. Pass the Relationships tab's view number (`10`) to check which workspaces this one can actually be related to **before** attempting a `POST` — this should let a client avoid the `400 "Workspace X is not related to workspace Y"` error above by checking first rather than guessing. Whether the *write* side (configuring a new relationship pair) is exposed via API at all, or is admin-UI-only, is still unconfirmed.

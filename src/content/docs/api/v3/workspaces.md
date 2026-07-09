---
title: Workspaces
description: List and retrieve workspaces and their sub-resources — confirmed from Autodesk's official Postman collection, with real example data.
---

## List and get

| Purpose | Endpoint |
|---|---|
| List workspaces (v1) | `GET /api/rest/v1/workspaces` |
| List workspaces (v3, paginated) | `GET /api/v3/workspaces?offset={n}&limit={n}` |
| List items in a workspace | `GET /api/v3/workspaces/{ws}/items?offset={n}&limit={n}` |
| Get workspace details | `GET /api/v3/workspaces/{ws}` |
| Tenant's own internal ID | `GET /api/v3/tenant` (singular — not `/tenants`) |

A workspace detail response (confirmed live shape) links out to all its sub-resources directly:
```json
{
  "__self__": "/api/v3/workspaces/84",
  "name": "Change Orders",
  "systemName": "WS_CHANGE_ORDERS",
  "type": "/api/v3/workspace-types/7",
  "fields": "/api/v3/workspaces/84/fields",
  "sections": "/api/v3/workspaces/84/sections",
  "views": "/api/v3/workspaces/84/views",
  "tableaus": "/api/v3/workspaces/84/tableaus",
  "scripts": "/api/v3/workspaces/84/scripts",
  "permissions": ["Update", "Delete", "Create", "Read"]
}
```
`systemName` (e.g. `WS_CHANGE_ORDERS`, `WS_ITEMS_AND_BOMS_2`) is a stable, tenant-independent identifier worth using for lookup instead of hardcoding numeric workspace IDs, which vary per tenant.

## Sections and fields

| Purpose | Endpoint |
|---|---|
| Item Details sections | `GET /api/v3/workspaces/{ws}/sections`, `Accept: application/vnd.autodesk.plm.sections.bulk+json` |
| Item Details fields | `GET /api/v3/workspaces/{ws}/fields` — carries `editability`, `derived`, and a `validators` link per field (needed for create/clone — see `api/v3/items`) |
| A specific field's metadata | `GET /api/v3/workspaces/{ws}/views/{viewId}/fields/{fieldId}` |

## Workflow definitions

| Purpose | Endpoint |
|---|---|
| Workflow states | `GET /api/v3/workspaces/{ws}/workflows/{workflowId}/states` |
| Workflow transitions | `GET /api/v3/workspaces/{ws}/workflows/{workflowId}/transitions` |

See `api/v3/workflow` for item-level (as opposed to workspace-level/definitional) workflow calls.

## Scripts

`GET /api/v3/workspaces/{ws}/scripts` — see `api/v3/scripts` for the full scripts subsystem (tenant-wide listing, source retrieval, running a script on an item).

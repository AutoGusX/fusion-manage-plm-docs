---
title: Views, Fields, Tableaus, Grid/Project Tabs, and Picklists
description: Workspace field/view discovery, tableau CRUD, grid and project tab rows, and picklist lookups — confirmed from Autodesk's official Postman collection.
---

Field discovery is a prerequisite for most write operations elsewhere on this site (`api/v3/items`, `api/v3/bom`) — read this page before constructing a create/update body. The view-1 fields embedded in an item's own detail response lack `editability`/`derived`/`derivedFieldSource`/validator metadata that `GET /api/v3/workspaces/{ws}/fields` exposes — use the workspace-level fields endpoint for anything that needs to check whether a field is required, derived, or writable.

## Tableaus

Confirmed from Autodesk's official Postman collection, with real example data:

| Operation | Endpoint |
|---|---|
| List tableaus | `GET /api/v3/workspaces/{ws}/tableaus` |
| Get a tableau's columns | `GET /api/v3/workspaces/{ws}/tableaus/{tableauId}`, `Accept: application/vnd.autodesk.plm.meta+json` |
| Get a tableau's data (paginated) | `GET /api/v3/workspaces/{ws}/tableaus/{tableauId}?page={n}` |
| Create a tableau | `POST /api/v3/workspaces/{ws}/tableaus`, `Content-Type: application/vnd.autodesk.plm.meta+json` |
| Delete a tableau | `DELETE /api/v3/workspaces/{ws}/tableaus/{tableauId}` |

Create body shape — each column names a field by its **view-0** self-link (view 0 appears to be the "all fields" virtual view used for tableau column definitions) plus a display `group`:
```json
{
  "name": "New View",
  "createdDate": "2024-01-01",
  "isDefault": false,
  "columns": [
    {
      "displayOrder": 0,
      "field": {
        "title": "Item Descriptor",
        "__self__": "/api/v3/workspaces/{ws}/views/0/fields/DESCRIPTOR",
        "type": { "link": "/api/v3/field-types/4" }
      },
      "group": { "label": "ITEM_DESCRIPTOR_FIELD" }
    }
  ]
}
```

## Grid tab

A workspace-configurable grid embedded on an item's detail page (distinct from BOM rows — see `api/v3/bom`):

| Operation | Endpoint |
|---|---|
| Get grid columns | `GET /api/v3/workspaces/{ws}/views/{gridViewId}/fields` |
| Get grid rows | `GET /api/v3/workspaces/{ws}/items/{itemId}/views/{gridViewId}/rows` |
| Add rows | `POST /api/v3/workspaces/{ws}/items/{itemId}/views/{gridViewId}/rows`, `Accept: application/vnd.autodesk.plm.grid.rows.bulk+json`, body is an **array** of `{ "rowData": [...] }` (supports adding multiple rows in one call) |
| Update a row | `PUT /api/v3/workspaces/{ws}/items/{itemId}/views/{gridViewId}/rows/{rowId}`, body is a single `{ "rowData": [...] }` |
| Delete a row | `DELETE /api/v3/workspaces/{ws}/items/{itemId}/views/{gridViewId}/rows/{rowId}` |

Each `rowData[]` entry is `{ "__self__": "<view-scoped field link>", "value": "...", "title": "...", "type": { "link": "/api/v3/field-types/{n}", "title": "...", "deleted": false } }` — richer than the `{__self__, value}` minimal shape used for item creation (see `api/v3/items`); the grid endpoints appear to want the fuller field-metadata shape.

## Project tab

Task/schedule entries on an item, confirmed from Autodesk's official Postman collection:

| Operation | Endpoint |
|---|---|
| Get entries | `GET /api/v3/workspaces/{ws}/items/{itemId}/views/16` |
| Add a manual task | `POST /api/v3/workspaces/{ws}/items/{itemId}/views/16`, body `{ "predecessors": [], "progress": 0, "startDate": "2025-01-01", "endDate": "2025-12-31", "title": "..." }` |
| Add a linked item | Same endpoint, with a `content-location` header pointing at `/api/v3/workspaces/{ws}/items/{itemId}/views/16/linkable-items/{targetItemId}` and an otherwise-empty body |
| Remove an entry | `DELETE /api/v3/workspaces/{ws}/items/{itemId}/views/16/project-items/{entryId}` |

View `16` recurs across the examples seen — likely a fixed view number for the Project tab, similar to `views/5` for BOM (see `api/v3/bom`), though not confirmed as universal across all tenants.

## Picklists and lookups

A real v1/v3 split — see `concepts/versioning` for the full explanation:

| Operation | Endpoint |
|---|---|
| List all picklist setups | `GET /api/rest/v1/setups/picklists` |
| Get a picklist's values (v1) | `GET /api/rest/v1/setups/picklists/{picklistId}`, with `offset`/`limit` as **headers**, not query params |
| Get a picklist's values (v3 lookup) | `GET /api/v3/lookups/{lookupId}` (e.g. `CUSTOM_LOOKUP_WS_CHANGE_APPROVAL_TEMPLATES`) — standard paginated envelope |

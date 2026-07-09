---
title: Classifications
description: The classification tree — v2 CRUD, plus a v3 sibling endpoint for reading a class's fields, confirmed live and from Autodesk's official Postman collection.
---

## Read

| Purpose | Endpoint |
|---|---|
| List all classes | `GET /api/v2/classifications?size={n}&page={n}` |
| Classification tree (adjacency graph) | `GET /api/v2/classifications/{rootId}/graphs/adjacency-set` |
| A class's fields | `GET /api/v3/classifications/{classId}/fields`, `Accept: application/vnd.autodesk.plm.fields.bulk+json` — **v3**, confirmed live (`204` on an empty classification, endpoint itself is real and accepted) |

:::tip[Correction — 2026-07-09]
An earlier pass claimed this subsystem has "no known v3 equivalent." That's too strong: Autodesk's official Postman collection documents the v3 `GET /api/v3/classifications/{id}/fields` endpoint above, and it's confirmed live. The classification **tree** itself (creating/reading classes, linking parent/child, defining properties) is still v2-only as far as has been found — v3 only covers reading a class's fields, not full CRUD.
:::

## Write (v2 — confirmed from Autodesk's official Postman collection, not yet independently live-tested)

**Create a class** — `POST /api/v2/classifications`
```json
{
  "children": [],
  "description": "Quality Testing",
  "displayName": "Quality Testing",
  "ext": { "abstract": false },
  "name": "QUALITY_TESTING",
  "parents": [],
  "properties": [],
  "suppressedProperties": []
}
```

**Create a property** — `POST /api/v2/properties` (same endpoint for both text and picklist properties; `type` distinguishes them)
```json
{
  "children": [],
  "constraints": [],
  "defaultValue": null,
  "displayName": "Test Type",
  "name": "TEST_TYPE",
  "parent": null,
  "suppressed": false,
  "type": "text"
}
```
Use `"type": "picklist"` for a picklist property, then create its options separately:

**Create a picklist option** — `POST /api/v2/enumerations`
```json
{ "displayValue": "Level A", "rank": 0, "value": "Level 1" }
```

**Link a class to a parent class** — `PUT /api/v2/classifications/{parentId}/children/{childId}`, body `{ "id": "{childId}" }`

**Add a property to a class** — `PUT /api/v2/classifications/{classId}/property-instances/{propertyId}`, body `{ "id": "{propertyId}" }`

See `api/v2/property-instances` for reading property values once assigned, and `api/v3/search` for the `CLASS:` query-grammar prefix used to search by classification.

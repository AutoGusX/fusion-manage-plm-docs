---
title: Classifications
description: The classification tree — v2 CRUD, plus a v3 sibling endpoint for reading a class's fields, confirmed live and from Autodesk's official Postman collection.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->




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

See [Property Instances](/api/v2/property-instances/) for reading property values once assigned, and [Search](/api/v3/search/) for the `CLASS:` query-grammar prefix used to search by classification.

## Where an item's classification actually lives

Confirmed live (2026-07-13) against a real Documents-workspace item: a workspace bound to the classification system has a dedicated section with `"type": "CLASSIFICATION"` (distinct from the ordinary `FIELDCONTAINER` type — see [Workspaces](/api/v3/workspaces/) for the sections endpoint). On the item itself, that section carries `classificationId` and `classificationName` directly (e.g. `118` / `"Documents"`, the default for that workspace), plus one or more dynamically-named fields following the pattern seen in [Property Instances](/api/v2/property-instances/)'s lookup convention — e.g. `0CWS_DOCUMENT_CLASS_NAME` — rather than static field IDs like `TITLE`/`DESCRIPTION`.

## Classifying an item

:::tip[Confirmed live — 2026-08-31, previously recorded as unresolved]
Assigning a classification **does** work through the ordinary item `PATCH`. An
earlier pass recorded this as a dead end after getting a `500`; the missing piece
was an empty `fields` array.

```
PATCH /api/v3/workspaces/{ws}/items/{itemId}
```
```json
{
  "sections": [
    {
      "link": "/api/v3/workspaces/{ws}/items/{itemId}/views/1/sections/{classificationSectionId}",
      "classificationId": 141,
      "fields": []
    }
  ]
}
```
Returns `204`, and the item's `classificationId`/`classificationName` change.

Three things this depends on, each of which returns an unhelpful error if wrong:

- **`fields: []` is required.** Omit it and you get a bare
  `500 INTERNAL_SERVER_ERROR` — not a validation message. This single omission is
  what made this look unsupported for weeks.
- **The section link must be item-scoped** (include `/items/{itemId}/views/1/`),
  matching the general `PATCH` rule in [Items](/api/v3/items/). Workspace-scoped
  links also return `500` here rather than the clearer
  `"Could not find section …"` that item updates give.
- **`classificationId` is not a top-level item field.** Sending it at the top
  level returns `400 "Invalid field classificationId"`.
:::

:::caution[Confirmed live — classification is effectively write-once]
Assignment succeeds only while the item still carries its workspace's **default**
class. Once it has been classified, every further change returns `500` — including
setting it back to the default.

Verified explicitly, and worth spelling out because the failure looks like a bug
rather than a rule: class `141` and class `19` each returned `204` on a *fresh*
item, and the identical requests returned `500` against an item that had already
been reclassified. Then, on an item sitting at `141`, both `142` and a revert to
the default returned `500`.

So: **treat classification as set-once at creation time.** If you need a different
class, create a new item. Whether the Fusion Manage UI can reclassify (via some
path the API doesn't expose) was not tested.
:::

:::note[Tenant scripts can block this independently]
On this tenant the Documents workspace rejected the same correctly-shaped request
with `400 "There has been a problem running a custom action."` — a workspace
`onEdit` script failing, not an API problem. The identical request shape worked on
the Items workspace. If you get that message, look at the workspace's scripts
(see [Scripts](/api/v3/scripts/)) before suspecting your payload.
:::

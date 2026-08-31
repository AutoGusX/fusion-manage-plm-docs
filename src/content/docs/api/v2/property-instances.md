---
title: Property Instances
description: Read classification-bound property values and their display metadata, and resolve classification-driven picklist lookup values.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-orange-low);color:var(--sl-color-orange-high)">Derived from client source — not yet live-verified</span></p>
<!-- verification-badge:end -->

Sourced from a production Fusion Manage API client (`plm.js`, BOM Builder Fork extension), and confirmed live on 2026-08-31.

## Property instances for a classification

```
GET /api/v2/property-instances?classification={classificationId}&inherited=true&page=1&size=100
```

Response: `{ "propertyInstances": [ /* ... */ ] }` (or nested under `data.propertyInstances`, depending on tenant — check both). `inherited=true` includes properties inherited from parent classifications, not just ones defined directly on this classification.

:::caution[Confirmed live — 2026-08-31: the N+1 is unavoidable]
The list carries a `displayName` key, but it is **`null`** — and there is no type
information at all. What you get per instance is essentially an `id` plus a
`properties` sub-resource link and a pile of `*Overridden`/`*Suppressed` flags:

```json
{ "id": 182,
  "properties": { "link": "property-instances/182/properties" },
  "displayName": null, "description": null, "rank": null, … }
```

The real metadata is one call further down:

```
GET /api/v2/property-instances/{instanceId}/properties
```
```json
{ "properties": [ { "id": 1, "name": "PREFIX", "displayName": "Prefix",
                    "type": "text", "defaultValue": "000",
                    "required": false, "readOnly": false } ] }
```

So a `displayName: null` in the list is not a data problem — it is the shape.
Budget one extra call per instance (fetch them in parallel) if you need labels or
types. Note the sub-resource links are **relative** (`property-instances/182/properties`),
like the rest of v2 — resolve them against `/api/v2/` yourself.
:::

## Resolving a classification-driven picklist's values

Property instances of picklist type don't carry their option list inline either — that's a separate v3 lookup, named by convention from the classification ID and property name:

```
GET /api/v3/lookups/CUSTOM_LOOKUP_0CWS_{PROPERTY_NAME_UPPERCASE}_{classificationId}?asc=title&filter=&limit=200&offset=0
```

Response shape varies by tenant — a production client defensively checks for `items`, `values`, `lookupValues`, or `results` as the array key, or a bare array at the top level. Don't assume one shape without checking.

See [Search](/api/v3/search/) for the `CLASS:{propertyName}="{value}"` query-grammar prefix, which searches by these same classification property values without needing to resolve instances/lookups first.

:::note
Not yet independently live-verified — transcribed from a production client's code and comments, not re-checked against a live tenant.
:::

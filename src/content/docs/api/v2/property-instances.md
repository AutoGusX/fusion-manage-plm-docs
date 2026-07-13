---
title: Property Instances
description: Read classification-bound property values and their display metadata, and resolve classification-driven picklist lookup values.
---

Sourced from a production Fusion Manage API client (`plm.js`, BOM Builder Fork extension) — not yet independently live-tested.

## Property instances for a classification

```
GET /api/v2/property-instances?classification={classificationId}&inherited=true&page=1&size=100
```

Response: `{ "propertyInstances": [ /* ... */ ] }` (or nested under `data.propertyInstances`, depending on tenant — check both). `inherited=true` includes properties inherited from parent classifications, not just ones defined directly on this classification.

:::caution
The property-instance list itself does **not** carry the friendly display name or data type — those live on each instance's `/properties` sub-resource. If you need human-readable labels (not the system id) or need to resolve picklist types, fetch each instance's properties separately:

```
GET /api/v2/property-instances/{instanceId}/properties
```

A production client fetches these in parallel (one call per instance) rather than expecting the list endpoint to inline them — budget for N+1 calls if you need display names for every property on a classification.
:::

## Resolving a classification-driven picklist's values

Property instances of picklist type don't carry their option list inline either — that's a separate v3 lookup, named by convention from the classification ID and property name:

```
GET /api/v3/lookups/CUSTOM_LOOKUP_0CWS_{PROPERTY_NAME_UPPERCASE}_{classificationId}?asc=title&filter=&limit=200&offset=0
```

Response shape varies by tenant — a production client defensively checks for `items`, `values`, `lookupValues`, or `results` as the array key, or a bare array at the top level. Don't assume one shape without checking.

See `api/v3/search` for the `CLASS:{propertyName}="{value}"` query-grammar prefix, which searches by these same classification property values without needing to resolve instances/lookups first.

:::note
Not yet independently live-verified — transcribed from a production client's code and comments, not re-checked against a live tenant.
:::

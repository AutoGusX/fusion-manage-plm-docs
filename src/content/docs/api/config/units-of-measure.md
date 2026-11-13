---
title: Units of measure (v1)
description: BOM units of measure (create, update, delete) and the read-only metric/imperial conversion table on the undocumented v1 configuration API. Confirmed live 2026-11-13.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->

Two unrelated unit lists live on the v1
[Configuration API](/api/config/configuration-api/):

- **`bom-uoms`**: the units a BOM row's quantity can be expressed in (Each,
  Meter, Kilogram…). Admins can edit this list.
- **`uoms`**: a fixed metric-to-imperial conversion table used by number fields
  with a unit. Read-only.

Base URL, the `adsk-plm-tenant` header, and the error envelope are as described
on the [Configuration API](/api/config/configuration-api/#base-url-and-tenant)
page.

## BOM units of measure

| Purpose | Endpoint |
|---|---|
| List BOM units | `GET /{context}/v1/bom-uoms` |
| Get a BOM unit | `GET /{context}/v1/bom-uoms/{id}` |
| Create a BOM unit | `POST /{context}/v1/bom-uoms` |
| Update a BOM unit | `PATCH /{context}/v1/bom-uoms/{id}` |
| Delete a BOM unit | `DELETE /{context}/v1/bom-uoms/{id}` |

```json
POST /{context}/v1/bom-uoms
{ "name": "Pallet", "abbreviation": "plt" }
```

```json
{
  "id": 30,
  "name": "Pallet",
  "abbreviation": "plt",
  "urn": "urn:adsk.plm:tenant.bom-uom:ACMECORP.30",
  "url": "/v1/bom-uoms/30"
}
```

:::tip[Confirmed live — 2026-11-13: full create, update, and delete]
- **Create** returns `201`. `POST {}` returns `400` with `abbreviation` and
  `name` both "must not be blank". `name` is 1 to 50 characters and
  `abbreviation` 1 to 10; longer values return `size must be between …`.
- **Update** is a partial `PATCH`, but the body must carry `id`
  (`{ "id": 30, "abbreviation": "zz9" }` returned `200`; without `id`, `400`
  `id: must not be null`). `PUT` returns the gateway `404`.
- **Delete** returns `204`. A second delete, or a `GET`, returns `404` "No unit
  of measure for bill of materials found with id …". The delete is permanent:
  the same name could be created again straight away.
- **List** is wrapped (`{ pagination, results }`), `limit` defaults to `100`, and
  `limit=max` works. The single-record `GET` works too, unlike
  [delegations](/api/config/delegations/).
:::

:::caution[Confirmed live — 2026-11-13: uniqueness is weaker than it looks]
- **`name` must be unique, but only as an exact match.** `each` was accepted next
  to `Each`, and `"Pallet "` with a trailing space next to `"Pallet"`. Whitespace
  isn't trimmed; a name of only spaces is refused as blank.
- **`abbreviation` isn't unique at all.** Two units with the same abbreviation
  were both accepted, as was `ea` next to `EA`.

An importer that maps a spreadsheet's unit column onto `bom-uoms` by
abbreviation can match the wrong unit. Match on `name` (case-insensitively) and
warn on duplicates.
:::

### Filtering and sorting

`filter[name]` and `filter[abbreviation]` are a **case-insensitive "contains"**
match: `filter[name]=Meter` returned six units, including Centimeter and Square
Meter. `filter[id]` must be numeric (`400` "The specified filter value … is
invalid for the property id" otherwise). `sort=name desc` works. Unsupported
properties return `400` naming them. Confirmed live 2026-11-13.

### Seed data

A tenant's default list included Each (`EA`), Meter, Liter, Gram, Kilogram,
Metric Ton, Inch, Foot, Quart, Gallon, Pound, Centimeter, Millimeter, As Required
(`AR`), Ounce, Milligram, Milliliter, square units, Liquid Ounce, and Yard. The
IDs had gaps, so units had been deleted before. Cubic Centimeter's abbreviation
was `cc^3`.

:::caution[Not tested: deleting a unit a BOM still uses]
Testing it means changing a real BOM row. Whether the delete is refused (as
categories are when a workspace uses them) or leaves rows pointing at a missing
unit is unknown. Check BOMs before deleting a unit.
:::

## Unit conversions

```
GET /{context}/v1/uoms
GET /{context}/v1/uoms/{metricName}
```

A bare array (no pagination wrapper) of eight pairs:

```json
{ "metricName": "grams", "imperialName": "ounces", "multiplier": 0.03527396, "urn": "urn:adsk.plm:tenant.uom:ACMECORP.grams", "url": "/v1/uoms/grams" }
```

| `metricName` | `imperialName` | `multiplier` |
|---|---|---|
| grams | ounces | 0.03527396 |
| kilograms | pounds | 2.2046225 |
| kilometers | miles | 0.6213712 |
| liters | gallons | 0.26417205 |
| meters | feet | 3.28084 |
| metric tonne | ton | 0.9842 |
| mm | inches | 0.03937008 |
| newton meters | pound force feet | 0.7375621 |

`multiplier` converts metric to imperial. "ton" here is the **long** (imperial)
ton: 1 tonne = 0.9842 long tons, not the 1.1023 US short tons. In the admin UI's
source, this list feeds a field form's unit picker (`uomUnit`). The read was
confirmed live 2026-11-13. Writes weren't tried, and the UI source contains none.

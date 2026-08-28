---
title: Suppliers
description: Approved Manufacturer/Supplier (AML) list and quotes for an item, via the fixed views/8 pattern.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->




Sourced from two independent production clients (a Chrome extension and a Python MCP server) that agree exactly on shape.

## Endpoints

| Purpose | Endpoint |
|---|---|
| List approved suppliers for an item | `GET /api/v3/workspaces/{ws}/items/{itemId}/views/8/suppliers` |
| Get quotes for one supplier | `GET /api/v3/workspaces/{ws}/items/{itemId}/views/8/suppliers/{supplierId}/quotes` |

Like BOM (`views/5`) and Project Management (`views/16`), suppliers/AML lives under view `8`. Confirm the number for a given workspace with `GET /api/v3/workspaces/{ws}/views` rather than assuming it — see [Views, Fields, and Tableaus](/api/v3/views-fields-tableaus/).

:::tip[Confirmed live — 2026-07-13]
`GET .../views/8/suppliers` returns `200` even for an item with zero suppliers configured (rather than `404`):
```json
{
  "__self__": "/api/v3/workspaces/57/items/9878/views/8/suppliers",
  "suppliers": [],
  "workingVersionChanged": false,
  "costIgnored": false,
  "hasQuotes": false,
  "hasDefaultQuote": false
}
```
Note `hasQuotes`/`hasDefaultQuote` also appear at the **top level** of this response (item-wide, "does this item have any quotes/a default quote across all its suppliers"), not just per-supplier as documented below — check both depending on whether you need an item-wide or per-supplier answer.
:::

## Response shape

Each supplier entry: `supplier.title`, `supplierPartNumber`, `manufacturer`, `manufacturerPartNumber`, a `quotes.link` to fetch that supplier's quotes, and a `hasQuotes` flag — check this before bothering to fetch quotes for a supplier that has none.

Each quote entry: `leadTime`, `leadTimeMultiplier`, `unitPrice`, `minAmount`, `maxAmount`, `defaultQuote` (boolean), and `bomAssemblies` (which assemblies this quote applies to).

:::tip
**Effective lead time in days = `leadTime * leadTimeMultiplier`.** The raw `leadTime` field alone is not the answer — both production clients independently compute this same product, suggesting `leadTimeMultiplier` represents a unit conversion (e.g. weeks-to-days) rather than being redundant with `leadTime`.
:::

To fetch quotes for every supplier on an item in one pass, list suppliers first, skip any with `hasQuotes: false`, then fetch each remaining supplier's `quotes.link` in parallel.

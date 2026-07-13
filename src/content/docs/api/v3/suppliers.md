---
title: Suppliers
description: Approved Manufacturer/Supplier (AML) list and quotes for an item, via the fixed views/8 pattern.
---

Sourced from two independent production clients (a Chrome extension and a Python MCP server) that agree exactly on shape — not yet independently live-tested against a live tenant in this documentation effort.

## Endpoints

| Purpose | Endpoint |
|---|---|
| List approved suppliers for an item | `GET /api/v3/workspaces/{ws}/items/{itemId}/views/8/suppliers` |
| Get quotes for one supplier | `GET /api/v3/workspaces/{ws}/items/{itemId}/views/8/suppliers/{supplierId}/quotes` |

Like BOM (`views/5`) and Project (`views/16`), `views/8` for suppliers/AML appears to be a fixed view number rather than something that varies per workspace — not confirmed as universal across all tenants, but consistent across every source examined.

## Response shape

Each supplier entry: `supplier.title`, `supplierPartNumber`, `manufacturer`, `manufacturerPartNumber`, a `quotes.link` to fetch that supplier's quotes, and a `hasQuotes` flag — check this before bothering to fetch quotes for a supplier that has none.

Each quote entry: `leadTime`, `leadTimeMultiplier`, `unitPrice`, `minAmount`, `maxAmount`, `defaultQuote` (boolean), and `bomAssemblies` (which assemblies this quote applies to).

:::tip
**Effective lead time in days = `leadTime * leadTimeMultiplier`.** The raw `leadTime` field alone is not the answer — both production clients independently compute this same product, suggesting `leadTimeMultiplier` represents a unit conversion (e.g. weeks-to-days) rather than being redundant with `leadTime`.
:::

To fetch quotes for every supplier on an item in one pass, list suppliers first, skip any with `hasQuotes: false`, then fetch each remaining supplier's `quotes.link` in parallel.

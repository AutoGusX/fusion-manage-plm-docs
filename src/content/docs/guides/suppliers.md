---
title: Suppliers
description: List a part's approved suppliers and pull their quotes, with correct lead-time math.
---

Full endpoint reference lives in `api/v3/suppliers`.

## 1. List approved suppliers for a part

```
GET /api/v3/workspaces/{ws}/items/{itemId}/views/8/suppliers
```

Check each entry's `hasQuotes` flag before bothering to fetch quotes — many suppliers on an AML have no quotes attached.

## 2. Get quotes for a supplier with quotes

```
GET /api/v3/workspaces/{ws}/items/{itemId}/views/8/suppliers/{supplierId}/quotes
```

To pull quotes for every quoted supplier on a part in one pass, list suppliers first, filter to `hasQuotes: true`, then fetch each remaining supplier's `quotes.link` in parallel rather than sequentially.

## 3. Compute effective lead time

Don't use `leadTime` alone — the effective value is:
```
effectiveLeadTimeDays = leadTime * leadTimeMultiplier
```
Two independent production clients agree on this; treat `leadTimeMultiplier` as a real unit-conversion factor, not a field you can safely ignore.

## 4. Pick a default quote

Each quote carries a `defaultQuote` boolean — use that rather than assuming the first quote in the list is the preferred one, and check `minAmount`/`maxAmount` against your actual order quantity before treating a quote's `unitPrice` as valid for that order size.

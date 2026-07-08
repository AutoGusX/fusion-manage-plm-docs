---
title: Search
description: The two distinct search subsystems — the v3 query-grammar search-results endpoint and the v1 structured searchDefinition body.
---

:::note[Coming soon]
This page is a placeholder. Content will document two distinct search mechanisms and when to use each:

1. `GET /api/v3/search-results` — free-text query grammar (`ITEM_DETAILS:`/`CLASS:` prefixes, operators, quoting rules, and documented broken behaviors like `!=` returning 0 and `NOT()` dropping null-valued items).
2. `POST /api/rest/v1/workspaces/{id}/items/search` — a structured `searchDefinition` body (fields/sorting/filteringCriteria).

**Primary sources to author from:** `SEARCH_GRAMMAR.md` (BOM Builder Fork extension, verbatim-reusable) for #1, and `api-reference.md` (Fusion Manage MCP server) for #2.
:::

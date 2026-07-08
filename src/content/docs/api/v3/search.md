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

:::tip[Confirmed live — 2026-07-08]
`GET /api/v3/search-results?query=ITEM_DETAILS:TITLE=*Power*&revision=1&limit=5&offset=0&page=1` returned `200` with real matches against a live tenant, confirming the `ITEM_DETAILS:{FIELD_ID}={value}` query grammar works as documented in `SEARCH_GRAMMAR.md`. Response uses the same `offset`/`limit`/`totalCount`/`first`/`next`/`last` envelope as v3 workspace listing (see `concepts/pagination`), plus an `items[]` array of match objects (each with `workspaceLongName`, `creator`, `urn`, etc.).

**Zero-match quirk confirmed:** a query with no matches returns `204 No Content` with an **empty response body** — not `200` with an empty `items[]` array, and not even a `totalCount` field. Code consuming this endpoint must treat 204 as "zero results," not as an error or an unexpected response.
:::

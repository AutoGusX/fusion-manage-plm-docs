---
title: Search
description: The two distinct search subsystems — the v3 query-grammar search-results endpoint and the v1 structured searchDefinition body — with confirmed live examples.
---

Two distinct search mechanisms exist. Use the v3 grammar for ad-hoc/free-text queries and the v1 structured body for programmatic, field-by-field search construction.

## v3 query-grammar search

```
GET /api/v3/search-results?query={grammar}&revision={1|2|3}&limit={n}&offset={n}&page={n}
```

`revision`: `1` = latest only, `2` = all revisions, `3` = working/unreleased only.

**Query grammar** (see `SEARCH_GRAMMAR.md` in the BOM Builder Fork extension for the full reference): `ITEM_DETAILS:{fieldId}={value}` for item-field matches, `CLASS:{propertyName}="{value}"` for classification-property matches, combinable with `AND`/`OR` and parentheses. Examples confirmed from Autodesk's official Postman collection:

```
query=*EMBER*                                                    (free-text)
query=itemDescriptor=01-1939 - CAR SUSPENSION+AND+(workspaceId={ws})    (descriptor + workspace scope)
query=(CLASS:CLASS_PATH="DOCUMENTS")
query=(CLASS:CLASS_PATH="LAB_EQUIPMENT" OR CLASS:CLASS_PATH="SUPPLIER_QUALITY")
query=(CLASS:SYSTEM_NAME="WORK_INSTRUCTIONS" AND (CLASS:ADDITIONAL_DESCRIPTION="Measurements"))
```

A "bulk" search variant exists too — request it with `Accept: application/vnd.autodesk.plm.items.bulk+json`.

:::tip[Confirmed live — 2026-07-08]
`GET /api/v3/search-results?query=ITEM_DETAILS:TITLE=*Power*&revision=1&limit=5&offset=0&page=1` returned `200` with real matches against a live tenant, confirming the `ITEM_DETAILS:{FIELD_ID}={value}` query grammar works. Response uses the same `offset`/`limit`/`totalCount`/`first`/`next`/`last` envelope as v3 workspace listing (see `concepts/pagination`), plus an `items[]` array of match objects (each with `workspaceLongName`, `creator`, `urn`, etc.).

**Zero-match quirk confirmed:** a query with no matches returns `204 No Content` with an **empty response body** — not `200` with an empty `items[]` array, and not even a `totalCount` field. Code consuming this endpoint must treat 204 as "zero results," not as an error or an unexpected response.
:::

Documented (not independently re-verified) broken/unreliable behaviors from `SEARCH_GRAMMAR.md`: `!=` returns 0 results rather than excluding matches; `NOT(...)` silently drops items where the field is null rather than including them.

## v1 structured search

```
POST /api/rest/v1/workspaces/{ws}/items/search
```
```json
{
  "searchDefinition": {
    "pageNo": 1,
    "pageSize": 50,
    "logicClause": "AND",
    "fields": [{ "fieldID": "TITLE", "fieldTypeID": "text" }],
    "sorting": [{ "fieldID": "TITLE", "sortOrder": "ASC" }],
    "filteringCriteria": [{ "filterType": { "filterID": "CONTAINS" }, "filterValue": "Widget" }]
  }
}
```
Response is a `reportResult` shape: `{ "reportResult": { "totalResultCount": N, "columnKey": [...], "row": [{ "cells": [...] }] } }` — a columnar/tabular shape, quite different from the v3 item-object shape.

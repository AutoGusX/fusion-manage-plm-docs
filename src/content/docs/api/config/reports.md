---
title: Report definitions (v1)
description: Read, clone, update, delete, and run Fusion Manage report definitions on the undocumented v1 configuration API. Running a report returns HTML or an Excel file. Confirmed live 2026-11-13.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->

The v1 [Configuration API](/api/config/configuration-api/) exposes report
**definitions**, the saved reports behind the Reports tab and dashboard charts.
It can also run a report and hand back the result as HTML or `.xlsx`. Base URL,
the `adsk-plm-tenant` header, and the error envelope are as described on the
[Configuration API](/api/config/configuration-api/#base-url-and-tenant) page.

For the v3 reporting endpoints on the tenant host, see
[Reports & dashboards](/api/v3/reports-dashboards/). The v1 list's `nextUrl` was
seen pointing at `/api/v4/reports` on 2026-11-02; that surface is still
unexplored.

| Purpose | Endpoint |
|---|---|
| List reports | `GET /{context}/v1/reports` |
| Get a report | `GET /{context}/v1/reports/{id}` |
| Create a report | `POST /{context}/v1/reports` |
| Update a report | `PATCH /{context}/v1/reports/{id}` |
| Delete a report | `DELETE /{context}/v1/reports/{id}` |
| Clone a report | `POST /{context}/v1/reports/{id}:clone` |
| Run a report | `POST /{context}/v1/reports/{id}:run` |

## A report definition

```json
{
  "id": 512,
  "name": "RMA by FA code",
  "description": "RMA by FA code",
  "owner": { "id": "{userId}", "urn": "…", "url": "/api/v3/users/{userId}" },
  "workspace": { "id": 140, "urn": "…", "url": "/v1/workspaces/140" },
  "access": "PUBLIC",
  "groupingEnabled": true,
  "topRows": -1,
  "logicClause": "AND",
  "advancedFilter": "",
  "showGrouped": false,
  "suppressDuplicateRecords": false,
  "displayFields": [
    { "fieldId": "FA_CODE", "fieldTypeId": 0, "displayOrder": 0, "aggregation": null },
    { "fieldId": "FA_CODE", "fieldTypeId": 0, "displayOrder": 1, "aggregation": "COUNT" }
  ],
  "filters": null,
  "sorts": [ { "fieldId": "FA_CODE", "fieldTypeId": 0, "sortDescending": false, "listOrder": 0, "aggregation": null } ],
  "groupings": [ { "fieldId": "FA_CODE", "fieldTypeId": 0, "groupByOrder": 0, "datePart": null } ],
  "chartConfig": {
    "title": "RMA by FA code",
    "chartType": "PIE",
    "xAxis": { "fieldId": "FA_CODE", "fieldTypeId": 6, "aggregation": null },
    "yAxis": { "fieldId": "FA_CODE", "fieldTypeId": 6, "aggregation": "COUNT" }
  },
  "sharedWith": null,
  "createdDate": "2013-01-03T17:53:00.737Z",
  "modifiedDate": "2021-04-08T08:23:04.579Z",
  "urn": "urn:adsk.plm:tenant.report:ACMECORP.512",
  "url": "/v1/reports/512"
}
```

`access` is one of `PRIVATE`, `PUBLIC`, or `SHARED`. Aggregation names map to
`GET /{context}/v1/aggregation-types` (Sum, Count, Average; a bare array).

:::tip[Confirmed live — 2026-11-13]
- `GET /{context}/v1/reports/{id}` returns `200`, and `404` "No report found with
  id …" for an unknown ID.
- `filter[workspace.id]` and `filter[name]` are **not** supported on the list
  (`400` "The specified filter property … is not supported").
- `POST {}` lists the create requirements: `access`, `groupingEnabled`, `name`,
  and `workspace`. A full create was confirmed later; see below.
:::

:::tip[Confirmed live — 2026-11-24: a full create works]
`POST /{context}/v1/reports` with a complete definition returned `201` and the
new report's `id`. Five grouped chart reports were created this way and each
one then returned rows from `:run`. The body that worked, for a count of
records by workflow state:

```json
{
  "name": "Changes by state", "description": "Changes by state",
  "workspace": { "id": 140 }, "access": "PUBLIC",
  "groupingEnabled": true, "topRows": -1, "logicClause": "AND", "advancedFilter": "",
  "showGrouped": false, "suppressDuplicateRecords": false,
  "displayFields": [
    { "fieldId": "WF_CURRENT_STATE", "fieldTypeId": 1, "displayOrder": 0, "aggregation": null },
    { "fieldId": "TITLE", "fieldTypeId": 0, "displayOrder": 1, "aggregation": "COUNT" }
  ],
  "filters": null,
  "sorts": [ { "fieldId": "WF_CURRENT_STATE", "fieldTypeId": 1, "sortDescending": false, "listOrder": 0, "aggregation": null } ],
  "groupings": [ { "fieldId": "WF_CURRENT_STATE", "fieldTypeId": 1, "groupByOrder": 0, "datePart": null } ],
  "chartConfig": {
    "title": "Changes by state", "chartType": "COLUMN", "seriesLabel": "",
    "baseline": { "value": 0.0, "label": "" },
    "xAxis": { "fieldId": "WF_CURRENT_STATE", "fieldTypeId": 4, "label": "", "min": null, "max": null, "aggregation": null },
    "yAxis": { "fieldId": "TITLE", "fieldTypeId": 4, "label": "", "min": null, "max": null, "aggregation": "COUNT" },
    "xAxisSeries": null, "yAxisSeries": null
  }
}
```

- `WF_CURRENT_STATE` is the workflow state and has `fieldTypeId` `1`; an
  ordinary item field (here `TITLE`, or a picklist field to group by) is `0`.
- The chart axes were copied from an existing report, where both carry
  `fieldTypeId` `4`. Whether other values work wasn't tried.
- `chartType` values seen on existing reports: `COLUMN`, `MSCOLUMN`,
  `STACKEDCOLUMN`, `PIE`, `DOUGHNUT`, `LINE`, `AREA`, `MSAREA`, `STACKEDAREA`.

Not checked: how the charts render in the browser, and putting a report on a
dashboard.
:::

## Cloning, updating, and deleting

:::tip[Confirmed live — 2026-11-13]
- **Clone:** `POST /{context}/v1/reports/{id}:clone` with `{}` returned `201` and a
  copy with the **same name**. Duplicate report names are allowed. With
  `{ "name": "…" }` the copy took the new name. The owner was the caller.
  An unknown ID returns `404`.
- **Update:** partial `PATCH` with `id` in the body:
  `{ "id": 513, "name": "…", "access": "PRIVATE" }` returned `200`. An invalid
  `access` returns `400` "The specified value must be one of PRIVATE, PUBLIC,
  SHARED".
- **Delete:** `204`, then `404` on `GET`.

The admin UI also changes a report's owner with `PATCH { "id", "owner": { "id" } }`.
That call is from its source and wasn't run.
:::

## Running a report

`POST /{context}/v1/reports/{id}:run` returns the report's **rendered result**,
not JSON. The `Accept` header picks the format.

```bash
curl -X POST "https://api.aps.usa.autodesk.com/{context}/v1/reports/512:run" \
  -H "Authorization: Bearer $TOKEN" \
  -H "adsk-plm-tenant: ACMECORP" \
  -H "Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" \
  -H "Content-Type: application/json" \
  -H "Content-Length: 0" \
  -o report.xlsx
```

:::tip[Confirmed live — 2026-11-13: the request has to be exactly right]
| Request | Result |
|---|---|
| `GET` | `502` from the gateway: "Received 405 Response without Allow Header" |
| `POST` with no body and no `Content-Length` | `411 Length Required` (an HTML page) |
| `POST`, empty body, no `Content-Type` | `415 Unsupported Media Type` |
| `POST`, `Accept: text/html;charset=UTF-8`, `Content-Type: application/json`, empty body | **`200`**, a standalone HTML page with the report title and a table |
| Same, `Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | **`200`**, an `.xlsx` file |
| `Accept: application/json`, `text/csv`, `application/xml`, or `application/pdf` | `406 Not Acceptable` |
| Body `{}` or `{ "filters": [] }` | `400` "The specified value has an invalid format" |
| Body `[]` | `200` |
:::

:::caution[Attempted, inconclusive: the run body]
The body is an optional **JSON array**. The admin UI passes a parsed array of
runtime filter values when it has one. `[{ "fieldId": "…", "value": "x" }]` was
accepted with `200`, but the output wasn't compared against an unfiltered run,
so whether that shape actually filters is unknown.
:::

## What isn't reachable

The admin UI's source also calls `POST /{context}/v1/report-filters` and
`GET`/`PATCH /{context}/v1/report-filters/{id}`. On 2026-11-13 the gateway
returned its own `404` for every method on both, so report filters can't be
managed through this API yet.

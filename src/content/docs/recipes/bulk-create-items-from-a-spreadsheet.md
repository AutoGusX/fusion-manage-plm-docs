---
title: "Recipe: bulk-create items from a spreadsheet"
description: Map columns to real field IDs, validate before you write, and create items in a loop that fails safely partway through.
---

Importing a spreadsheet is mostly not an API problem — it's a mapping and
error-handling problem. There is no bulk item-create endpoint, so this is a loop,
and the interesting decisions are what you do *before* it and how you behave when
row 400 of 900 fails.

## 1. Resolve the workspace by name, not by number

```
GET /api/v3/workspaces?offset=0&limit=200
```

Match on `systemName` (e.g. `WS_ITEMS_AND_BOMS_2`) rather than a numeric id —
numbers differ per tenant, so a hardcoded id makes the tool single-tenant
([Workspaces](/api/v3/workspaces/)).

## 2. Build the column → field map from real metadata

```
GET /api/v3/workspaces/{ws}/sections
Accept: application/vnd.autodesk.plm.sections.bulk+json

GET /api/v3/workspaces/{ws}/fields
```

Send the bulk `Accept` header on `/sections` — without it you get only
`link`/`urn`/`title`/`deleted`, and can't see `sectionType` or each section's
fields at all.

Map each spreadsheet column to a **field ID** (`TITLE`, `NUMBER`, …) and record
which **section** it belongs to, since the create body is grouped by section. Keep
`editability`, `derived`, and the validators — you need them in step 3.

Field types matter for the value you send:

| Field type | Value shape |
|---|---|
| Text / number | `"value": "ABC-123"` |
| Picklist (single) | `"value": { "link": "/api/v3/workspaces/{ws}/items/{id}" }` |
| Picklist (multi) | `"value": [{ "link": "…" }, { "link": "…" }]` |

For picklist columns the spreadsheet holds a label, not a link, so resolve labels
to links up front:

```
GET /api/v3/lookups/{lookupId}
GET /api/rest/v1/setups/picklists/{picklistId}
```

Cache that resolution — doing it per row turns a 900-row import into thousands of
calls ([Views, Fields, and Tableaus](/api/v3/views-fields-tableaus/)).

## 3. Validate the whole sheet before writing anything

Cheap, and it's the difference between a clean report and a half-finished import:

- every **required** field present and non-empty
- no **non-editable** field being written (`error.editable`)
- no **derived** field without its `derivedFieldSource` also present
  (`error.derived.invalidDerivedFieldValue`)
- every picklist label resolved to a link
- duplicate keys within the sheet

Report all failing rows at once. Partial imports are much worse than a rejected
file.

## 4. Create, one row at a time

```
POST /api/v3/workspaces/{ws}/items
```
```json
{
  "sections": [
    {
      "link": "/api/v3/workspaces/{ws}/sections/{sectionId}",
      "fields": [
        { "__self__": "/api/v3/workspaces/{ws}/views/1/fields/NUMBER", "value": "ABC-123" },
        { "__self__": "/api/v3/workspaces/{ws}/views/1/fields/TITLE",  "value": "Widget" }
      ]
    }
  ]
}
```

`201`, empty body, new item URL in `Location`. Record that id against the source
row — it's your restart point and your audit trail.

:::caution[Do not use the v1 create]
`POST /api/rest/v1/workspaces/{ws}/items` returns `400 "Title is required."`
regardless of payload shape, *including* when `TITLE` is populated. Item creation
is v3-only in practice ([Items](/api/v3/items/)).
:::

## 5. Fail safely partway through

There's no transaction, so a run *will* stop halfway eventually. Make that survivable:

- **Write the id back per row as you go**, not at the end. A crash then leaves a
  resumable file rather than an unknown state.
- **Treat `401` as retryable, not fatal.** Tokens last ~60 minutes and long
  imports outlive them — refresh and continue rather than aborting
  ([Authentication](/concepts/authentication/)).
- **Distinguish row errors from run errors.** A `400` is that row's data; a `401`
  or `5xx` is the run. Skip the former, pause on the latter.
- **Be ready for a tenant script.**
  `400 "There has been a problem running a custom action."` means a workspace
  `onCreate` script threw — your payload was fine. That's a tenant
  configuration conversation, not a payload fix
  ([Troubleshooting](/concepts/troubleshooting/)).

## 6. Optional follow-ups

Classification, if the workspace uses it — do it immediately after create, while
the item still carries the workspace default, because it is **set-once**
([Classifications](/api/v2/classifications/)):

```
PATCH /api/v3/workspaces/{ws}/items/{newId}
{"sections":[{"link":"…/items/{newId}/views/1/sections/{classSectionId}","classificationId":141,"fields":[]}]}
```

The `"fields": []` is required — omitting it returns a bare `500`.

BOM edges, if the sheet describes structure, come after every row exists so
parents can reference children by id ([BOM](/api/v3/bom/)).

## Verifying the import

```
GET /api/v3/workspaces/{ws}/items?offset=0&limit=50
GET /api/v3/tenants/{TENANT_UPPERCASE}/system-logs?offset=0&limit=250
```

The system log is the better evidence for a demo — it shows the creates
attributed to a user and timestamped
([Users, Groups, and Roles](/api/v3/users-groups-roles/)).

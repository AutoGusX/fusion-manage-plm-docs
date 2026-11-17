---
title: BOM views
description: Read the fields available to a workspace's BOM views and replace its BOM view definitions (columns, order, labels, default view) through the legacy /api/rest/v1/setups routes, with a bearer token. Confirmed live 2026-11-17.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->

BOM views (the column sets on a workspace's Bill of Materials tab) are saved by
the admin UI as JSON through two legacy v1 routes on the tenant host. Both accept
an ordinary bearer token.

| Purpose | Endpoint |
|---|---|
| Fields a BOM view can show | `GET /api/rest/v1/setups/bomAvailableFields.json?workspaceId={ws}` |
| Read the BOM views | `GET /api/rest/v1/setups/viewdefs.json?workspaceId={ws}&tab=BOM` |
| Replace the BOM views | `PUT /api/rest/v1/setups/viewdefs.json?workspaceId={ws}` |

Host is the tenant (`https://{tenant}.autodeskplm360.net`). Found in a HAR of the
admin UI, then repeated with a bearer token on a second tenant.

:::note[BOM *fields* are a different thing]
Creating a BOM field (a new column definition on the BOM tab) is still a
browser-only form post (`/bomFieldSave.do`, with the session cookie and a
`PLM-XSRF-TOKEN`), and the v1 configuration API's `bom-fields` routes return
the gateway `404` (see [Configuration API](/api/config/configuration-api/)).
This page is about choosing which existing fields a view shows.
:::

## Available fields

`bomAvailableFields.json` returns
`{ "ViewDefWorkspaceMetafieldByTabList": { "tabs": [ … ] } }`, one entry per
field source:

| `tabId` | Fields |
|---|---|
| `STANDARD_BOM` | Quantity, Units, Revision Pinning… |
| `CUSTOM_BOM` | BOM fields the workspace added |
| `ITEM_DETAIL` | Fields from the child item's Item Details |
| `STANDARD_SOURCING` | Sourcing fields |
| `CUSTOM_SOURCING` | Custom sourcing fields |
| `SYSTEM` | Descriptor, Revision, Lifecycle, Status, Attachments… |

Each field has `fieldID`, `fieldName`, `dataType`, `fieldType`, `tabId`, and
`assigned` (already on a view). An empty source has no `meta` key at all, so
check before reading it.

## Reading the views

```json
GET /api/rest/v1/setups/viewdefs.json?workspaceId={ws}&tab=BOM
{ "list": { "data": [
  { "viewdef": { "id": 501, "name": "Default View", "defaultView": true, "tab": "BOM",
    "fields": { "meta": [
      { "id": 7001,
        "metafield": { "fieldID": "DESCRIPTOR", "fieldName": "Descriptor", "workspaceId": 1300, "tabId": "SYSTEM", … },
        "displayProps": { "displayName": "Descriptor", "displayOrder": 1, "htmlDisplayId": 1 } }
    ] } } }
] } }
```

A new workspace already has a "Default View".

## Replacing the views

`PUT` takes a **bare array** of view definitions: every view the workspace
should have.

```json
PUT /api/rest/v1/setups/viewdefs.json?workspaceId={ws}
[
  { "id": 501, "name": "Default View", "defaultView": true, "tab": "BOM",
    "fields": { "meta": [
      { "id": -1,   "metafield": { "fieldID": "QUANTITY",   "workspaceId": 1300, "tabId": "STANDARD_BOM" },
                    "displayProps": { "displayName": "Quantity",   "displayOrder": 1 } },
      { "id": 7001, "metafield": { "fieldID": "DESCRIPTOR", "workspaceId": 1300, "tabId": "SYSTEM" },
                    "displayProps": { "displayName": "Descriptor", "displayOrder": 2 } }
    ] } },
  { "id": -1, "name": "Costing", "defaultView": false, "tab": "BOM",
    "fields": { "meta": [
      { "id": -1, "metafield": { "fieldID": "DESCRIPTOR", "workspaceId": 1300, "tabId": "SYSTEM" },
                  "displayProps": { "displayName": "Descriptor", "displayOrder": 1 } }
    ] } }
]
```

`"id": -1` means new, for both a view and a column. A column needs only
`fieldID`, `workspaceId`, and `tabId` in `metafield`, plus a label and order in
`displayProps`.

:::tip[Confirmed live — 2026-11-17]
On a scratch workspace, with a bearer token:

- `PUT` with a new column on the default view and a second, new view returned
  **`202`** with the saved views (new IDs assigned). A follow-up `GET` showed
  both views.
- **Duplicates aren't checked.** The default view already had Quantity further
  down; adding it again left the view with two Quantity columns. De-duplicate
  `fieldID`s yourself.
:::

:::caution[Not yet tested]
- Whether a view left out of the `PUT` is deleted (the workflow route works that
  way; this one wasn't checked).
- Changing which view is the default, or having none.
- Fields from `ITEM_DETAIL`, `CUSTOM_BOM`, and the sourcing sources.
- Other `tab` values. The UI sent only `BOM`.
:::

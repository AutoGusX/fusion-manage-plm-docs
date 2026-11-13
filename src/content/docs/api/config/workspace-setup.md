---
title: Workspace setup (v1)
description: Clone workspaces and fields, reorder and rename tabs, set the descriptor, write relationship config, read pending setup tasks, and manage categories on the undocumented v1 configuration API. Confirmed live 2026-11-13.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->

These routes complete the workspace lifecycle on the v1
[Configuration API](/api/config/configuration-api/): everything an admin does in
Workspace Manager after creating a workspace, apart from roles and workflow.
Base URL, the `adsk-plm-tenant` header, and the error envelope are as described
on the [Configuration API](/api/config/configuration-api/#base-url-and-tenant)
page.

They were found by extracting every `/v1/` call from the admin UI's JavaScript
bundle, then probed live on a scratch workspace that was deleted afterwards.

| Purpose | Endpoint |
|---|---|
| Clone a workspace | `POST /{context}/v1/workspaces/{ws}:clone` |
| Clone an item field | `POST /{context}/v1/workspaces/{ws}/item-fields/{fieldId}:clone` |
| Clone a grid field | `POST /{context}/v1/workspaces/{ws}/grid-fields/{fieldId}:clone` |
| Read or replace tabs | `GET` / `PUT /{context}/v1/workspaces/{ws}/tabs` |
| Read or replace the descriptor | `GET` / `PUT /{context}/v1/workspaces/{ws}/descriptor-fields` |
| Fields eligible for the descriptor | `GET /{context}/v1/workspaces/{ws}/descriptor-eligible-fields` |
| Read or replace relationships | `GET` / `PUT /{context}/v1/workspaces/{ws}/relationships` |
| Pending setup tasks | `GET /{context}/v1/workspaces/{ws}:get-pending-configuration-tasks` |
| Create a category | `POST /{context}/v1/categories` |
| Update a category | `PATCH /{context}/v1/categories/{id}` |
| Delete a category | `DELETE /{context}/v1/categories/{id}` |

## Cloning a workspace

```json
POST /{context}/v1/workspaces/{sourceWs}:clone
{
  "systemName": "TEST_COPY",
  "name": "Test copy",
  "type": { "id": 2 },
  "controlled": false,
  "category": { "id": 12 },
  "cloneItemFields": true,
  "cloneGridFields": true,
  "cloneLinkedFields": true,
  "cloneBomFields": true,
  "cloneSourcingFields": true,
  "cloneTabNames": true,
  "cloneRelationships": true
}
```

`POST {}` lists `systemName`, `name`, `type`, and `controlled` as required. The
seven `clone*` flags are what the admin UI sends (all `true` by default in its
source). Returns `201` with the new workspace record.

:::caution[Confirmed live — 2026-11-13: without the flags, you get an empty shell]
A clone **without** the `clone*` flags returned `201`, but the copy had **no
sections and no fields**. Only the workspace record and its default tabs were
created, so it was no better than a plain create. Its pending tasks listed
"Create sections", "Create fields", "Choose a descriptor", "Create roles…", and
"Upload a workflow".

With all seven flags, the copy got every section (4 of 4), item field (37 of
37), grid field (7 of 7), tab, and the descriptor fields. The source had no
relationships, linked fields, or sourcing fields, so whether those flags work is
untested.

What a clone **never** copies: **role permissions** and the **workflow**. The
copy's pending tasks still listed "Create roles and assign them to groups" and
"Upload a workflow", and v3 `workflows/1/states` on the copy returned `204`. A
copy with grid columns also warned "This Workspace has Grid columns but no Roles
are assigned Grid View Permission". Create roles before anyone uses it (see
[Creating a role](/api/v3/users-groups-roles/#creating-a-role)).
:::

:::note[Confirmed live — 2026-11-13: the server adds `WS_`]
`"systemName": "TEST_COPY"` came back as `WS_TEST_COPY`. A name that
already starts with `WS_` was kept as is. The admin UI strips `WS_` before
sending and builds the rest from the display name: trimmed, spaces to `_`, only
`A-Z0-9_`, upper-cased.
:::

## Cloning a field

```json
POST /{context}/v1/workspaces/{sourceWs}/item-fields/{sourceFieldId}:clone
{ "workspace": { "id": 1300 }, "fieldId": "NEW_FIELD", "name": "New field" }
```

The path names the **source**; the body names the **target** workspace and the
new `fieldId`. `POST {}` lists `workspace` and `fieldId`. Any other field
property in the body overrides the copied value (`name` did). Returns `201` with
the new field. Grid fields work the same way under `grid-fields/{fieldId}:clone`.
The UI also calls `linked-fields`, `sourcing-fields`, and `bom-fields` clone
routes; those weren't tried.

:::danger[Confirmed live — 2026-11-13: two clone defects]
- **A cross-workspace clone keeps the source's section.** Cloning a field from
  workspace A into workspace B created it in B, but its `section` still pointed
  at A's section. Fix it straight away with a field `PATCH` that sets a section
  in B.
- **The clone copies `descriptorOrder`.** Cloning a descriptor field made the
  copy part of the descriptor too, and two descriptor fields then both had
  `displayOrder: 1`. Re-`PUT` the descriptor after cloning (see below).

A duplicate `fieldId` in the target returns `400` `fieldId: must be unique`.
:::

## Tabs

`GET` returns a bare array, one entry per tab:

```json
{ "workspace": { "id": 1300, "urn": "…", "url": "…" }, "key": "Grid", "name": "Assembly process", "displayOrder": 12, "urn": "…", "url": "/v1/workspaces/1300/tabs/Grid" }
```

`name` is `null` unless the tab has a custom label. The per-tab `url` returns
`404`.

`PUT` replaces the whole tab list. The body is a **bare array**:

```json
PUT /{context}/v1/workspaces/{ws}/tabs
[
  { "workspace": { "id": 1300 }, "key": "Item Details", "name": "Item Details", "displayOrder": 1 },
  { "workspace": { "id": 1300 }, "key": "Grid", "name": "Assembly process", "displayOrder": 2 },
  …
]
```

:::tip[Confirmed live — 2026-11-13: tab rules]
| Body | Result |
|---|---|
| `{ "tabs": [ … ] }` | `400` "The request body is not readable" (must be a bare array) |
| Entries without `workspace`, or with `name: null` | `400` `name: must not be blank`, `workspace: must not be null` |
| A tab missing, or an unknown key | `400` "must include all tab keys for the workspace with no missing or unknown keys" |
| Two tabs with the same order, or a gap | `400` "must be consecutive starting from 1 with no gaps or duplicates" |
| Item Details not at 1 | `400` "must be 1 for the Item Details tab" |
| Complete, consecutive, Item Details first | `200`, tabs reordered and renamed |

Because `name` is required, a `PUT` turns every tab's `null` name into an
explicit label. Send the `key` as the name to keep the default text.
:::

## Descriptor fields

The descriptor is the set of fields that make up an item's title.

```json
GET /{context}/v1/workspaces/{ws}/descriptor-fields
[ { "fieldId": "PART_NUMBER", "descriptorFieldType": "FM", "displayOrder": 1 },
  { "fieldId": "TITLE", "descriptorFieldType": "FM", "displayOrder": 2 } ]
```

`GET …/descriptor-eligible-fields` lists the candidates as
`{ workspaceId, fieldId, fieldName }`. `PUT` replaces the descriptor with a bare
array.

:::tip[Confirmed live — 2026-11-13]
- `PUT` with one field, or with three in a new order, returned `200` with the
  new descriptor.
- A field that isn't eligible returns `400` "The field … is ineligible as a
  workspace descriptor."
- `[]` returns `400` "Workspace descriptor cannot be empty."
- `descriptorFieldType` must be `FM` or **`MFGDM`**. `MFGDM` presumably refers
  to Autodesk's Manufacturing Data Model (Fusion design data); it wasn't tried.
- A brand-new workspace returns `204` with no body until a descriptor is set.
:::

## Relationships

`GET` returns a bare array of `{ fromWorkspace, toWorkspace, type }`, or `204`
when there are none. `PUT` replaces the whole set:

```json
PUT /{context}/v1/workspaces/{ws}/relationships
[
  { "fromWorkspace": { "id": 1300 }, "toWorkspace": { "id": 1210 }, "type": "RELATION" },
  { "fromWorkspace": { "id": 1300 }, "toWorkspace": { "id": 1220 },  "type": "BOM" }
]
```

:::tip[Confirmed live — 2026-11-13: relationship config is writable here]
This contradicts the [v3 finding](/api/v3/relationships-and-affected-items/)
that workspace pairing can't be configured through an API. On v1 it can:

- `type` must be one of `BOM`, `PROJECT_ITEMS`, `RELATION`, or `WORKFLOW_ITEMS`.
- A `PUT` with one `RELATION` entry, then with three entries (`RELATION`, `BOM`,
  and `WORKFLOW_ITEMS`), returned `200` each time with the new set.
- `fromWorkspace` is required and must equal the path workspace (`400`
  `workspaceId: must match in path and body`).
- `PUT []` returned `204` and cleared every relationship. A following `GET` also
  returned `204`.
- An unknown workspace returns `400` `workspaceId: must exist or must refer to an
  existing resource`.

Writes were made on a scratch workspace only. Whether the v3 `related-workspaces`
list reflects a v1 write wasn't checked.
:::

## Pending setup tasks

`GET /{context}/v1/workspaces/{ws}:get-pending-configuration-tasks` returns
`204` when setup is complete, and otherwise the checklist Workspace Manager
shows:

```json
[
  { "type": 0, "nameKey": "admin.setup.home.workspacetab.warning.sections", "workspaceIds": [1300], "name": "Create sections in Item Details" },
  { "type": 1, "nameKey": "admin.setup.home.workspacetab.warning.fields", "workspaceIds": [1300], "name": "Create fields in Item Details" },
  { "type": 2, "nameKey": "admin.setup.home.workspacetab.warning.descriptors", "workspaceIds": [1300], "name": "Choose a descriptor" },
  { "type": 3, "nameKey": "admin.setup.home.workspacetab.warning.roles", "workspaceIds": [1300], "name": "Create roles and assign them to groups" },
  { "type": 4, "nameKey": "admin.setup.home.workspacetab.warning.workflow", "workspaceIds": [1300], "name": "Upload a workflow" }
]
```

Confirmed live 2026-11-13 on a fresh clone. A clone with grid fields also got a
warning that no role has Grid View permission. Use this after an automated
create or port to see what still needs doing.

## Categories

Categories group workspaces in the navigation.

:::tip[Confirmed live — 2026-11-13: create, update, and delete]
- **Create:** `POST { "name": "…" }` returned `201` with
  `displayOrder: null` and `icon: null`. `POST {}` lists only `name`.
  **Duplicate names are accepted.**
- **Update:** partial `PATCH` with `id` in the body. `{ "id", "name" }` renamed
  it, and `{ "id", "displayOrder": 99, "icon": { "icon": "/images/home/adminicon_24.png" } }`
  set both. Icon paths come from `GET /{context}/v1/category-icons`.
- **Delete:** `204`. **A category a workspace still uses can't be deleted:**
  `400` `categoryId: must not be referenced by any other resource`. Move or
  delete the workspace first. Unknown IDs return `404` "No category found with
  id …".
:::

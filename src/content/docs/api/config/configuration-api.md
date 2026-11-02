---
title: Configuration API (v1)
description: The undocumented plm360-ft v1 API behind the Fusion Manage admin UI. It creates, updates, and deletes workspaces, sections, item fields, and picklists. Confirmed live 2026-11-02.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->

Fusion Manage's admin UI now saves workspace configuration through a separate API
on the APS gateway, not the tenant host. It isn't in Autodesk's Postman collection
or developer docs. It was found in the browser's network tab while editing a
workspace description, then probed end to end against a live tenant.

What it gives an integration that v3 doesn't: **write access to configuration.**
A web app that needs a field can create it, instead of failing with "field X is
missing, ask your admin."

:::caution[Undocumented API]
Everything here was observed, not published. Autodesk can change or withdraw it
without notice. Probe for what you need at startup and degrade gracefully if it
404s, rather than assuming this page still describes production.
:::

## Base URL and tenant

```
https://api.aps.usa.autodesk.com/plm360-ft/v1/{resource}
```

The tenant is **not** in the host or the path. It goes in a header:

```
adsk-plm-tenant: ACMECORP
Authorization: Bearer {token}
Accept: application/json
```

:::tip[Confirmed live — 2026-11-02: how the tenant header behaves]
| Request | Result |
|---|---|
| Header omitted | `400` "The specified tenant is invalid" |
| Unknown tenant name | `400`, same message, and the body echoes `"tenant": "NOSUCHTENANT"` |
| Lowercase tenant name | `200`. The header is case-insensitive |

Response URNs always carry the uppercased tenant, for example
`urn:adsk.plm:tenant.workspace:ACMECORP.{ws}`.
:::

Only the `usa` regional host was tested. Whether an EMEA tenant answers on a
different regional host is unknown.

## Authentication

A 3-legged APS bearer token, the same kind the Fusion Manage web client already
holds. The token used in testing carried `data:read data:write data:create
data:search user:read`.

The same token also works against v3 on the tenant host
(`https://{tenant}.autodeskplm360.net/api/v3/...`), so one token covers both
surfaces. See [Authentication](/concepts/authentication/) for getting one.

:::caution[Attempted, inconclusive: who is allowed to write]
Testing used a **tenant administrator's** token, issued to the Fusion Manage web
client's own APS app. Two things remain unknown:

- Whether a token from **your own** APS app is accepted. Only the web client's
  token was tried.
- Whether a **non-admin** user is refused writes, and with what status.

Until those are tested, treat config writes as admin-only and check for a `403`.
:::

## Conventions

These apply to every resource below.

- **CORS is open.** `access-control-allow-origin: *` with `PATCH` and `DELETE`
  allowed, and `adsk-plm-tenant` is in the allowed-headers list. Browser apps can
  call it directly. `OPTIONS` is answered for CORS only and returns no `Allow`
  header, so it can't be used to discover methods.
- **`PATCH` needs the whole object.** A partial body such as
  `{"description": "..."}` returns `400` with `id must not be null`. Field `PATCH`
  similarly demands `workspace` and `fieldId`. `GET` the resource, change what you
  need, and send it all back. This is the opposite of v3's item `PATCH`.
- **Empty bodies are self-documenting.** `POST {}` returns every missing required
  field in one `400`. This is the fastest way to learn a payload shape. The
  required-field lists below were found this way.
- **Status codes:** create returns `201` with a `Location` header. Update returns
  `200` with the full object. Delete returns `204`.
- **No published spec.** `openapi.json`, `swagger.json`, `v3/api-docs`,
  `api-docs`, and `docs` all return `404`, both at the root and under `/v1`.

:::note[Windows PowerShell 5.1 misreports `204`]
`Invoke-WebRequest` in Windows PowerShell 5.1 throws on a `204 No Content` and
reports status `0`, even though the delete succeeded. Re-`GET` the resource, or
use `curl.exe` or PowerShell 7.
:::

### Error envelope

Validation and not-found errors use a new shape, so add this one to the
[existing list](/concepts/errors/):

```json
{
  "statusCode": 400,
  "title": "Bad Request",
  "detail": "Validation failed",
  "errors": [ { "field": "id", "message": "must not be null" } ],
  "time": "2026-11-02T22:26:20.735842806Z",
  "requestId": "f70686fd-…",
  "tenant": "ACMECORP"
}
```

A path that doesn't exist at all returns the APS gateway's envelope instead:
`{ "developerMessage": "The requested resource does not exist.", "moreInfo": "…", "errorCode": "" }`.
A few unknown paths return an empty `404` body. Don't parse the body to decide
whether a route exists.

### Pagination and filtering

Most lists return a wrapper:

```json
{ "pagination": { "totalResults": 126, "offset": 0, "limit": 3, "nextUrl": "/v1/workspaces?sort=id&offset=3&limit=3" }, "results": [ … ] }
```

`limit` defaults to `100`. `nextUrl` is present only when more pages exist, and it's
relative to `/plm360-ft`. Scope a list with `filter[path]=value`, for example
`filter[workspace.id]={ws}` or `filter[section.id]={sectionId}`.

Some metadata lists (`field-data-types`, `validators`, `categories`,
`category-icons`, `workspace-types`, and tabs) return a **bare array** with no
wrapper and ignore `limit`.

## Workspaces

| Purpose | Endpoint |
|---|---|
| List workspaces | `GET /plm360-ft/v1/workspaces?offset={n}&limit={n}` |
| Get a workspace | `GET /plm360-ft/v1/workspaces/{ws}` |
| Create a workspace | `POST /plm360-ft/v1/workspaces` |
| Update a workspace | `PATCH /plm360-ft/v1/workspaces/{ws}` |
| Delete a workspace | `DELETE /plm360-ft/v1/workspaces/{ws}` |

:::tip[Confirmed live — 2026-11-02: full create, update, and delete]
A scratch workspace was created (`201`), had a section and fields added, and was
deleted (`204`). A follow-up `GET` returned `404` "No workspace found with id …".
On a real workspace, a description `PATCH` returned `200` and was reverted.

**Delete cascades.** Deleting a workspace that still held two fields and a
section succeeded and removed them, even though the section itself couldn't be
deleted while those fields existed (see [Sections](#sections)).
:::

Create requires `name`, `systemName`, `type`, `category`, `controlled`,
`expireFromDashboardDays`, and `showOnlyLatestVersionForRelationships`:

```json
{
  "name": "Test Workspace",
  "systemName": "WS_TEST_WORKSPACE",
  "description": "",
  "type": { "id": 1 },
  "category": { "id": 12 },
  "displayOnDashboard": false,
  "expireFromDashboardDays": 99999,
  "controlled": false,
  "showOnlyLatestVersionForRelationships": false
}
```

`type.id` comes from `GET /plm360-ft/v1/workspace-types` (`1` is "Basic
Workspace"). `category.id` comes from `GET /plm360-ft/v1/categories`. A response
links to the workspace's other config collections:

```json
{
  "id": 1200,
  "name": "Test Workspace",
  "systemName": "WS_TEST_WORKSPACE",
  "displayOrder": null,
  "controlled": false,
  "type": { "id": 1, "urn": "…", "url": "/v1/workspace-types/1" },
  "category": { "id": 12, "urn": "…", "url": "/v1/categories/12" },
  "pendingConfigurationTasksUrl": "/v1/workspaces/1200:get-pending-configuration-tasks",
  "sectionsUrl": "/v1/sections?filter[workspace.id]=1200",
  "tabsUrl": "/v1/workspaces/1200/tabs",
  "itemFieldsUrl": "/v1/item-fields?filter[workspace.id]=1200",
  "gridFieldsUrl": "/v1/grid-fields?filter[workspace.id]=1200",
  "bomFieldsUrl": "/v1/bom-fields?filter[workspace.id]=1200",
  "linkedFieldsUrl": "/v1/linked-fields?filter[workspace.id]=1200",
  "sourcingFieldsUrl": "/v1/sourcing-fields?filter[workspace.id]=1200",
  "url": "/v1/workspaces/1200"
}
```

A new Basic workspace starts with **no sections and no fields**, but with its
default tabs already present.

## Sections

| Purpose | Endpoint |
|---|---|
| List a workspace's sections | `GET /plm360-ft/v1/sections?filter[workspace.id]={ws}` |
| Get a section | `GET /plm360-ft/v1/sections/{sectionId}` |
| Create a section | `POST /plm360-ft/v1/sections` |
| Update a section | `PATCH /plm360-ft/v1/sections/{sectionId}` |
| Delete a section | `DELETE /plm360-ft/v1/sections/{sectionId}` |

Create requires `name`, `workspace`, and `type`:

```json
{ "name": "Details", "workspace": { "id": 1200 }, "type": "FIELDCONTAINER", "displayOrder": 1, "collapse": false, "workflowLocking": false }
```

:::tip[Confirmed live — 2026-11-02]
Create returned `201`. A full-body `PATCH` (rename plus `collapse: true`) returned
`200`. `DELETE` on a section that still contains fields returns `400` with
`sectionId: must not be referenced by any other resource`. Delete or move its
fields first. Deleting an empty section wasn't tested, because the workspace
delete removed it.
:::

Only `FIELDCONTAINER` was seen and tested. Other section types (classification,
matrix) weren't tried.

## Item fields

| Purpose | Endpoint |
|---|---|
| List a workspace's fields | `GET /plm360-ft/v1/item-fields?filter[workspace.id]={ws}` |
| List a section's fields | `GET /plm360-ft/v1/item-fields?filter[section.id]={sectionId}` |
| Get a field | `GET /plm360-ft/v1/workspaces/{ws}/item-fields/{fieldId}` |
| Create a field | `POST /plm360-ft/v1/item-fields` |
| Update a field | `PATCH /plm360-ft/v1/workspaces/{ws}/item-fields/{fieldId}` |
| Delete a field | `DELETE /plm360-ft/v1/workspaces/{ws}/item-fields/{fieldId}` |

Two different path shapes, and neither works in the other's place: create and
list use the flat `/v1/item-fields` collection, and a single field lives under
its workspace. `GET /v1/workspaces/{ws}/item-fields` (no field ID),
`POST /v1/workspaces/{ws}/item-fields`, and `PATCH /v1/item-fields/{fieldId}` all
return `404`.

:::tip[Confirmed live — 2026-11-02: create, update, and delete]
Fields of type single-line text, float, checkbox, and picklist were created
(`201`). A field `PATCH` renamed one and added a `required` validator (`200`).
`DELETE` returned `204`, and a repeat `DELETE` returned `404`. New fields appeared
in v3 at once (`GET /api/v3/workspaces/{ws}/fields` on the tenant host listed them
with no delay).
:::

Create requires `workspace`, `fieldId`, `name`, `dataType`, `visible`,
`editable`, `matrix`, `matrixEnd`, `newline`, and `preview`. `section` places it.

```json
{
  "workspace": { "id": 1200 },
  "section": { "id": 2400 },
  "fieldId": "UNIT_COST",
  "name": "Unit cost",
  "dataType": { "id": 2 },
  "length": 7,
  "precision": 2,
  "displayLength": 9,
  "visible": "ALWAYS",
  "editable": "ALWAYS",
  "matrix": false,
  "matrixEnd": false,
  "newline": false,
  "preview": true,
  "validators": [ { "validator": { "id": "floatPrecision" }, "values": [] } ]
}
```

The server assigns `displayOrder`. A field `PATCH` sent without one came back
with a different value, so don't rely on the order you send.

### Implicit validators are required

Some data types require specific validators on the field. Omit them and create
fails with `validators: must include every validator implicit for the field's
data type`. The list isn't hardcoded anywhere you need to copy: every validator in
`GET /plm360-ft/v1/validators` carries `dataTypes[]`, each with an `implicit`
flag. Build the set from that. On the tenant tested, it came out as:

| Data type (id) | Implicit validator |
|---|---|
| Integer (1) | `integer` |
| Float (2) | `floatPrecision` |
| Date (3) | `date` |
| Money (5) | `money` |
| Paragraph (8), paragraph without line breaks (17) | `maxlength` |
| Checkbox (9) | `byte` |
| URL (16) | `url` |
| Email (18) | `email` |
| Filtered picklist (29) | `dropdownSelectionValidOrNone` |
| Long (30) | `long` |
| Extended money (31) | `moneyExtended` |
| Single-line text (4), picklist (20), and the rest | none |

A validator entry is `{ "validator": { "id": "…" }, "values": [] }`. Validators
that take a parameter list it in their `vars[]`. For example `maxlength` takes
`"values": [ { "varId": "maxlength", "value": "10000" } ]`.

Confirmed implicit-validator creates: float with `floatPrecision` and checkbox
with `byte`. The other rows come from the validator metadata and weren't created.

### Data types

`GET /plm360-ft/v1/field-data-types` returns 31 types. Each carries
`disabledItem`, `disabledGrid`, `disabledBom`, `disabledLinked`, and
`disabledSourcing`, which say where the type is allowed. For example auto-number
(11) is item-only. `GET /plm360-ft/v1/field-data-types/{id}` returns `404`, so
read the list.

| id | Type | id | Type |
|---|---|---|---|
| 1 | Integer | 17 | Paragraph without line breaks |
| 2 | Float | 18 | Email |
| 3 | Date | 19 | CSV |
| 4 | Single-line text | 20 | Picklist |
| 5 | Money | 21 | Flash |
| 6 | Picklist (first value default) | 22 | Linking picklist (latest version) |
| 7 | Linking picklist (first value default) | 23 | Linking picklist |
| 8 | Paragraph | 24 | Picklist (LRL) |
| 9 | Checkbox | 25 | Linking radio button |
| 10 | Radio button | 26 | Linking picklist (search filter) |
| 11 | Auto number | 27 | Linking multiselect |
| 12 | Read-only auto text | 28 | BOM UOM picklist |
| 13 | Multiselect | 29 | Filtered picklist |
| 14 | Picklist with filter | 30 | Long |
| 15 | Image | 31 | Extended money |
| 16 | URL | 32 | Derived |

Type names are inferred from each entry's `nameKey` (for example
`data.type.paragraph.no.line.breaks`). The API returns keys, not display names.

### Picklist fields

A picklist field also needs `displayLength` (create fails with `displayLength:
must not be null` otherwise), plus the picklist by system name:

```json
{ "dataType": { "id": 20 }, "displayLength": 30, "picklist": { "systemName": "CUSTOM_LOOKUP_DEPARTMENT" } }
```

Linking picklists (types 7, 22, 23, 25 to 27), derived fields, and formula fields
weren't tested.

## Picklists

| Purpose | Endpoint |
|---|---|
| List picklists | `GET /plm360-ft/v1/picklists?offset={n}&limit={n}` |
| Get a picklist | `GET /plm360-ft/v1/picklists/{systemName}` |
| Create a picklist | `POST /plm360-ft/v1/picklists` |
| Delete a picklist | `DELETE /plm360-ft/v1/picklists/{systemName}` |
| List values | `GET /plm360-ft/v1/picklists/{systemName}/values` |
| Add a value | `POST /plm360-ft/v1/picklists/{systemName}/values` |

Picklist create requires `systemName`, `name`, `type`, `filterByOwnership`,
`includeInactive`, and `includeDeleted`:

```json
{ "systemName": "CUSTOM_LOOKUP_DEPARTMENT", "name": "Department", "description": "", "type": "MANUAL", "filterByOwnership": false, "includeInactive": false, "includeDeleted": false }
```

Adding a value requires `value` and `picklist`:

```json
{ "value": "Receiving", "picklist": { "systemName": "CUSTOM_LOOKUP_DEPARTMENT" } }
```

:::tip[Confirmed live — 2026-11-02]
Picklist create returned `201`, each value add returned `201` with an
incrementing `id`, and the picklist appeared at once in v3 as
`GET /api/v3/lookups/{systemName}` with both values. `DELETE` on the picklist
returned `204` and removed its values with it.
:::

:::caution[Attempted, inconclusive: editing or removing a single value]
`PATCH /plm360-ft/v1/picklists/{systemName}/values/{id}` and
`DELETE /plm360-ft/v1/picklists/{systemName}/values/{id}` both return the gateway's
`404` "The requested resource does not exist", even for a value whose `url` field
points at exactly that path. The value-level write route may live elsewhere or
may not exist. Only `MANUAL` picklists were tried; workspace-backed picklists
(`workspace`, `reportId`) weren't.
:::

## Read-only and lightly tested collections

| Endpoint | What was observed |
|---|---|
| `GET /plm360-ft/v1/validators` | 45 validators with `vars[]` and per-type `implicit` flags. Bare array |
| `GET /plm360-ft/v1/field-data-types` | 31 types (see above). Bare array |
| `GET /plm360-ft/v1/workspace-types` | Workspace types with `allowWorkflow`. `/workspace-types/{id}` returns `404` despite being linked |
| `GET /plm360-ft/v1/categories` | Workspace categories with icons. `/categories/{id}` works |
| `GET /plm360-ft/v1/category-icons` | Icon catalogue |
| `GET /plm360-ft/v1/workspaces/{ws}/tabs` | Tabs with `key` and `displayOrder`. The per-tab `url` it returns gives `404` |
| `GET /plm360-ft/v1/workspaces/{ws}/relationships` | Relationship config, for example `"type": "BOM"` with `fromWorkspace`/`toWorkspace`. Writes not tried |
| `GET /plm360-ft/v1/grid-fields` | Grid field definitions across workspaces. Accepts `filter[workspace.id]` |
| `GET /plm360-ft/v1/linked-fields` | Linked field definitions |
| `GET /plm360-ft/v1/sourcing-fields` | Sourcing field definitions |
| `GET /plm360-ft/v1/reports` | Report definitions. Its `nextUrl` points at `/api/v4/reports`, a surface not yet explored |
| `GET /plm360-ft/v1/workspaces/{ws}:get-pending-configuration-tasks` | `204` when nothing is pending. `POST` returns `404`. What a pending task looks like is unknown |

`GET /plm360-ft/v1/bom-fields` without a filter returns `404`, even though every
workspace links to `bom-fields?filter[workspace.id]={ws}`. The filtered form
wasn't tried.

These guessed names all returned `404` under `/v1`: `workflows`,
`workflow-states`, `workflow-transitions`, `scripts`, `users`, `groups`, `roles`,
`permissions`, `views`, `units-of-measure`, `lookups`, `tenant`, `settings`,
`dashboards`, `notifications`, and, under a workspace, `workflow`, `scripts`,
`permissions`, and `sections`. Workflow, script, and permission configuration
isn't reachable here yet.

## Not yet tested

- Grid, BOM, linked, and sourcing field **writes**
- Derived, formula, and linking-picklist fields
- Changing a field's `dataType` or `fieldId` after creation, or a workspace's `systemName`
- Deleting an empty section on its own
- Tokens from a non-admin user or a third-party APS app (see [Authentication](#authentication))
- Regional hosts other than `usa`

See [Recipe: create a missing field](/recipes/create-a-missing-field/) for the
discovery-and-create flow this enables.

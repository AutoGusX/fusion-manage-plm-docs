---
title: "Recipe: create a missing field"
description: Instead of failing when a workspace lacks a field your app needs, detect it and offer to create it through the configuration API.
---

Apps built on Fusion Manage usually assume certain fields exist. When one doesn't,
the usual answer is an error asking the user to find an admin. The
[configuration API](/api/config/configuration-api/) makes a better answer
possible: detect the gap, show the user what's missing, and create it with their
consent.

:::note[Confirmed live — 2026-11-02, call by call]
Every call in this recipe returned the documented status against a live tenant.
The JavaScript below composes those calls but hasn't itself been run as one
program.
:::

```js
const CFG = 'https://api.aps.usa.autodesk.com/plm360-ft/v1';
const headers = (token, tenant) => ({
  Authorization: `Bearer ${token}`,
  'adsk-plm-tenant': tenant,
  Accept: 'application/json',
  'Content-Type': 'application/json',
});
```

## 1. Find the workspace by `systemName`

Numeric workspace IDs vary per tenant. Match on `systemName`:

```
GET /plm360-ft/v1/workspaces?offset=0&limit=100
```

Follow `pagination.nextUrl` until it's absent.

## 2. Check which required fields are missing

```
GET /plm360-ft/v1/item-fields?filter[workspace.id]={ws}
```

```js
const have = new Set(results.map((f) => f.fieldId));
const missing = REQUIRED_FIELDS.filter((f) => !have.has(f.fieldId));
```

If `missing` is empty, stop here. Otherwise show the user the list, with names and
types, and ask before changing anything. This is a tenant-wide configuration
change, not a record edit.

## 3. Pick or create a section

A field must belong to a section:

```
GET /plm360-ft/v1/sections?filter[workspace.id]={ws}
```

Reuse an existing `FIELDCONTAINER` section, or create one:

```
POST /plm360-ft/v1/sections
{ "name": "My App", "workspace": { "id": {ws} }, "type": "FIELDCONTAINER", "displayOrder": 99, "collapse": false, "workflowLocking": false }
```

## 4. Attach each data type's implicit validators

Create fails unless the field carries every validator that's implicit for its
data type. Read the list once and derive the map:

```
GET /plm360-ft/v1/validators
```

```js
const implicitByType = {};
for (const v of validators)
  for (const d of v.dataTypes)
    if (d.implicit) (implicitByType[d.dataType.id] ??= []).push(v.id);
```

## 5. Create the field

```
POST /plm360-ft/v1/item-fields
```

```js
await fetch(`${CFG}/item-fields`, {
  method: 'POST',
  headers: headers(token, tenant),
  body: JSON.stringify({
    workspace: { id: ws },
    section: { id: sectionId },
    fieldId: 'UNIT_COST',
    name: 'Unit cost',
    dataType: { id: 2 },
    length: 7,
    precision: 2,
    displayLength: 9,
    visible: 'ALWAYS',
    editable: 'ALWAYS',
    matrix: false,
    matrixEnd: false,
    newline: false,
    preview: true,
    validators: (implicitByType[2] ?? []).map((id) => ({ validator: { id }, values: [] })),
  }),
});
```

Expect `201`. On `400`, read `errors[]`: each entry names the offending `field`,
which is enough to show a useful message.

Picklist fields also need `displayLength` and `picklist: { "systemName": … }`. If
the picklist doesn't exist yet, create it and its values first. See
[Picklists](/api/config/configuration-api/#picklists).

## 6. Use it straight away

The field appears in v3 without delay, so the app can continue in the same
session and read or write the field through
`/api/v3/workspaces/{ws}/fields` and [item updates](/api/v3/items/) as usual.

## Things to handle

- **Permissions.** Writes were confirmed with a tenant administrator's token
  only. Offer the action, but expect a non-admin to be refused, and fall back to
  telling them which fields to ask an admin for.
- **Availability.** This API is undocumented. If the first call returns `404`,
  hide the offer and show the manual instructions.
- **Never overwrite.** Only create fields that are absent. A field `PATCH`
  replaces the whole definition, so editing an existing field the admin has
  tuned can silently undo their changes.

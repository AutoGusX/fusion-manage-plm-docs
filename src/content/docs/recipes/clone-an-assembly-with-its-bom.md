---
title: "Recipe: clone an assembly with its BOM"
description: There is no clone endpoint — build one from item create plus BOM rows, with the field-inclusion rules that decide whether it succeeds.
---

There is no clone endpoint. Cloning means: read the source item, decide which
fields may legally be carried over, create a fresh item, then rebuild the BOM
edges. This recipe is the sequence a production Chrome extension uses, and the
field rules are the part that decides whether it works.

## 1. Read the source

```
GET /api/v3/workspaces/{ws}/items/{sourceId}
```

Returns `sections[]`, each with a `link` and `fields[]`. Note the links are
**item-scoped** (`…/items/{sourceId}/views/1/sections/{id}`) — you'll have to
rewrite them in step 3.

## 2. Get real field metadata — not the copy embedded in the item

```
GET /api/v3/workspaces/{ws}/fields
```

:::caution[Use this endpoint, not the fields inside the item response]
The view-1 fields embedded in an item's detail response **don't carry**
`editability`, `derived`, `derivedFieldSource`, or validators. Only the
workspace-level `/fields` endpoint does. Deciding what to copy from the item's own
field list silently skips every rule below — a real bug that shipped in a
production client before it was caught.
:::

From this response, build three sets:

- **required** — fields whose validators include a `required` rule
- **derived** — `derived: true`, each with its `derivedFieldSource`
- **writable** — `editability !== 'NEVER'` and not a formula field

## 3. Decide what to include, and rewrite the links

Include a field only if it has a non-empty value **and** it is either required or
writable-and-selected. Then:

- **Skip system fields** (`isSystemField: true`) entirely.
- **A derived field may only be included if its `derivedFieldSource` is also
  included.** Otherwise omit it and let the server compute it — sending one
  without its source returns `error.derived.invalidDerivedFieldValue`.
- **Sending a non-editable field** returns `error.editable`.
- **Reduce each field to exactly `{ __self__, value }`.** The full object from
  `GET` is rejected.
- **Rewrite item-scoped links to workspace-scoped**, because create wants
  workspace-scoped:

```
…/workspaces/{ws}/items/{srcId}/views/{v}/sections/{id}  ->  …/workspaces/{ws}/sections/{id}
…/workspaces/{ws}/items/{srcId}/views/{v}/fields/{name}  ->  …/workspaces/{ws}/views/{v}/fields/{name}
```

Check required fields client-side before calling the API — a named
"missing required field X" beats a server rejection you have to decode.

## 4. Create the new item

```
POST /api/v3/workspaces/{ws}/items
```
```json
{
  "sections": [
    {
      "link": "/api/v3/workspaces/{ws}/sections/{sectionId}",
      "fields": [
        { "__self__": "/api/v3/workspaces/{ws}/views/1/fields/TITLE", "value": "Cloned assembly" }
      ]
    }
  ]
}
```

`201` with an **empty body** — the new item's URL is in the `Location` header.
Parse the id from there; there's nothing in the response to read
([Items](/api/v3/items/)).

To land it directly at a revision instead of as a working version, add top-level
`versionId`, `effectivity`, and `lifecycle: { title }`.

:::note[Classification is set-once]
If the workspace is classification-enabled and the clone needs a specific class,
set it **now**, right after create, while the item still carries the workspace
default. Once classified, every further change returns `500` — including reverting.
See [Classifications](/api/v2/classifications/).
:::

## 5. Rebuild the BOM

Read the source's BOM, then add one row per child:

```
GET  /api/v3/workspaces/{ws}/items/{sourceId}/bom-items?depth=1&revisionBias=release&viewDefId={bomViewId}&rootId={sourceId}
POST /api/v3/workspaces/{ws}/items/{newId}/bom-items
```
```json
{
  "quantity": 1,
  "item": { "link": "/api/v3/workspaces/{ws}/items/{childId}" },
  "isPinned": false
}
```

`201` per row, with the new row's URL in `Location`. Confirmed live: the minimal
body above is enough — only add `fields[]` for BOM-line attributes like a
reference designator, and note that BOM-row fields use
`{ "metaData": { "link": … }, "value": … }`, **not** the `{ __self__, value }`
shape used for item fields ([BOM](/api/v3/bom/)).

Find `bomViewId` via `GET /api/v3/workspaces/{ws}/views` rather than assuming a
number ([Views, Fields, and Tableaus](/api/v3/views-fields-tableaus/)).

## 6. Decide how deep to go

The above clones one level. For a deep clone, recurse — but decide deliberately
whether each child should be **shared** (point the new parent at the same child
item) or **copied** (clone the child too). Sharing is one `POST` per edge;
copying multiplies the whole recipe per node. Most real "clone assembly" features
share leaf parts and copy only sub-assemblies.

Stuck? [Troubleshooting](/concepts/troubleshooting/) indexes the errors above by
what you actually saw.

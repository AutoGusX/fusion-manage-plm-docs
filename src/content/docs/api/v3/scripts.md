---
title: Scripts
description: List and retrieve tenant custom scripts, and run a script against an item — a 100% v3 subsystem.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-orange-low);color:var(--sl-color-orange-high)">Derived from client source — not yet live-verified</span></p>
<!-- verification-badge:end -->

Sourced from a full grep of a production Fusion Manage API client (`plm.js`, BOM Builder Fork extension). No v1 or non-`/api/v3` scripts endpoints exist anywhere in that client — this subsystem is entirely v3.

| Operation | Endpoint |
|---|---|
| List scripts on a workspace | `GET /api/v3/workspaces/{wsId}/scripts` |
| List all scripts (tenant-wide) | `GET /api/v3/scripts` |
| Get a script's source | `GET {link}` — takes an arbitrary script detail link (e.g. a script's own `__self__`) rather than a fixed path template |
| Run a script on an item | `POST {itemLink}/scripts/{scriptId}` with body `{}`, where `itemLink` is `/api/v3/workspaces/{wsId}/items/{dmsId}`. Optionally follow with a `GET {itemLink}` to fetch the item's post-run state. |

:::note
**Confirmed live (2026-08-31):** `GET /api/v3/scripts`, `GET /api/v3/workspaces/{ws}/scripts`, and `GET /api/v3/scripts/{scriptId}` all return `200`.

Two things worth knowing:

- **`/api/v3/scripts/{id}` returns the source** in a `code` field, alongside `uniqueName`, `scriptType` (e.g. `ACTION`), and `version`. That's the whole export mechanism — list, then fetch each id.
- **A workspace-scoped script id resolves at the tenant-level detail endpoint.** An id discovered via `/workspaces/{ws}/scripts` was fetched successfully from `/api/v3/scripts/{id}`, so you don't need to keep track of which workspace a script came from to read it.

Running a script on an item was tested later; see below.
:::

:::tip[Confirmed live — 2026-11-23: running an on-demand script]
`POST /api/v3/workspaces/{ws}/items/{itemId}/scripts/{scriptId}` with body `{}`:

- **Success is `204` with an empty body.** The run is synchronous (about 0.4 s
  for a small script), so a failure comes back in the same response.
- **A script error is `400`** with `errorSource` (the script name),
  `errorMessage` (for example `ReferenceError: "window" is not defined.`),
  `lineNumber`, `columnNumber`, `timeStamp`, and a generic `message`. Show
  `errorMessage`; `message` only says there was a problem running a custom action.
- Only the **workspace** list (`GET /api/v3/workspaces/{ws}/scripts`) carries
  `scriptBehaviorType` (`ON_DEMAND`, `ON_CREATE`, `ON_EDIT`). The tenant-wide
  list doesn't, so use the workspace list to find what can be run on demand.
- A run that wrote nothing left no change log entry. It ran on a released
  revision.

Not tested: whether a non-admin user may run a script, and a script that writes
to a released revision.
:::

:::tip[Confirmed live — 2026-11-20: creating a script]
```json
POST /api/v3/scripts
{ "uniqueName": "MY_WF_ACTIONS", "displayName": "My workflow actions",
  "scriptType": "ACTION", "code": "…", "dependsOn": [] }
```

Returns `201` with a `Location` header ending in the new script ID.
**`dependsOn` is required, even when empty.** Without it the call returns `500`
"Unknown error". `scriptType` values created this way: `CONDITION`,
`VALIDATION`, and `ACTION`; all three were then linked to workflow transitions
and ran.

There is still no edit or delete. To change a workflow script by API, create a
**new** script (for example with a `_V2` name) and point the transitions at its
ID in the [workflow definition](/api/config/workflow-definitions/). This was
done on a workflow with records in progress, and the old script stays on the
tenant until someone removes it in the admin UI.
:::

:::caution[From the route map — 2026-11-17: scripts can be created, but not changed or deleted]
The tenant's [route map](/reference/route-map/) lists `POST /api/v3/scripts` and
`POST /api/v3/workspaces/{ws}/scripts` (`createScript`), and `OPTIONS` confirms
both. It has **no `PUT`, `PATCH`, or `DELETE`** for a script, and
`OPTIONS /api/v3/scripts/{id}` allows only `GET` and `POST` (`runScript`).

So a script created through the API can only be edited or removed in the admin
UI. Which workspace events run
a script (on create, on edit, on demand) is set on the admin UI's behaviors page,
which is browser-only (see [Admin UI coverage](/guides/admin-ui-coverage/)).
Workflow scripts are linked by ID in a
[workflow definition](/api/config/workflow-definitions/).
:::

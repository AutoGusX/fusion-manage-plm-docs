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

Running a script on an item (`POST {itemLink}/scripts/{scriptId}`) has **not** been live-tested — it executes tenant code with real side effects.
:::

:::caution[From the route map — 2026-11-17: scripts can be created, but not changed or deleted]
The tenant's [route map](/reference/route-map/) lists `POST /api/v3/scripts` and
`POST /api/v3/workspaces/{ws}/scripts` (`createScript`), and `OPTIONS` confirms
both. It has **no `PUT`, `PATCH`, or `DELETE`** for a script, and
`OPTIONS /api/v3/scripts/{id}` allows only `GET` and `POST` (`runScript`).

So a script created through the API can only be edited or removed in the admin
UI. `createScript` hasn't been tried for that reason. Which workspace events run
a script (on create, on edit, on demand) is set on the admin UI's behaviors page,
which is browser-only (see [Admin UI coverage](/guides/admin-ui-coverage/)).
Workflow scripts are linked by ID in a
[workflow definition](/api/config/workflow-definitions/).
:::

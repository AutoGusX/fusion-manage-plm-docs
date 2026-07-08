---
title: Scripts
description: List and retrieve tenant custom scripts, and run a script against an item — a 100% v3 subsystem.
---

Sourced from a full grep of a production Fusion Manage API client (`plm.js`, BOM Builder Fork extension). No v1 or non-`/api/v3` scripts endpoints exist anywhere in that client — this subsystem is entirely v3.

| Operation | Endpoint |
|---|---|
| List scripts on a workspace | `GET /api/v3/workspaces/{wsId}/scripts` |
| List all scripts (tenant-wide) | `GET /api/v3/scripts` |
| Get a script's source | `GET {link}` — takes an arbitrary script detail link (e.g. a script's own `__self__`) rather than a fixed path template |
| Run a script on an item | `POST {itemLink}/scripts/{scriptId}` with body `{}`, where `itemLink` is `/api/v3/workspaces/{wsId}/items/{dmsId}`. Optionally follow with a `GET {itemLink}` to fetch the item's post-run state. |

:::note
None of the endpoints on this page have been independently live-verified against a tenant yet — they're transcribed from production client code, not yet re-checked. Treat them as high-confidence but unverified.
:::

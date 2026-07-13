---
title: Scripting
description: Enumerate a workspace's or tenant's custom scripts and pull their source.
---

Full endpoint reference lives in `api/v3/scripts`. This subsystem is 100% v3 — no v1 fallback exists for any of it.

## 1. List scripts

```
GET /api/v3/workspaces/{ws}/scripts   (scripts attached to one workspace)
GET /api/v3/scripts                   (every script in the tenant)
```

Each entry includes `uniqueName`, `scriptType` (e.g. `ACTION`), and — for workspace-scoped scripts — `scriptBehaviorType` (e.g. `ON_CREATE`, `ON_EDIT`) telling you when it fires. Scripts can `dependsOn` other scripts (shared libraries) — check that array if you're trying to export a script and need its dependencies too.

## 2. Get a script's source

```
GET /api/v3/scripts/{scriptId}
```
Response includes a `code` field with the actual script source — this is how you'd build an export/backup tool: list scripts (step 1), then fetch each one's source individually.

## 3. Run a script against an item

```
POST {itemLink}/scripts/{scriptId}
Body: {}
```
Where `itemLink` is `/api/v3/workspaces/{ws}/items/{itemId}`. Optionally follow with a `GET {itemLink}` afterward to see the item's post-run state, since running a script is typically done to trigger a side effect (field computation, validation, external call) rather than to get useful data back from the run call itself.

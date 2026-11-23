---
title: Scripting
description: Enumerate a workspace's or tenant's custom scripts and pull their source.
---

Full endpoint reference lives in [Scripts](/api/v3/scripts/). This subsystem is 100% v3 — no v1 fallback exists for any of it.

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

Confirmed live 2026-11-23: success is `204` with an empty body, and a script error is a `400` that carries the script's own `errorMessage` and `lineNumber`. See [Scripts](/api/v3/scripts/).

## 4. Create a script

```
POST /api/v3/scripts
Body: { "uniqueName": "…", "displayName": "…", "scriptType": "ACTION", "code": "…", "dependsOn": [] }
```
`dependsOn` is required even when empty. There is no edit or delete by API, so to change a workflow script, create a new one and relink the transitions in the [workflow definition](/api/config/workflow-definitions/).

## 5. Script idioms confirmed while building workflows by API

Confirmed live 2026-11-20 and 2026-11-23, in workflow condition, validation, and action scripts:

- `item.LINK_FIELD.OTHER_FIELD` reads a field on the record a linking picklist points at. Useful for a template record that holds rules for the workflow.
- `item.project.children[i].item` gives each record on the Project Management tab; `.descriptor.descriptor` is its title and `.descriptor.workflowState` its current state. A validation script can use this to block a gate while a child record is still open.
- `createItem('WS_SYSTEM_NAME')` creates a record in another workspace; set its fields, then `item.project.addTask(newItem)` puts it on the current record's Project Management tab. Run from a workflow action, the new records were there when the transition returned.
- Scripts can write fields that users can never edit, which makes them a good place for values users must not type (dates stamped at a gate, values copied from a template).
- `customTransID` holds the transition's custom ID, so one script per type can serve a whole workflow with a `switch`.


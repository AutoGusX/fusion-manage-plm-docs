---
title: Change Orders and Workflow
description: A Change Order lifecycle walkthrough — finding affected items, checking status, and performing a workflow transition.
---

Full endpoint reference lives in `api/v3/relationships-and-affected-items` (Managed Items / `views/11`) and `api/v3/workflow` (transitions) — this page walks through the common sequence.

## 1. Find a Change Order

Either search directly:
```
GET /api/v3/search-results?query=ITEM_DETAILS:TITLE=*your search*&revision=1
```
or, if you already have an item and want the COs affecting it, use `views/2` on the item itself (item → CO direction — see `api/v3/relationships-and-affected-items` for how this direction was confirmed):
```
GET /api/v3/workspaces/{itemWs}/items/{itemId}/views/2
```

## 2. See what a CO affects (Managed Items tab)

```
GET /api/v3/workspaces/{coWs}/items/{coId}/views/11
```
Returns `affectedItems[]`, each pointing to a real item elsewhere in the tenant. This is the CO → item direction (the opposite of step 1's `views/2`) — see `api/v3/relationships-and-affected-items` for the full confirmed-direction detail; don't mix the two up.

## 3. Add an item to the CO's affected-items list

```
POST /api/v3/workspaces/{coWs}/items/{coId}/affected-items
```
Body is a raw array of item links (not nested under `views/11`, despite the read/update/remove calls being there):
```json
["/api/v3/workspaces/{itemWs}/items/{itemId}"]
```

## 4. Check current status and available transitions

```
GET /api/v3/workspaces/{coWs}/items/{coId}                              (current state is a field on the item itself)
GET /api/v3/workspaces/{coWs}/items/{coId}/workflows/{workflowId}/transitions   (what you can do from here)
```

## 5. Perform a transition

```
POST /api/v3/workspaces/{coWs}/items/{coId}/workflows/{workflowId}/transitions
```
With a `content-location` header pointing at the specific transition being performed. See `api/v3/workflow` — this is transcribed from Autodesk's official documentation and not yet independently live-tested, since exercising it mutates the CO's real workflow state.

Don't confuse this with a **lifecycle** transition (revision/release state, a separate v1 XML-bodied endpoint — see `api/v3/items`). Workflow transitions move a CO through its approval steps; lifecycle transitions move an *item* between release states.

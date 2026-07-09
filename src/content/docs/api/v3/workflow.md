---
title: Workflow
description: Workspace-level and item-level workflow states/transitions/history on v3 — confirmed from Autodesk's official Postman collection. Distinct from lifecycle transitions.
---

Not to be confused with **lifecycle transitions** (revision/release state, v1, XML-bodied — see `api/v3/items`). Workflow transitions move an item along its configured workflow steps.

## Workspace-level (definitions)

| Purpose | Endpoint |
|---|---|
| All states in a workspace's workflow | `GET /api/v3/workspaces/{ws}/workflows/{workflowId}/states` |
| All transitions in a workspace's workflow | `GET /api/v3/workspaces/{ws}/workflows/{workflowId}/transitions` |

`workflowId` is `1` in every example seen so far — likely a per-workspace constant (each workspace has one workflow, workflow-scoped IDs like states/transitions are what actually vary), but not confirmed as universally `1`.

## Item-level

| Purpose | Endpoint |
|---|---|
| Current workflow status | Just `GET` the item itself (`/api/v3/workspaces/{ws}/items/{itemId}`) — there's no separate "workflow status" endpoint; state is a field on the item response. |
| Transitions available right now on this item | `GET /api/v3/workspaces/{ws}/items/{itemId}/workflows/{workflowId}/transitions` |
| Workflow history | `GET /api/v3/workspaces/{ws}/items/{itemId}/workflows/{workflowId}/history` |
| Perform a transition | `POST /api/v3/workspaces/{ws}/items/{itemId}/workflows/{workflowId}/transitions`, with a `content-location` header pointing at the specific transition being performed (`/api/v3/workspaces/{ws}/workflows/{workflowId}/transitions/{transitionId}`) |

:::caution[Needs live verification]
The 403-as-"not enabled"-not-error pattern (see `concepts/errors`) was observed on a v1-style workflow-history call in an older client; it hasn't been re-confirmed against the v3 `workflows/{id}/history` endpoint shown above. Confirm before assuming the same graceful-degradation behavior applies here.
:::

:::caution[Needs live verification]
The exact `content-location` header value and whether it's required (vs. the transition ID being derivable from the body alone) hasn't been independently tested — transcribed from Autodesk's official Postman collection, not yet re-verified.
:::

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

:::tip[Confirmed live — 2026-07-13]
`GET /api/v3/workspaces/{ws}/workflows/1/transitions` returns `200` with a real array of transition definitions (`name`, `customLabel`, `fromState`, `sendEmail`, etc.) against a real Change Orders workspace.
:::

## Item-level

| Purpose | Endpoint |
|---|---|
| Current workflow status | Just `GET` the item itself (`/api/v3/workspaces/{ws}/items/{itemId}`) — there's no separate "workflow status" endpoint; state is a field on the item response. |
| Transitions available right now on this item | `GET /api/v3/workspaces/{ws}/items/{itemId}/workflows/{workflowId}/transitions` |
| Workflow history | `GET /api/v3/workspaces/{ws}/items/{itemId}/workflows/{workflowId}/history` |
| Perform a transition | `POST /api/v3/workspaces/{ws}/items/{itemId}/workflows/{workflowId}/transitions`, with a `content-location` header pointing at the specific transition being performed (`/api/v3/workspaces/{ws}/workflows/{workflowId}/transitions/{transitionId}`) |

:::tip[Confirmed live — 2026-07-13]
Both read endpoints confirmed live against a real Change Order: `GET .../workflows/1/transitions` returns `200` with the transitions available right now on that specific item (a subset of the workspace-level list, reflecting the item's current state), and `GET .../workflows/1/history` returns `200` with a `history[]` array of past transitions, each with `user`, `created` timestamp, and the transition performed.
:::

## Performing a transition — confirmed live

:::tip[Confirmed live end-to-end — 2026-07-13]
Performed a real transition on a real Change Order (moved it from "Preparation" to "Change Control Board Review," then back). Key confirmed findings:

- **A successful transition returns `303 See Other`** — not `200`, `201`, or `204` as might be assumed from the rest of this API.
- The `content-location` header pointing at the specific transition (`/api/v3/workspaces/{ws}/workflows/{workflowId}/transitions/{transitionId}`) **is required** — this is the correct, working pattern.
- **Transitions can carry business-rule preconditions**, surfaced as a `400` with a human-readable message rather than a generic validation error, e.g. `"Change tasks must be defined in Tasks Planning tab first"`. The item's state is left unchanged when this happens — safe to retry a different transition.
- **Some transitions require a comment.** The precondition error names it explicitly (`"Comment required for Return / Reject transition"`), but the required body field is `{ "comment": "..." }` — **singular**, not `comments` or `workflowComments` (both returned the same 400 until the singular form was tried). Don't assume the v1 workflow endpoint's `workflowComments` field name carries over to v3.

```
POST /api/v3/workspaces/{ws}/items/{itemId}/workflows/{workflowId}/transitions
Header: content-location: /api/v3/workspaces/{ws}/workflows/{workflowId}/transitions/{transitionId}
Body: {}                              (most transitions)
Body: { "comment": "..." }            (transitions that require one)
```
:::

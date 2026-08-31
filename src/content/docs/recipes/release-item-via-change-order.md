---
title: "Recipe: release an item through a change order"
description: The canonical PLM flow end to end — find the change order, add the affected item, drive the workflow, and confirm the release actually happened.
---

The flagship Fusion Manage flow, and the one that spans the most pages: a change
order carries an item to a released revision. Each step below links to its
reference page; the value here is the order, and the places it bites.

**Prerequisites:** a bearer token and the tenant subdomain
([Authentication](/concepts/authentication/)), plus the workspace IDs for your
Items and Change Orders workspaces — look them up by `systemName` rather than
hardcoding numbers, since they differ per tenant
([Workspaces](/api/v3/workspaces/)).

## 1. Find the change order

```
GET /api/v3/search-results?query=ITEM_DETAILS:TITLE=*CO-00123*&revision=1&limit=10&offset=0&page=1
```

A query with no matches returns **`204` and an empty body** — no `items[]`, no
`totalCount`. Treat that as zero results, not an error
([Search](/api/v3/search/)).

Going the other direction — "which change orders already affect this item?" — is
`views/2` on the *item*:

```
GET /api/v3/workspaces/{itemWs}/items/{itemId}/views/2
```

## 2. Check the CO's current state and legal next moves

```
GET /api/v3/workspaces/{coWs}/items/{coId}
GET /api/v3/workspaces/{coWs}/items/{coId}/workflows/1/transitions
```

The first gives `currentState`; there is no separate status endpoint. The second
lists only the transitions legal *right now*, which is a subset of the
workspace-wide list — always read it rather than caching transition IDs, because
which ones apply changes as the CO moves ([Workflow](/api/v3/workflow/)).

## 3. Add the item to the CO's affected items

```
POST /api/v3/workspaces/{coWs}/items/{coId}/affected-items
Accept: application/vnd.autodesk.plm.affected.items.bulk+json
```
```json
["https://{tenant}.autodeskplm360.net/api/v3/workspaces/{itemWs}/items/{itemId}"]
```

:::caution
Two things trip this up, both confirmed the hard way:

- The array needs **fully-qualified absolute URLs**. Relative paths — which is
  what Autodesk's own example shows — return
  `400 GEN_INVALID_INPUT_SCHEMA "Incorrect payload"`.
- The add path is `…/items/{coId}/affected-items`, but read/update/remove live
  under `…/items/{coId}/views/11/affected-items/{itemId}`. The inconsistency is
  real, not a typo.
:::

Confirm it landed with `GET …/items/{coId}/views/11`
([Relationships and Affected Items](/api/v3/relationships-and-affected-items/)).

## 4. Set each affected item's target transition

This is the step that makes the CO actually *do* something on release — it says
what should happen to the item when the CO completes.

```
PUT /api/v3/workspaces/{coWs}/items/{coId}/views/11/affected-items/{itemId}
```
```json
{
  "linkedFields": [
    { "__self__": "/api/v3/workspaces/{coWs}/views/11/fields/{fieldId}", "value": "…" }
  ],
  "targetTransition": { "link": "/api/v3/workflows/{workflowId}/transitions/{transitionId}" }
}
```

Discover valid field IDs from `GET …/views/11/fields`. `{ "linkedFields": [] }` is
accepted if you only need the transition.

## 5. Drive the CO through its workflow

```
POST /api/v3/workspaces/{coWs}/items/{coId}/workflows/1/transitions
content-location: /api/v3/workspaces/{coWs}/workflows/1/transitions/{transitionId}
```
```json
{}
```

:::tip[The three things that surprise people here]
- **Success is `303`**, not `2xx`. Don't treat it as a redirect to follow or as a
  failure.
- Some transitions **require a comment**, and the field is `comment` — singular.
  `comments` and `workflowComments` both fail with the same
  "Comment required…" message, which makes it look like the comment isn't being
  read at all.
- Transitions can carry **business preconditions** surfaced as a plain-English
  `400` (e.g. *"Change tasks must be defined in Tasks Planning tab first"*). The
  CO's state is unchanged when that happens, so it's safe to try a different
  transition.
:::

Repeat step 2 after each transition — the legal set changes as you go.

## 6. Confirm the item actually released

Don't infer the outcome from the CO's state. Re-read the *item*:

```
GET /api/v3/workspaces/{itemWs}/items/{itemId}
```

Check `version` / `versionId` — a working item reads `[REV:w]`, a released one
carries a revision like `[REV:1]` or `[REV:A]`.

If the item didn't move, the release is a **lifecycle** transition, which is a
different mechanism from the workflow transition in step 5 — see
[Items](/api/v3/items/). You can drive one directly if needed:

```
GET  /api/rest/v1/workspaces/{itemWs}/items/{itemId}/lifecycles/transitions
PUT  /api/rest/v1/workspaces/{itemWs}/items/{itemId}/lifecycles/transitions/{tid}
Content-Type: application/xml

<dmsVersionItem><release>A</release></dmsVersionItem>
```

The `GET` returns `{"list": null}` when there is no legal move — check it first,
or you get a bare `409`. And this endpoint returns an **HTML** error page on a
malformed body, so don't assume JSON when parsing failures.

## Audit trail

```
GET /api/v3/workspaces/{coWs}/items/{coId}/workflows/1/history
GET /api/v3/workspaces/{itemWs}/items/{itemId}/logs?offset=0&limit=100&desc=timeStamp
```

The first is who moved the CO and when; the second is every field change on the
item. Both are useful for demonstrating traceability.

Stuck? [Troubleshooting](/concepts/troubleshooting/) indexes these errors by what
you actually saw.

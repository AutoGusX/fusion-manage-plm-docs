---
title: Webhooks
description: Register callbacks for item/workflow events — a separate APS Webhooks API, not a Fusion Manage endpoint, discovered via Autodesk's official Postman collection.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-blue-low);color:var(--sl-color-blue-high)">From Autodesk's official collection — not yet live-verified</span></p>
<!-- verification-badge:end -->

:::note[Different base URL — this is not `{tenant}.autodeskplm360.net`]
Webhooks are a general Autodesk Platform Services (APS) capability, not Fusion-Manage-specific. Every call here goes to `developer.api.autodesk.com`, not the tenant's PLM host, and the tenant is passed as an `X-Tenant` header rather than being part of the URL.
:::

```
Base: https://developer.api.autodesk.com/webhooks/v1/systems/adsk.flc.production/events/{eventType}/hooks
```

:::tip[Confirmed live — 2026-08-31: five events exist, not the three in the official collection]
Autodesk's Postman collection documents `item.create`, `item.update`, and
`workflow.transition`. Probing event names directly (a `GET` on a valid event's
hook list returns `200`; an unknown one returns `404`) found **two more that are
not in the collection**:

| Event | |
|---|---|
| `item.create` | ✅ in the official collection |
| `item.update` | ✅ in the official collection |
| `workflow.transition` | ✅ in the official collection |
| **`item.release`** | ✅ exists — **not** in the official collection |
| **`item.clone`** | ✅ exists — **not** in the official collection |

`item.release` is the interesting one: it's the hook you actually want for "tell
my ERP when something is released", and it would be easy to conclude it doesn't
exist from the official docs alone.

Confirmed **not** to exist (all `404`): `item.delete`, `attachment.create`,
`attachment.update`, `bom.update`, `relationship.create`, `user.create`. There is
no discovery endpoint — `GET /events` returns `404` — so this list was built by
probing and may still be incomplete.
:::

| Operation | Endpoint |
|---|---|
| List hooks for an event | `GET .../events/{eventType}/hooks` |
| Create a hook | `POST .../events/{eventType}/hooks`, header `X-Tenant: {TENANT_UPPERCASE}` |
| Delete a hook | `DELETE .../events/{eventType}/hooks/{hookId}` |

**Create body** — scope narrows the hook to a workspace (for `item.*` events) or a specific workflow transition (for `workflow.transition`):
```json
{
  "callbackUrl": "https://your-callback-endpoint/...",
  "scope": { "workspace": "urn:adsk.plm:tenant.workspace:{TENANT}.{workspaceId}" }
}
```
```json
{
  "callbackUrl": "https://your-callback-endpoint/...",
  "scope": { "workflow.transition": "urn:adsk.plm:tenant.workspace.workflow.transition:{TENANT}.{workspaceId}.1.{transitionId}" }
}
```

A confirmed live hook object (from the collection's saved example) looks like:
```json
{
  "hookId": "...",
  "tenant": "...",
  "callbackUrl": "...",
  "event": "item.create",
  "status": "active",
  "scope": { "workspace": "urn:adsk.plm:tenant.workspace:{TENANT}.82" },
  "autoReactivateHook": false
}
```

The list response wraps hooks in `{ "links": { "next": … }, "data": [ … ] }` —
confirmed live, including that `data` is `[]` (not absent) when no hooks exist,
and that `links.next` is `null` rather than omitted on a single page.

:::caution[Hook creation was deliberately not tested]
Reads were verified live; **`POST` and `DELETE` were not**. Creating a hook —
even briefly — makes the tenant start POSTing real item and workflow events to
whatever `callbackUrl` you name. On a tenant carrying live product data that is
data egress to a third party, and there's no callback endpoint here that could
receive it safely. The create/delete shapes above therefore remain as documented
by Autodesk, not as observed.

Still unverified, and worth knowing before you depend on it: whether `status`
flips to inactive after repeated callback failures (the `autoReactivateHook` field
implies some auto-disable/retry behaviour), and what the delivered payload
actually looks like.
:::

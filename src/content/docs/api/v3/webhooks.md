---
title: Webhooks
description: Register callbacks for item/workflow events — a separate APS Webhooks API, not a Fusion Manage endpoint, discovered via Autodesk's official Postman collection.
---

:::note[Different base URL — this is not `{tenant}.autodeskplm360.net`]
Webhooks are a general Autodesk Platform Services (APS) capability, not Fusion-Manage-specific. Every call here goes to `developer.api.autodesk.com`, not the tenant's PLM host, and the tenant is passed as an `X-Tenant` header rather than being part of the URL.
:::

```
Base: https://developer.api.autodesk.com/webhooks/v1/systems/adsk.flc.production/events/{eventType}/hooks
```

Confirmed events (from Autodesk's official Postman collection): `item.create`, `item.update`, `workflow.transition`. There are likely more (`item.delete`? other lifecycle/workflow events?) — not enumerated here, only what's confirmed.

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

Not independently live-tested in this pass — transcribed from Autodesk's official Postman collection only. Untested and worth checking before relying on it: whether `status` can flip to inactive on repeated callback failures (the `autoReactivateHook` field suggests some kind of auto-disable/retry behavior exists).

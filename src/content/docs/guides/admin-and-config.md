---
title: Admin and Config
description: Common admin tasks — impersonating a user, looking up a workspace by its stable name, auditing config changes, and managing group access.
---

Full endpoint reference lives in `api/v3/admin-impersonation`, `api/v3/users-groups-roles`, and `api/v3/workspaces`.

## 1. Look up a workspace without hardcoding its ID

Numeric workspace IDs vary per tenant — a workspace's `systemName` (e.g. `WS_CHANGE_ORDERS`, `WS_ITEMS_AND_BOMS_2`) doesn't:
```
GET /api/v3/workspaces?offset=0&limit=200
```
Filter the response by `systemName` client-side rather than assuming a numeric ID transfers between tenants — this matters for any tooling meant to run against more than one tenant.

## 2. Act as another user (admin impersonation)

Get an app-level token via the separate 2-legged client-credentials flow, then combine it with an `X-User-Id` header — see `api/v3/admin-impersonation` for the full flow and its caveats. Don't use your own session-derived token for this; it's a fundamentally different credential type.

## 3. Disable a user

```
PATCH /api/v3/users/{userId}
Content-Type: application/json-patch+json

[{ "op": "replace", "path": "/userStatus", "value": "Deleted" }]
```

## 4. Manage group workspace access

```
GET /api/v3/groups/{groupId}/workspaces               (see each entry's permissions[] array)
DELETE /api/v3/groups/{groupId}/workspaces/{workspaceId}   (revoke)
```

## 5. Audit configuration changes and system activity

```
GET /api/v3/tenants/{TENANT_UPPERCASE}/setup-logs?offset=0&limit=10     (config/setup changes)
GET /api/v3/tenants/{TENANT_UPPERCASE}/system-logs?offset=0&limit=250   (general activity, optionally &type=item)
```
Both are the only endpoints in this API that path-scope by the uppercased tenant name as a URL segment rather than just using the tenant subdomain as host — easy to get wrong if you're pattern-matching from other endpoints.

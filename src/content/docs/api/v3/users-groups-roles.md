---
title: Users, Groups, and Roles
description: User, group, and role lookups, the current-user (@me) pattern, and a documented v1/v3 inconsistency in the assign/unassign group pair.
---

Sourced from a full grep of a production Fusion Manage API client (`plm.js`, BOM Builder Fork extension).

## Current user

```
GET /api/v3/users/@me
```

This single endpoint serves double duty in the source client: it's used both as "get my profile" and as "get my assigned groups" (by reading `.groups` off the same response) — there is no separate dedicated groups-assigned endpoint.

## Users and groups

| Operation | Endpoint |
|---|---|
| List users | `GET /api/v3/users?sort=displayName&activeOnly={bool}&mappedOnly={bool}&offset={n}&limit={n}` — defaults `limit=1000`, `activeOnly=false`, `mappedOnly=false`. Pass header `Accept: application/vnd.autodesk.plm.users.bulk+json` for the bulk response variant (used by default in the source client). |
| List groups | `GET /api/v3/groups?offset={n}&limit={n}` — default `limit=100`. Same bulk-header pattern: `Accept: application/vnd.autodesk.plm.groups.bulk+json`. |
| Add a user | `POST /api/v3/users` with body `{ "email": "...", "thumbnailPref": "Yes", "uomPref": "Metric", "timezone": "Etc/GMT+1", "licenseType": { "licenseCode": "S" } }` (`licenseCode` `"S"` = Professional, `"P"` = Participant). New user ID is parsed from the `Location` response header, not the body. |
| Assign groups to a user | `POST /api/v3/users/{userId}/groups` with a raw array body of group references |
| Unassign a group from a user | `DELETE /api/rest/v1/users/{userId}/groups/{groupId}` |

:::caution
`unassignGroup` uses the **v1** path while its counterpart `assignGroups` uses **v3** — a real inconsistency within the same assign/unassign pair in the source client, not a typo. Confirm both independently before assuming symmetry.
:::

## Roles and permissions

| Operation | Endpoint |
|---|---|
| List roles | `GET /api/rest/v1/roles` — v1-only, no v3 equivalent exists in the source client (its own code comments explicitly flag this as "(V1)") |
| Get permissions definition | `GET /api/rest/v1/permissions` — also explicitly v1-only |
| Get current-user permissions on a workspace or item | `GET /api/v3/workspaces/{wsId}/users/@me/permissions` or `GET /api/v3/workspaces/{wsId}/items/{dmsId}/users/@me/permissions` |

## System logs (admin)

```
GET /api/v3/tenants/{TENANT_UPPERCASE}/system-logs?offset={n}&limit={n}[&type=item]
```

Worth calling out separately: this is the only endpoint in this entire cluster that path-scopes by the **uppercased tenant name** as a URL segment, rather than just using the tenant subdomain as the host. Every other v3 call in this group is a plain `/api/v3/{resource}` path off the tenant host.

:::note
None of the endpoints on this page have been independently live-verified against a tenant yet — they're transcribed from production client code, not yet re-checked. Treat them as high-confidence but unverified.
:::

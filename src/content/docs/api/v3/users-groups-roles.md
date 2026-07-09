---
title: Users, Groups, and Roles
description: User, group, and role management on v3 — confirmed live and cross-checked against Autodesk's official Postman collection, including a corrected v3-roles claim.
---

## Current user

```
GET /api/v3/users/@me
```

Serves double duty: it's "get my profile," and (per one production client) also "get my assigned groups" by reading `.groups` off the same response — there's no separate dedicated groups-assigned endpoint.

## Users

| Operation | Endpoint |
|---|---|
| List users | `GET /api/v3/users?sort=displayName&activeOnly={bool}&mappedOnly={bool}&offset={n}&limit={n}` — `Accept: application/vnd.autodesk.plm.users.bulk+json` for the bulk variant |
| Get a single user by login name | `GET /api/v3/users?filter[loginName]={loginName}` |
| Get a single user (v1) | `GET /api/rest/v1/users/{userId}` |
| Add a user | `POST /api/v3/users` — see body note below |
| Assign groups to a user | `POST /api/v3/users/{userId}/groups` — body is a **raw array of group URN strings**, e.g. `["urn:adsk.plm:tenant.group:{TENANT}.145"]` (confirmed by Autodesk's official example — a production client instead sent an array of group objects; if one shape fails, try the other) |
| Disable a user | `PATCH /api/v3/users/{userId}`, `Content-Type: application/json-patch+json`, JSON-Patch body: `[{ "op": "replace", "path": "/userStatus", "value": "Deleted" }]` |
| Unassign a group from a user | `DELETE /api/rest/v1/users/{userId}/groups/{groupId}` |

:::caution
`unassignGroup` uses the **v1** path while `assignGroups` uses **v3** — a real inconsistency within the same assign/unassign pair, confirmed independently in both a production client and Autodesk's own official Postman collection (its "Remove User From Group" call also hits `DELETE /api/rest/v1/users/{userId}/groups/{groupId}`). Not a typo — don't assume v3 symmetry here.
:::

**Add User body** — Autodesk's official example omits `licenseType` entirely and adds `notifyUser`:
```json
{
  "email": "person@example.com",
  "thumbnailPref": "Yes",
  "uomPref": "Metric",
  "timezone": "Etc/GMT+1",
  "notifyUser": false
}
```
A commented-out line in the same official example notes `licenseType: { licenseCode }` (`"S"` = Professional, `"P"` = Participant) should **only** be used for trial/demo environments — omit it for normal tenants and let the default license apply. New user ID is parsed from the `Location` response header, not the response body.

## Groups

| Operation | Endpoint |
|---|---|
| List all groups | `GET /api/v3/groups?offset={n}&limit={n}` — `Accept: application/vnd.autodesk.plm.groups.bulk+json` |
| Get group details | `GET /api/v3/groups/{groupId}` |
| Get a group's users | `GET /api/v3/groups/{groupId}/users` |
| Get a group's workspace access | `GET /api/v3/groups/{groupId}/workspaces` (each entry includes a `permissions` array, e.g. `["Update","Delete","Create","Read"]`) |
| Remove a group's access to a workspace | `DELETE /api/v3/groups/{groupId}/workspaces/{workspaceId}` |

## Roles and permissions

:::tip[Correction, confirmed live — 2026-07-09]
An earlier pass claimed role listing was v1-only, based on one production client that happened to only call the v1 path. That was wrong: **`GET /api/v3/roles?offset={n}&limit={n}` exists and is confirmed live** against a real tenant (`200`, standard paginated envelope). Use v3 for roles; don't assume v1-only just because one client never called the v3 form.
:::

| Operation | Endpoint |
|---|---|
| List roles | `GET /api/v3/roles?offset={n}&limit={n}` — confirmed live |
| Get permissions definition | `GET /api/rest/v1/permissions` — v1, not yet found on v3 |
| Get current-user permissions on a workspace or item | `GET /api/v3/workspaces/{wsId}/users/@me/permissions` or `GET /api/v3/workspaces/{wsId}/items/{dmsId}/users/@me/permissions` |

## Logs (admin)

Both confirmed from Autodesk's official Postman collection, both path-scoped by the **uppercased tenant name** as a URL segment — the only place in this API that does that instead of just using the tenant subdomain as the host:

| Operation | Endpoint |
|---|---|
| System log entries | `GET /api/v3/tenants/{TENANT_UPPERCASE}/system-logs?offset={n}&limit={n}[&type=item]` |
| Setup/config-change log entries | `GET /api/v3/tenants/{TENANT_UPPERCASE}/setup-logs?offset={n}&limit={n}` |

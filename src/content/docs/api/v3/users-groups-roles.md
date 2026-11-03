---
title: Users, Groups, and Roles
description: User, group, and role management on v3 (and the v1 routes it still needs), including undocumented role, group, and user-level writes — confirmed live and cross-checked against Autodesk's official Postman collection.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->

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
| Add a user | `POST /api/v3/users` — `licenseType` is **required**, see [Adding a user](#adding-a-user). Confirmed live 2026-11-03 |
| Assign groups to a user | `POST /api/v3/users/{userId}/groups` — body is a **raw array of group URN strings**, e.g. `["urn:adsk.plm:tenant.group:{TENANT}.145"]`. `204`. Confirmed live 2026-11-03 |
| Change a user's status | `PATCH /api/v3/users/{userId}`, `Content-Type: application/json-patch+json`, body `[{ "op": "replace", "path": "/userStatus", "value": "Inactive" }]`. `"Inactive"`, `"Deleted"` and `"Active"` all return `204`, and `"Active"` restores an inactive or deleted user. Confirmed live 2026-11-03 |
| Change a user's level (licence) | **v1 only**: `GET /api/rest/v1/users/{userId}`, then `PUT` it back with `licenseType` changed — see [Changing a user's level](#changing-a-users-level). Confirmed live 2026-11-03 |
| Unassign a group from a user | `DELETE /api/rest/v1/users/{userId}/groups/{groupId}` — `204`, group gone. Confirmed live 2026-11-03 |

:::caution
`unassignGroup` uses the **v1** path while `assignGroups` uses **v3** — a real inconsistency within the same assign/unassign pair, confirmed independently in both a production client and Autodesk's own official Postman collection (its "Remove User From Group" call also hits `DELETE /api/rest/v1/users/{userId}/groups/{groupId}`). Not a typo — don't assume v3 symmetry here.
:::

### Adding a user

```
POST /api/v3/users
{ "email": "person@example.com", "notifyUser": false, "licenseType": { "licenseCode": "S" } }
```

`201`, no body; the new user ID is the last segment of the `Location` header.

:::caution[Confirmed live — 2026-11-03: contradicts Autodesk's official example]
Autodesk's example omits `licenseType`, and a commented-out line in it says the licence
code is only for trial or demo tenants. On a production tenant:

| Body | Result |
|---|---|
| `{ "email", "notifyUser" }` (no `licenseType`) | `400` `Must provide e-mail and license type code` |
| `{ "email", "firstName", "lastName", "notifyUser" }` | `400` `Unexpected attributes in supplied payload` |
| `{ "email", "notifyUser", "licenseType": { "licenseCode": "S" } }` | `201` |

`"S"` is Professional (listed as "Standard"), `"P"` is Participant; `GET /api/v3/licenses`
lists the codes. Names can't be sent on create; set them afterwards with the v1 `PUT` below.
:::

### Changing a user's level

The v3 user resource won't change the licence, and the obvious-looking v3 licence route does
something else. Use v1:

```
GET /api/rest/v1/users/{userId}          → { "user": { …, "licenseType": { "value": "S", "label": "Standard" }, … } }
PUT /api/rest/v1/users/{userId}          body: the "user" object as returned, with
                                         "licenseType": { "value": "P" }
```

`204`, and the level sticks on both v1 and v3 reads.

:::caution[Confirmed live — 2026-11-03: what doesn't work]
| Request | Result |
|---|---|
| `PATCH /api/v3/users/{userId}` JSON-Patch on `/licenseType` or `/licenseType/licenseCode` | `400` `Cannot modify the user resource attribute licenseType` |
| `PATCH /api/v3/users/{userId}/licenses` `{ "licenseCode": "P" }` | `200`, but the user gets licence **`B` "Basic"** with `expirationInSeconds: 1199`, whatever code is sent. It's a temporary licence lease, not the user's level. Don't use it to change levels. |
| The same route with a JSON-Patch body | `415` |
| v1 `PUT` with the wrapped `{ "user": { … } }` body | `500` |
| v1 `PUT` with lookups flattened (`"licenseType": "S"`) | `400` `Cannot construct instance of com.dms.lookup.LookupListItem` |
| v1 `PUT` on a user with no first or last name | `400` `'firstName' is not specified`, `'lastName' is not specified` |

The v1 `PUT` **replaces** the user, so always send back the record you just read and change
only `licenseType`. A user created through v3 has no names yet; supply `firstName` and
`lastName` in the same `PUT`.
:::

## Groups

| Operation | Endpoint |
|---|---|
| List all groups | `GET /api/v3/groups?offset={n}&limit={n}` — `Accept: application/vnd.autodesk.plm.groups.bulk+json` |
| Get group details | `GET /api/v3/groups/{groupId}` |
| Get a group's users | `GET /api/v3/groups/{groupId}/users` |
| Get a group's workspace access | `GET /api/v3/groups/{groupId}/workspaces` (each entry includes a `permissions` array, e.g. `["Update","Delete","Create","Read"]`) |
| Remove a group's access to a workspace | `DELETE /api/v3/groups/{groupId}/workspaces/{workspaceId}` |
| Create a group | `POST /api/v3/groups` — `{ "name": "…", "description": "…" }`. Not in Autodesk's collection; confirmed live 2026-11-03 |
| Get a group's roles | `GET /api/v3/groups/{groupId}/roles?offset={n}&limit={n}` — confirmed live 2026-11-03 |
| Add roles to a group | `POST /api/v3/groups/{groupId}/roles` — raw array of role URN strings. Confirmed live 2026-11-03 |
| Add users to a group | `POST /api/v3/groups/{groupId}/users` — raw array of user URN strings. Confirmed live 2026-11-03 |
| Remove a role from a group | `DELETE /api/v3/groups/{groupId}/roles/{roleId}` — `204`, role gone. Confirmed live 2026-11-03 |
| Delete groups | `DELETE /api/v3/groups` with a raw array of group URNs, e.g. `["urn:adsk.plm:tenant.group:{TENANT}.{groupId}"]` — `204`; the group then `404`s. There's no `DELETE /groups/{groupId}`. Confirmed live 2026-11-03 |

:::tip[Confirmed live — 2026-11-03: creating a group and filling it]
- `POST /api/v3/groups` with `{}` returns `400` `'name' must not be blank`. Send
  `name` and, optionally, `description`. It returns `201` with
  `Location: …/api/v3/groups/{groupId}` and no body.
- The create keys don't match the read keys. A `GET` returns your `name` as
  **`shortName`** and your `description` as **`longName`**.
- **A new group isn't empty.** Before anyone was added, `GET …/groups/{groupId}/users`
  already listed the tenant's three system accounts (`gdpr_user`, `system_user`,
  `tenant_admin`). Don't treat a non-zero member count as proof that your add
  worked; look for the user.
- `POST …/groups/{groupId}/roles` with
  `["urn:adsk.plm:tenant.role:{TENANT}.{roleId}"]` returned `204`, and the group's
  role count went from 0 to 1.
- `POST …/groups/{groupId}/users` with
  `["urn:adsk.plm:tenant.user:{TENANT}.{userId}"]` returned `204`. `{userId}` is the
  short ID from `GET /api/v3/users/@me` (`userId`), not the login name.
- The effect was immediate. Straight after the two adds,
  `GET /api/v3/workspaces/{ws}/users/@me/permissions` listed the role's
  permissions, and a v3 read on the workspace that had returned `403` returned
  `200`.
:::

## Roles and permissions

:::tip[Correction, confirmed live — 2026-07-09]
An earlier pass claimed role listing was v1-only, based on one production client that happened to only call the v1 path. That was wrong: **`GET /api/v3/roles?offset={n}&limit={n}` exists and is confirmed live** against a real tenant (`200`, standard paginated envelope). Use v3 for roles; don't assume v1-only just because one client never called the v3 form.
:::

| Operation | Endpoint |
|---|---|
| List roles | `GET /api/v3/roles?offset={n}&limit={n}` — confirmed live |
| Get a role | `GET /api/v3/roles/{roleId}` — confirmed live 2026-11-03 |
| List a workspace's roles | `GET /api/v3/workspaces/{wsId}/roles` — `204` with no body when there are none. Confirmed live 2026-11-03 |
| Create a role | `POST /api/v3/roles` — not in Autodesk's collection. Confirmed live 2026-11-03, see below |
| Add permissions to a role | `POST /api/v3/roles/{roleId}/permissions` — raw array of permission URN strings. Confirmed live 2026-11-03 |
| Remove a permission from a role | `DELETE /api/v3/roles/{roleId}/permissions/{permissionId}` — `204`, permission gone. Confirmed live 2026-11-03 |
| Delete roles | `DELETE /api/v3/roles` with a raw array of role URNs — `204`; the role then `404`s. There's no `DELETE /roles/{roleId}`. Confirmed live 2026-11-03 |
| List permissions | `GET /api/v3/permissions?limit={n}` — confirmed live 2026-11-03 (the v1 form `GET /api/rest/v1/permissions` also exists) |
| Get current-user permissions on a workspace or item | `GET /api/v3/workspaces/{wsId}/users/@me/permissions` or `GET /api/v3/workspaces/{wsId}/items/{dmsId}/users/@me/permissions`. `204` with no body means no permissions |

A role belongs to one workspace. A `GET` carries `shortName`, `longName`,
`isSystemManaged`, `workspaceUrn`, `workspaceRoleUrn`, and `permissions[]`. Each
permission has a `link`, a `urn`, a key-style `name` such as
`permission.shortname.view_items`, a display `title`, and a `groupName`. Roles
only take effect through a group (see [Groups](#groups)).

### Creating a role

Two calls: create the role, then add its permissions.

```
POST /api/v3/roles
{ "workspaceId": 1200, "shortName": "Parts [R/W]", "longName": "Parts [R/W]" }

POST /api/v3/roles/{roleId}/permissions
["urn:adsk.plm:tenant.permission:ACMECORP.5", "urn:adsk.plm:tenant.permission:ACMECORP.6"]
```

:::caution[Confirmed live — 2026-11-03: permissions in the create body are ignored]
A role was copied from one tenant to another.

- `POST /api/v3/roles` with `{}` returns `400` listing `'workspaceId' must not be null`
  and `'shortName' must not be blank`.
- The create returned `201` with `Location: …/api/v3/roles/{roleId}` and no body.
- **The body's `permissions` array was silently dropped.** It was sent as
  `[{ "link": "/api/v3/permissions/5" }, …]`, the shape a `GET` returns, and the new
  role came back with no permissions. Check the role after creating it.

What `POST /api/v3/roles/{roleId}/permissions` accepts:

| Body | Result |
|---|---|
| `["urn:adsk.plm:tenant.permission:{TENANT}.5"]` | `204`, permission added |
| The same list again, plus new URNs | `204`. The new ones were added, and the repeat wasn't duplicated |
| `["/api/v3/permissions/5"]` or an absolute URL | `400` `Invalid link URN "…"` |
| `[5]` | `400` `Invalid link URN "5"` |
| `[{ "link": "…" }]` or `{}` | `400` `GEN_INVALID_INPUT_SCHEMA` "Incorrect payload" |
| `Content-Type: text/uri-list` | `415` |

Adds are additive. To remove one, `DELETE /api/v3/roles/{roleId}/permissions/{permissionId}`
(`OPTIONS` on that path allows only `DELETE`); it returned `204` and the permission was gone
on the next read (confirmed live 2026-11-03).

These don't change permissions:

| Request | Result |
|---|---|
| `PATCH /api/v3/roles/{roleId}` | `405` |
| `PUT /api/v3/roles/{roleId}` with a full body and `permissions` | `204`, permissions unchanged |
| `PUT` or `PATCH` on `…/roles/{roleId}/permissions` | `405` |
| `POST /api/v3/workspaces/{wsId}/roles` | `405` |

The [Configuration API](/api/config/configuration-api/) has no role or permission
routes; `roles` and `permissions` return the gateway `404` under both contexts.
:::

**Copying a role between tenants.** Map permissions by `name`, not by ID. On the
two tenants tested, the 14 IDs used meant the same permission in both, but one
tenant had 201 permissions and the other 163, so the lists aren't identical.

## Tenant-scoped admin endpoints

All of these are path-scoped by the **uppercased tenant name** as a URL segment — the only place in this API that does that instead of just using the tenant subdomain as the host:

| Operation | Endpoint |
|---|---|
| System log entries | `GET /api/v3/tenants/{TENANT_UPPERCASE}/system-logs?offset={n}&limit={n}[&type=item]` |
| Setup/config-change log entries | `GET /api/v3/tenants/{TENANT_UPPERCASE}/setup-logs?offset={n}&limit={n}` |
| Tenant general settings | `GET /api/v3/tenants/{TENANT_UPPERCASE}/general-settings?offset={n}&limit={n}` |
| Tenant internal ID | `GET /api/v3/tenant` (singular, no tenant segment — see [Workspaces](/api/v3/workspaces/)) |

### General settings

Returns tenant-wide configuration as a paginated list of typed setting groups, each identified by a `type` discriminator and addressable individually at `.../general-settings/{TYPE}`:

```json
{
  "items": [
    {
      "type": "REVISION_CONTROL",
      "asyncRevisioning": false,
      "newWorkingVersionReleaseInPlace": false,
      "workingVersionAlwaysAvailable": true,
      "numberGenerationStrategy": "AUTOMATIC",
      "__self__": "/api/v3/tenants/{TENANT}/general-settings/REVISION_CONTROL"
    },
    {
      "type": "...",
      "quantityLength": 5,
      "quantityPrecision": 1,
      "quantityTrailingZerosHidden": false
    }
  ]
}
```

Each group carries a different set of keys depending on its `type` — don't expect a uniform shape across `items[]`. Useful for reading behavior your integration has to respect rather than hardcode: whether revisioning is async, whether working versions are always available, the tenant's numbering strategy, and quantity precision/rounding for BOM math (see [BOM](/api/v3/bom/)).

:::note
Transcribed from Autodesk's official Postman collection's saved response; not independently live-verified (the token available at the time had expired). The endpoint shape and `type`-discriminated grouping are from that real captured response, not invented.
:::

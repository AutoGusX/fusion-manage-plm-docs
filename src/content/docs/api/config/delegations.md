---
title: Delegations (v1)
description: The undocumented v1 delegation API behind Fusion Manage's modern Delegation Manager. Lists delegable workspaces and eligible delegatees, and creates, updates, and deletes delegations. Confirmed live 2026-11-13.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->

A delegation hands one user's workflow responsibilities in one workspace to one or
more other users for a date range. Fusion Manage's modern Delegation Manager
(behind the `process-fusion-manage-modern-delegation-manager` feature flag; the
classic page is embedded otherwise) saves delegations through the same
undocumented v1 API as the [Configuration API](/api/config/configuration-api/).
Base URL, the `adsk-plm-tenant` header, the error envelope, and pagination all
work the same way, so read that page's
[Base URL and tenant](/api/config/configuration-api/#base-url-and-tenant) section
first.

:::caution[Undocumented API]
Found in the admin UI's network traffic and probed live against a sandbox
tenant. Autodesk can change it without notice.
:::

## Endpoints

| Purpose | Endpoint |
|---|---|
| Workspaces a user can delegate | `GET /{context}/v1/users/{userId}/delegable-workspaces` |
| Users eligible as delegatees | `GET /{context}/v1/workspaces/{ws}/delegatees?filter[startDate]={iso}&filter[endDate]={iso}` |
| List delegations | `GET /{context}/v1/delegations` |
| Create a delegation | `POST /{context}/v1/delegations` |
| Update a delegation | `PATCH /{context}/v1/delegations/{id}` |
| Delete a delegation | `DELETE /{context}/v1/delegations/{id}` |

:::caution[Confirmed live — 2026-11-13: you can't GET one delegation by ID]
Every delegation's own `url` is `/v1/delegations/{id}`, but `GET` (and `PUT`) on
that path returns the **APS gateway's** `404` ("The requested resource does not
exist."), not the API's. `PATCH` and `DELETE` on the same path work. The
gateway routes each method separately. To read one delegation, filter the list:
`GET /{context}/v1/delegations?filter[id]={id}`.
:::

## Delegable workspaces

```
GET /{context}/v1/users/{userId}/delegable-workspaces?offset=0&limit=max
```

Returns `{ pagination, results }` with `id`, `name`, `urn`, and `url` per
workspace. `{userId}` accepts `@me`, a user ID, or an email-style login.

:::tip[Confirmed live — 2026-11-13]
- `limit` defaults to `100`. `limit=max` works and echoes `limit: 1000000`.
- An admin token can read **another user's** list.
- On a tenant with 129 workspaces, 82 were delegable. Every excluded workspace
  checked had a type with `allowWorkflow: false` (Basic, Items, Documents; see
  `GET /{context}/v1/workspace-types`). One workflow-type workspace was also
  excluded, so "has workflow type" is necessary but apparently not sufficient.
  The cause is unconfirmed; it may need a workflow actually uploaded.
:::

## Eligible delegatees

```
GET /{context}/v1/workspaces/{ws}/delegatees?offset=0&limit=max&filter[startDate]=2026-11-13T00:00:00Z&filter[endDate]=2026-11-14T00:00:00Z
```

Returns users as `{ id, displayName, urn, url }`, where `url` points at v3
(`/api/v3/users/{id}`).

:::tip[Confirmed live — 2026-11-13]
- **Both date filters are required.** Omitting them returns `400` with one
  `errors[]` entry per missing filter: `The filter startDate is required`.
- An unknown workspace returns `404` "No workspace found with id …".
- **The list includes the delegator.** Delegating to yourself is then refused at
  create time (see below), so filter the current user out before showing a
  picker.
- A user with no name comes back with `displayName: " "` (a single space).
:::

## Listing delegations

```
GET /{context}/v1/delegations?offset=0&limit=20&sort=startDate desc
```

The list holds the caller's own delegations. Each record:

```json
{
  "id": 41,
  "name": "Out of office",
  "status": "ENABLED",
  "state": "ACTIVE",
  "delegator": { "id": "{userId}", "urn": "…", "url": "/api/v3/users/{userId}" },
  "workspace": { "id": 120, "urn": "…", "url": "/v1/workspaces/120" },
  "delegatees": [ { "id": "{userId}", "urn": "…", "url": "/api/v3/users/{userId}" } ],
  "startDate": "2026-11-13T00:00:00Z",
  "endDate": "2026-11-14T00:00:00Z",
  "createdDate": "2026-11-13T19:54:47.879Z",
  "modifiedDate": "2026-11-13T19:54:47.879Z",
  "urn": "urn:adsk.plm:tenant.delegation:ACMECORP.41",
  "url": "/v1/delegations/41"
}
```

Note the mixed link styles: users point at v3 on the tenant host, workspaces at
v1 on the gateway.

:::tip[Confirmed live — 2026-11-13: filters and sorts]
Supported filters: `id`, `name`, `workspace`, `status`, `state`, `delegator`,
and `delegatees` (plural; `filter[delegatee]` is refused). Date filters are not
supported on this list. `sort=name desc` and `sort=startDate desc` work; the
default sort is `id`. Any unsupported property returns `400` naming it:
`The specified filter property foo is not supported`.

With an admin token, `filter[delegator]={otherUserId}` returned another user's
delegation, so the list isn't strictly "mine" for an admin.
:::

## Creating a delegation

```json
POST /{context}/v1/delegations
{
  "name": "Out of office",
  "status": "ENABLED",
  "delegator": { "id": "{userId}" },
  "workspace": { "id": 120 },
  "delegatees": [ { "id": "{userId}" } ],
  "startDate": "2026-12-01T00:00:00Z",
  "endDate": "2026-12-05T00:00:00Z"
}
```

Returns `201` with the full record. `POST {}` lists the required fields: `name`,
`delegator`, `workspace`, `delegatees`, `startDate`, and `endDate`. `status`
defaults to `ENABLED`.

### `status` and `state`

- **`status`** is what you set: `ENABLED` or `DISABLED`. The validator also lists
  `DELETED`, but sending it returns `400` "status DELETED is not allowed". Use
  `DELETE` instead.
- **`state`** is computed from the dates only: `NOT_STARTED`, `ACTIVE`, or
  `EXPIRED`. A disabled delegation whose dates cover today still reads
  `state: ACTIVE`, so check both. Writes to `state` are silently ignored.

### Validation rules

:::tip[Confirmed live — 2026-11-13]
| Input | Result |
|---|---|
| Start date before today | `400` `startDate: start date must be today or later` |
| End date before tomorrow | `400` `endDate: end date must be tomorrow or later` |
| End before start | `400` `endDate: end date must be on or after start date` |
| Start and end on the same day | Accepted |
| Times other than midnight | Accepted, but **truncated to `00:00:00Z`** |
| Delegator listed as a delegatee | `400` `delegatees: delegator cannot be their own delegatee` |
| Empty `delegatees` | `400` `delegatees: must not be empty` |
| Unknown user | `400` "No user found with id …" |
| Two or more delegatees | Accepted |
| Overlaps an **enabled** delegation by the same delegator in the **same** workspace | `400` on create, **`409`** on a `PATCH` that enables it: "The delegator already has an active delegation that overlaps the specified date range" |
| Overlaps one in a **different** workspace | Accepted |
| Overlaps a **disabled** delegation | Accepted |

The date rules apply on `PATCH` too, so a past delegation can't be backdated or
re-dated into the past.
:::

## Updating a delegation

`PATCH` is a **true partial update**, unlike the "send everything back" pattern
some config resources were documented with. The body must carry `id`, matching
the path; without it the API returns `400` with `id: must not be null` and
`arg0: must match in path and body`.

```json
PATCH /{context}/v1/delegations/41
{ "id": 41, "status": "DISABLED" }
```

:::caution[Confirmed live — 2026-11-13: an admin can reassign the delegator]
`name`, `status`, `workspace`, `delegatees`, and dates all changed with a partial
`PATCH`. So did **`delegator`**: an admin token moved a test delegation to
another user, and it then appeared under `filter[delegator]={thatUser}`. That
effectively creates a delegation on someone else's behalf. Setting the delegator
to a user who is already a delegatee returns `400` "The delegator cannot
delegate to themselves". The change was reverted.
:::

## Deleting a delegation

`DELETE /{context}/v1/delegations/{id}` returns `204`. A second delete returns
`404` "No delegation found with id …". Deleted delegations vanish from the list
entirely, including from `filter[status]=DELETED`, which explains gaps in the ID
sequence.

## Headers

:::note[Confirmed live — 2026-11-13: `adsk-plm-user` is ignored on a user token]
The admin UI's service layer can add an `adsk-plm-user` header. With a 3-legged
user token it changes nothing: the delegation list came back identical with the
header set to another user, to the caller, and to a user that doesn't exist.
This matches the [`X-User-Id` finding on v3](/api/v3/admin-impersonation/). Whether a
2-legged token honours it is untested.
:::

## Not yet tested

- Whether a delegatee actually receives the delegator's workflow actions while a
  delegation is `ACTIVE`. That needs a second user's session.
- Whether creating a delegation sends anyone a notification.
- What a non-admin token can see and change, especially `delegator` reassignment.
- Why one workflow-type workspace wasn't delegable.

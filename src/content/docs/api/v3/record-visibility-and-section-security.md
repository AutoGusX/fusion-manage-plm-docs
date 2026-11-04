---
title: Record Visibility and Section Security
description: Who can see which records and which item-detail sections — the "own records only" permission, record owners (primary and additional), owner search limits, and where section-level group restrictions are stored. Confirmed live 2026-11-04.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->

Two questions come up whenever external users (suppliers, partners) are given
access to a tenant:

1. In a workspace they can open, do they see **every record**, or only the
   records **they own**?
2. Inside a record, which **item-detail sections** can they read or edit?

Both are answered from role, group and section data. None of it is in one call.

## Own records only vs everyone's

Two workspace permissions decide it:

| Permission | ID (tested tenants) | Meaning |
|---|---|---|
| View Items | `5` | Can open records in the workspace at all |
| View Records Owned by Others | `523` | `permission.shortname.view_records_owned_by_others`: "Access records where the user is not the record owner or additional owner" |

- A role with **View Items but not 523** sees only records where the user is
  the owner or an additional owner.
- A role with **both** sees every record in the workspace.
- A user's effective access is the union over every role on every group they
  belong to. One group granting 523 is enough.

Map permissions by name, not ID, across tenants (see
[Users, Groups, and Roles](/api/v3/users-groups-roles/)).

## Record owners

```
GET /api/v3/workspaces/{ws}/items/{itemId}/owners
```

Returns `owners[]`. Each entry has:

| Field | Notes |
|---|---|
| `ownerType` | `PRIMARY`, or `ADDITIONAL_USER` for an additional user. Group owners link to `/groups/` |
| `detailsLink` | `/api/v3/users/{userId}` or a group link |
| `shortDesc`, `longDesc` | Display name |
| `__self__` | `…/owners/{userId}` |

### Writing owners

```
PUT /api/v3/workspaces/{ws}/items/{itemId}/owners
Content-Type: application/json

[
  { "__self__": "/api/v3/workspaces/{ws}/items/{itemId}/owners/{userId}",
    "ownerType": "PRIMARY",
    "detailsLink": "/api/v3/users/{userId}" },
  { "__self__": "/api/v3/workspaces/{ws}/items/{itemId}/owners/{otherUserId}",
    "ownerType": "ADDITIONAL_USER",
    "detailsLink": "/api/v3/users/{otherUserId}" }
]
```

:::caution[Confirmed live — 2026-11-04: the list replaces the owners]
- The body is a **raw array**, and it replaces the full owner list. Send the
  primary owner back with it.
- Every entry needs its own `__self__`. Without it: `400 selfLink cannot be null
  and it should have an ownerId`.
- A wrapped `{ "owners": [ … ] }` body returns `400 Incorrect payload`.
- `POST` to the same path returns `400` with any body, including `{}` and `[]`.
:::

## Searching by owner finds primary owners only

```
GET /api/v3/search-results?query=workspaceId={ws} AND owner={email}&revision=1&limit=100&offset=0&page=1
```

- Returns the records the user is **primary owner** of. Drop `workspaceId=` to
  search the whole tenant.
- No matches returns `204` with no body, not an empty list.
- Encode spaces as `%20`.

:::caution[Confirmed live — 2026-11-04: additional owners are invisible to search]
With a test user added as an additional owner of a record, none of these found
it, retried for a minute: `owner={email}`, `owner={userId}`, `owner="{name}"`,
`additionalOwner=`, `additionalOwners=`, `ownerId=`, `OWNER_USERID=`. All
returned `204`.

To find every record a user or group owns, including as an additional owner,
read `…/owners` for each record in the workspace. Run four to six reads at a
time and show progress: about 1,700 records took around 45 seconds.
:::

## Section security

Item-detail sections can be restricted to groups. The restriction is stored
**only on the v1 single-section read**:

```
GET /api/rest/v1/workspaces/{ws}/sections/{sectionId}
```

```json
{
  "section": {
    "sectionID": 101,
    "sectionName": "Supplier Review",
    "viewOnlyRestrictedTo": { "group": [{ "id": 11 }] },
    "editRestrictedTo":     { "group": [{ "id": 12 }] }
  }
}
```

These don't carry it: v3 workspace sections, v3 item sections, the
[Configuration API](/api/config/configuration-api/) section read, and the v1
sections **list** (`GET /api/rest/v1/workspaces/{ws}/sections`). Use the list
for the section IDs, then read each section.

`group` can be a single object instead of an array when there's one group.
Handle both.

How to read the two lists (confirmed with a tenant admin, 2026-11-04):

| The user is in | They get |
|---|---|
| A group in `editRestrictedTo` | Read and write |
| A group in `viewOnlyRestrictedTo` only | Read only |
| Neither, and at least one list is non-empty | The section is hidden |
| Both lists empty | Not restricted. Normal workspace permissions apply |

A section grant doesn't give workspace access on its own: the user still needs
View Items in the workspace to open the record.

`POST /api/v3/workspaces/{ws}/sections/{id}/permissions` exists (`OPTIONS`
lists `POST`). Its purpose is unknown and it hasn't been called.

## Permission groups that aren't workspace or system

When classifying permissions from `GET /api/v3/permissions`, not every
permission without a workspace type is a workflow transition. `groupName` is
either `Workflow Permission` or `Named Relationship` (for example
`AML:View`, `AML:Add`, `AML:Edit`, `AML:Delete`).

---
title: Route map (WADL)
description: The tenant host publishes a machine-generated map of every v3 route (Jersey WADL). How to read it, how to confirm a route with OPTIONS, and a table of what each route family is known to do. Swept live 2026-11-17.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->

The tenant host's REST layer is Jersey, and Jersey publishes a generated
description of every resource it serves:

```
GET https://{tenant}.autodeskplm360.net/api/application.wadl
GET https://{tenant}.autodeskplm360.net/api/application.wadl/xsd0.xsd
```

The WADL lists **395 method entries** (path, HTTP method, Java method name, query
parameters, media types); the XSD holds the request and response schemas. Only
part of it is described elsewhere on this site, so it's the best place to look
before guessing a path.

It covers the tenant host only (`/api/v3/…` plus a stray `/api/fields`). The
legacy `/api/rest/…` routes, `/api/v2/…`, and the
[Configuration API](/api/config/configuration-api/) on the APS gateway are
**not** in it.

## Reading it

- Sub-resources are nested, so a full path is the join of every ancestor's
  `path`. Path parameters carry their regex (`{workspaceId:[0-9]+}`).
- Jersey reuses sub-resource classes, so the same subtree appears under several
  parents, and some joins look odd: `/workspaces/{ws}/users/{userId}/bookmarks`,
  `affected-items/affected-items`. Some are real
  (`/workspaces/{ws}/users/@me/permissions` is documented and works); others
  have never been called. Confirm before relying on one.
- The `id` on each method (`createScript`, `updateWorkspaceDescriptorFields`,
  `removePermissionsFromRole`…) is the server's own name for it, and usually
  explains what a route does better than its path.

## Confirming a route with OPTIONS

`OPTIONS` on a v3 path returns `200` with an `Allow` header listing the methods
that path really serves, and `404` if no resource matches. It never runs the
method, so it's a safe way to check a write route exists.

```
OPTIONS /api/v3/workspaces/{ws}/workflows/1/states   ->  200  Allow: HEAD,GET,OPTIONS
OPTIONS /api/v3/workspaces/{ws}/behaviors            ->  404
```

`Allow` says the route exists, not that your token may use it.

:::tip[Confirmed live — 2026-11-17]
Every non-item path in the WADL (117, with tenant-provisioning and mock-login
routes left out) was swept with `OPTIONS` on a scratch workspace: **116 answered
`200`** with an `Allow` header matching the WADL. The one `404` was
`/workspaces/{ws}/user-views/{viewId}` with a made-up view ID.
:::

## Route families

**Status** says what has been exercised: *documented* (see the linked page),
*read* (a `GET` returned `200` on a live tenant), or *exists* (only `OPTIONS`
was checked). Methods are from the `Allow` header.

### Workspace configuration

| Path (under `/api/v3`) | Methods | Status |
|---|---|---|
| `/workspaces` | `GET` `POST` | documented ([Workspaces](/api/v3/workspaces/)) |
| `/workspaces/{ws}/sections` | `GET` `POST` | documented |
| `/workspaces/{ws}/sections/{id}/permissions` | `POST` | documented ([Record visibility and section security](/api/v3/record-visibility-and-section-security/)) |
| `/workspaces/{ws}/sections/{id}/matrices/{id}` | `GET` | exists |
| `/workspaces/{ws}/descriptor-fields` | `GET` `PUT` | exists. `GET` with `Accept: application/json` returned `405`; use the [v1 route](/api/config/workspace-setup/#descriptor-fields) |
| `/workspaces/{ws}/tabs` | `GET` | exists |
| `/workspaces/{ws}/clone-options` | `GET` | read, see [Workspaces](/api/v3/workspaces/) |
| `/workspaces/{ws}/print-views` | `GET` | read: lists print views (`type: advanced`); no write route |
| `/workspaces/{ws}/tableaus` | `GET` `POST`, and `PUT` `PATCH` `DELETE` on one | documented ([Views, Fields, and Tableaus](/api/v3/views-fields-tableaus/)) |
| `/workspaces/{ws}/slices` | `GET` | read: the workspace's saved views as report links |
| `/workspaces/{ws}/user-views` | `GET` | read: the same views as `/api/rest/v1/reports/{id}` links |
| `/workspaces/{ws}/roles` | `GET` | read |
| `/workspaces/{ws}/workflows/1/states`, `…/transitions` | `GET` only (transitions `POST` performs one) | documented ([Workflow](/api/v3/workflow/)). To change a workflow, use [Workflow definitions](/api/config/workflow-definitions/) |
| `/workspaces/{ws}/workflows/1/states/{id}/events` | `GET` | read, see [Workflow](/api/v3/workflow/) |
| `/workspaces/{ws}/scripts`, `/scripts` | `GET` `POST` | read; see [Scripts](/api/v3/scripts/) |

### Users, groups, roles, and permissions

| Path (under `/api/v3`) | Methods | Status |
|---|---|---|
| `/roles` | `GET` `POST` `DELETE` | documented ([Users, Groups, and Roles](/api/v3/users-groups-roles/)) |
| `/roles/{id}` | `GET` `PUT` | `PUT` exists, untested |
| `/roles/{id}/permissions` | `POST`; `DELETE` on one | documented |
| `/roles/{id}/permissions:batch-delete` | `POST` | exists (`removePermissionsFromRole`) |
| `/roles/{id}/groups` | `GET` `DELETE` | exists |
| `/groups`, `/groups/{id}` | `GET` `POST` `DELETE`; `PATCH` on one | documented |
| `/groups/{id}/roles`, `/groups/{id}/users`, `/groups/{id}/workspaces` | `GET` `POST` / `DELETE` | documented |
| `/security-summaries` | `GET` | read: user counts by status, licence use, group and role counts |
| `/permissions`, `/workspaces/{ws}/users/@me/permissions` | `GET` | documented |
| `/users/{id}/permissions` | `GET` | exists |

### Tenant

| Path (under `/api/v3`) | Methods | Status |
|---|---|---|
| `/tenant` | `GET` | documented |
| `/tenant/enabled-features` | `GET` | read: the tenant's feature toggles by name (for example `whereUsed.api`, `grid.show`) |
| `/tenants/{TENANT}/general-settings` | `GET`; `PATCH` on one type | documented ([Users, Groups, and Roles](/api/v3/users-groups-roles/)). `PATCH` untested |
| `/tenants/{TENANT}/setup-logs` | `GET` | documented. Every admin change, with the properties it set. Useful for finding out what an admin-UI action stored |
| `/resources` | `GET` | read: a small index of top-level collections |
| `/lookups/BOM-UOM` | `GET` | read: BOM units of measure, paginated. To edit them, see [Units of measure](/api/config/units-of-measure/) |
| `/milestone-types` | `GET` | read: `ENTER`, `EXIT` |
| `/events/{eventId}/hooks` | `GET` `POST`; `GET` `PUT` `DELETE` on one | exists. `GET` with guessed event IDs (`item.create`, `1`) returned `404`; valid IDs unknown |

### Never call these

They exist and answer `OPTIONS`, but act on the whole tenant or on Autodesk's
provisioning, and there is no undo:

| Path (under `/api/v3`) | What the WADL calls it |
|---|---|
| `DELETE /tenants/{id}` | `deleteTenant` |
| `POST /tenants/{id}` | `triggerBulkSync` |
| `PATCH /tenants/{id}` | `patchTenant` |
| `DELETE /caches`, `DELETE /caches/{id}` | `clearCaches`, `clearCache` |
| `POST /workspaces/{ws}/indexes` | `indexWorkspace` |

The WADL also lists Autodesk-internal provisioning routes (`aum-tenants`,
`upchain-tenants`, `tms-tenants`) and a mock login. They aren't covered here.

## What isn't in it

No v3 route writes a workflow, lifecycle, behavior, print-view layout, BOM view,
or BOM field. Some of those turned out to be JSON routes outside v3; the rest
are browser-only. See [Admin UI coverage](/guides/admin-ui-coverage/).

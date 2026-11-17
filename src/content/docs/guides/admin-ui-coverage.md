---
title: Admin UI coverage
description: For each Workspace Manager and admin screen, which API (v1 configuration, v3, legacy JSON) can do the same job, or whether it is browser-only, and how that was established.
---

Fusion Manage's admin screens are built on three generations of code, and each
one saves through a different channel. This page maps every screen to the API
that can do the same job, so you know before you start whether a setup task can
be automated.

**Channels:**

- **v1 config**: the [Configuration API](/api/config/configuration-api/) on the
  APS gateway (bearer token, `adsk-plm-tenant` header).
- **v3**: `/api/v3/…` on the tenant host.
- **Legacy JSON**: `/api/rest/…` or `/api/v2/…` on the tenant host. Old, but
  takes JSON and a bearer token.
- **Browser only**: a form post (`*.do`, `*.form`) that needs the session cookie
  and a `PLM-XSRF-TOKEN`. Not usable from an integration.

**Source** says how the channel was found: the admin UI's JavaScript
(**bundle**), a HAR recorded while using the screen (**HAR**), the tenant's
[route map](/reference/route-map/) (**WADL**), or calls made directly
(**probe**).

## Workspace Manager

| Screen | Read | Write | Source |
|---|---|---|---|
| Create, edit, delete a workspace | v1 config | v1 config ([Configuration API](/api/config/configuration-api/#workspaces)) | bundle, probe |
| Clone a workspace | | v1 config ([Workspace setup](/api/config/workspace-setup/#cloning-a-workspace)) | bundle, probe |
| Item Details sections and fields | v1 config, v3 | v1 config. The UI itself still uses browser-only `sectionSave.do`, `fieldSave.do`, `itemDetailsSaveLayout.do` | HAR, probe |
| Grid fields | v1 config | v1 config (UI: `gridFieldSave.do`) | HAR, probe |
| Managed Items (linked) fields | | Browser only (`linkedFieldSave.do`). A v1 clone route is in the bundle, untested | HAR, bundle |
| BOM fields | | Browser only (`bomFieldSave.do`); v1 `bom-fields` is a gateway `404` | HAR, probe |
| BOM views | Legacy JSON | Legacy JSON ([BOM views](/api/config/bom-views/)) | HAR, probe |
| Sourcing fields | | Browser only (`sourcingFieldSave.do`) | HAR |
| Tab names and order | v1 config | v1 config ([Workspace setup](/api/config/workspace-setup/#tabs)) | HAR, probe |
| Descriptor | v1 config | v1 config ([Workspace setup](/api/config/workspace-setup/#descriptor-fields)) | HAR, probe |
| Relationships (which workspaces may relate) | v1 config, v3 | v1 config ([Workspace setup](/api/config/workspace-setup/#relationships)) | bundle, probe |
| Workflow states and transitions | v3, legacy JSON | Legacy JSON ([Workflow definitions](/api/config/workflow-definitions/)) | HAR, WADL, probe |
| State escalations and reminders | v3 (`…/states/{id}/events`), legacy JSON | Probably part of the workflow `PUT`; untested | HAR, probe |
| Lifecycle | | Unknown: `lifecycleEditorView.form` wasn't recorded | bundle |
| Behaviors (scripts run on create, edit, on demand) | | Browser only (`behavior.form`) | HAR |
| Print views | v3 (list) | Browser only (`printViewEdit.do`) | HAR, WADL |
| Item explorer settings | | Browser only (`itemExplorerSave.do`) | HAR |
| Pending setup tasks | v1 config | | bundle, probe |

## Other admin screens

| Screen | Read | Write | Source |
|---|---|---|---|
| Roles and role permissions | v3 | v3 ([Users, Groups, and Roles](/api/v3/users-groups-roles/)) | bundle, probe |
| Groups and users | v3 | v3 | bundle, probe |
| Section security | v3 | v3 ([Record visibility and section security](/api/v3/record-visibility-and-section-security/)) | probe |
| Scripts | v3 (including source) | Create only on v3; edit in the UI ([Scripts](/api/v3/scripts/)) | WADL, probe |
| Picklists | v1 config | v1 config | bundle, probe |
| Categories | v1 config | v1 config ([Workspace setup](/api/config/workspace-setup/#categories)) | bundle, probe |
| Units of measure | v1 config, v3 lookup | v1 config ([Units of measure](/api/config/units-of-measure/)) | bundle, probe |
| Delegations | v1 config | v1 config ([Delegations](/api/config/delegations/)) | bundle, probe |
| Reports | v1 config | v1 config ([Report definitions](/api/config/reports/)) | bundle, probe |
| Saved views (tableaus) | v3 | v3 ([Views, Fields, and Tableaus](/api/v3/views-fields-tableaus/)) | probe |
| General settings | v3 | v3 `PATCH`, untested | bundle, WADL |
| Setup log (audit of admin changes) | v3 | | probe |

## Finding out what a browser-only screen stores

Every admin change is written to the setup log, with the properties it set:

```
GET /api/v3/tenants/{TENANT}/setup-logs?offset=0&limit=20
```

Make the change in the UI on a scratch workspace, then read the newest entries.
Each one has `action`, `sectionOrWorkspace`, and `details[]` lines such as
`Property 'type' set to 'RELATION'`. That tells you what the server stored, even
when no API can write it.

:::caution[Browser-only means browser-only]
Don't drive the `*.do` and `*.form` routes from an integration by copying the
session cookie and XSRF token. They post form fields and layout XML that the
admin UI builds, they aren't versioned, and nothing on this site has tested
them.
:::

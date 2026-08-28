---
title: Endpoint Index
description: Every documented Fusion Manage endpoint in one table, grouped by API surface and linked to its reference page.
---

Every endpoint documented on this site, in one place. The topic pages are the
better read; this is for when you already have an endpoint and want to find
where it is explained — or when an agent wants the whole surface in one fetch.

:::note
Generated from the reference pages by `prototypes/01-endpoint-index/generate-endpoint-index.mjs`.
Don't edit by hand — it is rewritten on every build.
:::

## v3 — `/api/v3/…`

The primary modern surface.

| Method | Path | Documented in |
|---|---|---|
| `GET` | `/api/v3/classifications/{classId}/fields` | [Classifications](/api/v2/classifications/) |
| `GET` | `/api/v3/groups?offset={n}&limit={n}` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/groups/{groupId}` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/groups/{groupId}/users` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/groups/{groupId}/workspaces` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `DELETE` | `/api/v3/groups/{groupId}/workspaces/{workspaceId}` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/lookups/{lookupId}` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `GET` | `/api/v3/lookups/CUSTOM_LOOKUP_0CWS_{PROPERTY_NAME_UPPERCASE}_{classificationId}?asc=title&filter=&limit=200&offset=0` | [Property Instances](/api/v2/property-instances/) |
| `GET` | `/api/v3/roles?offset={n}&limit={n}` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/roles?offset=&limit=` | [API Versions: v1, v2, and v3](/concepts/versioning/) |
| `GET` | `/api/v3/scripts` | [Scripts](/api/v3/scripts/) |
| `GET` | `/api/v3/scripts/{scriptId}` | [Scripting](/guides/scripting/) |
| `GET` | `/api/v3/search-results` | [Pagination](/concepts/pagination/) |
| `GET` | `/api/v3/search-results?query={grammar}&revision={1` | [Search](/api/v3/search/) |
| `GET` | `/api/v3/search-results?query=ITEM_DETAILS:TITLE=*Power*&revision=1&limit=5&offset=0&page=1` | [Search](/api/v3/search/) |
| `GET` | `/api/v3/search-results?query=ITEM_DETAILS:TITLE=*your` | [Change Orders and Workflow](/guides/change-orders-and-workflow/) |
| `GET` | `/api/v3/tenant` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/tenants/{TENANT_UPPERCASE}/general-settings?offset={n}&limit={n}` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/tenants/{TENANT_UPPERCASE}/setup-logs?offset={n}&limit={n}` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/tenants/{TENANT_UPPERCASE}/setup-logs?offset=0&limit=10` | [Admin and Config](/guides/admin-and-config/) |
| `GET` | `/api/v3/tenants/{TENANT_UPPERCASE}/system-logs?offset={n}&limit={n}[&type=item]` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/tenants/{TENANT_UPPERCASE}/system-logs?offset=0&limit=250` | [Admin and Config](/guides/admin-and-config/) |
| `POST` | `/api/v3/users` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/users?filter[loginName]={loginName}` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/users?sort=displayName&activeOnly={bool}&mappedOnly={bool}&offset={n}&limit={n}` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `PATCH` | `/api/v3/users/{userId}` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `POST` | `/api/v3/users/{userId}/groups` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/users/@me` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/users/@me/available-charts` | [Reports, Dashboards, Bookmarks, and Recently-Viewed](/api/v3/reports-dashboards/) |
| `GET` | `/api/v3/users/@me/bookmarks` | [Reports, Dashboards, Bookmarks, and Recently-Viewed](/api/v3/reports-dashboards/) |
| `POST` | `/api/v3/users/@me/bookmarks` | [Reports, Dashboards, Bookmarks, and Recently-Viewed](/api/v3/reports-dashboards/) |
| `DELETE` | `/api/v3/users/@me/bookmarks/{dmsId}` | [Reports, Dashboards, Bookmarks, and Recently-Viewed](/api/v3/reports-dashboards/) |
| `GET` | `/api/v3/users/@me/outstanding-work` | [Reports, Dashboards, Bookmarks, and Recently-Viewed](/api/v3/reports-dashboards/) |
| `GET` | `/api/v3/users/@me/recently-viewed` | [Reports, Dashboards, Bookmarks, and Recently-Viewed](/api/v3/reports-dashboards/) |
| `GET` | `/api/v3/workspaces` | [API Versions: v1, v2, and v3](/concepts/versioning/) |
| `GET` | `/api/v3/workspaces?offset={n}&limit={n}` | [Workspaces](/api/v3/workspaces/) |
| `GET` | `/api/v3/workspaces?offset=&limit=` | [Pagination](/concepts/pagination/) |
| `GET` | `/api/v3/workspaces?offset=0&limit=200` | [Admin and Config](/guides/admin-and-config/) |
| `POST` | `/api/v3/workspaces/{coWs}/items/{coId}/affected-items` | [Relationships and Affected Items](/api/v3/relationships-and-affected-items/) |
| `PUT` | `/api/v3/workspaces/{coWs}/items/{coId}/views/11/affected-items/{itemId}` | [Relationships and Affected Items](/api/v3/relationships-and-affected-items/) |
| `DELETE` | `/api/v3/workspaces/{coWs}/items/{coId}/views/11/affected-items/{itemId}` | [Relationships and Affected Items](/api/v3/relationships-and-affected-items/) |
| `GET` | `/api/v3/workspaces/{coWs}/items/{coId}/views/11/fields` | [Relationships and Affected Items](/api/v3/relationships-and-affected-items/) |
| `GET` | `/api/v3/workspaces/{coWsId}/items/{coId}/views/11` | [Relationships and Affected Items](/api/v3/relationships-and-affected-items/) |
| `POST` | `/api/v3/workspaces/{workspaceId}/items` | [Items](/api/v3/items/) |
| `GET` | `/api/v3/workspaces/{ws}` | [Workspaces](/api/v3/workspaces/) |
| `GET` | `/api/v3/workspaces/{ws}/fields` | [Items](/api/v3/items/) |
| `GET` | `/api/v3/workspaces/{ws}/items?offset={n}&limit={n}` | [Workspaces](/api/v3/workspaces/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}` | [Fusion Components (Manufacturing GraphQL)](/api/v3/fusion-components/) |
| `PUT` | `/api/v3/workspaces/{ws}/items/{itemId}` | [Items](/api/v3/items/) |
| `PATCH` | `/api/v3/workspaces/{ws}/items/{itemId}` | [Items](/api/v3/items/) |
| `PATCH` | `/api/v3/workspaces/{ws}/items/{itemId}?deleted=false` | [Items](/api/v3/items/) |
| `PATCH` | `/api/v3/workspaces/{ws}/items/{itemId}?deleted=true` | [Items](/api/v3/items/) |
| `POST` | `/api/v3/workspaces/{ws}/items/{itemId}/attachments` | [Attachments](/api/v3/attachments/) |
| `PATCH` | `/api/v3/workspaces/{ws}/items/{itemId}/attachments` | [Attachments](/api/v3/attachments/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/attachments?asc=name` | [Attachments](/api/v3/attachments/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}` | [Attachments](/api/v3/attachments/) |
| `POST` | `/api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}` | [Attachments](/api/v3/attachments/) |
| `PATCH` | `/api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}` | [Attachments](/api/v3/attachments/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}/history` | [Attachments](/api/v3/attachments/) |
| `POST` | `/api/v3/workspaces/{ws}/items/{itemId}/bom-items` | [BOM](/api/v3/bom/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/bom-items?depth={n}&revisionBias=release&viewDefId={bomViewId}&rootId={itemId}` | [BOM](/api/v3/bom/) |
| `PATCH` | `/api/v3/workspaces/{ws}/items/{itemId}/bom-items/{rowId}` | [BOM](/api/v3/bom/) |
| `DELETE` | `/api/v3/workspaces/{ws}/items/{itemId}/bom-items/{rowId}` | [BOM](/api/v3/bom/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/bom?depth={n}&revisionBias=release&viewDefId={bomViewId}&rootId={itemId}` | [BOM](/api/v3/bom/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/designs` | [Fusion Components (Manufacturing GraphQL)](/api/v3/fusion-components/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/logs?offset=&limit=&desc=timeStamp` | [Items](/api/v3/items/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/owners` | [Items](/api/v3/items/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/tabs` | [Items](/api/v3/items/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/versions` | [Items](/api/v3/items/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/views/{gridViewId}/rows` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `POST` | `/api/v3/workspaces/{ws}/items/{itemId}/views/{gridViewId}/rows` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `PUT` | `/api/v3/workspaces/{ws}/items/{itemId}/views/{gridViewId}/rows/{rowId}` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `DELETE` | `/api/v3/workspaces/{ws}/items/{itemId}/views/{gridViewId}/rows/{rowId}` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/views/10` | [Relationships and Affected Items](/api/v3/relationships-and-affected-items/) |
| `POST` | `/api/v3/workspaces/{ws}/items/{itemId}/views/10` | [Relationships and Affected Items](/api/v3/relationships-and-affected-items/) |
| `PUT` | `/api/v3/workspaces/{ws}/items/{itemId}/views/10/relationships/{relationshipId}` | [Relationships and Affected Items](/api/v3/relationships-and-affected-items/) |
| `DELETE` | `/api/v3/workspaces/{ws}/items/{itemId}/views/10/relationships/{relationshipId}` | [Relationships and Affected Items](/api/v3/relationships-and-affected-items/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/views/16` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `POST` | `/api/v3/workspaces/{ws}/items/{itemId}/views/16` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `DELETE` | `/api/v3/workspaces/{ws}/items/{itemId}/views/16/project-items/{entryId}` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/views/2` | [Items](/api/v3/items/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/views/8/suppliers` | [Suppliers](/api/v3/suppliers/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/views/8/suppliers/{supplierId}/quotes` | [Suppliers](/api/v3/suppliers/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/where-used?depth={n}` | [BOM](/api/v3/bom/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/workflows/{workflowId}/history` | [Workflow](/api/v3/workflow/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/workflows/{workflowId}/transitions` | [Workflow](/api/v3/workflow/) |
| `POST` | `/api/v3/workspaces/{ws}/items/{itemId}/workflows/{workflowId}/transitions` | [Workflow](/api/v3/workflow/) |
| `GET` | `/api/v3/workspaces/{ws}/items/{itemId}/workflows/1/transitions` | [Items](/api/v3/items/) |
| `GET` | `/api/v3/workspaces/{ws}/sections` | [Workspaces](/api/v3/workspaces/) |
| `GET` | `/api/v3/workspaces/{ws}/tableaus` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `POST` | `/api/v3/workspaces/{ws}/tableaus` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `GET` | `/api/v3/workspaces/{ws}/tableaus/{tableauId}` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `DELETE` | `/api/v3/workspaces/{ws}/tableaus/{tableauId}` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `GET` | `/api/v3/workspaces/{ws}/tableaus/{tableauId}?page={n}` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `GET` | `/api/v3/workspaces/{ws}/transitions` | [Items](/api/v3/items/) |
| `GET` | `/api/v3/workspaces/{ws}/views` | [BOM](/api/v3/bom/) |
| `GET` | `/api/v3/workspaces/{ws}/views/{gridViewId}/fields` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `GET` | `/api/v3/workspaces/{ws}/views/{viewId}/fields/{fieldId}` | [Items](/api/v3/items/) |
| `GET` | `/api/v3/workspaces/{ws}/views/10/related-workspaces` | [Relationships and Affected Items](/api/v3/relationships-and-affected-items/) |
| `GET` | `/api/v3/workspaces/{ws}/views/5` | [BOM](/api/v3/bom/) |
| `GET` | `/api/v3/workspaces/{ws}/views/5/viewdef/{bomViewId}` | [BOM](/api/v3/bom/) |
| `GET` | `/api/v3/workspaces/{ws}/views/5/viewdef/{bomViewId}/fields` | [BOM](/api/v3/bom/) |
| `GET` | `/api/v3/workspaces/{ws}/workflows/{workflowId}/states` | [Workflow](/api/v3/workflow/) |
| `GET` | `/api/v3/workspaces/{ws}/workflows/{workflowId}/transitions` | [Workflow](/api/v3/workflow/) |
| `GET` | `/api/v3/workspaces/{ws}/workflows/1/transitions` | [Workflow](/api/v3/workflow/) |
| `GET` | `/api/v3/workspaces/{wsId}/items/{dmsId}/users/@me/permissions` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/v3/workspaces/{wsId}/scripts` | [Scripts](/api/v3/scripts/) |
| `GET` | `/api/v3/workspaces/{wsId}/users/@me/permissions` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |

## v2 — `/api/v2/…`

The classification / parts-attribute subsystem.

| Method | Path | Documented in |
|---|---|---|
| `POST` | `/api/v2/classifications` | [Classifications](/api/v2/classifications/) |
| `GET` | `/api/v2/classifications?size={n}&page={n}` | [Classifications](/api/v2/classifications/) |
| `PUT` | `/api/v2/classifications/{classId}/property-instances/{propertyId}` | [Classifications](/api/v2/classifications/) |
| `PUT` | `/api/v2/classifications/{parentId}/children/{childId}` | [Classifications](/api/v2/classifications/) |
| `GET` | `/api/v2/classifications/{rootId}/graphs/adjacency-set` | [Classifications](/api/v2/classifications/) |
| `POST` | `/api/v2/enumerations` | [Classifications](/api/v2/classifications/) |
| `GET` | `/api/v2/parts?referenceUrn={referenceUrn}` | [Parts and Classifications](/api/v2/parts-and-classifications/) |
| `GET` | `/api/v2/parts/{partId}/classifications` | [Parts and Classifications](/api/v2/parts-and-classifications/) |
| `POST` | `/api/v2/properties` | [Classifications](/api/v2/classifications/) |
| `GET` | `/api/v2/property-instances?classification={classificationId}&inherited=true&page=1&size=100` | [Property Instances](/api/v2/property-instances/) |
| `GET` | `/api/v2/property-instances/{instanceId}/properties` | [Property Instances](/api/v2/property-instances/) |

## v1 — `/api/rest/v1/…`

Legacy, but still load-bearing for several operations.

| Method | Path | Documented in |
|---|---|---|
| `GET` | `/api/rest/v1/permissions` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/rest/v1/reports` | [Reports, Dashboards, Bookmarks, and Recently-Viewed](/api/v3/reports-dashboards/) |
| `GET` | `/api/rest/v1/reports/{reportId}` | [Reports, Dashboards, Bookmarks, and Recently-Viewed](/api/v3/reports-dashboards/) |
| `GET` | `/api/rest/v1/reports/dashboard` | [Reports, Dashboards, Bookmarks, and Recently-Viewed](/api/v3/reports-dashboards/) |
| `GET` | `/api/rest/v1/roles` | [API Versions: v1, v2, and v3](/concepts/versioning/) |
| `GET` | `/api/rest/v1/setups/picklists` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `GET` | `/api/rest/v1/setups/picklists/{picklistId}` | [Views, Fields, Tableaus, Grid/Project Tabs, and Picklists](/api/v3/views-fields-tableaus/) |
| `GET` | `/api/rest/v1/users/{userId}` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `DELETE` | `/api/rest/v1/users/{userId}/groups/{groupId}` | [Users, Groups, and Roles](/api/v3/users-groups-roles/) |
| `GET` | `/api/rest/v1/workspaces` | [Workspaces](/api/v3/workspaces/) |
| `GET` | `/api/rest/v1/workspaces/{id}/items` | [Pagination](/concepts/pagination/) |
| `POST` | `/api/rest/v1/workspaces/{ws}/items` | [Items](/api/v3/items/) |
| `GET` | `/api/rest/v1/workspaces/{ws}/items?includeRelationships=true` | [BOM](/api/v3/bom/) |
| `PUT` | `/api/rest/v1/workspaces/{ws}/items/{itemId}/lifecycles/transitions/{transitionId}` | [Items](/api/v3/items/) |
| `POST` | `/api/rest/v1/workspaces/{ws}/items/search` | [Search](/api/v3/search/) |

_134 endpoints across 3 surfaces._

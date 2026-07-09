---
title: Fusion Components (Manufacturing GraphQL)
description: A separate GraphQL API bridging Fusion Manage PLM items to Fusion 360 CAD design data and manufacturing properties — not part of the core PLM REST surface.
---

:::note[A genuinely separate API]
This is Autodesk's Manufacturing (CDE/mfg) GraphQL API, not a Fusion Manage REST endpoint. It's included here because Autodesk's official Fusion Manage Postman collection bundles it under a "Fusion Components" folder for items that are linked to Fusion 360 CAD components — but the request mechanics (GraphQL over a single POST endpoint, a `hub`/`component`/`model` domain model) are entirely different from everything else on this site.
:::

```
POST https://developer.api.autodesk.com/mfg/v3/graphql/public
```

All operations are GraphQL queries/mutations against this single endpoint (some require `Accept: multipart/mixed;deferSpec=20220824,application/json` for deferred/streamed fields).

## Bridging a PLM item to a CAD component

A Fusion Manage item that represents a Fusion 360 component still has ordinary PLM endpoints:

| Purpose | Endpoint |
|---|---|
| Get the item's linked design/viewable | `GET /api/v3/workspaces/{ws}/items/{itemId}/designs` |
| Get the item itself (to read its component/model ID fields) | `GET /api/v3/workspaces/{ws}/items/{itemId}` |

## GraphQL operations (confirmed to exist, not deeply documented here)

| Purpose | GraphQL operation |
|---|---|
| Get connected hub | `query CDE_PROPERTIES_GetGQLHubId($dataManagementAPIHubId: ID!)` |
| List all hubs | `query GetHubs` |
| Get component BOM structure | `query CDE_BOM_GetComponentStructure($componentId: ID!, $composition: BOMCompositionEnum!, ...)` |
| Get custom property definitions for a hub | `query CDE_PROPERTIES_CustomPropertyDefinitions($hubId: ID!, ...)` |
| Get a model's properties (basic) | `query GetModelProperties($modelId: ID!)` |
| Get a model's properties (advanced, deferred) | `query CDE_PROPERTIES_ModelProperties($modelId: ID!, ...)` |
| Set a custom property value | `mutation CDE_PROPERTIES_SetCustomProperties($input: SetPropertiesInput!)` |

This is a large, separate schema (hubs → components → models → properties, with composition/configuration semantics for assemblies). Treat this page as a pointer that the capability exists and where to start, not a full reference — a proper GraphQL schema walkthrough is future work if this integration path becomes relevant to your use case.

---
title: "API Versions: v1, v2, and v3"
description: What v1, v2, and v3 actually mean in Fusion Manage, which one to use for which operation, and the known discrepancies between documentation and working code.
---

Fusion Manage exposes three API surfaces that are easy to conflate. This page is the reconciliation point every other page links back to — read it before trusting any single endpoint page.

## The three surfaces

- **v1** (`/api/rest/v1/...`) — the original REST API. Despite being "legacy," it is still load-bearing in verified-working production code for: listing workspaces, listing/searching items (structured `searchDefinition` body), **creating and updating items**, attachments, and workflow history/transitions.
- **v3** (`/api/v3/...`) — the newer surface. Used for: item detail retrieval, workspace sections/fields/views, free-text search (`/search-results`, query-grammar based — see `api/v3/search`), BOM operations, supplier/AML data (`views/8`), and CO↔item relationship views.
- **v2** (`/api/v2/...`) — **not a predecessor or successor to v3.** It's a separate subsystem for the classification/parts-attribute model (`/api/v2/classifications`, `/api/v2/parts`, `/api/v2/property-instances`). There is no known v3 equivalent for this subsystem — treat v2 as its own thing, not "the old version of v3."

A single workflow often mixes all three: e.g. searching for an item via v3 `/search-results`, then updating it via a v1 `PUT`.

:::tip[Confirmed live — base host]
**Resolved (2026-07-08).** Live-tested directly against a real tenant: both `GET /api/rest/v1/workspaces` and `GET /api/v3/workspaces` return `200` on `https://{tenant}.autodeskplm360.net/...` — **the same host for both v1 and v3.** The `https://{tenant}.autodeskplm.com` host claimed by some documentation was never confirmed and should be treated as incorrect (or at best an alternate/legacy alias) unless proven otherwise on a specific tenant.
:::

:::caution[Live-tested but inconclusive — create/update verb and version]
Documentation describes:
- Create: `POST /api/v3/workspaces/{wsId}/items`
- Update: `PATCH /api/v3/workspaces/{wsId}/items/{itemId}`

The verified-working MCP client (`client.py`) instead implements:
- Create: `POST` against the **v1** path `/api/rest/v1/workspaces/{wsId}/items`, with a flat field-map body (not the v3 `sections[].fields[]` shape)
- Update: `PUT` (not `PATCH`) against the **v1** path `/api/rest/v1/workspaces/{wsId}/items/{itemId}`

**Attempted live (2026-07-08)** against a real tenant: neither the v1 flat-map shape nor the v3 `sections[].fields[]` shape could be confirmed working — v1 create returned `400 Title is required` regardless of payload shape tried (including with a `TITLE` value present), and v3 create returned an opaque `500 UNKNOWN` error. This needs the Postman collection's actual working request (or Autodesk's official docs) to resolve, not more trial and error — see `api/v3/items` for the full detail of what was tried.
:::

:::tip[Confirmed live — CO/item relationship view direction]
**Resolved (2026-07-08).** Live-tested against a real tenant with real items and Change Orders: `views/2` on a plain item returned `204` (valid, empty); `views/11` on the same item returned `403 VIEW_WORKFLOW_ITEMS denied`. Conversely, `views/11` on two different real Change Orders returned `200` with a populated `affectedItems[]` array pointing to real parts, while `views/2` on those same COs returned `403 VIEW_ASSOCIATED_WORKFLOW denied`. This confirms the `client.py` reading: **`views/2`** = Change Orders linked to an item (item → CO direction), **`views/11`** = affected items on a Change Order (CO → item direction). The other internal note claiming the opposite was incorrect for this tenant — see `api/v3/relationships-and-affected-items`.
:::

## Legacy v1 patterns to treat as historical, not current guidance

Some older integrations use v1 endpoints that newer code has since moved off of, e.g. `views/11` for change-order affected items fetched via the older reusable-components pattern, or `where-used?depth=N` style params. Where a page notes something as "legacy (v1)," treat it as a historical example worth knowing about (older tenants or older integrations may still rely on it) rather than the recommended current approach.

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

:::caution[Needs live verification — base host]
Some documentation (the APS/OAuth-oriented reference) states the v3 base URL is `https://{tenant}.autodeskplm.com/api/v3/`. However, the only **verified-working, production** code examined — a Chrome extension confirmed live against a real tenant, and a working Python MCP server client — both call `https://{tenant}.autodeskplm360.net/api/v3/...` for v3 endpoints, i.e. **the same host as v1**, not a separate `autodeskplm.com` domain. Until re-checked against a live tenant, treat `.autodeskplm360.net` as correct for both v1 and v3.
:::

:::caution[Needs live verification — create/update verb and version]
Documentation describes:
- Create: `POST /api/v3/workspaces/{wsId}/items`
- Update: `PATCH /api/v3/workspaces/{wsId}/items/{itemId}`

But the verified-working MCP client (`client.py`) actually implements:
- Create: `POST` against the **v1** path `/api/rest/v1/workspaces/{wsId}/items`, with a flat field-map body (not the v3 `sections[].fields[]` shape)
- Update: `PUT` (not `PATCH`) against the **v1** path `/api/rest/v1/workspaces/{wsId}/items/{itemId}`

Both can't be the current, correct behavior for the same tenant configuration — this may be a tenant-version difference (some tenants may genuinely support the v3 create/PATCH flow) rather than one source simply being wrong. **Do not assume either is universally correct** — verify against your specific tenant before building on either pattern. See `api/v3/items` for both documented shapes side by side.
:::

:::caution[Needs live verification — CO/item relationship view direction]
Two sources directly conflict on which workspace "view" number goes which direction:

- The verified-working `client.py` code comment states: **`views/2`** = Change Orders linked to an item (item → CO direction), and **`views/11`** = affected items listed on a Change Order (CO → item direction).
- A separate internal note (from the same overall project) states: "Related COs for a parts item come via **views/11**" — the opposite direction assignment for views/11.

Both cannot be correct simultaneously. This is flagged, not resolved — see `api/v3/relationships-and-affected-items` for the full detail. Verify directly against a live tenant before relying on either direction in new code, and expect that view-ID-to-meaning mapping may also vary by tenant/workspace configuration.
:::

## Legacy v1 patterns to treat as historical, not current guidance

Some older integrations use v1 endpoints that newer code has since moved off of, e.g. `views/11` for change-order affected items fetched via the older reusable-components pattern, or `where-used?depth=N` style params. Where a page notes something as "legacy (v1)," treat it as a historical example worth knowing about (older tenants or older integrations may still rely on it) rather than the recommended current approach.

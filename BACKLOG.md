# Backlog

<!-- Prioritized, top = next. Link items to their spec: (spec: specs/0001-foo.md) -->

## Now
- [ ] Write `api/v2/` pages: parts-and-classifications, property-instances (classifications.md done) (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Write remaining stub pages: suppliers, admin-impersonation (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Next
- [ ] Write `guides/` pages: authentication-quickstart, working-with-items, working-with-bom, change-orders-and-workflow, suppliers, admin-and-config, scripting (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Live-verify the write operations transcribed from Autodesk's official Postman collection but not yet independently tested: BOM row add/update/delete, Managed Items add/update/delete, Relationships tab CRUD, Grid/Project tab rows, workflow transition POST, group/role writes, v2 classification writes (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Later
- [ ] Locate Autodesk's official (non-Postman) API docs, if they add anything the collection doesn't (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Deepen the Fusion Components GraphQL page — full query/mutation reference if that integration path becomes relevant (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Live-test the v1 XML lifecycle-transition endpoint (mutates release state — needs a disposable item first) (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Site search spot-check against 5 example queries once content is filled in (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Done
- [x] Scaffold Astro Starlight site, GitHub Actions deploy workflow, llms.txt/llms-full.txt generator, and 4 concepts pages (auth, versioning, pagination, errors) written in full from mined source material
- [x] Create GitHub repo (AutoGusX/fusion-manage-plm-docs), push, and deploy to GitHub Pages — made public since GitHub Free doesn't support Pages on private repos: https://autogusx.github.io/fusion-manage-plm-docs/
- [x] Live-verification pass against a real tenant (2026-07-08) — confirmed: base host (`.autodeskplm360.net` for both v1 and v3), v1 BOM shape (`relations.entry[REL_BOM]`), v3 pagination envelope, search query grammar + 204-on-zero-results quirk, actual v3 error envelope shape (differs from prior docs), and resolved the `views/2` vs `views/11` direction conflict conclusively.
- [x] Deep-inspected the BOM Builder Fork extension's full `plm.js` client and its production clone-item code path (2026-07-08) — this **fully resolved the item create/update discrepancy**: confirmed-working v3 create shape (`sections[].fields[].{__self__,value}`, workspace-scoped links), confirmed PATCH requires item-scoped links while PUT accepts either, confirmed archive is `PATCH ?deleted=true` (no DELETE support, 405). Also wrote `reports-dashboards.md`, `users-groups-roles.md`, and `scripts.md` from a full enumeration of the client's remaining endpoint groups. Two disposable test items were created and immediately archived as part of verification.
- [x] Located and mined Autodesk's official Postman collection (2026-07-09, `Downloads\Fusion Manage REST API.postman_collection.json`) — confirmed the base-host and create/update findings independently, corrected a wrong "v1-only roles" claim (v3 `/roles` exists, confirmed live), corrected an overly-strong "no v3 equivalent" claim for classifications (v3 `/classifications/{id}/fields` exists, confirmed live), and substantially expanded `bom.md`, `relationships-and-affected-items.md`, `workflow.md`, `users-groups-roles.md`, `classifications.md`, `workspaces.md`, `views-fields-tableaus.md` (now covers Tableaus/Grid/Project tabs/Picklists), `attachments.md`, and `search.md` with confirmed shapes. Added two new pages for genuinely separate adjacent APIs discovered in the collection: `webhooks.md` (APS Webhooks) and `fusion-components.md` (Manufacturing GraphQL). Live-tested three of the most surprising/corrective claims (v3 roles, v3 classification fields, outstanding-work) against the user's own tenant before writing them up.

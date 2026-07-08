# Backlog

<!-- Prioritized, top = next. Link items to their spec: (spec: specs/0001-foo.md) -->

## Now
- [ ] Write remaining `api/v3/` pages: workspaces, relationships-and-affected-items (mostly done, needs prose pass), views-fields-tableaus, suppliers, admin-impersonation (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Write `api/v2/` pages: classifications, parts-and-classifications, property-instances (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Next
- [ ] Write `guides/` pages: authentication-quickstart, working-with-items, working-with-bom, change-orders-and-workflow, suppliers, admin-and-config, scripting (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Live-verify the reports/dashboards, users/groups/roles, and scripts endpoints (currently transcribed from client code, not yet re-checked against a live tenant) (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Later
- [ ] Locate the Postman collection and official Autodesk docs (likely in OneDrive - Autodesk, not yet found on disk) and reconcile against mined content (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Remaining live-verification items: attachment 3-step S3 upload flow, workflow transition/history 403-as-empty behavior, unarchive (`?deleted=false`, not independently tested) (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Site search spot-check against 5 example queries once content is filled in (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Done
- [x] Scaffold Astro Starlight site, GitHub Actions deploy workflow, llms.txt/llms-full.txt generator, and 4 concepts pages (auth, versioning, pagination, errors) written in full from mined source material
- [x] Create GitHub repo (AutoGusX/fusion-manage-plm-docs), push, and deploy to GitHub Pages — made public since GitHub Free doesn't support Pages on private repos: https://autogusx.github.io/fusion-manage-plm-docs/
- [x] Live-verification pass against a real tenant (2026-07-08) — confirmed: base host (`.autodeskplm360.net` for both v1 and v3), v1 BOM shape (`relations.entry[REL_BOM]`), v3 pagination envelope, search query grammar + 204-on-zero-results quirk, actual v3 error envelope shape (differs from prior docs), and resolved the `views/2` vs `views/11` direction conflict conclusively.
- [x] Deep-inspected the BOM Builder Fork extension's full `plm.js` client and its production clone-item code path (2026-07-08) — this **fully resolved the item create/update discrepancy**: confirmed-working v3 create shape (`sections[].fields[].{__self__,value}`, workspace-scoped links), confirmed PATCH requires item-scoped links while PUT accepts either, confirmed archive is `PATCH ?deleted=true` (no DELETE support, 405). Also wrote `reports-dashboards.md`, `users-groups-roles.md`, and `scripts.md` from a full enumeration of the client's remaining endpoint groups. Two disposable test items were created and immediately archived as part of verification.

# Backlog

<!-- Prioritized, top = next. Link items to their spec: (spec: specs/0001-foo.md) -->

## Now
- [ ] Write `api/v3/items.md`, `bom.md`, `search.md`, `attachments.md`, `workflow.md` from mined source material (see stub pages for source pointers) (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Next
- [ ] Write remaining `api/v3/` pages: workspaces, relationships-and-affected-items, views-fields-tableaus, suppliers, reports-dashboards (needs full `plm.js` grep first), users-groups-roles (needs grep), scripts (needs grep), admin-impersonation (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Write `api/v2/` pages: classifications, parts-and-classifications, property-instances (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Write `guides/` pages: authentication-quickstart, working-with-items, working-with-bom, change-orders-and-workflow, suppliers, admin-and-config, scripting (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Later
- [ ] Resolve the v1/v3 item create body shape — every shape tried against the live tenant on 2026-07-08 failed (see `api/v3/items.md`); needs the Postman collection's actual working request or Autodesk's official docs, not more trial and error (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Locate the Postman collection and official Autodesk docs (likely in OneDrive - Autodesk, not yet found on disk) and reconcile against mined content (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Remaining live-verification items: item update (PUT vs PATCH), attachment 3-step S3 upload flow, workflow transition/history 403-as-empty behavior (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Site search spot-check against 5 example queries once content is filled in (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Done
- [x] Scaffold Astro Starlight site, GitHub Actions deploy workflow, llms.txt/llms-full.txt generator, and 4 concepts pages (auth, versioning, pagination, errors) written in full from mined source material
- [x] Create GitHub repo (AutoGusX/fusion-manage-plm-docs), push, and deploy to GitHub Pages — made public since GitHub Free doesn't support Pages on private repos: https://autogusx.github.io/fusion-manage-plm-docs/
- [x] Live-verification pass against a real tenant (2026-07-08) — confirmed: base host (`.autodeskplm360.net` for both v1 and v3), v1 BOM shape (`relations.entry[REL_BOM]`), v3 pagination envelope, search query grammar + 204-on-zero-results quirk, actual v3 error envelope shape (differs from prior docs), and resolved the `views/2` vs `views/11` direction conflict conclusively. Item create body shape remains unresolved — moved to Later.

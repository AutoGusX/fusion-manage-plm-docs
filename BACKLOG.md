# Backlog

<!-- Prioritized, top = next. Link items to their spec: (spec: specs/0001-foo.md) -->

## Now
- [ ] Write `api/v3/items.md`, `bom.md`, `search.md`, `attachments.md`, `workflow.md` from mined source material (see stub pages for source pointers) (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Next
- [ ] Write remaining `api/v3/` pages: workspaces, relationships-and-affected-items, views-fields-tableaus, suppliers, reports-dashboards (needs full `plm.js` grep first), users-groups-roles (needs grep), scripts (needs grep), admin-impersonation (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Write `api/v2/` pages: classifications, parts-and-classifications, property-instances (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Write `guides/` pages: authentication-quickstart, working-with-items, working-with-bom, change-orders-and-workflow, suppliers, admin-and-config, scripting (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Later
- [ ] Locate the Postman collection and official Autodesk docs (likely in OneDrive - Autodesk, not yet found on disk) and reconcile against mined content (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Live-token verification pass against the 9 pages flagged "Needs live verification" — start with `api/v3/relationships-and-affected-items.md` (highest-priority conflict: views/2 vs views/11 direction) (spec: specs/0001-fusion-manage-plm-documentation-site.md)
- [ ] Site search spot-check against 5 example queries once content is filled in (spec: specs/0001-fusion-manage-plm-documentation-site.md)

## Done
- [x] Scaffold Astro Starlight site, GitHub Actions deploy workflow, llms.txt/llms-full.txt generator, and 4 concepts pages (auth, versioning, pagination, errors) written in full from mined source material
- [x] Create GitHub repo (AutoGusX/fusion-manage-plm-docs), push, and deploy to GitHub Pages — made public since GitHub Free doesn't support Pages on private repos: https://autogusx.github.io/fusion-manage-plm-docs/

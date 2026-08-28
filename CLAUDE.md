# Fusion Manage PLM Docs

Astro Starlight documentation site for the Autodesk Fusion Manage PLM API
(v1 + v2 + v3), deployed to GitHub Pages. Unofficial/personal — not an Autodesk
product. Spec: `specs/0001-fusion-manage-plm-documentation-site.md`. Current work:
`BACKLOG.md`.

Live: https://autogusx.github.io/fusion-manage-plm-docs/ · Repo: `AutoGusX/fusion-manage-plm-docs` (public)

## Commands

```bash
npm run build            # prototypes + llms.txt + astro build
npm run verify           # build, then fail on any broken internal link
npm run check:links      # link check alone (needs an existing dist/)
npm run coverage         # diff Autodesk's Postman collection vs. what's documented
npm run check:freshness  # age of each page's most recent live verification
npm run dev
```

`npm run verify` is the one to run before committing. Astro's build succeeds with
dead links, so a green build proves nothing on its own.

## The thing that makes this doc set worth anything

It distinguishes **what was actually confirmed against a live tenant** from what
was transcribed out of Autodesk's Postman collection or read out of a client's
source. Several confirmed findings directly contradict Autodesk's own official
examples (see below). Preserve that distinction obsessively:

- Never upgrade a claim's confidence without testing it. "Probably works" and
  "returned 201 on a real tenant" are different facts and the docs say which.
- When something can't be resolved, say so and say what was tried. Pages carry
  `:::caution[Attempted, inconclusive]` blocks on purpose.
- Date every live confirmation (`Confirmed live — YYYY-MM-DD`); `check:freshness`
  reads those dates.

## Hard-won API findings that contradict the official docs

- Both v1 and v3 live on `{tenant}.autodeskplm360.net`. The `autodeskplm.com`
  host in some docs was never reproducible.
- Item create/update is **v3-only**. The v1 flat-field create returns
  `400 Title is required` no matter the payload shape.
- Create needs **workspace-scoped** section/field links; `PATCH` needs
  **item-scoped** ones. `PUT` accepts either.
- Bulk array-body endpoints (Managed Items add, Grid add-rows) require
  **fully-qualified absolute URLs**. Relative paths — as printed in Autodesk's
  own Postman examples — return `400 GEN_INVALID_INPUT_SCHEMA`.
- Successful workflow transitions return **303**, not 2xx. Some require a
  `comment` field — singular, not `comments`/`workflowComments`.
- No hard delete: items are archived via `PATCH .../items/{id}?deleted=true`.
- `GET /api/v3/workspaces/{ws}/views` lists every view with its number — use it
  instead of assuming view IDs are fixed.
- At least five different error envelope shapes exist. Don't write a parser that
  assumes one.

## Site conventions

- Cross-references are markdown links with **root-relative** paths
  (`[Items](/api/v3/items/)`). Astro does *not* base-prefix links in markdown, so
  a rehype plugin in `astro.config.mjs` applies the base at build time and `BASE`
  is defined exactly once. Don't hardcode `/fusion-manage-plm-docs/` in content.
- Never commit a real tenant name, bearer token, or customer record title. Grep
  for `eyJhbGci`, the tenant name, and real record IDs before every commit.
  Examples use `{tenant}` / `acmecorp` and `{ws}` / `{itemId}` placeholders.

## Live testing against a tenant

Tokens are short-lived (~1h) and expire mid-session constantly. When testing:

- Create disposable items named `ZZZ-TEST-DELETE-ME-*` and **archive every one**
  before finishing. Verify the archive actually applied — don't assume.
- Revert any state you change on a real record (e.g. workflow transitions).
- Prefer read-only checks. Only mutate records the user has explicitly offered.

## Prototypes

`prototypes/` holds five feature prototypes pending review, each independently
removable — see `prototypes/README.md`. They add navigation and machine-readable
outputs; none of them change documentation content.

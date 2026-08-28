# Feature prototypes

Five ideas built far enough to judge, each self-contained and removable without
touching the others. Adopt the ones you like; `rm -rf` the rest.

All five are currently **enabled** so you can see them on the live site. Nothing
here changes the documentation's content — they add navigation, metadata, and
machine-readable outputs on top of it.

| # | Prototype | What it gives you | Touches the site? |
|---|---|---|---|
| 01 | [Endpoint index](#01--endpoint-index) | One table of all 134 endpoints, each linked to its page | New page + sidebar group |
| 02 | [Verification badges](#02--verification-badges) | "Verified live" vs "not yet verified" badge per page | Injected block in 22 files |
| 03 | [OpenAPI spec](#03--openapi-spec) | `openapi.json` — import to Postman, generate clients | New file in `public/` only |
| 04 | [Docs MCP server](#04--docs-mcp-server) | Claude can query the docs as tools | Nothing — fully separate |
| 05 | [Tenant playground](#05--tenant-playground) | Reader sets their tenant; samples become runnable | One `<script>` tag |

My ranking if you only keep two: **01** (the biggest everyday usability win) and
**04** (the biggest leverage win, and closest to how you already work).

---

## 01 — Endpoint index

`prototypes/01-endpoint-index/generate-endpoint-index.mjs`

The site is organised by topic, which is right for reading and wrong for the
most common lookup: *"I have an endpoint in front of me, where is it
documented?"* This generates
[`/reference/endpoint-index/`](https://autogusx.github.io/fusion-manage-plm-docs/reference/endpoint-index/)
— every documented endpoint grouped by API surface, each linked to the page that
explains it. It also gives an agent the whole surface in one fetch.

Generated on every build, so it cannot drift from the prose.

**Enabled by:** the `prototype:endpoint-index` script in `package.json` (run as
part of `build`), plus the `Reference` sidebar group in `astro.config.mjs`.

**To remove:** delete the directory, the `prototype:endpoint-index` script and
its mention in `prototypes`, the marked `PROTOTYPE 01` sidebar block in
`astro.config.mjs`, and `src/content/docs/reference/`.

---

## 02 — Verification badges

`prototypes/02-verification-badges/verification-badges.mjs`

This doc set's real differentiator is that it separates *confirmed against a live
tenant* from *transcribed out of Autodesk's Postman collection* from *read out of
a client's source*. Right now you only discover which you're reading by reading
it. This puts a badge at the top of each reference page.

Two things worth knowing about how this ended up:

- I first inferred the level by matching prose. It badged the **webhooks page as
  verified** — the page contains the phrase "a confirmed live hook object" while
  explicitly stating it is *not* live-tested. Matching only structured aside
  titles then swung the other way and under-claimed pages like Items, whose live
  confirmations are written as prose sections. For a signal whose entire job is
  telling the reader how much to trust a page, a quietly-wrong heuristic is worse
  than no badge. **The level is now declared per page** in a map at the top of
  the script — edit it there when a page's status changes. The script warns if a
  reference page has no declared level, so an unbadged page is a visible decision
  rather than a silent gap.
- Injecting an HTML block needs a blank line after it, or markdown parses the
  following paragraph as raw HTML and its inline code renders as literal
  backticks. That regression shipped briefly before output inspection caught it.

```bash
node prototypes/02-verification-badges/verification-badges.mjs           # dry run
node prototypes/02-verification-badges/verification-badges.mjs --apply
node prototypes/02-verification-badges/verification-badges.mjs --strip
```

`--strip` is verified byte-clean against git, so this is genuinely reversible.

**To remove:** run `--strip`, then delete the directory.

---

## 03 — OpenAPI spec

`prototypes/03-openapi-spec/generate-openapi.mjs` → `public/openapi.json`

An OpenAPI 3.1 document (110 paths, 134 operations, 29 tags) built from the
documented endpoints, served at
[`/openapi.json`](https://autogusx.github.io/fusion-manage-plm-docs/openapi.json).
Import it into Postman or Insomnia, generate a typed client, or hand it to
tooling that speaks OpenAPI.

**Scope, stated plainly:** this is a *path-and-method* spec, not a schema spec.
Request and response bodies in these docs are worked examples in prose, and
generating JSON Schema from them would produce confident-looking fiction. Every
operation instead carries an `externalDocs` link to the page with the real
shapes, confirmed status codes, and caveats. Validated structurally (every path
parameter declared, every operation has responses).

Because it is committed rather than ignored, the API surface becomes diffable in
git history.

**To remove:** delete the directory, the `prototype:openapi` script and its
mention in `prototypes`, and `public/openapi.json`.

---

## 04 — Docs MCP server

`prototypes/04-docs-mcp-server/` — see its own [README](04-docs-mcp-server/README.md)

A FastMCP server exposing the docs to Claude as five tools (`list_pages`,
`get_page`, `search_docs`, `find_endpoint`, `list_endpoints`). `llms.txt` gives an
agent one big snapshot; this lets it ask targeted questions and spend context on
the two pages it needs instead of all thirty.

Deliberately shaped like the PLM and MES servers in your MCP playground, so it
drops into the same `.mcp.json`. Read-only, offline, no credentials.

Tool logic was exercised against the real docs with FastMCP stubbed (31 pages
loaded; search, `find_endpoint`, and `list_endpoints` all correct). **Not yet run
against a live MCP client** — that needs `mcp` installed in a venv here.

**To remove:** delete the directory. Nothing outside it refers to the server.

---

## 05 — Tenant playground

`prototypes/05-tenant-playground/tenant-playground.js`

Every sample is written against `{tenant}`, so running one means hand-editing it.
This adds a small control on pages that contain samples: type your tenant once
and every snippet on the site substitutes it, remembered per browser. Also adds a
copy button to every code block.

Demo value too — set a prospect's tenant and the docs are speaking their
language rather than a placeholder's.

Vanilla JS, no dependencies, wrapped so that if anything throws the page is still
a perfectly good static doc page. The substitution stashes each block's pristine
text before its first edit, so switching tenants re-derives from the original
rather than substituting into already-substituted text — unit-tested, including
that it never clobbers the literal `/api/v3/tenant` endpoint path.

**Not yet exercised in a real browser** — the logic is tested, the visuals are
not. Worth a look before adopting.

**Enabled by:** the `prototype:tenant-playground` copy step in `package.json` and
the marked `PROTOTYPE 05` `head` entry in `astro.config.mjs`.

**To remove:** delete the directory, that script and its mention in `prototypes`,
the marked `head` block in `astro.config.mjs`, and the `public/tenant-playground.js`
line in `.gitignore`.

---

## Removing all five at once

```bash
node prototypes/02-verification-badges/verification-badges.mjs --strip
rm -rf prototypes src/content/docs/reference public/openapi.json public/tenant-playground.js
```

Then in `package.json` set `"build": "npm run generate:llms && astro build"` and
drop the four `prototype:*` scripts; in `astro.config.mjs` remove the two blocks
marked `PROTOTYPE 01` and `PROTOTYPE 05`. Nothing else references them.

Then run `npm run verify`. If you miss the `PROTOTYPE 05` block, the leftover
`<script>` tag points at a file that no longer exists, and the link checker will
say so on every page rather than letting it ship — that gap is exactly how the
missing favicon got through before the checker existed.

This whole procedure was executed end-to-end on a scratch branch: the site
rebuilt clean afterwards (31 pages, 1025 links, 0 broken) and the only diff was
the prototypes' own artifacts. The documentation content is untouched by all of
this.

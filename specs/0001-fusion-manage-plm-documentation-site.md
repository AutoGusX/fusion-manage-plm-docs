# Spec: Fusion Manage PLM Documentation Site

- **ID:** 0001
- **Status:** in-progress
- **Owner:** Gus Quade
- **Date:** 2026-07-07

## Problem
Fusion Manage's API surface (v2 + v3) is documented across scattered sources: official Autodesk docs, a personal Postman collection, and tribal knowledge accumulated from building PLM add-ins and Chrome extensions. There is no single, authoritative, well-structured reference. This slows down both human onboarding (new team members, other Autodesk sellers/SEs, partners) and AI-assisted development (Claude and other coding agents re-derive API behavior from scratch every session instead of reading a canonical source).

## Goals / Non-goals
- Goal: Produce a single documentation site covering the full Fusion Manage PLM knowledge domain — v2 + v3 API reference, conceptual guides, and admin/config/scripting notes.
- Goal: Content must be equally usable by a human reading rendered pages and by an AI agent reading raw source (markdown-first, with an `llms.txt`/`llms-full.txt` index).
- Goal: Host as a GitHub Pages site, built and deployed via CI.
- Goal: Explicitly reconcile v2 vs v3 API differences per resource, since Fusion Manage exposes overlapping functionality across both.
- Non-goal: Live "try it now" API console embedded in the site — v1 is a static reference, not an interactive API client.
- Non-goal: Automated re-scraping/regeneration when Autodesk updates their docs — v1 is manually authored and manually refreshed.
- Non-goal: Coverage of other Autodesk PLM/MES products (e.g., Fusion Operations MES is a separate system — see `project_plm_mes_mcp` memory) beyond incidental cross-references.

## Proposed approach
**Sources of truth to reconcile:**
1. Postman collection (concrete request/response shapes, real endpoints in use)
2. Autodesk's official Fusion Manage API documentation (authoritative but often incomplete or outdated)
3. Live Fusion Manage instance, accessed via bearer token (`GET /api/v3/token` with session cookie — see `reference_plm_session_token` memory) — used only during authoring to verify/correct examples, never shipped or committed.

**Content structure** (markdown-first, one concept per file):
- `/docs/concepts/` — auth flow, pagination, error format, versioning (v2 vs v3), rate limits
- `/docs/api/v3/<resource>.md` and `/docs/api/v2/<resource>.md` — per-resource endpoint reference (method, path, auth, params, request/response schema, example, and an explicit "v2 vs v3" callout box where the resource exists in both)
- `/docs/guides/` — task-oriented guides (items, BOM, change orders/workflows, suppliers, admin config, scripting) for both human onboarding and AI task-grounding
- `llms.txt` and `llms-full.txt` at site root, per the llms.txt convention, indexing every page with a one-line description so an AI agent can fetch a compact map without crawling the whole site

**Site generator:** Astro Starlight — markdown-native, fast, built-in search, easy GitHub Pages deploy.

**Repo visibility:** public (decided 2026-07-08). Originally set to private, but the AutoGusX GitHub account is on the Free plan, which the Pages API confirmed (422) does not support Pages on private repos. Rather than pay for a plan upgrade, the repo was deliberately made public — not a silent fallback — after that blocker was confirmed live against the API.

**Pipeline:** convert Postman collection → draft endpoint stubs → cross-check against Autodesk docs → verify against live instance during authoring → scrub instance-specific values (base URLs, IDs, tokens) → commit.

**Deploy:** GitHub Actions workflow builds the site and publishes to GitHub Pages on push to `main`.

## Acceptance criteria
- [x] Site builds and auto-deploys to GitHub Pages via a GitHub Actions workflow on push to `main`
- [ ] Every endpoint present in the provided Postman collection has a corresponding reference page with method, path, auth requirement, request/response schema, and a concrete example — the large majority are covered, but some read-only sub-resources (grid/project tab rows, a few "Item Details" GETs) are documented in endpoint tables rather than as individually worked examples; not literally 1:1 yet
- [x] For every resource that exists in both v2 and v3, the page explicitly documents the differences (fields, auth, deprecation status) — see `concepts/versioning` and `api/v2/classifications`
- [x] `llms.txt` and `llms-full.txt` exist at the site root and list every published page with a one-line description
- [x] At least one conceptual guide exists per major PLM area: auth, items, BOM, change orders/workflow, suppliers, admin/config
- [x] Docs are readable directly as raw markdown from the repo (not JS-rendered-only) — verified by reading a page's `.md` source without running the build
- [ ] Site search returns relevant results for at least 5 spot-check queries (e.g., "create item", "bearer token", "BOM export")
- [x] No bearer token, session cookie, instance hostname, or other instance-specific secret appears anywhere in git history — verified by grep before every commit this session
- [x] Repo visibility (public vs private/internal) is explicitly decided and documented before the first deploy

## Risks / open questions
- **Postman collection coverage:** likely doesn't cover 100% of the v2/v3 surface — gaps need to be filled from Autodesk's official docs, which may themselves be incomplete.
- **Staleness:** no automated sync with Autodesk's API changes in v1 — needs a manual review cadence (e.g., quarterly) or this rots quickly.
- **Token hygiene:** live-token verification during authoring means every example must be scrubbed of real instance data before commit — needs a concrete checklist/habit, not just intent.

## Out of scope
- Interactive in-browser API console / live request execution
- Automated documentation generation from OpenAPI/Swagger specs (Fusion Manage may not expose one — TBD)
- Coverage of Fusion Operations MES or other non-PLM Autodesk products
- Localization/i18n of the documentation site

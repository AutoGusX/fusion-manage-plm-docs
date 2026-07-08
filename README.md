# Fusion Manage PLM Docs

Human- and AI-readable reference for the Autodesk Fusion Manage PLM API (v2 + v3). Built with [Astro Starlight](https://starlight.astro.build), deployed to GitHub Pages.

See `specs/0001-fusion-manage-plm-documentation-site.md` for the full spec and `BACKLOG.md` for what's next.

## Repo visibility

**Decision: public.** The original default was private (proprietary-leaning content), but GitHub Pages on a private repo requires GitHub Pro/Team/Enterprise, and the AutoGusX account is on Free — confirmed via a 422 from the Pages API. Rather than pay for a plan upgrade, the repo was made public deliberately (not silently) after confirming the plan blocker. Content still needs review against the secret-hygiene checklist in the spec before merging anything with real tenant/customer data.

## Local development

```
npm install
npm run dev       # local preview at http://localhost:4321
npm run build     # generates llms.txt/llms-full.txt, then builds to dist/
npm run preview   # preview the production build
```

## Deploy

`.github/workflows/deploy.yml` builds and deploys on every push to `main`. One-time manual setup: in the repo's Settings → Pages, set **Source** to "GitHub Actions".

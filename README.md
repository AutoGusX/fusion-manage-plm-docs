# Fusion Manage PLM Docs

Human- and AI-readable reference for the Autodesk Fusion Manage PLM API (v2 + v3). Built with [Astro Starlight](https://starlight.astro.build), deployed to GitHub Pages.

See `specs/0001-fusion-manage-plm-documentation-site.md` for the full spec and `BACKLOG.md` for what's next.

## Repo visibility

**Decision: private.** This covers proprietary examples and customer scenarios, so it defaults closed rather than open (see spec's Risks section). GitHub Pages on a private repo requires GitHub Pro, Team, or Enterprise — **confirm the GitHub account/org this repo lands in has one of those plans before enabling Pages.** If it doesn't, the repo stays private with the Pages deploy deferred rather than silently flipping the repo public to unblock it.

## Local development

```
npm install
npm run dev       # local preview at http://localhost:4321
npm run build     # generates llms.txt/llms-full.txt, then builds to dist/
npm run preview   # preview the production build
```

## Deploy

`.github/workflows/deploy.yml` builds and deploys on every push to `main`. One-time manual setup: in the repo's Settings → Pages, set **Source** to "GitHub Actions".

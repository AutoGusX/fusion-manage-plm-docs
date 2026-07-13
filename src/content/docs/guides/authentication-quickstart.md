---
title: Authentication Quickstart
description: Get a bearer token and make your first authenticated Fusion Manage API call — the fastest path for each client type.
---

Three ways to get a token exist, and which one is right depends entirely on what you're building. Full detail on all of them (plus the legacy `localStorage` fallback) lives in `concepts/authentication` — this page just picks the fast path for the common case and shows a working example.

## Which flow do you need?

- **Building a browser extension, content script, or anything that runs inside an already-logged-in Fusion Manage tab?** → Use the session-cookie exchange below. This is the recommended, production-verified default.
- **Building a standalone backend service, desktop add-in, or MCP server that never runs inside a PLM browser session?** → Use APS 3-legged OAuth (see `concepts/authentication`, flow 2).
- **Building admin tooling that needs to act as another user (bulk operations, impersonation)?** → Use APS 2-legged client-credentials (see `api/v3/admin-impersonation`). Don't use this for anything else — it's a fundamentally different credential type.

The rest of this page covers the first case.

## Get a token (session-cookie exchange)

From a content script or any code running same-origin on a Fusion Manage page (`https://{tenant}.autodeskplm360.net/plm/...`):

```js
const resp = await fetch('/api/v3/token', {
  method: 'GET',
  credentials: 'same-origin',
  headers: { Accept: 'application/json' },
});
const { accessToken, expiresIn } = await resp.json();
// accessToken is a JWT, expiresIn is ~3600 (seconds)
```

**This only works same-origin.** If you're building a browser extension, the content script (which has the page's session cookie) must fetch the token and relay it to the background service worker via message passing — the background worker's own origin (`chrome-extension://...`) never has the session cookie and will get a 401 if it tries to fetch `/api/v3/token` directly.

```js
// content script
chrome.runtime.sendMessage({ type: 'AUTH_TOKEN_SYNC', payload: { token: accessToken, expiresIn } });
```

Refresh proactively — e.g. 5 minutes before `expiresIn` elapses — rather than waiting for a 401. See `concepts/authentication` for the full relay architecture and 401-recovery flow.

## Make your first authenticated call

Every call needs the token plus a tenant header:

```js
const res = await fetch(`https://${tenant}.autodeskplm360.net/api/v3/workspaces?offset=0&limit=10`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'x-tenant': tenant,
    Accept: 'application/json',
  },
});
const data = await res.json();
console.log(data.items.map((w) => w.title));
```

If this returns `401`, the token has almost certainly expired — re-run the token exchange above rather than treating it as a permissions problem (see `concepts/errors`).

## Next steps

- `api/v3/workspaces` — list workspaces and their sub-resources
- `api/v3/search` — find items without knowing an ID
- `guides/working-with-items` — create/update/archive an item end to end

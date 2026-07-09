---
title: Authentication
description: How to obtain and use a Fusion Manage bearer token — the session-cookie exchange, APS OAuth flows, and the legacy localStorage fallback.
---

Fusion Manage's v1 and v3 REST APIs both authenticate with an OAuth2 bearer token. There are three distinct ways to obtain one, depending on what kind of client you're building, plus one legacy fallback.

## 1. Session-cookie token exchange (browser / extension clients)

The simplest and most current approach for anything running inside an authenticated Fusion Manage browser tab (content scripts, bookmarklets, browser extensions). The PLM web app already holds a session; you exchange it for a bearer token via a same-origin call:

```
GET https://{tenant}.autodeskplm360.net/api/v3/token
```

- **Auth:** none needed explicitly — the browser auto-attaches the `JSESSIONID` session cookie because the request is same-origin. Use `credentials: 'same-origin'` (or `'include'`).
- **Response:**
  ```json
  { "accessToken": "eyJ...", "expiresIn": 3599, "tokenType": "Bearer" }
  ```
- **Constraint:** this call must happen from a same-origin context (e.g. a content script running on the PLM page). A browser extension's background/service-worker origin (`chrome-extension://...`) does **not** have the session cookie and will get a 401 — relay the token to the background context via message passing instead of fetching it there directly.
- **Token lifetime:** ~3600 seconds (~60 minutes). Refresh proactively — e.g. 5 minutes before expiry — rather than waiting for a 401.

This is production-verified (against a live tenant, 2026) and is the recommended approach for any UI extension. See the `guides/authentication-quickstart` guide for a minimal working example.

## 2. APS 3-legged OAuth (external / server-side clients)

For a standalone client that isn't running inside an authenticated PLM browser session (e.g. a backend service, a desktop add-in, an MCP server), use Autodesk Platform Services' standard Authorization Code flow:

```
GET https://developer.api.autodesk.com/authentication/v2/authorize
  ?response_type=code&client_id={CLIENT_ID}&redirect_uri={CALLBACK_URL}&scope=data:read data:write
```

Confirmed by Autodesk's own official Postman collection for this API, which ships a pre-configured OAuth2 flow with `scope: data:read data:write data:search`, `addTokenTo: header` — a real, working token carries additional scopes beyond this (`data:create`, `user:read` were seen on a live token), so treat the scope list as "at least these," not exhaustive.

Exchange the returned code for a token:

```
POST https://developer.api.autodesk.com/authentication/v2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code={auth_code}&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&redirect_uri={CALLBACK_URL}
```

```json
{ "access_token": "eyJ...", "token_type": "Bearer", "expires_in": 3600, "refresh_token": "eyJ..." }
```

Refresh with `grant_type=refresh_token`. **Access tokens expire in 60 minutes; refresh tokens are valid for 15 days.**

## 3. APS 2-legged client-credentials (admin / impersonation)

A separate, distinct credential type used specifically for admin tooling that needs to act as another user (e.g. bulk admin operations, impersonation):

```
POST https://developer.api.autodesk.com/authentication/v2/token
grant_type=client_credentials
```

The resulting token is combined with an `X-User-Id` header to impersonate a specific user on subsequent calls. See `api/v3/admin-impersonation` for the full flow — don't conflate this with flows 1 and 2 above, since it's a fundamentally different credential (app-level, not user-session-derived).

## 4. Legacy fallback: `localStorage['O2AuthToken']`

Older tenant versions wrote the active token to `localStorage['O2AuthToken']` instead of exposing the `/api/v3/token` endpoint. The stored value may be a raw string, a JSON-quoted string, or an object with one of `access_token` / `accessToken` / `token` / `O2AuthToken`. Treat this as a fallback only — prefer the `/api/v3/token` exchange (flow 1) when it's available, and fall back to scanning `localStorage` only if that endpoint 404s.

## Required headers

Once you have a token, every API call needs:

```http
Authorization: Bearer {access_token}
x-tenant: {tenant_name}
Accept: application/json
Content-Type: application/json
```

`x-tenant` is the tenant's subdomain — e.g. `acmecorp` in `acmecorp.autodeskplm360.net`.

## Token lifecycle and 401s

A 401 almost always means an expired token, not a permissions problem — refresh and retry rather than treating it as a hard failure. If a session-derived token (flow 1) starts failing, the user's underlying PLM browser session has likely expired too; they need to reload a Fusion Manage tab to re-authenticate before token refresh will succeed again.

:::tip[Confirmed live — 2026-07-08]
Live-tested directly against a real tenant: both v1 and v3 endpoints (including the token/session model) work correctly on `{tenant}.autodeskplm360.net`. The `{tenant}.autodeskplm.com` host described by some documentation was never confirmed and should be treated as incorrect (or at best an alternate/legacy alias) — see `concepts/versioning`.
:::

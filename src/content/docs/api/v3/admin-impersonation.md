---
title: Admin Impersonation
description: The separate APS 2-legged client-credentials flow used to act as another user for admin operations, via the X-User-Id header.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-orange-low);color:var(--sl-color-orange-high)">Derived from client source — not yet live-verified</span></p>
<!-- verification-badge:end -->

A fundamentally different credential type from everything in [Authentication](/concepts/authentication/) flows 1 and 2 — this is an **app-level** credential (client ID + secret, no user session involved at all), used specifically for admin tooling that needs to act as a user other than whoever is logged in. Sourced from a production Chrome extension's admin-utilities feature set.

## Get the token

```
POST https://developer.api.autodesk.com/authentication/v2/token
Content-Type: application/x-www-form-urlencoded

client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&grant_type=client_credentials&scope=data:read data:write
```
```json
{ "access_token": "...", "token_type": "Bearer", "expires_in": 3600 }
```

Confirmed working in a production extension's "Validate APS Credentials" step (used there just to confirm the client ID/secret are valid before enabling further admin actions).

## Use it to impersonate another user

Combine the resulting bearer token with an `X-User-Id` header naming the user to act as:

```
Authorization: Bearer {access_token}
X-User-Id: {targetUserId}
```

:::caution[Confirmed live — 2026-08-31: `X-User-Id` is silently ignored by a user token]
Tested with an ordinary **3-legged user** token: sending
`X-User-Id: {anotherUserId}` on `GET /api/v3/users/@me` returned `200` and
resolved as **the token's own user**, not the named one. Same result with
lowercase `x-user-id`.

There is no error, no warning, and no effect. That is the dangerous part: an
admin tool built on a user token will appear to work while operating as the wrong
user, and nothing in the response says so.

Impersonation therefore depends on the credential, not the header — the header
alone does nothing. It presumably requires the 2-legged client-credentials token
above, which **could not be verified here** (no client secret was available). So:
- Do not assume `X-User-Id` works because the request succeeded. Assert the
  effective user (e.g. re-read `users/@me`) before trusting an impersonated write.
- The specific endpoints that honour it, and whether it is needed per-call or
  per-session, remain unconfirmed.
:::

Don't reuse this flow for anything other than genuine admin/impersonation use cases — it bypasses per-user session auth entirely, so scope its use narrowly and treat the client secret as a high-value credential (the source extension explicitly warns against ever committing it).

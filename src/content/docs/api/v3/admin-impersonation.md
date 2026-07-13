---
title: Admin Impersonation
description: The separate APS 2-legged client-credentials flow used to act as another user for admin operations, via the X-User-Id header.
---

A fundamentally different credential type from everything in `concepts/authentication` flows 1 and 2 — this is an **app-level** credential (client ID + secret, no user session involved at all), used specifically for admin tooling that needs to act as a user other than whoever is logged in. Sourced from a production Chrome extension's admin-utilities feature set.

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

:::caution
The exact combined request (which specific endpoint accepts `X-User-Id`, and whether it's needed on every call or just ones that create/modify records "as" another user) wasn't found verbatim in the source examined — only described conceptually, in the context of an admin "Copy Workspace Views" feature that needs to create views owned by a specific target user rather than the admin running the tool. Confirm the exact header/endpoint combination before relying on this for a new integration.
:::

Don't reuse this flow for anything other than genuine admin/impersonation use cases — it bypasses per-user session auth entirely, so scope its use narrowly and treat the client secret as a high-value credential (the source extension explicitly warns against ever committing it).

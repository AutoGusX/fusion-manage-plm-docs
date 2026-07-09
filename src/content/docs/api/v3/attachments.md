---
title: Attachments
description: The full attachment lifecycle — list, upload (3-step S3 flow), check-in/check-out, version history, and delete — from a detailed Word add-in spec and Autodesk's official Postman collection.
---

## List and get

| Purpose | Endpoint |
|---|---|
| List attachments | `GET /api/v3/workspaces/{ws}/items/{itemId}/attachments?asc=name`, `Accept: application/vnd.autodesk.plm.attachments.bulk+json` |
| Get one attachment | `GET /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}` — use this when the list response's `url` isn't usable; this endpoint's `fileUrl` is a fresher pre-signed link |
| Version history | `GET /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}/history` — array of attachment objects (same shape as list), ordered by version |

Each attachment has `id`/`selfLink`, `name`, `url` (pre-signed S3 GET), `version`, `description`, `status`, `created`, `checkOut`, `type`, `resourceName`, `size`.

:::caution
**Download the `url`/`fileUrl` with no `Authorization` header** — it's a pre-signed S3 URL, not a Fusion Manage endpoint. Sending a Bearer token to S3 doesn't help and the URL's query-string order must be preserved exactly as returned; some HTTP clients reorder query params and invalidate the S3 signature.
:::

## Upload — 3-step flow

**Step 1 — create a placeholder and get an S3 upload URL:**
```
POST /api/v3/workspaces/{ws}/items/{itemId}/attachments        (new attachment)
POST /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}   (new version of an existing attachment)
```
Response: `id` (new attachment id), `url` (pre-signed S3 PUT URL), `extraHeaders` (e.g. `x-amz-meta-filename`, `x-amz-meta-fileurn`) — pass these headers through unmodified on step 2.

**Step 2 — upload the file bytes directly to S3:**
```
PUT {url from step 1}
Headers: {extraHeaders from step 1}   (x-amz-meta-filename, x-amz-meta-fileurn, etc.)
Body: raw file bytes
```
Do **not** send an `Authorization` header here — S3 doesn't want your Fusion Manage bearer token, and sending one can break the pre-signed-URL auth. A `200` from S3 means the upload succeeded.

**Step 3 — check in to finalize the version:**
```
PATCH /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}
Body: {"status":{"name":"CheckIn"}}
```

## Check-out / check-in status

```
PATCH /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}
Body: {"status":{"name":"CheckOut"}}   or   {"status":{"name":"CheckIn"}}
```

**Bulk alternative** (also used for delete — see below) — a single JSON-Patch-style PATCH against the attachments collection itself, targeting one or more attachments by ID in the path:
```
PATCH /api/v3/workspaces/{ws}/items/{itemId}/attachments
Body: [{ "op": "replace", "path": "/attachments/{attachmentId}/status/name", "value": "CheckOut" }]
```

## Delete

:::tip[Confirmed from Autodesk's official Postman collection]
Attachment deletion uses the same bulk JSON-Patch mechanism as check-in/check-out, with `"value": "Delete"` — and supports multiple attachments in one call:
```
PATCH /api/v3/workspaces/{ws}/items/{itemId}/attachments
Body: [
  { "op": "replace", "path": "/attachments/{attachmentId1}/status/name", "value": "Delete" },
  { "op": "replace", "path": "/attachments/{attachmentId2}/status/name", "value": "Delete" }
]
```
This is a distinct mechanism from item-level soft-delete (`?deleted=true` query param — see `api/v3/items`); attachments use a status-name JSON-Patch instead.
:::

## Manifest / CORS note (browser clients)

If uploading directly from a browser (Chrome extension, SPA), the client's manifest/CSP needs to allow the S3 bucket domain (e.g. `https://*.s3.amazonaws.com` or the specific bucket host returned in the pre-signed URL) for the step-2 `PUT` to succeed.

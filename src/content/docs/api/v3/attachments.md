---
title: Attachments
description: The full attachment lifecycle — list, upload (3-step S3 flow), check-in/check-out, version history, and delete — from a detailed Word add-in spec and Autodesk's official Postman collection.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-blue-low);color:var(--sl-color-blue-high)">From Autodesk's official collection — not yet live-verified</span></p>
<!-- verification-badge:end -->

## List and get

| Purpose | Endpoint |
|---|---|
| List attachments | `GET /api/v3/workspaces/{ws}/items/{itemId}/attachments?asc=name`, `Accept: application/vnd.autodesk.plm.attachments.bulk+json` |
| Get one attachment | `GET /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}` — use this when the list response's `url` isn't usable; this endpoint's `fileUrl` is a fresher pre-signed link |
| Version history | `GET /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}/history` — array of attachment objects (same shape as list), ordered by version |

Each attachment has `selfLink`, `urn`, `id`, `name`, `url` (pre-signed S3 GET), `description`, `version`, `status` (an object: `{ name, label, description }`), `type`, `resourceName`, `created`, `folder`, `size`, plus `thumbnails`, `markups`, and `scanStatus`.

:::caution[Confirmed live — 2026-08-31: the empty-list response has three different shapes]
`GET …/attachments` does **not** reliably return an `attachments` array. Observed
on one tenant, same endpoint:

| Case | Response |
|---|---|
| Item has attachments | `200` `{ "item": {…}, "attachments": [ … ] }` |
| Item never had attachments, **plain** `Accept: application/json` | `200` `{ "url": "…" }` — an S3 *upload* URL, and **no `attachments` key at all** |
| Attachments existed and were deleted, **bulk** `Accept` | `204`, empty body |

So `response.attachments.length` throws in two of the three cases, and `.url`
means something completely different from the `url` on an attachment object.
Guard with `(response?.attachments ?? [])` and treat `204` as zero.
:::

:::tip[Confirmed live — sending a Bearer token to S3 actually breaks the download]
This was previously advisory. Tested directly: fetching an attachment's
pre-signed `url` **without** an `Authorization` header returned `200` and the
correct bytes; the identical request **with** `Authorization: Bearer …` returned
`400`.

So it is not merely unnecessary — an auth header makes the download fail. Strip it
explicitly for S3 requests if your HTTP client attaches one globally, which most
do. Preserve the query-string order as returned, too; reordering invalidates the
signature.
:::

## Upload — 3-step flow

:::tip[Confirmed live end-to-end — 2026-08-31]
All three steps were exercised against a disposable item: placeholder `201`, S3
`PUT` `200`, check-in `200`, and the file then downloaded back byte-for-byte
before being deleted. The exact bodies below are the ones that worked.
:::

**Step 1 — create a placeholder and get an S3 upload URL:**
```
POST /api/v3/workspaces/{ws}/items/{itemId}/attachments        (new attachment)
POST /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}   (new version of an existing attachment)
```
```json
{
  "description": "…",
  "name": "myfile.txt",
  "folder": null,
  "resourceName": "myfile",
  "size": 27
}
```
Response `201`: `id` (new attachment id), `url` (pre-signed S3 PUT URL), and
`extraHeaders` — pass those through unmodified on step 2. On the tested tenant
`extraHeaders` was `{"x-amz-meta-filename": "myfile.txt"}`; treat it as an opaque
map rather than a fixed set. The new attachment's URL is also in the `Location`
header.

:::caution[The validation errors here name fields that don't exist]
Getting this body wrong produces messages that point at the wrong thing:

- Omitting `name` → `400 "Attachment title cannot be empty"` — there is no
  `title` field; it means `name`.
- Sending `title` instead of `name` → `400 "File name cannot be empty"`.
- Sending both `title` and `name` → back to `"Attachment title cannot be empty"`.

Use exactly the five keys above. Also note `size` is taken from what you declare,
not measured from the bytes: a placeholder declaring `27` still reported `size: 27`
after a 28-byte upload, so send the real length.
:::

**Step 2 — upload the file bytes directly to S3:**
```
PUT {url from step 1}
Headers: {extraHeaders from step 1}   (x-amz-meta-filename, x-amz-meta-fileurn, etc.)
Body: raw file bytes
```
Do **not** send an `Authorization` header here — see the confirmed download
result above; an auth header makes S3 reject the request. A `200` from S3 means
the upload succeeded.

**Step 3 — check in to finalize the version:**
```
PATCH /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attachmentId}
Body: {"status":{"name":"CheckIn"}}
```
Returns `200` with the full attachment object (not `204`). After check-in the
attachment lists with `version: 1` and `status.name: "CheckIn"`.

Until step 3 the attachment is not really there: between steps 1 and 2 the item's
attachment list can still read as empty, so don't treat a successful step 1 as a
created attachment.

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

:::tip[Confirmed live — 2026-08-31]
Attachment deletion uses the same bulk JSON-Patch mechanism as check-in/check-out, with `"value": "Delete"` — and supports multiple attachments in one call:
```
PATCH /api/v3/workspaces/{ws}/items/{itemId}/attachments
Body: [
  { "op": "replace", "path": "/attachments/{attachmentId1}/status/name", "value": "Delete" },
  { "op": "replace", "path": "/attachments/{attachmentId2}/status/name", "value": "Delete" }
]
```

Returns `200` with a **per-operation result array**, not a bare status — so a
partial failure is reported inside a `200` and you must inspect it:

```json
[ { "path": "/attachments/{attachmentId}/status/name", "value": "Delete",
    "result": "SUCCESS", "duration": 27 } ]
```

Check every entry's `result`; don't infer success from the HTTP status alone.
This is a distinct mechanism from item-level soft-delete (`?deleted=true` query param — see [Items](/api/v3/items/)); attachments use a status-name JSON-Patch instead.
:::

## Manifest / CORS note (browser clients)

If uploading directly from a browser (Chrome extension, SPA), the client's manifest/CSP needs to allow the S3 bucket domain (e.g. `https://*.s3.amazonaws.com` or the specific bucket host returned in the pre-signed URL) for the step-2 `PUT` to succeed.

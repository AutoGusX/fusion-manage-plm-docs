---
title: Errors
description: The standard Fusion Manage error envelope, the HTTP status code table, and which errors are actually recoverable rather than fatal.
---

## Error envelope

**Verified live** (2026-07-08, against a real v3 endpoint on a live tenant) — the actual shape is:

```json
{
  "statusCode": 404,
  "errors": ["NOT_FOUND"],
  "message": "Item 999999999 was not found"
}
```

i.e. `statusCode` + `errors` (an array of code strings) + a human-readable `message` — **not** the nested `{"error": {"code", "message", "details"}}` shape that older internal reference docs describe. Confirmed for both 403 and 404 responses on v3 endpoints; treat the nested-`error`-object shape as unverified/likely-outdated until seen in practice.

**More distinct shapes were found live, on top of the one above — this API does not use one consistent error envelope:**

- **v1 field-validation errors** use yet another shape entirely: `{"httpStatusCode": 400, "error": [{"fieldId": "TITLE", "message": "Title is required."}]}` (an array of per-field problems, confirmed on `POST /api/rest/v1/workspaces/{ws}/items`).
- **v3 opaque server errors** (confirmed on a malformed `POST /api/v3/workspaces/{ws}/items`) can return: `{"errorCode": "UNKNOWN", "message": "Unknown error.", "params": null, "url": null, "errorClass": "APIError"}`, unfortunately not useful for diagnosing what was actually wrong with the request.
- **`GEN_INVALID_INPUT_SCHEMA`** (same `errorCode`/`message`/`params`/`url`/`errorClass` shape as above, `message: "Incorrect payload"`) is what several bulk array-body endpoints (Managed Items add, Grid tab add rows) return when the array contains **relative paths instead of absolute URLs** — see `api/v3/relationships-and-affected-items` and `api/v3/views-fields-tableaus`. This is the most actionable of the opaque errors: if you see it on an endpoint expecting an array of item/field links, try fully-qualified URLs before anything else.

Don't write error-parsing code that assumes a single envelope shape across this API — check `statusCode`/`httpStatusCode`/`errorCode`/absence of all three, and branch accordingly.

| HTTP | Example `errors[]` value | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or invalid field values |
| 401 | `UNAUTHORIZED` | Invalid or expired token |
| 403 | `FORBIDDEN` | Insufficient permissions — **but see the caveat below, not all 403s mean this** |
| 404 | `NOT_FOUND` | Workspace, item, or attachment not found |
| 409 | `CONFLICT` | Workflow step conflict (e.g. `workflowStep` isn't current step + 1) |
| 500 | `SERVER_ERROR` | Fusion Manage internal error |

## 401: almost always an expired token

In practice, a 401 on an otherwise-working integration means the bearer token expired, not that the credentials are wrong. Refresh the token (see `concepts/authentication`) and retry before treating a 401 as a hard failure.

## 403 on certain "view" endpoints means "wrong direction" or "not enabled here," not "forbidden"

A handful of endpoints — change-orders-linked-to-an-item, affected-items-on-a-change-order, and workflow history — are backed by workspace-specific numbered "views" (`views/2`, `views/11`, etc.) that don't exist on every workspace or tenant, or that only make sense in one direction.

**Verified live:** calling `views/11` (affected items) on a plain item returns `403` with `"message": "... access VIEW_WORKFLOW_ITEMS denied. WS: {ws}, dmsID: {id}"`, and calling `views/2` (linked change orders) on a Change Order itself returns `403` with `"... access VIEW_ASSOCIATED_WORKFLOW denied ..."`. In both cases the 403 means "this view doesn't apply to this item type," not a real permissions problem — see `api/v3/relationships-and-affected-items` for the confirmed direction mapping.

A verified-working production client treats a 403 from these specific endpoints as **"this feature/view is not enabled for this workspace"** and returns an empty result instead of propagating a hard error:

```python
except httpx.HTTPStatusError as exc:
    if exc.response.status_code == 403:
        logger.warning("views/%d returned 403 — view may not exist in this workspace", view_id)
        return []  # or {"affectedItems": []}, {"list": {"historySteps": []}}, etc.
    raise
```

When building against these endpoints, mirror this pattern — don't surface a 403 from an optional view as a user-facing error.

## 409 on workflow transitions

`workflowStep` in a transition request body must equal the current step **+ 1**. A 409 here typically means the item has already moved past the step you're targeting (a stale-state race), not a permissions issue.

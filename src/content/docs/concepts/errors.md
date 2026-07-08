---
title: Errors
description: The standard Fusion Manage error envelope, the HTTP status code table, and which errors are actually recoverable rather than fatal.
---

## Error envelope

Errors follow a consistent shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field TITLE is required",
    "details": []
  }
}
```

| HTTP | Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or invalid field values |
| 401 | `UNAUTHORIZED` | Invalid or expired token |
| 403 | `FORBIDDEN` | Insufficient permissions — **but see the caveat below, not all 403s mean this** |
| 404 | `NOT_FOUND` | Workspace, item, or attachment not found |
| 409 | `CONFLICT` | Workflow step conflict (e.g. `workflowStep` isn't current step + 1) |
| 500 | `SERVER_ERROR` | Fusion Manage internal error |

## 401: almost always an expired token

In practice, a 401 on an otherwise-working integration means the bearer token expired, not that the credentials are wrong. Refresh the token (see `concepts/authentication`) and retry before treating a 401 as a hard failure.

## 403 on certain "view" endpoints means "not enabled here," not "forbidden"

A handful of endpoints — change-orders-linked-to-an-item, affected-items-on-a-change-order, and workflow history — are backed by workspace-specific numbered "views" (`views/2`, `views/11`, etc.) that don't exist on every workspace or tenant. A verified-working production client treats a 403 from these specific endpoints as **"this feature/view is not enabled for this workspace"** and returns an empty result instead of propagating a hard error:

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

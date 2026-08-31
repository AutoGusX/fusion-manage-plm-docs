---
title: Troubleshooting
description: Reverse index from the error or status code you actually got to what it really means and how to fix it — every entry observed against a live tenant.
---

This API's errors are frequently misleading: several `500`s are really "you
omitted one field", several `403`s are really "not applicable here", and a `303`
is success. This page goes from **what you saw** to **what it means**.

Every entry below was observed against a live tenant. Response-shape details are
in [Errors](/concepts/errors/); this is the diagnostic path.

## Quick index

| You saw | Most likely cause |
|---|---|
| `400 GEN_INVALID_INPUT_SCHEMA` "Incorrect payload" | Relative paths in a bulk array body — [use absolute URLs](#400-gen_invalid_input_schema-incorrect-payload) |
| `400` "Could not find section … in workspace …" | `PATCH` needs [item-scoped links](#400-could-not-find-section--in-workspace-) |
| `400` "Workspace X is not related to workspace Y" | [Unconfigured relationship pair](#400-workspace-x-is-not-related-to-workspace-y) |
| `400` "Title is required." (on a v1 create) | [v1 item create doesn't work](#400-title-is-required-on-a-v1-create) — use v3 |
| `400` "Comment required for … transition" | Field is [`comment`, singular](#400-comment-required-for--transition) |
| `400` "problem running a custom action" | [A tenant script failed](#400-there-has-been-a-problem-running-a-custom-action), not your payload |
| `400` + an **HTML** error page | [Empty XML body](#400-with-an-html-error-page) on the v1 lifecycle endpoint |
| `401` | [Expired token](#401), almost always |
| `403` "VIEW_WORKFLOW_ITEMS denied" / "VIEW_ASSOCIATED_WORKFLOW denied" | [Wrong view for this item type](#403-view_-denied) |
| `405` on `DELETE` of an item | [There is no hard delete](#405-on-delete) |
| `409` on a lifecycle transition | [Not legal from the current state](#409-on-a-lifecycle-transition) |
| `415 UNSUPPORTED_MEDIA_TYPE` | [Sent a `vnd.…` type as `Content-Type`](#415-unsupported_media_type) |
| `500` on a classification `PATCH` | [Missing `fields: []`](#500-on-a-classification-patch), or already classified |
| `500 UNKNOWN` / `APIError` on item create | [Malformed `sections` body](#500-unknown-on-item-create) |
| `204` where you expected data | [Success-but-empty](#204-where-you-expected-data), not an error |
| `303` on a workflow transition | [That is success](#303-on-a-workflow-transition) |
| A field you expected is missing from a list | [Bulk `Accept` header omitted](#a-field-is-missing-from-a-list-response) |
| Impersonation appears to work but doesn't | [`X-User-Id` silently ignored](#impersonation-silently-does-nothing) |

---

## `400 GEN_INVALID_INPUT_SCHEMA` "Incorrect payload"

**Cause:** an endpoint taking an *array of links* was given relative paths.
Confirmed on Managed Items add and Grid add-rows.

**Fix:** use fully-qualified absolute URLs.

```diff
- ["/api/v3/workspaces/57/items/12345"]
+ ["https://{tenant}.autodeskplm360.net/api/v3/workspaces/57/items/12345"]
```

Autodesk's own Postman examples show the relative form, so this is worth
suspecting first. See [Relationships and Affected Items](/api/v3/relationships-and-affected-items/)
and [Views, Fields, and Tableaus](/api/v3/views-fields-tableaus/).

## `400` "Could not find section … in workspace …"

**Cause:** an item `PATCH` with **workspace-scoped** section/field links.

**Fix:** `PATCH` requires **item-scoped** links (`…/items/{itemId}/views/1/sections/{id}`)
— copy them verbatim from a `GET` on that item. `PUT` accepts either form if you'd
rather not think about it. Create is the opposite: it wants workspace-scoped
links. See [Items](/api/v3/items/).

## `400` "Workspace X is not related to workspace Y"

**Cause:** trying to relate items across a workspace pair that isn't configured
as related — including an item to another item in *its own* workspace.

**Fix:** call `GET /api/v3/workspaces/{ws}/views/10/related-workspaces` first and
only relate to what it lists. If the pair you need isn't there, an integration
can't create it — that's an admin task, since the endpoint is read-only (`405` on
writes). See [Relationships and Affected Items](/api/v3/relationships-and-affected-items/).

## `400` "Title is required." on a v1 create

**Cause:** `POST /api/rest/v1/workspaces/{ws}/items`. This error appears
regardless of payload shape, *including* when `TITLE` is populated — flat map,
`fields: [{fieldID, value}]`, and lowercase keys were all tried.

**Fix:** use the v3 create instead. Item creation is v3-only in practice. See
[Items](/api/v3/items/).

## `400` "Comment required for … transition"

**Cause:** a workflow transition configured to require a comment.

**Fix:** the field is **`comment`** — singular. `comments` and
`workflowComments` both fail with this same message, which makes it look like the
comment isn't being read at all.

```json
{ "comment": "Returning for rework" }
```

See [Workflow](/api/v3/workflow/).

## `400` "There has been a problem running a custom action."

**Cause:** a tenant `onCreate`/`onEdit` script threw. Your request was
well-formed and got far enough to trigger it.

**Fix:** not a payload problem — inspect the workspace's scripts
(see [Scripts](/api/v3/scripts/)). The same request shape may succeed on a
workspace without that script; this was observed with an identical
classification `PATCH` failing on Documents and succeeding on Items.

## `400` with an HTML error page

**Cause:** an empty body on `PUT /api/rest/v1/workspaces/{ws}/items/{id}/lifecycles/transitions/{tid}`.
The response is a Tomcat HTML page, not JSON.

**Fix:** send the XML body. Also make your client tolerate non-JSON error bodies
on this endpoint specifically, or it will fail while parsing the error rather than
reporting it. See [Items](/api/v3/items/).

## `401`

**Cause:** an expired bearer token, in almost every case — not bad credentials or
missing permissions. Tokens last ~60 minutes.

**Fix:** refresh and retry before investigating anything else. If a
session-derived token keeps failing, the underlying PLM browser session has
expired too. See [Authentication](/concepts/authentication/).

## `403` "VIEW_… denied"

**Cause:** usually *not* permissions. These numbered views only apply in one
direction, and the wrong one returns `403`:

| Message | You did | Do instead |
|---|---|---|
| `VIEW_WORKFLOW_ITEMS denied` | `views/11` on a plain item | `views/11` is CO → affected items |
| `VIEW_ASSOCIATED_WORKFLOW denied` | `views/2` on a Change Order | `views/2` is item → linked COs |

**Fix:** check direction first. Also treat `403` from optional views (workflow
history, managed items) as "this feature isn't enabled for this workspace" and
degrade to an empty result rather than surfacing an error. See
[Relationships and Affected Items](/api/v3/relationships-and-affected-items/).

## `405` on `DELETE`

**Cause:** items have no hard delete.

**Fix:** soft-delete with `PATCH /api/v3/workspaces/{ws}/items/{id}?deleted=true`
(and `?deleted=false` to restore). Attachments are different again — they use a
JSON-Patch status change. See [Items](/api/v3/items/) and
[Attachments](/api/v3/attachments/).

## `409` on a lifecycle transition

**Cause:** the transition isn't legal from the item's current state.

**Fix:** check
`GET /api/rest/v1/workspaces/{ws}/items/{id}/lifecycles/transitions` first — it
returns `200` with `{"list": null}` when there is no legal move. That `null` is
the signal. There's no v3 equivalent (it `404`s). See [Items](/api/v3/items/).

## `415 UNSUPPORTED_MEDIA_TYPE`

**Cause:** sending a `vnd.autodesk.plm.*` media type as **`Content-Type`**.

**Fix:** those types are for **`Accept`** only. Keep
`Content-Type: application/json`.

## `500` on a classification `PATCH`

Two distinct causes, same opaque status:

1. **Missing `fields: []`.** The classification section needs an empty `fields`
   array even though you're only setting `classificationId`. Omitting it returns a
   bare `500` with no validation message.
2. **The item is already classified.** Assignment only works while the item
   carries its workspace's default class. Every later change — including
   reverting to the default — returns `500`. Treat classification as set-once.

See [Classifications](/api/v2/classifications/).

## `500 UNKNOWN` on item create

**Cause:** a malformed `sections` body — e.g. a field entry carrying the full
object returned by `GET`, rather than just `{ __self__, value }`.

**Fix:** reduce each field to exactly `__self__` and `value`, and use
workspace-scoped links. See [Items](/api/v3/items/).

## `204` where you expected data

`204` is success-with-no-content, not an error:

- Search with no matches returns `204` and an **empty body** — no `items[]`, no
  `totalCount`. Handle it as zero results.
- `views/2` on an item with no linked change orders returns `204`.
- Most successful `PATCH`/`PUT`/`DELETE` calls return `204`. Re-read the record
  if you need the new state.

## `303` on a workflow transition

**That is success.** A performed workflow transition returns `303`, not `2xx`.
Don't treat it as a redirect to follow or as a failure. See
[Workflow](/api/v3/workflow/).

## A field is missing from a list response

**Cause:** the bulk `Accept` header was omitted. On `/sections` it changes the
response *shape*, not just its size — without it you get only
`link`/`urn`/`title`/`deleted`, and `sectionType` is invisible.

**Fix:** send `Accept: application/vnd.autodesk.plm.<resource>.bulk+json`.
Suspect this before concluding the API doesn't expose a field. See
[Workspaces](/api/v3/workspaces/).

## Impersonation silently does nothing

**Cause:** `X-User-Id` with a 3-legged **user** token. The call returns `200` and
resolves as the token's own user — no error, no warning.

**Fix:** impersonation depends on the credential (2-legged client-credentials),
not the header. Assert the effective user by re-reading `users/@me` before
trusting an impersonated write. See [Admin Impersonation](/api/v3/admin-impersonation/).

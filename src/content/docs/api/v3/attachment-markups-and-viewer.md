---
title: Attachment viewer and markups
description: How to view a CAD attachment with the APS Viewer and read, create, edit, and delete the markup layers Fusion Manage stores on it — the viewable endpoint, the markups REST shape, and the anchor coordinate space.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->

Fusion Manage's own file viewer is the APS (Forge) Viewer plus two FM extensions. Everything it does is
reachable from a browser with an ordinary user token, so a custom client (here, a supplier portal SPA) can show
the same files and the same markups with no Model Derivative job, no storage bucket, and no credits of its own.

Two endpoints do the work, both under an attachment:

| Purpose | Endpoint |
|---|---|
| Get the viewer URN for an attachment | `GET /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attId}`, `Accept: application/vnd.autodesk.plm.attachment.viewable+json` |
| List markup layers | `GET /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attId}/markups` |
| Create a layer | `POST …/attachments/{attId}/markups` |
| Edit a layer | `PUT …/attachments/{attId}/markups/{n}` |
| Delete a layer | `DELETE …/attachments/{attId}/markups/{n}` |

Attachment ids come from the list call in [Attachments](/api/v3/attachments/).

## Viewing: the viewable endpoint

:::tip[Confirmed live — 2026-09-29]
`GET …/attachments/{attId}` with the `viewable+json` Accept returns Fusion Manage's *own* derivative for the file.
This is exactly what FM's `fileViewer` page calls. Tested with a user's 3-legged token (scopes `data:read data:write
data:create data:search` — no `viewables:read`), including cross-origin from a non-tenant origin.
:::

```http
GET /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attId}
Authorization: Bearer {token}
Accept: application/vnd.autodesk.plm.attachment.viewable+json
```

```json
{ "fileUrn": "dXJuOmFkc2suc...", "fileName": "bracket.dwf", "environment": "…",
  "viewerName": "LMV", "status": "DONE" }
```

| Field | Meaning |
|---|---|
| `fileUrn` | Base64 of `urn:adsk.plm:flc.file.s3:{tenant}.autodeskplm360.net/{bucket}/{key}`. This is the URN you give the Viewer. |
| `viewerName` | `LMV` for CAD (DWF, DWG, STEP, …) — the APS Viewer. `BOX` for documents (PDF, DOCX, XLSX) — not an APS Viewer file. |
| `status` | `DONE` or `REGISTERING`. |
| `eventId` | Present while registering. FM's UI waits on a server-sent event for it. |

`?force=true` re-registers the file.

:::caution[The GET itself starts the translation]
Asking about an attachment nobody has viewed yet returns `200` with `REGISTERING` — and that request is what
kicks off the translation. You do not trigger anything separately. Poll the same GET every few seconds until
`DONE`. Observed on the demo tenant: a DWF finished in about 90 seconds, a DWG in about two minutes.
Before the first viewable GET, the manifest for an untranslated file is `404 null`.
:::

### Loading the Viewer

Once `status` is `DONE`, the standard APS Viewer initialiser works with the user's own token — no custom endpoint
plumbing:

```js
Autodesk.Viewing.Initializer(
  { env: 'AutodeskProduction', api: 'derivativeV2', getAccessToken: (cb) => cb(userToken, 3600) },
  () => {
    const viewer = new Autodesk.Viewing.GuiViewer3D(container);
    viewer.start();
    Autodesk.Viewing.Document.load('urn:' + fileUrn, (doc) => {
      viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
    });
  },
);
```

:::note[Confirmed live — 2026-09-29]
| Call | Result |
|---|---|
| `GET https://cdn.derivative.autodesk.com/modeldata/manifest/{fileUrn}` (what FM's viewer loads) | `200` with the user's token; CORS allows the calling origin. Lists an SVF geometry and a property database. |
| `GET https://developer.api.autodesk.com/modelderivative/v2/designdata/{fileUrn}/manifest` | `200` with the same token — which is why the standard `derivativeV2` initialiser works. |
| `GET …/derivativeservice/v2/thumbnails/{fileUrn}?width=200&height=200` | `200 image/png`, CORS allowed — usable for file-list thumbnails. |
| `POST developer.api.autodesk.com/modelderivative/v2/designdata/job` with an FM `fileUrn` | `400 "Failed to trigger translation for this file."` — not your object, and not needed. |
| Viewer library `developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js` | `200`, ~950 KB, public. Load it on demand. |

If you serve a Content-Security-Policy, `script-src`, `style-src`, `connect-src`, `img-src`, and `worker-src` need
`developer.api.autodesk.com` and `cdn.derivative.autodesk.com` (the Viewer's workers are `blob:` URLs).
:::

:::caution[Attempted, inconclusive]
**Documents (`viewerName: BOX`).** PDF, DOCX and XLSX attachments were still `REGISTERING` after two minutes, so
the `DONE` response shape for `BOX` was never observed (an embed URL, presumably). Treat `BOX` as "download or
preview natively" until it is confirmed.
:::

## Reading markups

```http
GET /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attId}/markups
Authorization: Bearer {token}
```

:::tip[Confirmed live — 2026-09-29, re-probed 2026-10-02]
The response is a **bare JSON array** of layers (not an envelope). Nine layers on a real marked-up STEP file came
back as `200`, 1.1 MB, 0.8 s.
:::

```json
[
  {
    "id": 3,
    "selfLink": "/api/v3/workspaces/{ws}/items/{itemId}/attachments/{attId}/markups/3",
    "urn": "urn:adsk.plm:tenant.workspace.item.attachment.markup:{TENANT}.{ws}.{itemId}.{attId}.3",
    "allowModify": true,
    "allowDelete": true,
    "lastModified": "2026-09-29T14:02:11.000Z",
    "createdBy": {
      "user": { "link": "…", "urn": "…", "title": "Jane Doe", "status": "…", "email": "…", "image": "…" },
      "timeStamp": "2026-09-29T14:02:11.000Z"
    },
    "markupData": "{\"Data\":{…},\"Thumbnail\":\"/9j/4AAQ…\",\"ThumbnailFullSize\":\"/9j/4AAQ…\"}"
  }
]
```

| Field | Notes |
|---|---|
| `allowModify`, `allowDelete` | The API's own per-layer gates. Drive your Edit and Delete buttons from them rather than inferring from licence. |
| `markupData` | A **JSON string**, not an object. Parse it once. |
| `urn` | Contains the tenant name in clear. |

:::caution[Gotchas, all live-observed]
- **There is no lighter list.** The same URL with a `…markups.bulk+json` Accept returns `406`. Every layer's
  full-size JPEG is inline, so the list is heavy (1.1 MB for nine layers). Slim it before storing it anywhere.
- **A non-existent attachment id returns `500`, not `404`.** A client that treats markups as optional should
  fail open on either.
- A layer whose `markupData` does not parse should still be listed (title, author, date) rather than failing the
  whole call.
:::

### `markupData`, parsed

```json
{
  "Data": {
    "title": "Check clearance",
    "is2d": false,
    "sheetGUID": "…",
    "sheetName": "Scene",
    "viewerState": { "version": "2.0", "seedURN": "{fileUrn}", "objectSet": [], "viewport": {}, "renderOptions": {}, "cutplanes": [] },
    "markups": [
      { "type": "arrow", "dataModelVersion": 6,
        "state": { "anchors": [{ "x": 1170.2, "y": 131.8, "z": 0 }, { "x": 756.7, "y": 177.1, "z": 0 }],
                   "style": { "stroke-color": "#ff00ff", "stroke-width": 55 },
                   "translation": { "x": 0, "y": 0, "z": 0 }, "scale": { "x": 1, "y": 1, "z": 1 } } }
    ]
  },
  "Thumbnail": "<base64 JPEG>",
  "ThumbnailFullSize": "<base64 JPEG>"
}
```

- **`Data.viewerState`** is a verbatim `viewer.getState()` result. Hand it to `viewer.restoreState()` to put the
  camera, section planes, and isolated objects back exactly as the author had them. `seedURN` equals the
  attachment's `fileUrn`.
- **`Thumbnail` / `ThumbnailFullSize`** are base64 JPEGs (no `data:` prefix) of the marked-up view as the author saw
  it. The full-size one is the same aspect ratio as the saved viewport (1398 × 861 in the capture).
- **`sheetName`** is `"Scene"` for 3D files. `is2d` and `sheetGUID` identify the sheet for 2D drawings.

### Shape types

`markups[i]` is `{ type, state, dataModelVersion: 6 }`. These types were observed:

| `type` | `state.anchors` | Extra |
|---|---|---|
| `freehand` | The stroke's points (dozens) | |
| `arrow` | 2 points, **tail → head** (`anchors[1]` is the arrowhead) | |
| `rectangle`, `cloud` | 4 corners of the box, clockwise from one corner | |
| `callout` | 4 corners of the text box | `text`, `isFrameUsed: true`, `frameType: "rectangle"` |
| `simple-arrow-callout` | `[]` — this is a **group** | `uuid`; the next `arrow` (`groupOrder: 0`) and `callout` (`groupOrder: 1`) carry `groupId` equal to that `uuid`. The callout child has a non-zero `translation.x`: its offset from the arrow head. |

Anything outside this list should be treated as unknown and shown from the JPEG snapshot instead.

`state.style` uses MarkupsCore's own keys: `stroke-color`, `stroke-width`, `stroke-opacity`, `fill-color`
(`"-1"` means none), `fill-opacity`, `font-size`, `font-family` (`"Artifakt Element, Arial"`), `font-style`,
`font-weight`, `font-color`.

### Anchor coordinate space

:::tip[Confirmed live — 2026-09-29, pixel-fitted against FM's own snapshot]
Connected coloured regions in FM's `ThumbnailFullSize` JPEG were matched to the layer's shapes. One affine rule
fit every shape to about a pixel (for an 861 px tall snapshot: `px = 0.861·x + 268`, `py = 861 − 0.861·y`).
:::

- Anchors are **absolute**, centred at **(500, 500)**.
- The canvas **height** spans **1000 units**, whatever the aspect ratio. So `k = canvasHeight / 1000`,
  `px = canvasWidth/2 + (x − 500)·k`, and `py = canvasHeight/2 − (y − 500)·k`.
- **y points up.** `z` is always `0`.
- `stroke-width` and `font-size` are in the **same units** as the anchors.
- `translation` shifts a shape's anchors; apply it before converting.
- FM's own snapshot renderer **drops callout text** (the frames are empty in its JPEGs). A client that wants text
  has to draw the shapes itself.

:::caution[MarkupsCore's units are not canvas pixels]
If you draw with the Viewer's `Autodesk.Viewing.MarkupsCore` extension, its internal space is **normalised to 2000
units of canvas height**, independent of aspect ratio (calibration on a 919 × 936 canvas: 2.1368 units per pixel on
both axes = 2000 / 936). Assuming one unit per pixel put a client's markups at the wrong scale in FM and FM's layers
off-canvas in the client. Convert through the extension's `clientToMarkups`, `markupsToClient`, and
`sizeFromClientToMarkups` helpers rather than doing the arithmetic yourself, and keep your own geometry in canvas
pixels.
:::

## Writing markups

:::tip[Confirmed live — 2026-09-30]
POST, PUT and DELETE were each exercised from a custom client on the demo tenant with a Participant-licensed user.
A Participant licence is enough to create markups; FM's own UI loads `VaultMarkupsUI.js` and `BimMarkups.js` from
`/plm/extensions/` on top of the Viewer.
:::

### Create

```http
POST /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attId}/markups
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "Data": {
    "title": "Check clearance",
    "is2d": false,
    "sheetGUID": "…",
    "sheetName": "Scene",
    "viewerState": { "…": "viewer.getState() output" },
    "markups": [ { "type": "rectangle", "dataModelVersion": 6, "state": { "…": "…" } } ]
  },
  "Thumbnail": "<base64 JPEG, no data: prefix>",
  "ThumbnailFullSize": "<base64 JPEG, no data: prefix>"
}
```

Note that on **write** `Data` is a real **object**, even though on **read** the whole `markupData` is a JSON
string.

Response: `201`, empty body, and the new layer number in `Location: …/markups/{n}`.

### Edit

```http
PUT /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attId}/markups/{n}
```

Same body plus `"Id": n`. It replaces the layer. Only offer it where the layer's `allowModify` is `true`. A PUT
from a custom client saved successfully on 2026-09-30; the exact success status code was not recorded.

### Delete

```http
DELETE /api/v3/workspaces/{ws}/items/{itemId}/attachments/{attId}/markups/{n}
```

`204`. Only offer it where `allowDelete` is `true`.

:::note
FM's own React bundle also exposes `publishLayer`, `archiveLayer`, and `postDocumentAttachment` on its
`MarkupService`. Those endpoints were not captured or tested.
:::

## Drawing markups with MarkupsCore

If you want a client to author or redraw layers, these were the non-obvious findings (all live, 2026-09-30):

1. **Read-only display.** Edit-layer shapes vanish from view once `leaveEditMode()` runs. Draw in edit mode,
   serialise with `generateData()`, call `leaveEditMode()`, then reload the SVG with
   `loadMarkups(svg, '{layerId}')` — the documented view-mode path.
2. **`CreateArrow` takes tail, then head.** Passing them the other way round draws reversed arrows.
3. **Style applies to the next shape, plus the selected one.** MarkupsCore resets to its red default after every
   tool change and every creation, so re-apply your colour and width each time.
4. **Callout text size.** FM's `font-size` is in anchor units (36 rendered as 31 px in an 861 px snapshot), but FM
   stores a much smaller box than the text needs. MarkupsCore shrinks text to fit the box, so grow the box to fit
   the text at FM's size or the text comes out tiny.
5. **Snapshots.** `renderToCanvas` leaves the marked-up view bare. If you need your own thumbnails, paint the shapes
   onto the canvas yourself, text included.

:::caution[Not yet confirmed]
- Text size in FM after a layer saved by a custom client.
- Freehand `locations` relative to `position`, and `scale` handling in FM.
- Layers whose `type` is not in the table above.
:::

## Hygiene

`seedURN` base64-decodes to `urn:adsk.plm:flc.file.s3:{tenant}.autodeskplm360.net/…`, and each layer's `urn`
carries the tenant name in clear. Any capture of a real markup response identifies the tenant — build test
fixtures from synthetic data and never commit captures.

See also: [Attachments](/api/v3/attachments/) for listing and uploading the files these layers sit on, and
[Errors](/concepts/errors/) for the envelope shapes.

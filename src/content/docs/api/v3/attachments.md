---
title: Attachments
description: The full attachment lifecycle, including the 3-step S3 upload flow (placeholder, upload, check-in).
---

:::note[Coming soon]
This page is a placeholder. Content will cover the full attachment lifecycle — list, get, create, new-version, check-in/check-out — anchored on the worked 3-step S3 upload flow: `POST` a placeholder → `PUT` bytes directly to S3 (no bearer token, exact `x-amz-meta-*` headers) → `PATCH` to check in.

**Primary source to author from:** `SPECIFICATION-Fusion-Manage-Word-Document-Management.md` §5.3/§5.4 (PLM Office add-ins project) — the richest, most concrete worked example found across all mined sources. Cross-check against the ECO Crawler extension's attachment-upload section and `plm.js`'s `getAttachments`/`uploadAttachments`/`downloadAttachment`/`exportAttachments`/`importAttachment`.
:::

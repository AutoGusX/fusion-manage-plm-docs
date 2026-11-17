---
title: Workflow definitions
description: Read and replace a workspace's whole workflow (states, transitions, workflow permissions) as JSON through the legacy /api/rest/workflows route, with a normal bearer token. Confirmed live 2026-11-17.
---

<!-- verification-badge:begin -->
<p style="margin:0 0 1rem"><span style="display:inline-block;padding:.25rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;line-height:1.4;background:var(--sl-color-green-low);color:var(--sl-color-green-high)">Verified against a live tenant</span></p>
<!-- verification-badge:end -->

Workflow Manager's editor looks like an old server-rendered page
(`/workflowEditor.form`), but it loads and saves the workflow as **JSON** through
a legacy REST route on the tenant host. That route accepts an ordinary 3-legged
bearer token, so a workflow can be configured by API.

v3 only *reads* workflows: `GET /api/v3/workspaces/{ws}/workflows/1/states` and
`…/transitions` answer `OPTIONS` with `HEAD,GET` (plus the `POST` that performs a
transition), and the [route map](/reference/route-map/) has no write for either.
See [Workflow](/api/v3/workflow/) for the v3 reads.

| Purpose | Endpoint |
|---|---|
| Read a workflow | `GET /api/rest/workflows/{ws}.json` |
| Replace a workflow | `PUT /api/rest/workflows/{ws}` |
| Escalations on a state | `GET /api/v2/schedulers/eventCategory/WORKFLOW/resource/{stateId}` |

Host is the tenant (`https://{tenant}.autodeskplm360.net`), not the APS gateway
the rest of this section uses. The workflow ID **is the workspace ID**.

:::note[How this was found]
From a HAR recorded while editing a scratch workspace's workflow in the admin
UI. The browser sends the session cookie and `X-Requested-With: XMLHttpRequest`.
The same calls were then repeated on a second tenant with only a bearer token.
:::

## Reading a workflow

`GET /api/rest/workflows/{ws}.json` returns `{ "workflow": { … } }` with:

| Key | Contents |
|---|---|
| `states` | `stateID`, `customID`, `shortName`, `lockStateID`, `cmStateID`, `hidden`, and the editor's `coordinateX`/`coordinateY`/`width`/`height` |
| `transitions` | `transitionID`, `customID`, `shortName`, `fromState`, `toState`, `permissionID`, `escalationPermissionId`, `email`, `outstanding`, `notifyPerformers`, `passwordApproval`, `commentsForApproval`, `scriptConditionId`, `scriptValidationId`, `scriptActionId`, `filterNames`, label positions |
| `permissions` | Workflow permissions that transitions reference: `permissionID`, `shortName`, `groupName` ("Workflow Permission") |
| `filters` | Performer filters (`OWNER`, `ADDITIONAL_OWNERS`) usable in `filterNames` |
| `scripts` | **Every script on the tenant, with its full `code`**, so the editor can offer them. Large; don't log it |
| `initialStateX`, `initialStateY` | Position of the start node |

A workspace with no workflow yet returns only `filters`, `scripts`, and the
start-node position. A transition with no `fromState` leaves the start node:
it's the create transition. An unknown or deleted workspace returns
`500` `{"httpStatusCode":500}`.

## Replacing a workflow

`PUT` sends the **complete** workflow; whatever you leave out is removed.

```json
PUT /api/rest/workflows/{ws}
Content-Type: application/json

{
  "initialStateX": 50, "initialStateY": 50,
  "states": [
    { "customID": "DRAFT", "shortName": "Draft", "lockStateID": "false", "cmStateID": "false",
      "hidden": "false", "newStateID": "@2",
      "coordinateX": 240, "coordinateY": 210, "width": 121, "height": 61 },
    { "customID": "RELEASED", "shortName": "Released", "lockStateID": "true", "cmStateID": "false",
      "hidden": "false", "newStateID": "@5",
      "coordinateX": 450, "coordinateY": 120, "width": 121, "height": 61 }
  ],
  "transitions": [
    { "customID": "CREATE", "shortName": "Create", "newTransitionID": "@3",
      "newPermissionID": "@4", "newEscalationPermissionID": "@4",
      "toState": { "newStateID": "@2" } },
    { "customID": "RELEASE", "shortName": "Release", "newTransitionID": "@6",
      "newPermissionID": "@4", "newEscalationPermissionID": "@4",
      "email": "true", "outstanding": "true", "notifyPerformers": "true",
      "filterNames": ["Owner"],
      "fromState": { "newStateID": "@2" }, "toState": { "newStateID": "@5" } }
  ],
  "permissions": [
    { "newPermissionID": "@4", "permissionID": "@4", "shortName": "general",
      "longName": "", "permissionString": "" }
  ]
}
```

New objects get **placeholder IDs** of the form `"@n"` (`newStateID`,
`newTransitionID`, `newPermissionID`), and transitions point at states and
permissions through those placeholders. Existing objects keep their real
`stateID`/`transitionID`/`permissionID`. The UI sends booleans as strings
(`"true"`/`"false"`) and many empty strings for unused escalation and reminder
settings. The response is the saved workflow in the `GET` shape, with real IDs.

:::tip[Confirmed live — 2026-11-17]
On a scratch workspace, with a bearer token and no session cookie:

| Step | Result |
|---|---|
| `GET …/workflows/{ws}.json` on a new workspace | `200`, no `states` or `transitions` |
| `PUT` two states, a create transition, a second transition, and one permission (`@n` IDs) | `200`, real IDs assigned; v3 `…/workflows/1/transitions` then listed the transitions |
| `PUT` the `GET` response back with one state renamed and one transition left out | `200`; the rename applied, **the omitted transition was deleted**, and both `stateID`s were unchanged |

So `PUT` is a full replace that keeps the IDs of objects you send back. To make
a small change, `GET`, edit, and `PUT` the whole thing.
:::

:::caution[Not yet tested]
- Changing a workflow that items are already using (states with items in them).
  The admin UI warns about this; the API's behaviour is unknown.
- What `commentsForApproval` values mean (the UI sent `""`, the response says
  `0`; v3 reports `"comments": "OPTIONAL"`).
- State reminders and escalations through the `reminder*` and `escalation*`
  keys. The escalations read (`schedulers/…`) returned `[]` on the scratch
  states; nothing was configured to compare against.
- Linking scripts: the UI sends `scriptConditionId`, `scriptValidationId`, and
  `scriptActionId` as script IDs from the `scripts` list. Script links were
  removed before replay, so they weren't exercised here.
- Whether the workspace's role permissions pick up new workflow permissions
  automatically. Roles are a separate step (see
  [Users, Groups, and Roles](/api/v3/users-groups-roles/)).
:::

## Lifecycles

The lifecycle editor (`/lifecycleEditorView.form`) wasn't in the recording, so
no JSON route for it is known yet.

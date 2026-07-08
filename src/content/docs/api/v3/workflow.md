---
title: Workflow
description: Transition items through workflow steps and read workflow history.
---

:::note[Coming soon]
This page is a placeholder. Content will cover `getWorkflowTransitions`, `performWorkflowTransition`/`transition_workflow` (`workflowStep` must equal current step + 1), and `getWorkflowHistory`.

**Primary sources to author from:** `plm.js` (BOM Builder Fork extension), `api-reference.md` (Fusion Manage MCP server), and `client.py`'s `transition_workflow`/`get_workflow_history` for verified-working request shapes.
:::

:::caution[Needs live verification]
`get_workflow_history` treats a 403 as "workflow not enabled for this workspace" and returns an empty result rather than propagating a hard error — confirm this pattern still holds and document it here (see `concepts/errors`).
:::

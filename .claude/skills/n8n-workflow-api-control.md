---
name: n8n-workflow-api-control
description: Activate or deactivate an n8n workflow via the n8n REST API — used for Start/Pause campaign feature
user-invocable: true
allowed-tools: Read, Glob, Grep, mcp__n8n__get_workflow, mcp__n8n__n8n_list_workflows
---

# n8n Workflow API Control — Golden Legacy Patterns

## Overview

The Start/Pause campaign buttons in the UI call `/webhook/start` and `/webhook/pause`. These webhooks trigger n8n to activate or deactivate the **main send workflow** (the one with the Schedule Trigger) using the n8n REST API.

This requires:
1. The **workflow ID** of the main send workflow
2. An **n8n API key** to authenticate the API call
3. An **HTTP Request node** inside a webhook-triggered workflow to make the PATCH call

---

## n8n Cloud Instance

- **Instance**: `Golden-legacy-email-Automation` on n8n.cloud
- **Base URL**: `https://justsearchweb.app.n8n.cloud` (from project memory)
- **API base**: `https://justsearchweb.app.n8n.cloud/api/v1`
- **Main Send Workflow ID**: `wYjMYped6zbGZ4OY`

---

## Step 1 — Get the Workflow ID

The workflow ID is visible in the n8n editor URL when you have the send workflow open:

```
https://justsearchweb.app.n8n.cloud/workflow/WORKFLOW_ID_HERE
```

Copy this ID. It will be used in the PATCH call. Store it in n8n as a workflow variable or hardcode it in the HTTP Request node URL.

---

## Step 2 — Get an n8n API Key

In n8n cloud:
1. Click your avatar (top right) → **Settings** → **API**
2. Create a new API key
3. Copy it — you'll only see it once
4. Store it in n8n as a **Credential** of type `Header Auth`:
   - Name: `n8n API Key`
   - Header Name: `X-N8N-API-KEY`
   - Header Value: `<your api key>`

---

## Step 3 — The API Call

### Activate (Start Campaign)

```
PATCH https://justsearchweb.app.n8n.cloud/api/v1/workflows/wYjMYped6zbGZ4OY
Headers:
  X-N8N-API-KEY: <your-api-key>
  Content-Type: application/json
Body:
  { "active": true }
```

### Deactivate (Pause Campaign)

```
PATCH https://justsearchweb.app.n8n.cloud/api/v1/workflows/wYjMYped6zbGZ4OY
Headers:
  X-N8N-API-KEY: <your-api-key>
  Content-Type: application/json
Body:
  { "active": false }
```

---

## Webhook Workflow Structure

Build **two separate webhook workflows** (or one with a Switch node):

### Option A — Two separate workflows (simpler)

**Workflow: Handle /webhook/start**
```
Webhook (POST /webhook/start)
      ↓
HTTP Request (PATCH .../workflows/wYjMYped6zbGZ4OY, body: { "active": true })
      ↓
Respond to Webhook ({ "success": true, "active": true })
```

**Workflow: Handle /webhook/pause**
```
Webhook (POST /webhook/pause)
      ↓
HTTP Request (PATCH .../workflows/wYjMYped6zbGZ4OY, body: { "active": false })
      ↓
Respond to Webhook ({ "success": true, "active": false })
```

### Option B — Single workflow with Switch node (cleaner)

```
Webhook (POST — captures both /start and /pause via path variable)
      ↓
Switch node (check $json.body.action === 'start' vs 'pause')
  ├── start → HTTP Request (active: true)
  └── pause → HTTP Request (active: false)
      ↓ (both merge)
Respond to Webhook
```

---

## HTTP Request Node Configuration

| Field | Value |
|-------|-------|
| Method | `PATCH` |
| URL | `https://justsearchweb.app.n8n.cloud/api/v1/workflows/wYjMYped6zbGZ4OY` |
| Authentication | `Header Auth` → select your `n8n API Key` credential |
| Body Content Type | `JSON` |
| Body | `{ "active": true }` (or `false` for pause) |
| Response Format | `JSON` |

---

## Respond to Webhook — Format

The UI expects:
```json
{ "success": true, "active": true }
```

In the Respond to Webhook node:
- Response Body: `{ "success": true, "active": true }`
- Do NOT prefix with `=`

---

## Get Campaign Status (`/webhook/stats` — active check)

To return whether the campaign is currently active, add an HTTP Request to:

```
GET https://justsearchweb.app.n8n.cloud/api/v1/workflows/wYjMYped6zbGZ4OY
Headers: X-N8N-API-KEY: <key>
```

Response includes `"active": true/false`. Include this in the stats response to the UI so the Start/Pause button shows the correct state.

---

## Security — API Key Handling

- Store the API key as an n8n **Header Auth credential** — never put it in a Code node as a plain string
- The webhook workflows themselves don't need CORS headers — the frontend calls n8n webhooks directly (n8n handles CORS for webhook endpoints)
- The n8n API key is server-side only — it never touches the React frontend

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Wrong API key or missing header | Check `X-N8N-API-KEY` header name (exact case) |
| `404 Not Found` | Wrong workflow ID | Copy ID from the n8n editor URL bar |
| `403 Forbidden` | API key doesn't have workflow scope | Regenerate key with full access |
| Workflow won't deactivate | Workflow has active executions | Wait for current run to finish; pause takes effect on next trigger |
| Start button has no effect | Webhook is hitting test URL | Use production URL (`/webhook/...` not `/webhook-test/...`) |

---
name: n8n-gmail-send
description: Gmail node configuration for per-item sending with fixed CC, error handling, and SplitInBatches wiring
user-invocable: true
allowed-tools: Read, Glob, Grep, mcp__n8n__get_node, mcp__n8n__validate_node
---

# n8n Gmail Send — Golden Legacy Patterns

## Overview

This project sends one email per contact row. The Gmail node must:
1. Send from `info@goldenlegacy.ae` (Gmail OAuth — user connects manually in n8n)
2. Always CC `fatema@goldenfortune.ae` — never omit this
3. Not stop the workflow if a single email fails (`continueOnFail: true`)
4. Route successes and failures to separate write-back paths

---

## Gmail Node Configuration

**Node type**: `n8n-nodes-base.gmail`
**Operation**: `Send` (Message → Send)

### Required fields

| Field | Value |
|-------|-------|
| Credential | Gmail OAuth2 (user configures manually) |
| Resource | `Message` |
| Operation | `Send` |
| To | `={{ $json.email }}` |
| Subject | `={{ $json.subject }}` |
| Email Type | `Text` (plain text — do NOT use HTML unless redesigning) |
| Message | `={{ $json.emailBody }}` |
| CC | `fatema@goldenfortune.ae` (hardcoded — never use an expression here) |

### Settings tab — CRITICAL

Enable **"Continue on Fail"** on the Gmail node:
- In the node panel → click the `...` menu (or Settings tab) → toggle **"Continue on Fail"** = ON

Without this, one bad email address will stop the entire campaign.

---

## Error Detection After Gmail Send

When `continueOnFail` is ON, failed items pass through the **main output** (not an error branch) with an `error` property injected into `$json`:

```json
{
  "error": {
    "message": "Invalid email address",
    "name": "NodeOperationError"
  }
}
```

Successful items have no `error` property.

### Route with an IF node after Gmail

Add an **IF node** immediately after Gmail:

| Field | Value |
|-------|-------|
| Condition | `{{ $json.error }}` exists / is not empty |
| True branch | → Write-back Failure node |
| False branch | → Write-back Success node |

---

## Full Wiring Pattern

```
Schedule Trigger
      ↓
Google Sheets Read (filter: status = pending)
      ↓
Limit Node (daily cap)
      ↓
SplitInBatches
  ├── [index 1] loop ──→ Code Node (template injection)
  │                              ↓
  │                         Gmail Send (continueOnFail ON)
  │                              ↓
  │                         IF Node (error exists?)
  │                           ├── true  → Sheets Write-back (failed)  ──┐
  │                           └── false → Sheets Write-back (sent)    ──┘
  │                                                                      │
  └── [index 0] done ←──────────────────────────────────────────────────┘
                ↓
        Respond to Webhook (if triggered via webhook)
        OR End (if triggered by schedule)
```

### SplitInBatches port mapping (typeVersion 3)

- **Output index 0** = `done` — fires ONCE when all batches are processed (no items)
- **Output index 1** = `loop` — fires per batch WITH the items

Wire `loop` (index 1) → Code Node. Wire `done` (index 0) → end/respond node.

**Common mistake**: The visual labels in n8n say "done" and "loop" but in the JSON the indices can look swapped. Always verify by checking which output carries items during test execution.

---

## Code Node — Template Injection

This runs inside the `loop` branch, before Gmail:

```javascript
// Read template from workflow static data (set via /webhook/template)
const staticData = $getWorkflowStaticData('global');
const template = staticData.emailTemplate || `Dear {{name}},\n\nI hope this message finds you well.\n\n[Default template — update via Settings]`;

const items = $input.all();
return items.map(item => {
  const row = item.json;
  return {
    json: {
      row_number: row.row_number,   // MUST carry through for write-back
      email: row.email,
      subject: "An Important Update from Arvind Pal Singh \u2014 Golden Legacy",
      emailBody: template
        .replace(/\{\{name\}\}/g, row.name || '')
        .replace(/\{\{company\}\}/g, row.company || ''),
    }
  };
});
```

---

## Storing and Retrieving the Template

The template is saved to **workflow static data** via the `/webhook/template` POST endpoint.

### Save template webhook handler (Code node):

```javascript
const body = $input.first().json.body;
const staticData = $getWorkflowStaticData('global');
staticData.emailTemplate = body.template;
return [{ json: { success: true, savedAt: new Date().toISOString() } }];
```

### Retrieve in the main send workflow:

```javascript
const staticData = $getWorkflowStaticData('global');
const template = staticData.emailTemplate || DEFAULT_TEMPLATE;
```

---

## Sender Display Name

The Gmail node sends from the authenticated Gmail account (`info@goldenlegacy.ae`). To show the sender name as `Arvind Pal Singh`, the Gmail account's display name must be set in Google account settings — this cannot be overridden from n8n.

**Action**: Ensure the Gmail account `info@goldenlegacy.ae` has display name `Arvind Pal Singh` set in Google Account → Personal Info → Name.

---

## Key Constraints — Never Violate

- CC `fatema@goldenfortune.ae` must be hardcoded in the Gmail node — never driven by an expression or a settings variable
- `continueOnFail` MUST be ON — a single bad address must not kill the campaign
- Never re-process rows already marked `sent` — the Google Sheets Read node filters on `status = pending`
- Always carry `row_number` through every node so write-back can target the correct row

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid grant` | Gmail OAuth token expired | Re-authenticate the Gmail credential in n8n |
| `Daily sending limit exceeded` | Too many emails in one run | Reduce daily limit in Settings; use the Limit node |
| All emails show `failed` in sheet | `continueOnFail` is OFF | Enable it in Gmail node Settings tab |
| Write-back updates wrong row | `row_number` lost in Code node | Explicitly pass `row_number` in every Code node return |
| CC not sent | Typo in CC field expression | Use plain text `fatema@goldenfortune.ae` not an expression |

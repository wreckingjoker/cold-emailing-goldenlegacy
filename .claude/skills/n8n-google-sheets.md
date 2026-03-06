---
name: n8n-google-sheets
description: Google Sheets node patterns for this project — read with status filter, limit node, and write-back by row number
user-invocable: true
allowed-tools: Read, Glob, Grep, mcp__n8n__get_node, mcp__n8n__validate_node
---

# n8n Google Sheets — Golden Legacy Patterns

## This Project's Sheet

- **Sheet ID**: `1anNPKpCf-8_Vf_LmLBpwd6krT5CDYa8Y_5AAKBCGaoo`
- **Sheet name**: `Sheet1` (default — confirm in the Google Sheets URL `gid=0`)
- **Credential type**: Google Sheets OAuth2 (user connects manually in n8n)

### Column Schema (exact, case-sensitive)

| id | name | company | email | status | sent_at | opened | error |
|----|------|---------|-------|--------|---------|--------|-------|

Column names must match exactly. A typo in any column name will cause the node to silently write to the wrong column or throw a mapping error.

---

## Node 1 — Read Pending Rows

**Node type**: `n8n-nodes-base.googleSheets`
**Operation**: `getAll` (reads all rows matching a filter)

### Key fields

| Field | Value |
|-------|-------|
| Resource | `Sheet Within Document` |
| Operation | `Get Many` (getAll) |
| Document ID | `1anNPKpCf-8_Vf_LmLBpwd6krT5CDYa8Y_5AAKBCGaoo` |
| Sheet Name | `Sheet1` |
| Filters → Column | `status` |
| Filters → Value | `pending` |
| Options → First Row Is Header | `true` (ALWAYS enable) |

### Critical: Filters UI vs expression

Use the built-in **Filters** section (not a Code node after the fact):
- Add filter: Column = `status`, Value = `pending`
- This runs server-side — much faster than fetching all rows and filtering in code

### What each row looks like downstream

```json
{
  "row_number": 2,
  "id": "001",
  "name": "John Smith",
  "company": "Acme Corp",
  "email": "john@acme.com",
  "status": "pending",
  "sent_at": "",
  "opened": "",
  "error": ""
}
```

`row_number` is automatically injected by n8n — you MUST use this for write-back (not the `id` column). The `id` column is your own reference ID; `row_number` is the actual sheet row.

---

## Node 2 — Limit Node (Daily Cap)

**Node type**: `n8n-nodes-base.limit`

Place this **immediately after** the Google Sheets Read node, before any processing.

| Field | Value |
|-------|-------|
| Max Items | `={{ $vars.dailyLimit \|\| 50 }}` or hardcode `50` |

Wire: `Google Sheets Read → Limit → Code Node (template injection)`

---

## Node 3 — Write-back (Success Path)

**Node type**: `n8n-nodes-base.googleSheets`
**Operation**: `update`

| Field | Value |
|-------|-------|
| Resource | `Sheet Within Document` |
| Operation | `Update` |
| Document ID | `1anNPKpCf-8_Vf_LmLBpwd6krT5CDYa8Y_5AAKBCGaoo` |
| Sheet Name | `Sheet1` |
| Matching Column | `row_number` |
| Column to Update: status | `sent` |
| Column to Update: sent_at | `={{ new Date().toISOString() }}` |

### Success path mapping

```
Column          Value
──────────────  ─────────────────────────────
status          sent
sent_at         ={{ new Date().toISOString() }}
```

---

## Node 4 — Write-back (Failure Path)

Same node type and settings, but different column values:

```
Column          Value
──────────────  ──────────────────────────────────────────────
status          failed
error           ={{ $json.error?.message || "Unknown error" }}
```

Wire from the **error output** of the Gmail node (or after a Switch/IF node checking for error).

---

## Matching Row for Write-back — Critical Pattern

**Always match by `row_number`**, not by `id` or `email`.

When you configure the Update node:
- Set **Matching Column** = `row_number`
- The value comes from `={{ $json.row_number }}` (passed through from the Read node)

If you try to match by `id` or `email`, n8n will scan the entire sheet which is slower and can fail on duplicates.

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `No sheet found` | Wrong Sheet Name or Sheet ID | Double-check Sheet ID from URL, Sheet name from tab at bottom |
| `The caller does not have permission` | OAuth scope missing | Re-authenticate with `spreadsheets` scope (not just `spreadsheets.readonly`) |
| Column not found | Column name typo | Column names are case-sensitive: `status` ≠ `Status` |
| `row_number` undefined in write-back | Node chaining broke `row_number` | Pass `row_number` explicitly through Code nodes: `return [{ json: { ...item.json, row_number: item.json.row_number } }]` |
| Empty results (no rows returned) | All rows already `sent` or `failed` | Add a check: if 0 items, respond early and skip the loop |

---

## Preserving `row_number` Through Code Nodes

When your Code node processes each item, always carry `row_number` forward:

```javascript
const items = $input.all();
return items.map(item => {
  const body = item.json;
  return {
    json: {
      ...body,                          // includes row_number, name, company, email
      subject: "An Important Update from Arvind Pal Singh — Golden Legacy",
      emailBody: template
        .replace(/\{\{name\}\}/g, body.name)
        .replace(/\{\{company\}\}/g, body.company),
    }
  };
});
```

---

## Webhook: Stats Aggregation (`/webhook/stats`)

When the `/webhook/stats` GET webhook fires, read ALL rows (no filter) and count by status in a Code node:

```javascript
const rows = $input.all();
const stats = { total: 0, sent: 0, pending: 0, failed: 0, opened: 0 };
for (const row of rows) {
  stats.total++;
  const s = row.json.status || 'pending';
  if (stats[s] !== undefined) stats[s]++;
}
return [{ json: stats }];
```

---

## Webhook: Contacts (`/webhook/contacts`)

Read ALL rows (no filter), return them as-is. The UI will do client-side filtering by status badge.

Node: Google Sheets → `getAll`, no Filters set → Respond to Webhook with `={{ JSON.stringify($input.all().map(i => i.json)) }}`

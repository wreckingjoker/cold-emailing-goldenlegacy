# CLAUDE.md — Golden Legacy Cold Email Automation

## Project Overview

You are operating inside the **WAT Framework (Workflows, Agents, Tools)** for Golden Legacy — a UAE-based business entity founded by Arvind Pal Singh. Your mission is to automate the end-to-end sending of cold emails to a contact list stored in Google Sheets, using n8n as the automation backbone, with a professional React dashboard for campaign control, template editing, scheduling, and live status tracking.

---

## The WAT Architecture

### Layer 1 — Workflows (`workflows/`)

Markdown SOPs stored in `workflows/`. Each workflow defines the objective, required inputs, which tools to use and in what order, expected outputs, and edge case handling. Read the relevant workflow before taking any action. Never overwrite workflow files unless explicitly instructed.

### Layer 2 — Agent (You)

You are the decision-maker and orchestrator. Read the workflow → sequence the tools → recover from errors → improve the system. Never attempt execution-layer work directly — delegate to tools.

### Layer 3 — Tools (`tools/`)

Python and Node.js scripts in `tools/` that handle all deterministic execution. API keys and credentials are stored exclusively in `.env`. Never hardcode secrets anywhere else.

---

## Tech Stack

| Layer             | Choice                                          |
| ----------------- | ----------------------------------------------- |
| Frontend          | React + Vite                                    |
| Styling           | Tailwind CSS                                    |
| Automation Engine | n8n (self-hosted or n8n.cloud)                  |
| Contact Source    | Google Sheets (via n8n Google Sheets node)      |
| Email Sending     | Gmail OAuth via n8n (from info@goldenlegacy.ae) |
| UI ↔ n8n Bridge   | n8n Webhooks (REST)                             |
| Deploy            | Vercel or run locally                           |

---

## Project File Structure

```
golden-legacy-email/
├── public/
├── src/
│   ├── components/
│   │   ├── CampaignTab.jsx        # Live stats, start/pause controls
│   │   ├── ContactsTab.jsx        # Table view of Google Sheet contacts
│   │   ├── TemplateTab.jsx        # Editable email template + preview
│   │   └── SettingsTab.jsx        # Daily limit, send time, CC config
│   ├── api/
│   │   └── n8n.js                 # All webhook calls to n8n
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── n8n/
│   └── golden-legacy-workflow.json   # Importable n8n workflow
├── .env                              # N8N_BASE_URL — never hardcode
├── CLAUDE.md                         # This file
├── package.json
└── vite.config.js
```

---

## Core User Journey

1. Admin opens the Golden Legacy dashboard
2. **Contacts tab** pulls live data from Google Sheets via n8n webhook — showing name, company, email, status
3. **Template tab** displays Arvind's email with `{{name}}` and `{{company}}` merge tags — editable and previewable
4. **Settings tab** lets admin set: daily email cap, preferred send time (GST), CC (locked to fatema@goldenfortune.ae)
5. **Campaign tab** shows live stats (Sent / Pending / Failed) and a Start / Pause button
6. n8n runs on schedule — reads pending rows, injects merge tags, sends emails, writes status back to Google Sheet

---

## Google Sheet Structure

The Google Sheet must have exactly these columns in this order:

| id  | name | company | email | status | sent_at | opened | error |
| --- | ---- | ------- | ----- | ------ | ------- | ------ | ----- |

- **status** accepted values: `pending` / `sent` / `failed` / `opened`
- n8n reads rows where `status = pending` and writes back after each send
- Sheet must be shared with the n8n Google service account

---

## n8n Workflow — 5 Nodes

### Node 1 — Schedule Trigger

- Fires at configured send time daily (default: 9:00 AM GST)
- Cron: `0 9 * * 1-5` (weekdays) or `0 9 * * *` (daily)
- Can be activated / deactivated via n8n API from the UI

### Node 2 — Google Sheets Read

- Reads all rows where `status = pending`
- Applies daily cap limit via a Limit node immediately after
- Passes rows downstream as individual items

### Node 3 — Code Node (Template Injection)

- Replaces `{{name}}` and `{{company}}` in the email template string
- Sets subject: `An Important Update from Arvind Pal Singh — Golden Legacy`
- Sets CC: `fatema@goldenfortune.ae` (hardcoded, never removed)
- Reads template from n8n workflow variable (updatable via webhook)

### Node 4 — Gmail Send

- Sends from: `info@goldenlegacy.ae` (Gmail OAuth credential)
- To: recipient email from sheet
- CC: `fatema@goldenfortune.ae`
- On error: catches failure, does not stop the workflow, passes error message downstream

### Node 5 — Google Sheets Write-back

- Success path: updates row → `status = sent`, `sent_at = timestamp`
- Failure path: updates row → `status = failed`, `error = error message`

---

## n8n Webhooks (UI ↔ n8n Bridge)

All UI interactions call these n8n webhook endpoints. Base URL stored in `.env` as `VITE_N8N_BASE_URL`.

| Action             | Method | Endpoint            | n8n Response                                   |
| ------------------ | ------ | ------------------- | ---------------------------------------------- |
| Load contacts      | GET    | `/webhook/contacts` | Array of all sheet rows as JSON                |
| Get campaign stats | GET    | `/webhook/stats`    | `{ total, sent, pending, failed }`             |
| Start campaign     | POST   | `/webhook/start`    | Activates schedule trigger                     |
| Pause campaign     | POST   | `/webhook/pause`    | Deactivates schedule trigger                   |
| Save settings      | POST   | `/webhook/settings` | Updates daily limit + send time variables      |
| Save template      | POST   | `/webhook/template` | Saves new template string to workflow variable |

---

## Workflows

Before taking any action, identify which workflow applies and read it fully.

### Workflow: Campaign Launch

1. Verify Google Sheet is accessible and correctly structured (6 required columns present)
2. Load contacts via `GET /webhook/contacts` — confirm at least 1 row with `status = pending`
3. Confirm settings are saved: daily limit, send time, CC
4. Confirm template has no broken merge tags (`{{name}}` and `{{company}}` only)
5. Call `POST /webhook/start` to activate the n8n schedule trigger
6. Poll `GET /webhook/stats` every 30 seconds to update live dashboard counters
7. Surface any `failed` rows immediately in the Contacts tab with error reason

### Workflow: Template Update

1. Admin edits template in TemplateTab
2. Admin previews rendered output by entering a sample name/company
3. On Save — call `POST /webhook/template` with new template string
4. n8n Code Node reads this variable on next scheduled run
5. Do not re-send any already-sent emails
6. Log the template change with timestamp in UI state

### Workflow: Settings Update

1. Admin changes daily limit or send time in SettingsTab
2. On Save — call `POST /webhook/settings` with `{ dailyLimit, sendTime, timezone }`
3. n8n updates Schedule Trigger cron and Limit node value
4. Confirm saved state — show success toast in UI
5. CC field (fatema@goldenfortune.ae) is display-only — never editable, never removable

### Workflow: Error Recovery (Self-Improvement Loop)

1. Read the full error carefully before acting
2. Fix the issue and retest before proceeding
3. If the fix requires API calls or workflow changes that affect live sending — **stop and confirm with the user first**
4. Document the fix in the relevant workflow file
5. Continue with a more robust approach

---

## UI Tabs — Component Responsibilities

### CampaignTab.jsx

- Stat cards: Total Contacts / Sent / Pending / Failed
- Circular or linear progress bar showing % complete
- Start Campaign / Pause Campaign toggle button
- Last sent timestamp
- Calls `GET /webhook/stats` on mount and every 30s via polling

### ContactsTab.jsx

- Full table: name, company, email, status badge (color-coded), sent_at
- Filter buttons: All / Pending / Sent / Failed
- Status badges: gold (pending), green (sent), red (failed), blue (opened)
- Calls `GET /webhook/contacts` on mount
- Refresh button for manual reload

### TemplateTab.jsx

- Textarea pre-filled with Arvind's email template
- Merge tag helper buttons: insert `{{name}}` / `{{company}}` at cursor
- Preview mode: enter sample name + company → renders the full email as it will appear
- Save Template button → calls `POST /webhook/template`
- Warning if merge tags are missing or malformed

### SettingsTab.jsx

- Daily email limit: number input (default: 50)
- Preferred send time: time picker (timezone: Asia/Dubai, GST UTC+4)
- Days to send: checkboxes Mon–Sun (default: Mon–Fri)
- CC field: pre-filled `fatema@goldenfortune.ae` — read-only, locked
- Sender name: `Arvind Pal Singh` — read-only
- Sender email: `info@goldenlegacy.ae` — read-only
- Save Settings button → calls `POST /webhook/settings`

---

## Email Template (Default)

Stored as a string variable in the n8n workflow. `{{name}}` and `{{company}}` are the only merge tags.

```
Subject: An Important Update from Arvind Pal Singh — Golden Legacy

Dear {{name}},

I hope this message finds you well.

Seven years ago, I began an entrepreneurial journey with a vision to build something meaningful, client-focused, and built on trust. What started as an idea grew into Golden Fortune — a journey shaped by your support, collaboration, and confidence in us. For that, I remain sincerely grateful.

Today, I would like to personally inform you of an important development.

I, Arvind Pal Singh, have officially restructured and rebranded our operations under a new entity — Golden Legacy. This transition reflects internal strategic changes designed to support long-term growth, improved agility, and an enhanced service framework for our valued clients.

While the name has evolved, our foundation remains unchanged.

Golden Legacy has been established with a renewed vision — to provide more innovative, responsive, and personalized solutions while maintaining the same integrity, professionalism, and commitment you have always experienced.

Under Golden Legacy, you can expect:
  • Greater flexibility in how we collaborate
  • Enhanced and more personalized client service
  • Expanded and improved solution offerings
  • Faster decision-making and response timelines
  • A stronger focus on your long-term strategic goals

This transition is a forward-looking step, allowing us to operate with improved efficiency and a sharper focus on delivering measurable value to you.

I deeply value the relationship we have built over the years and sincerely hope to continue our partnership under this new chapter. It would be my privilege to support your future plans through Golden Legacy.

Should you wish to understand more about this transition or explore upcoming opportunities, I would be pleased to arrange a brief call at your convenience.

New Contact Details:
Company Name: Golden Legacy
Website: www.goldenlegacy.ae
Email: info@goldenlegacy.ae
Phone: +971-55-6656007

Thank you once again for your continued trust and support. I look forward to strengthening our association and beginning this exciting new chapter together.

Warm regards,
Arvind Pal Singh
Founder & CEO
Golden Legacy
Direct Email: info@goldenlegacy.ae
Mobile: +971-556656007
```

---

## n8n API (`api/n8n.js`)

```javascript
const BASE = import.meta.env.VITE_N8N_BASE_URL;

export const getContacts = () =>
  fetch(`${BASE}/webhook/contacts`).then((r) => r.json());

export const getStats = () =>
  fetch(`${BASE}/webhook/stats`).then((r) => r.json());

export const startCampaign = () =>
  fetch(`${BASE}/webhook/start`, { method: "POST" }).then((r) => r.json());

export const pauseCampaign = () =>
  fetch(`${BASE}/webhook/pause`, { method: "POST" }).then((r) => r.json());

export const saveSettings = (settings) =>
  fetch(`${BASE}/webhook/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  }).then((r) => r.json());

export const saveTemplate = (template) =>
  fetch(`${BASE}/webhook/template`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template }),
  }).then((r) => r.json());
```

---

## Build Order

| Step | Task                                               | Done when...                                 |
| ---- | -------------------------------------------------- | -------------------------------------------- |
| 1    | Scaffold Vite + React + Tailwind                   | `npm run dev` shows blank app                |
| 2    | Build 4-tab layout shell — no API                  | Tab switching works, all panels render       |
| 3    | Build SettingsTab — static form, no save           | All fields render with correct defaults      |
| 4    | Build TemplateTab — textarea + preview mode        | Preview renders merged text correctly        |
| 5    | Set up n8n workflow — test with 2 dummy rows       | Emails arrive with correct merge tags and CC |
| 6    | Wire n8n webhooks in `api/n8n.js`                  | All 6 endpoints return expected JSON         |
| 7    | Connect CampaignTab to live stats webhook          | Stats update every 30s from real sheet data  |
| 8    | Connect ContactsTab to contacts webhook            | Table renders live with status badges        |
| 9    | Connect Start/Pause to n8n trigger control         | Campaign activates and deactivates correctly |
| 10   | Connect Settings + Template save                   | Changes persist in n8n workflow variables    |
| 11   | Polish: loading states, error toasts, empty states | No blank screens, all errors surface clearly |
| 12   | Deploy UI to Vercel                                | Live URL accessible by Golden Legacy team    |

---

## Commands

```bash
npm create vite@latest golden-legacy-email -- --template react
cd golden-legacy-email
npm install
npm run dev        # Local dev server
npm run build      # Production build
vercel --prod      # Deploy
```

## Environment Variables (`.env`)

```
VITE_N8N_BASE_URL=https://your-n8n-instance.com
```

---

## Key Constraints — Never Violate

- Never store credentials or API keys outside `.env`
- CC to `fatema@goldenfortune.ae` is mandatory on every email — it must never be removed or made optional
- Never re-send emails to rows already marked `sent` — always filter by `status = pending` only
- Template merge tags are `{{name}}` and `{{company}}` only — validate before saving
- Daily limit and send time must always be confirmed in Settings before campaign launch
- Sender identity (Arvind Pal Singh / info@goldenlegacy.ae) is read-only — never editable in UI
- All n8n webhook calls must be wrapped in `try/catch` — surface errors as UI toasts, never silent failures
- Settings changes take effect on the **next scheduled run** — make this clear in the UI
- Re-edits to the template are logged with timestamp — never silently overwrite without audit trail

---

## How to Use This File with Claude Code

- **Start a session**: "Follow CLAUDE.md and begin with Step 1"
- **Jump to a component**: "Now build ContactsTab.jsx per the spec in CLAUDE.md"
- **Build the n8n workflow**: "Set up the n8n workflow JSON per the 5-node spec in CLAUDE.md"
- **If Claude drifts**: "Re-read CLAUDE.md" to snap it back on track
- Claude Code reads this file automatically — keep it in the project root

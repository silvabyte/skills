---
name: qa-flow-report
description: |
  Drive a UI flow with chrome-devtools, capture a screenshot per step, then render a self-contained HTML report (report.html) showing each step with status pills, full console log, and full network log per step. Use when:
  (1) User asks to "QA this flow", "walk through X with screenshots", "verify [feature] end-to-end with a report"
  (2) User wants screenshot-backed evidence that a multi-step UI flow worked
  (3) User wants a single artifact they can attach to a PR or share as proof of a manual walkthrough
  Do NOT use for one-off "open this page and check console", for automated regression testing (a Playwright/Cypress suite is the right tool), or for single-screenshot bug repros.
  Triggers: "QA this flow", "qa flow report", "walk through X with screenshots", "verify end-to-end with a report", "screenshot-backed evidence", "manual QA report"
---

# qa-flow-report

Produce a screenshot-backed HTML report from a manual UI walkthrough driven through chrome-devtools MCP tools. The output is a single `report.html` next to its `screenshots/` and `manifest.json`, openable in a browser, and suitable to attach to a PR as evidence.

This skill is intentionally ad-hoc visual evidence. It complements — does not replace — an automated test suite (Playwright, Cypress, Storybook interactions, etc.). Use the automated suite to assert behavior in CI; use this skill to produce a one-off human-readable artifact that a flow works end-to-end.

## Preconditions

Before driving the flow:

1. **Target URL is reachable.** Confirm with the user which surface is being QA'd and that the dev server (or staging URL) is up. If the project has a `CLAUDE.md`, check it for known dev-server ports, fixture URLs, and any query-param shortcuts before guessing.
2. **chrome-devtools MCP tools are available.** The `mcp__chrome-devtools__*` tools are deferred — call `ToolSearch` with `query: "select:mcp__chrome-devtools__navigate_page,mcp__chrome-devtools__take_screenshot,mcp__chrome-devtools__take_snapshot,mcp__chrome-devtools__click,mcp__chrome-devtools__fill,mcp__chrome-devtools__wait_for,mcp__chrome-devtools__list_console_messages,mcp__chrome-devtools__list_network_requests,mcp__chrome-devtools__resize_page,mcp__chrome-devtools__new_page"` to load schemas. Add others (`hover`, `press_key`, `evaluate_script`, `handle_dialog`, `fill_form`, `select_page`) as the flow requires.
3. **Output location won't dirty the repo.** Default output dir is `tmp/qa-reports/<slug>-<timestamp>/` at the repo root. Verify `tmp/` is gitignored before writing there. If it isn't, surface that as a separate fix and ask the user where to put the artifact instead of silently editing `.gitignore`.

## Workflow

### 1. Plan the flow

Before driving, write down the steps as a numbered list (e.g. "1. land on /signin, 2. enter email, 3. submit code, 4. expect dashboard, 5. open settings"). Mirror them in `TaskCreate` so progress shows in the UI.

### 2. Pick a slug + create output dir

- Slug: kebab-case from the flow purpose (`signin-email-code`, `cart-checkout-stripe`, `search-filter-radius`).
- Timestamp: `YYYY-MM-DD-HHmm` in local time.
- Default path: `tmp/qa-reports/<slug>-<timestamp>/` at the repo root.
- Inside it, create `screenshots/`. The `manifest.json` and `report.html` will land at the dir root.

### 3. Set viewport

Decide based on what's being QA'd:

- **Mobile-shape UI:** `resize_page` to `390x844` (iPhone 14 baseline) before the first action.
- **Tablet:** `820x1180` (iPad baseline) is a reasonable default.
- **Desktop:** leave the default, or `1440x900` if you want a consistent shape across runs.

Record the chosen viewport in the manifest.

### 4. Step loop

For each planned step:

1. **Drive** — invoke the appropriate `mcp__chrome-devtools__*` tool (`navigate_page`, `click`, `fill`, `hover`, etc.).
2. **Wait for stable state** — use `mcp__chrome-devtools__wait_for` against an expected selector or text, or `evaluate_script` to poll for a condition. Don't screenshot during a load spinner.
3. **Screenshot** — call `take_screenshot` and save the PNG to `tmp/qa-reports/<slug>-<ts>/screenshots/NN-kebab-step-name.png`. `NN` is zero-padded (`01`, `02`, ...).
4. **Capture context** — call `list_console_messages` and `list_network_requests` to grab the full state since the previous step. Record everything (see Noise capture).
5. **Record observation** — append to the manifest a step entry with status, notes, console, and network.

#### Status values

- `"pass"` — observed matched expected.
- `"fail"` — observed did not match expected. Take the screenshot anyway; describe the discrepancy in `notes`. Continue subsequent steps unless the failure makes them impossible.
- `"note"` — neither pass nor fail — informational checkpoint (e.g. "captured intermediate animation state", "second device shape").

### 5. Render the report

Run from the repo root (or wherever you placed the output dir — the path can be absolute or relative):

```
bun <path-to-skill>/scripts/render-qa-flow-report.ts tmp/qa-reports/<slug>-<ts>
```

When installed via `npx skills add silvabyte/skills`, the script will be at `.claude/skills/qa-flow-report/scripts/render-qa-flow-report.ts`.

The script prints the absolute path to the generated `report.html` on success, or a clear error message and non-zero exit on failure (missing manifest, malformed JSON, missing template).

### 6. Surface the artifact

Print the absolute `report.html` path in your final response so the user can open it. Briefly summarize pass/fail counts and any notable console errors / network failures.

## Manifest schema

Write `<output-dir>/manifest.json` exactly in this shape. The render script tolerates missing `summary` (it computes counts from the steps), missing `console`/`network` (treats as empty), and missing `screenshot` (renders a placeholder).

```json
{
  "title": "Signin email-code flow QA",
  "url": "http://localhost:3000/signin",
  "startedAt": "2026-05-14T14:30:00Z",
  "viewport": { "width": 390, "height": 844 },
  "steps": [
    {
      "n": 1,
      "name": "Landing on /signin",
      "screenshot": "screenshots/01-landing.png",
      "status": "pass",
      "notes": "Email input focused, submit disabled until valid",
      "console": [
        { "level": "log", "text": "[auth] session resolved: null" }
      ],
      "network": [
        { "method": "GET", "url": "/api/csrf", "status": 200 }
      ]
    }
  ]
}
```

Field notes:

- `console[].level`: `log` | `info` | `warn` | `error` | `debug` — match what `list_console_messages` returns.
- `network[].status`: HTTP status code; `0` or missing renders as a failure.
- `screenshot`: relative path from the manifest, always `screenshots/NN-kebab.png`.

## Noise capture

Capture **all** console messages and **all** network requests per step — not just errors. Chatty-app noise is acceptable; missing a deprecation warning or a 304 that should've been a 200 isn't. The report tucks full lists behind collapsibles per step (and a global appendix) so the default view stays scannable while raw data is one click away.

## Project-specific defaults

Before driving an unfamiliar UI, check the project's `CLAUDE.md` (and any nested `**/CLAUDE.md`) for:

- **Dev server URL + port** — don't guess `localhost:3000` if the project uses `5173`, `8080`, etc.
- **Auth shortcuts** — magic links, OTP codes, dev-only bypass flags, seeded test accounts.
- **Geolocation / locale / feature-flag query params** — many apps honor a dev-only `?devLoc=…`, `?flag=…`, `?lang=…` for reproducibility.
- **Known-good fixture data** — seeded users, demo carts, sample uploads.
- **Visibility / role rules** — if the surface filters by role, plan to capture screenshots from each relevant role.

If the project lacks a `CLAUDE.md`, ask the user for these details before starting rather than blundering through reset states or auth dead-ends.

## Constraints

- **Read-only.** This skill drives the UI; it does not modify production data. Never point it at prod and never use it to push state changes — if the flow requires writes, do them against local/staging only.
- **No deploys.** This skill never runs deploy targets — only navigates and reads.
- **Don't bail on first red.** A failed step is signal, not a stop condition. Continue the flow unless physically impossible.

## File layout (for reference)

```
skills/qa-flow-report/
├── SKILL.md
├── assets/
│   └── qa-flow-report-template.html
└── scripts/
    └── render-qa-flow-report.ts
```

Output for one run:

```
tmp/qa-reports/<slug>-<YYYY-MM-DD-HHmm>/
├── manifest.json
├── screenshots/
│   ├── 01-landing.png
│   ├── 02-open-filters.png
│   └── ...
└── report.html        ← generated by render-qa-flow-report.ts
```

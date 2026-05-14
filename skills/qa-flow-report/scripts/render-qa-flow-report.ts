#!/usr/bin/env bun
/**
 * Render a qa-flow-report HTML report from a manifest.
 *
 * Usage:
 *   bun .claude/skills/qa-flow-report/scripts/render-qa-flow-report.ts <output-dir>
 *
 * Reads <output-dir>/manifest.json + the bundled template, writes <output-dir>/report.html.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

type ConsoleMsg = { level?: string; text?: string; source?: string };
type NetworkReq = { method?: string; url?: string; status?: number; type?: string };
type StepStatus = "pass" | "fail" | "note";

interface Step {
  n: number;
  name: string;
  screenshot?: string;
  status: StepStatus;
  notes?: string;
  console?: ConsoleMsg[];
  network?: NetworkReq[];
}

interface Manifest {
  title: string;
  url: string;
  startedAt: string;
  viewport?: { width: number; height: number };
  steps: Step[];
  summary?: {
    pass?: number;
    fail?: number;
    note?: number;
    consoleErrorCount?: number;
    consoleWarningCount?: number;
    networkFailureCount?: number;
  };
}

const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: render-qa-flow-report.ts <output-dir>");
  process.exit(2);
}
const absOut = resolve(outDir);
const manifestPath = join(absOut, "manifest.json");
if (!existsSync(manifestPath)) {
  console.error(`manifest not found: ${manifestPath}`);
  process.exit(1);
}

let manifest: Manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (e) {
  console.error(`could not parse manifest.json: ${(e as Error).message}`);
  process.exit(1);
}
if (!manifest.title || !Array.isArray(manifest.steps)) {
  console.error("manifest missing required fields: title, steps[]");
  process.exit(1);
}

const templatePath = join(import.meta.dir, "..", "assets", "qa-flow-report-template.html");
if (!existsSync(templatePath)) {
  console.error(`template not found: ${templatePath}`);
  process.exit(1);
}
const template = readFileSync(templatePath, "utf8");

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function levelClass(level: string | undefined): string {
  const l = (level ?? "log").toLowerCase();
  if (l === "error" || l === "exception") return "error";
  if (l === "warn" || l === "warning") return "warn";
  return "log";
}

function isOkStatus(status: number | undefined): boolean {
  // 1xx (incl. 101 Switching Protocols for Vite HMR websocket upgrades),
  // 2xx success, and 3xx redirects all count as non-failures.
  return status != null && status >= 100 && status < 400;
}

function netStatusClass(status: number | undefined): "ok" | "bad" {
  return isOkStatus(status) ? "ok" : "bad";
}

function renderConsoleLog(msgs: ConsoleMsg[]): string {
  if (!msgs?.length) return "(none)";
  return msgs
    .map((m) => {
      const lvl = (m.level ?? "log").padEnd(5);
      const cls = levelClass(m.level);
      return `<span class="row ${cls}"><span class="lvl ${cls}">${escapeHtml(lvl)}</span>${escapeHtml(m.text)}</span>`;
    })
    .join("\n");
}

function renderNetworkLog(reqs: NetworkReq[]): string {
  if (!reqs?.length) return "(none)";
  return reqs
    .map((r) => {
      const status = r.status ?? 0;
      const cls = netStatusClass(r.status);
      const method = (r.method ?? "GET").padEnd(6);
      return `<span class="row"><span class="net-status ${cls}">${escapeHtml(String(status).padEnd(4))}</span>${escapeHtml(method)} ${escapeHtml(r.url)}</span>`;
    })
    .join("\n");
}

function statusChipClass(s: StepStatus): string {
  return s === "pass" ? "pass" : s === "fail" ? "fail" : "note";
}

const steps = manifest.steps.map((step) => {
  const consoleMsgs = step.console ?? [];
  const networkReqs = step.network ?? [];
  const consoleSection =
    consoleMsgs.length > 0
      ? `<details><summary>Console (${consoleMsgs.length})</summary><pre class="log">${renderConsoleLog(consoleMsgs)}</pre></details>`
      : "";
  const networkSection =
    networkReqs.length > 0
      ? `<details><summary>Network (${networkReqs.length})</summary><pre class="log">${renderNetworkLog(networkReqs)}</pre></details>`
      : "";
  const screenshot = step.screenshot
    ? `<div class="thumb"><img src="${escapeHtml(step.screenshot)}" alt="step ${step.n}" /></div>`
    : `<div class="thumb empty">(no screenshot)</div>`;

  return `
<div class="step ${escapeHtml(step.status)}">
  ${screenshot}
  <div class="body">
    <div class="head">
      <span class="num">#${escapeHtml(String(step.n).padStart(2, "0"))}</span>
      <span class="name">${escapeHtml(step.name)}</span>
      <span class="chip ${statusChipClass(step.status)}">${escapeHtml(step.status)}</span>
    </div>
    ${step.notes ? `<p class="notes">${escapeHtml(step.notes)}</p>` : ""}
    ${step.screenshot ? `<div class="file">${escapeHtml(step.screenshot)}</div>` : ""}
    ${consoleSection}
    ${networkSection}
  </div>
</div>`;
});

const allConsole = manifest.steps.flatMap((s) => s.console ?? []);
const allNetwork = manifest.steps.flatMap((s) => s.network ?? []);

const summary = manifest.summary ?? {};
const passCount = summary.pass ?? manifest.steps.filter((s) => s.status === "pass").length;
const failCount = summary.fail ?? manifest.steps.filter((s) => s.status === "fail").length;
const noteCount = summary.note ?? manifest.steps.filter((s) => s.status === "note").length;
const consoleErrorCount =
  summary.consoleErrorCount ??
  allConsole.filter((m) => ["error", "exception"].includes((m.level ?? "").toLowerCase())).length;
const consoleWarningCount =
  summary.consoleWarningCount ??
  allConsole.filter((m) => ["warn", "warning"].includes((m.level ?? "").toLowerCase())).length;
const networkFailureCount =
  summary.networkFailureCount ?? allNetwork.filter((r) => !isOkStatus(r.status)).length;

const viewportLabel = manifest.viewport ? `${manifest.viewport.width}×${manifest.viewport.height}` : "—";

const html = template
  .replace(/{{title}}/g, escapeHtml(manifest.title))
  .replace(/{{url}}/g, escapeHtml(manifest.url))
  .replace(/{{startedAt}}/g, escapeHtml(manifest.startedAt))
  .replace(/{{viewport}}/g, escapeHtml(viewportLabel))
  .replace(/{{passCount}}/g, String(passCount))
  .replace(/{{failCount}}/g, String(failCount))
  .replace(/{{noteCount}}/g, String(noteCount))
  .replace(/{{consoleErrorCount}}/g, String(consoleErrorCount))
  .replace(/{{consoleWarningCount}}/g, String(consoleWarningCount))
  .replace(/{{networkFailureCount}}/g, String(networkFailureCount))
  .replace(/{{stepsHtml}}/g, steps.join("\n"))
  .replace(/{{allConsoleCount}}/g, String(allConsole.length))
  .replace(/{{allConsoleHtml}}/g, renderConsoleLog(allConsole))
  .replace(/{{allNetworkCount}}/g, String(allNetwork.length))
  .replace(/{{allNetworkHtml}}/g, renderNetworkLog(allNetwork))
  .replace(/{{generatedAt}}/g, new Date().toISOString());

const reportPath = join(absOut, "report.html");
writeFileSync(reportPath, html);
console.log(reportPath);

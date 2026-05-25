#!/usr/bin/env node
// Probes every target in .github/uptime-targets.yml with Playwright/chromium,
// then writes three files under data/ that the Grafana status page reads:
//   data/uptime-current.json   snapshot of this run (overwritten)
//   data/uptime-history.jsonl  one line per probe, pruned to last 30 days
//   data/uptime-summary.json   rolled-up status + uptime % + recent incidents
//
// Designed to be idempotent and self-contained — safe to run locally for
// debugging (`node scripts/probe-uptime.mjs`) as long as you have chromium
// installed (`npx playwright install chromium`).

import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { chromium } from 'playwright';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS_FILE = join(REPO_ROOT, '.github', 'uptime-targets.yml');
const DATA_DIR = join(REPO_ROOT, 'data');
const CURRENT_FILE = join(DATA_DIR, 'uptime-current.json');
const HISTORY_FILE = join(DATA_DIR, 'uptime-history.jsonl');
const SUMMARY_FILE = join(DATA_DIR, 'uptime-summary.json');

const NAV_TIMEOUT_MS = 15_000;
const SELECTOR_TIMEOUT_MS = 3_000;
const HISTORY_RETENTION_DAYS = 30;

async function loadTargets() {
  const raw = await readFile(TARGETS_FILE, 'utf8');
  const parsed = parseYaml(raw);
  if (!parsed?.targets?.length) throw new Error(`No targets in ${TARGETS_FILE}`);
  // Tailnet targets only get probed when the runner has joined the tailnet
  // (set PROBE_TAILNET=1 in the workflow once the tailscale step is wired up).
  const includeTailnet = process.env.PROBE_TAILNET === '1';
  const targets = parsed.targets.filter((t) => includeTailnet || t.network !== 'tailnet');
  const skipped = parsed.targets.length - targets.length;
  if (skipped > 0) console.log(`Skipping ${skipped} tailnet target(s); set PROBE_TAILNET=1 to include them.`);
  return targets;
}

async function probe(browser, target) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  // Track only uncaught exceptions (pageerror). Plain `console.error` calls
  // are too noisy on real sites — 3rd-party scripts log errors all the time
  // without the page being broken. Uncaught JS is the meaningful "the page
  // is bombing" signal.
  let pageErrors = 0;
  page.on('pageerror', () => { pageErrors++; });

  const startedAt = Date.now();
  let status = 0;
  let selectorPresent = false;
  let error = null;
  try {
    const response = await page.goto(target.url, {
      waitUntil: 'load',
      timeout: NAV_TIMEOUT_MS,
    });
    status = response ? response.status() : 0;
    try {
      await page.waitForSelector(target.expect_selector, { timeout: SELECTOR_TIMEOUT_MS, state: 'attached' });
      selectorPresent = true;
    } catch {
      selectorPresent = false;
    }
  } catch (err) {
    error = err.message?.split('\n')[0] ?? String(err);
  } finally {
    await context.close().catch(() => {});
  }
  const latencyMs = Date.now() - startedAt;
  const up = status === 200 && selectorPresent && pageErrors === 0 ? 1 : 0;
  return {
    project: target.project,
    url: target.url,
    network: target.network,
    status_code: status,
    latency_ms: latencyMs,
    selector_present: selectorPresent,
    page_errors: pageErrors,
    error,
    up,
  };
}

async function runAllProbes(targets) {
  const browser = await chromium.launch({ headless: true });
  try {
    const results = [];
    // Sequential: predictable, easy to debug, ~30s total for ~10 targets.
    for (const target of targets) {
      const r = await probe(browser, target);
      results.push(r);
      const tag = r.up === 1 ? 'UP  ' : 'DOWN';
      console.log(`${tag} ${r.project.padEnd(32)} ${r.status_code || '---'} ${r.latency_ms}ms${r.error ? ` (${r.error})` : ''}`);
    }
    return results;
  } finally {
    await browser.close();
  }
}

async function loadHistory() {
  if (!existsSync(HISTORY_FILE)) return [];
  const raw = await readFile(HISTORY_FILE, 'utf8');
  const lines = raw.split('\n').filter(Boolean);
  const records = [];
  for (const line of lines) {
    try { records.push(JSON.parse(line)); } catch { /* skip malformed line */ }
  }
  return records;
}

async function writeHistory(records) {
  if (records.length === 0) {
    await writeFile(HISTORY_FILE, '');
    return;
  }
  await writeFile(HISTORY_FILE, records.map((r) => JSON.stringify(r)).join('\n') + '\n');
}

function pruneHistory(records, nowMs) {
  const cutoff = nowMs - HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return records.filter((r) => Date.parse(r.ts) >= cutoff);
}

function uptimePctOverWindow(records, project, windowMs, nowMs) {
  const cutoff = nowMs - windowMs;
  const subset = records.filter((r) => r.project === project && Date.parse(r.ts) >= cutoff);
  if (subset.length === 0) return null;
  const ups = subset.reduce((acc, r) => acc + r.up, 0);
  return Math.round((ups / subset.length) * 1000) / 10; // one decimal, e.g. 99.8
}

function incidentsInWindow(records, project, windowMs, nowMs) {
  const cutoff = nowMs - windowMs;
  const subset = records
    .filter((r) => r.project === project && Date.parse(r.ts) >= cutoff)
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  const incidents = [];
  let openedAt = null;
  let lastDownTs = null;
  for (const r of subset) {
    if (r.up === 0 && openedAt === null) {
      openedAt = r.ts;
      lastDownTs = r.ts;
    } else if (r.up === 0) {
      lastDownTs = r.ts;
    } else if (r.up === 1 && openedAt !== null) {
      incidents.push({
        started_at: openedAt,
        ended_at: r.ts,
        duration_min: Math.round((Date.parse(r.ts) - Date.parse(openedAt)) / 60_000),
      });
      openedAt = null;
      lastDownTs = null;
    }
  }
  if (openedAt !== null) {
    // Still down at end of window — leave ended_at null.
    incidents.push({
      started_at: openedAt,
      ended_at: null,
      duration_min: Math.round((Date.parse(lastDownTs) - Date.parse(openedAt)) / 60_000),
    });
  }
  return incidents;
}

function buildSummary(results, history, nowIso) {
  const nowMs = Date.parse(nowIso);
  const projects = results.map((r) => ({
    project: r.project,
    url: r.url,
    network: r.network,
    current_up: r.up,
    current_status: r.status_code,
    current_latency_ms: r.latency_ms,
    current_error: r.error,
    uptime_24h: uptimePctOverWindow(history, r.project, 24 * 60 * 60 * 1000, nowMs),
    uptime_7d: uptimePctOverWindow(history, r.project, 7 * 24 * 60 * 60 * 1000, nowMs),
    uptime_30d: uptimePctOverWindow(history, r.project, 30 * 24 * 60 * 60 * 1000, nowMs),
    incidents_7d: incidentsInWindow(history, r.project, 7 * 24 * 60 * 60 * 1000, nowMs),
  }));
  // Flat copy of incidents — top-level so the Grafana table panel can read
  // rows directly via root_selector instead of walking projects[].incidents_7d.
  const incidents_7d = projects.flatMap((p) =>
    p.incidents_7d.map((i) => ({ project: p.project, ...i })),
  );
  return { generated_at: nowIso, projects, incidents_7d };
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  const targets = await loadTargets();
  const nowIso = new Date().toISOString();
  const results = await runAllProbes(targets);

  // Append fresh records to history, then prune.
  const historyRecords = await loadHistory();
  for (const r of results) {
    historyRecords.push({
      ts: nowIso,
      project: r.project,
      up: r.up,
      status_code: r.status_code,
      latency_ms: r.latency_ms,
    });
  }
  const pruned = pruneHistory(historyRecords, Date.parse(nowIso));
  await writeHistory(pruned);

  // Current snapshot.
  await writeFile(
    CURRENT_FILE,
    JSON.stringify({ generated_at: nowIso, results }, null, 2) + '\n',
  );

  // Rolled-up summary the dashboard renders from. History includes the records
  // we just appended, so uptime_* numbers reflect the latest probe.
  const summary = buildSummary(results, pruned, nowIso);
  await writeFile(SUMMARY_FILE, JSON.stringify(summary, null, 2) + '\n');

  const down = results.filter((r) => r.up === 0);
  console.log(`\n${results.length} probed, ${down.length} down.`);
  // Don't fail the workflow when targets are down — the dashboard reports it.
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

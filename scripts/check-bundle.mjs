#!/usr/bin/env node
// Fails the build if any single client chunk is larger than the budget.
//
// Lighthouse can only see a page's total transfer size, and a page's total
// hides the thing that actually hurts: one enormous chunk that every route
// has to parse before it can paint. This reads the build manifests and
// measures the chunks themselves.
//
// The budget is a ratchet, not a target. It sits just above today's largest
// chunk so a regression fails loudly. Lower it as the chunk shrinks; never
// raise it to make a build pass.

import { readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const NEXT_DIR = "apps/web/.next";
// Overridable so the check itself can be tested. CI does not set it.
const BUDGET_BYTES = Number(process.env.BUNDLE_BUDGET_BYTES ?? 150_000);

/**
 * Per-route budgets, on the JavaScript that route loads for itself.
 *
 * A single-chunk budget cannot see a page that is heavy because it loads
 * twelve reasonable chunks, and #45's promise is about one page in
 * particular: the week a parent is reading. This measures that page's own
 * first load — everything in its manifest entry except React and Next's
 * runtime, which no page can avoid and which is measured by Lighthouse.
 *
 * Gzipped, because that is what crosses the wire; raw size is printed
 * beside it so a regression is legible either way.
 */
const ROUTE_BUDGETS = new Map([["/week/[id]/page", { gzip: 90_000 }]]);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

const appManifest = readJson(join(NEXT_DIR, "app-build-manifest.json"));
const buildManifest = readJson(join(NEXT_DIR, "build-manifest.json"));

if (!appManifest && !buildManifest) {
  console.error(`No build manifest under ${NEXT_DIR}. Run \`pnpm build\` first.`);
  process.exit(1);
}

/**
 * React and Next's own runtime. It is in every route's first load, it is not
 * ours to shrink, and it is over any budget worth having — so it is measured
 * by Lighthouse, not here.
 */
const runtime = new Set(buildManifest?.rootMainFiles ?? []);

/** Every chunk file the build produced, keyed by its path under .next/. */
const chunks = new Map();

function collect(files) {
  for (const file of files ?? []) {
    if (!file.endsWith(".js")) continue;
    if (!file.startsWith("static/")) continue;
    if (runtime.has(file)) continue;
    if (/\/(framework|polyfills|main)-/.test(file)) continue;
    if (chunks.has(file)) continue;
    try {
      chunks.set(file, statSync(join(NEXT_DIR, file)).size);
    } catch {
      // A manifest can name a file the build did not emit; that is a
      // different problem and not this script's to report.
    }
  }
}

for (const files of Object.values(appManifest?.pages ?? {})) collect(files);
for (const files of Object.values(buildManifest?.pages ?? {})) collect(files);
collect(buildManifest?.rootMainFiles);

const oversized = [...chunks.entries()]
  .filter(([, size]) => size > BUDGET_BYTES)
  .sort((a, b) => b[1] - a[1]);

const largest = [...chunks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

console.log(`Checked ${chunks.size} client chunks against a ${BUDGET_BYTES} byte budget.`);
for (const [file, size] of largest) {
  console.log(`  ${String(size).padStart(8)}  ${file}`);
}

if (oversized.length > 0) {
  console.error("");
  for (const [file, size] of oversized) {
    console.error(`  ${file} is ${size} bytes, over the ${BUDGET_BYTES} byte budget.`);
  }
  console.error("");
  console.error("A chunk this large is parsed on every route that loads it.");
  console.error("Find what pulls it in before raising the budget.");
  process.exit(1);
}

/** Everything a route loads for itself: its manifest entry, minus runtime. */
function routeOwnChunks(route) {
  const files = appManifest?.pages?.[route] ?? [];
  return files
    .filter((file) => file.endsWith(".js"))
    .filter((file) => file.startsWith("static/"))
    .filter((file) => !runtime.has(file));
}

let routeFailures = 0;
for (const [route, budget] of ROUTE_BUDGETS) {
  const files = routeOwnChunks(route);
  if (files.length === 0) {
    console.error(`  ${route} has no client chunks in the build manifest.`);
    routeFailures += 1;
    continue;
  }
  let raw = 0;
  let gzip = 0;
  for (const file of files) {
    try {
      const bytes = readFileSync(join(NEXT_DIR, file));
      raw += bytes.length;
      gzip += gzipSync(bytes, { level: 9 }).length;
    } catch {
      // Same reasoning as above: a manifest naming a file the build did not
      // emit is a different problem, and the per-chunk pass already reports
      // chunks it can measure.
    }
  }
  const verdict = gzip <= budget.gzip ? "ok" : "OVER";
  console.log(
    `  ${route} loads ${files.length} chunks: ${gzip} gzipped, ${raw} raw (${verdict}, budget ${budget.gzip} gzipped).`,
  );
  if (gzip > budget.gzip) {
    routeFailures += 1;
    console.error(
      `  ${route} ships ${gzip} gzipped bytes of its own JavaScript, over the ${budget.gzip} byte budget.`,
    );
  }
}

if (routeFailures > 0) {
  console.error("");
  console.error("A route over its budget is a route a parent waits for on 4G.");
  console.error("Split what it imports before raising the budget.");
  process.exit(1);
}

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
import { join } from "node:path";

const NEXT_DIR = "apps/web/.next";
// Overridable so the check itself can be tested. CI does not set it.
const BUDGET_BYTES = Number(process.env.BUNDLE_BUDGET_BYTES ?? 450_000);

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

/** Every chunk file the build produced, keyed by its path under .next/. */
const chunks = new Map();

function collect(files) {
  for (const file of files ?? []) {
    if (!file.endsWith(".js")) continue;
    if (!file.startsWith("static/")) continue;
    // React and Next's own runtime. Not ours to shrink, and never small.
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

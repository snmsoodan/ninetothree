#!/usr/bin/env node
/**
 * Every source a pack cites must resolve. A dead citation is worse than no
 * citation: it tells a parent at 3am that the product is not maintained.
 *
 * Some of the most important sources — CDC, CPSC, NHTSA, DOL — return 403 to
 * anything that is not a browser. A 403 is not a dead link, so it is reported
 * as "verify manually" and does not fail the build. A 404 or 410 does.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const PACKS = "packages/content/packs";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const TIMEOUT_MS = 20_000;
const CONCURRENCY = 6;

/** Hosts that block non-browser clients. A 403 from these is expected. */
const BOT_PROTECTED = new Set([
  "www.cdc.gov",
  "cdc.gov",
  "www.cpsc.gov",
  "cpsc.gov",
  "www.nhtsa.gov",
  "nhtsa.gov",
  "www.dol.gov",
  "dol.gov",
  "www.medicaid.gov",
  "medicaid.gov",
  "www.naeyc.org",
  "naeyc.org",
  "adaa.org",
  "www.ssa.gov",
  "ssa.gov",
  "www.acog.org",
  "acog.org",
]);

async function collect() {
  const files = (await readdir(PACKS)).filter((f) => f.endsWith(".json"));
  const urls = new Map();
  for (const file of files) {
    const pack = JSON.parse(await readFile(join(PACKS, file), "utf8"));
    for (const source of pack.sources ?? []) {
      if (!urls.has(source.url)) urls.set(source.url, []);
      urls.get(source.url).push(pack.id);
    }
  }
  return urls;
}

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,*/*" },
    });
    return { status: response.status };
  } catch (error) {
    return { status: 0, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

function classify(url, result) {
  if (result.status === 0) return "unreachable";
  if (result.status >= 200 && result.status < 400) return "ok";
  if (result.status === 403 || result.status === 429) return "bot-protected";
  return "broken";
}

const urls = await collect();
const entries = [...urls.entries()];
const results = [];

for (let i = 0; i < entries.length; i += CONCURRENCY) {
  const batch = entries.slice(i, i + CONCURRENCY);
  results.push(
    ...(await Promise.all(
      batch.map(async ([url, packs]) => {
        const result = await probe(url);
        return { url, packs, result, verdict: classify(url, result) };
      }),
    )),
  );
}

const broken = results.filter((r) => r.verdict === "broken" || r.verdict === "unreachable");
const manual = results.filter((r) => r.verdict === "bot-protected");

for (const r of results) {
  const mark = r.verdict === "ok" ? "ok  " : r.verdict === "bot-protected" ? "403 " : "FAIL";
  console.log(`${mark} ${r.result.status || "---"} ${r.url}`);
}

if (manual.length > 0) {
  console.log(
    `\n${manual.length} source(s) block non-browser clients and must be verified by hand:`,
  );
  for (const r of manual) console.log(`  ${r.url}  (${r.packs.join(", ")})`);
}

if (broken.length > 0) {
  console.error(`\n${broken.length} broken source link(s):`);
  for (const r of broken) {
    console.error(`  ${r.url}  ${r.result.status || r.result.error}  (${r.packs.join(", ")})`);
  }
  process.exit(1);
}

console.log(`\n${results.length} source links checked, none broken.`);

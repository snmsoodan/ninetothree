#!/usr/bin/env node
/**
 * Every source a pack cites, and every link in the catalogue, must resolve.
 * A dead citation is worse than no citation: it tells a parent at 3am that
 * the product is not maintained.
 *
 * Some of the most important sources — CDC, CPSC, NHTSA, DOL — return 403 to
 * anything that is not a browser. A 403 is not a dead link, so it is reported
 * as "verify manually" and does not fail the build. A 404 or 410 does.
 *
 * Runs on every pull request and weekly on a schedule, because a link that
 * worked when it was written can rot without anyone touching the repo.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const PACKS = "packages/content/packs";
const LINKS = "packages/content/links";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const TIMEOUT_MS = 20_000;
const CONCURRENCY = 6;
const RETRIES = 2;

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
  "www.postpartum.net",
  "postpartum.net",
  "www.naeyc.org",
  "cribsforkids.org",
  "thebluedotproject.org",
  "www.nytimes.com",
  "www.simonandschuster.com",
  "www.fda.gov",
  "www.healthcare.gov",
  "www.fns.usda.gov",
  "www.irs.gov",
  "www.medicaid.gov",
  "www.healthychildren.org",
  "www.marchofdimes.org",
  "www.nichd.nih.gov",
  "www.ncbi.nlm.nih.gov",
  "www.womenshealth.gov",
  "mchb.hrsa.gov",
  "www.acf.hhs.gov",
  "www.childcareaware.org",
  "www.uslca.org",
  "www.dona.org",
  "www.midwife.org",
  "www.lamaze.org",
  "www.thehotline.org",
  "www.lawhelp.org",
  "www.consumerreports.org",
  "www.ecfr.gov",
  "www.saferproducts.gov",
  "www.insurekidsnow.gov",
  "www.211.org",
  "www.zerotothree.org",
  "www.asha.org",
  "www.poison.org",
  "988lifeline.org",
  "www.nami.org",
  "www.safekids.org",
  "www.llli.org",
  "www.ican-online.org",
  "fedisbest.org",
  "solidstarts.com",
  "www.nursefamilypartnership.org",
  "ectacenter.org",
  "www.feedingamerica.org",
  "baby2baby.org",
  "blackmamasmatter.org",
  "everymothercounts.org",
  "www.pbskids.org",
  "www.mouthhealthy.org",
  "childcare.gov",
  "www.usa.gov",
  "safetosleep.nichd.nih.gov",
  "www.happiestbaby.com",
  "parentdata.org",
  "www.penguinrandomhouse.com",
  "www.preciouslittlesleep.com",
  "www.consumerreports.org",
]);

function add(urls, url, owner) {
  if (!urls.has(url)) urls.set(url, []);
  const owners = urls.get(url);
  if (!owners.includes(owner)) owners.push(owner);
}

async function collect() {
  const urls = new Map();

  const packFiles = (await readdir(PACKS)).filter((f) => f.endsWith(".json"));
  for (const file of packFiles) {
    const pack = JSON.parse(await readFile(join(PACKS, file), "utf8"));
    for (const source of pack.sources ?? []) add(urls, source.url, pack.id);
  }

  const linkFiles = (await readdir(LINKS)).filter((f) => f.endsWith(".json"));
  for (const file of linkFiles) {
    const entries = JSON.parse(await readFile(join(LINKS, file), "utf8"));
    for (const link of entries) add(urls, link.url, link.id);
  }

  return urls;
}

async function probeOnce(url) {
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

/**
 * A 5xx or a dropped connection is usually the CDN having a bad minute, not
 * a dead page. Retrying twice turns a flaky weekly job into a useful one.
 */
async function probe(url) {
  let result = await probeOnce(url);
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const retryable = result.status === 0 || result.status >= 500;
    if (!retryable) return result;
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    result = await probeOnce(url);
  }
  return result;
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
    `\n${manual.length} link(s) block non-browser clients and must be verified by hand:`,
  );
  for (const r of manual) console.log(`  ${r.url}  (${r.packs.join(", ")})`);
}

if (broken.length > 0) {
  console.error(`\n${broken.length} broken link(s):`);
  for (const r of broken) {
    console.error(`  ${r.url}  ${r.result.status || r.result.error}  (${r.packs.join(", ")})`);
  }
  process.exit(1);
}

console.log(`\n${results.length} links checked, none broken.`);

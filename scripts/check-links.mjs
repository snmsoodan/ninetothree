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
 * A host that never answers is a third case, and it is not a dead link either.
 * nationaldiaperbanknetwork.org went quiet for a fortnight; the pull requests
 * that happened to land in that fortnight failed on it, which taught everyone
 * to re-run the job rather than to read it. So a timeout is reported as
 * "could not be checked" and does not fail a pull request — but `--strict`
 * does fail on it, and the weekly schedule passes `--strict`, because a site
 * that stays down for a week is a link that needs a person.
 *
 * Runs on every pull request and weekly on a schedule, because a link that
 * worked when it was written can rot without anyone touching the repo.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const PACKS = "packages/content/packs";
const LINKS = "packages/content/links";
const ARTICLES = "packages/content/articles";
const TRIAGE = "packages/content/triage/triage.json";
const RECALLS = "packages/content/recalls/recalls.json";
const CHECKLISTS = "packages/content/checklists";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const TIMEOUT_MS = 20_000;
const CONCURRENCY = 6;
const RETRIES = 2;
const PARKED_MAX_BYTES = 2000;

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

  // Articles are typed modules, not JSON, and this script has no TypeScript
  // loader. The `url:` field is a string literal in every one of them, so it
  // is read with a regex — and the count is checked against the number of
  // `url:` keys, so a source that stops matching fails loudly instead of
  // quietly going unchecked.
  const articleFiles = (await readdir(ARTICLES)).filter((f) => f.endsWith(".ts"));
  for (const file of articleFiles) {
    const text = await readFile(join(ARTICLES, file), "utf8");
    const id = /id:\s*"([^"]+)"/.exec(text)?.[1] ?? file;
    const found = [...text.matchAll(/url:\s*"(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
    const declared = (text.match(/^\s*url:/gm) ?? []).length;
    if (found.length !== declared) {
      throw new Error(
        `${file}: found ${found.length} URLs but ${declared} url: keys. The article source check would miss one.`,
      );
    }
    for (const url of found) add(urls, url, id);
  }

  // The triage tree is JSON, so its sources are read directly. Every outcome
  // carries at least one, and the schema refuses a tree where one does not.
  const tree = JSON.parse(await readFile(TRIAGE, "utf8"));
  for (const result of tree.results) {
    for (const source of result.sources) add(urls, source.url, source.id);
  }

  // A recall cites the agency page that published it. That page is the whole
  // point of the notice, so it is checked like any other source.
  const recalls = JSON.parse(await readFile(RECALLS, "utf8"));
  for (const recall of recalls) add(urls, recall.source.url, recall.source.id);

  // A checklist is printed and carried to the hospital, so its sources are
  // read off paper. They are checked like every other citation.
  const checklistFiles = (await readdir(CHECKLISTS)).filter((f) => f.endsWith(".json"));
  for (const file of checklistFiles) {
    const checklist = JSON.parse(await readFile(join(CHECKLISTS, file), "utf8"));
    for (const source of checklist.sources) add(urls, source.url, source.id);
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
    const result = { status: response.status, finalUrl: response.url };
    // A parked domain answers 200 with a tiny page that redirects in script.
    // It is not a page, and a 200 is not proof the link is right: six entries
    // were sitting on one, and every local probe said 200.
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (response.status === 200 && (!declared || declared < PARKED_MAX_BYTES)) {
      const body = await response.text();
      if (body.length < PARKED_MAX_BYTES && /location\.href\s*=\s*["']\/lander["']/.test(body)) {
        result.parked = true;
      }
    }
    return result;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : String(error);
    // An abort is our own timer, or the CDN giving up. A refused connection
    // or a missing name is the domain being gone, which is a real dead link.
    const silent =
      name === "AbortError" || /abort|timed?\s?out|eai_again|econnreset/i.test(message);
    return { status: 0, error: message, silent };
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

/**
 * Some hosts answer a bot with a redirect to a challenge page instead of a
 * status code. ecfr.gov sends non-browser clients to
 * unblock.federalregister.gov, which is a "prove you are human" wall, not a
 * move. Treating it as a move would fail the build on a link that is fine.
 */
const CHALLENGE_HOSTS = [
  "unblock.federalregister.gov",
  "challenges.cloudflare.com",
  "geo.captcha-delivery.com",
  "validate.perfdrive.com",
];

function isChallenge(finalUrl) {
  if (!finalUrl) return false;
  const host = new URL(finalUrl).host;
  return CHALLENGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

function registrable(host) {
  return host.split(".").slice(-2).join(".");
}

function lastSegment(url) {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  return (segments.at(-1) ?? "").toLowerCase();
}

/**
 * A 200 is not proof the link is right. Penguin Random House served a 200 for
 * a book URL that had been reassigned to a different book, and a rebranded
 * charity served a 200 for a page that was no longer theirs. Both would have
 * shipped. A link that now lands somewhere else is a link whose promise may no
 * longer be true, so it fails and a human confirms the destination.
 */
function movedTo(url, finalUrl) {
  if (!finalUrl) return null;
  const from = new URL(url);
  const to = new URL(finalUrl);
  if (from.href === to.href) return null;
  if (registrable(from.host) !== registrable(to.host)) return "a different site";
  const before = lastSegment(url);
  const after = lastSegment(finalUrl);
  if (before === after) return null;
  if (before.startsWith(after) || after.startsWith(before)) return null;
  return "a different page";
}

function classify(url, result) {
  if (result.status === 0) return result.silent ? "unchecked" : "unreachable";
  if (result.parked) return "parked";
  if (isChallenge(result.finalUrl)) return "bot-protected";
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
        return {
          url,
          packs,
          result,
          verdict: classify(url, result),
          moved: isChallenge(result.finalUrl) ? null : movedTo(url, result.finalUrl),
        };
      }),
    )),
  );
}

const strict = process.argv.includes("--strict");
const broken = results.filter(
  (r) => r.verdict === "broken" || r.verdict === "unreachable" || r.verdict === "parked",
);
const manual = results.filter((r) => r.verdict === "bot-protected");
const unchecked = results.filter((r) => r.verdict === "unchecked");
const moved = results.filter((r) => r.verdict === "ok" && r.moved);

for (const r of results) {
  const mark =
    r.verdict === "ok"
      ? "ok  "
      : r.verdict === "bot-protected"
        ? "403 "
        : r.verdict === "unchecked"
          ? "TMO "
          : r.verdict === "parked"
            ? "PARK"
            : "FAIL";
  console.log(`${mark} ${r.result.status || "---"} ${r.url}`);
}

if (manual.length > 0) {
  console.log(`\n${manual.length} link(s) block non-browser clients and must be verified by hand:`);
  for (const r of manual) console.log(`  ${r.url}  (${r.packs.join(", ")})`);
}

if (unchecked.length > 0) {
  const heading = strict ? "must be checked by hand" : "could not be checked from here";
  console.log(`\n${unchecked.length} link(s) ${heading}, and none of them is a 404:`);
  for (const r of unchecked) console.log(`  ${r.url}  ${r.result.error}  (${r.packs.join(", ")})`);
  if (strict) {
    console.log(
      "\nThis is the weekly run: a host that has not answered for a week is a link somebody has to look at.",
    );
  }
}

if (moved.length > 0) {
  console.error(`\n${moved.length} link(s) now land somewhere else:`);
  for (const r of moved) {
    console.error(`  ${r.url}  (${r.packs.join(", ")})`);
    console.error(`    -> ${r.result.finalUrl}  [${r.moved}]`);
  }
  console.error(
    "\nPoint the entry at the destination, or confirm the destination is still the right place.",
  );
}

if (broken.length > 0) {
  console.error(`\n${broken.length} broken link(s):`);
  for (const r of broken) {
    const why = r.verdict === "parked" ? "parked domain" : r.result.status || r.result.error;
    console.error(`  ${r.url}  ${why}  (${r.packs.join(", ")})`);
  }
}

if (broken.length > 0 || moved.length > 0 || (strict && unchecked.length > 0)) process.exit(1);

console.log(
  `\n${results.length} links checked, none broken, none moved` +
    `${unchecked.length > 0 ? `, ${unchecked.length} unanswered` : ""}.`,
);

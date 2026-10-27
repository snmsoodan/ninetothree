#!/usr/bin/env node
/**
 * The evidence pack: one command that runs everything this repo claims is
 * true and writes down what happened.
 *
 * The point is not the passing. It is that a reviewer can look at a release
 * and see the actual output of the actual commands on the actual commit,
 * without taking anyone's word for it. So the script never summarises a
 * result into "passed": it records the exit code, the wall time and the tail
 * of the output, and it writes the same thing to `evidence/summary.md` that
 * it prints.
 *
 *   pnpm evidence                 everything that works without a network
 *   pnpm evidence --links         plus the 251-link audit (slow, needs a network)
 *   pnpm evidence --lighthouse    plus Lighthouse on ten routes (slow)
 *
 * `evidence/` is not committed. It is attached to the release pull request,
 * because a file in a repo rots and a file on a PR is dated.
 */
import { spawn } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "evidence");
const TAIL_LINES = 40;

const argv = new Set(process.argv.slice(2));
const withLinks = argv.has("--links");
const withLighthouse = argv.has("--lighthouse");

/**
 * Ordered cheapest-and-most-fundamental first, so the first failure in the
 * summary is the one worth reading. `EVIDENCE=1` is what wakes the screenshot
 * spec inside the end-to-end run; it is skipped otherwise so a normal
 * `pnpm test:e2e` does not write files.
 */
const CHECKS = [
  { name: "format:check", args: ["format:check"], what: "Prettier, whole repo" },
  { name: "lint", args: ["lint"], what: "ESLint with --max-warnings 0" },
  { name: "typecheck", args: ["typecheck"], what: "tsc --noEmit, every package" },
  { name: "test", args: ["test"], what: "Vitest, with coverage floors" },
  { name: "content:validate", args: ["content:validate"], what: "Every pack against the schema" },
  {
    name: "content:registry:check",
    args: ["content:registry:check"],
    what: "The generated registry is not stale",
  },
  {
    name: "content:indexes:check",
    args: ["content:indexes:check"],
    what: "The generated library indexes are not stale",
  },
  {
    name: "build",
    args: ["build"],
    what: "Next build and package builds",
    env: { AUTH_SECRET: "evidence-not-a-secret-0000000000" },
  },
  { name: "bundle:check", args: ["bundle:check"], what: "Every route inside its gzipped budget" },
  {
    name: "build:storybook",
    args: ["build:storybook"],
    what: "Storybook, which the e2e sweep reads",
  },
  {
    name: "test:e2e",
    /*
     * Straight to the package script rather than through `turbo`: turbo runs
     * tasks in strict env mode, so `EVIDENCE` would be dropped on the way in
     * and the screenshot spec would skip itself — a pack that silently
     * contains no pictures. The screenshots are checked for below.
     */
    args: ["--filter", "@ninetothree/web", "test:e2e"],
    what: "Playwright: journeys, a11y, no-JS, offline, and screenshots",
    env: { EVIDENCE: "1" },
    timeoutMs: 20 * 60_000,
  },
];

const OPTIONAL = [
  {
    name: "links:check",
    args: ["links:check"],
    what: "Every citation and catalogue link resolves",
    enabled: withLinks,
    why: "--links",
    timeoutMs: 30 * 60_000,
  },
  {
    name: "lighthouse",
    args: ["lighthouse"],
    what: "Lighthouse on ten routes, medians of three runs",
    enabled: withLighthouse,
    why: "--lighthouse",
    timeoutMs: 30 * 60_000,
  },
];

function run({ args, env = {}, timeoutMs = 15 * 60_000 }) {
  return new Promise((resolveRun) => {
    const started = Date.now();
    const child = spawn("pnpm", args, {
      cwd: ROOT,
      env: { ...process.env, CI: "", ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    const keep = (chunk) => {
      output += chunk.toString();
      /* Keep the buffer bounded: a failing test run can print megabytes. */
      if (output.length > 400_000) output = output.slice(-200_000);
    };
    child.stdout.on("data", keep);
    child.stderr.on("data", keep);
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolveRun({
        code: code ?? (signal ? 1 : 0),
        signal,
        ms: Date.now() - started,
        output,
      });
    });
  });
}

const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;

function tail(output) {
  const lines = output.trimEnd().split("\n");
  return lines.slice(-TAIL_LINES).join("\n");
}

async function main() {
  /* Start from nothing: a stale picture from a previous run is not evidence
     that this run produced one. */
  await rm(join(OUT, "screenshots"), { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const results = [];
  const skipped = OPTIONAL.filter((check) => !check.enabled).map((check) => ({
    name: check.name,
    why: check.why,
  }));

  for (const check of [...CHECKS, ...OPTIONAL.filter((c) => c.enabled)]) {
    process.stdout.write(`\n── ${check.name} — ${check.what}\n`);
    const result = await run(check);
    const ok = result.code === 0;
    process.stdout.write(`   ${ok ? "ok" : "FAILED"} in ${seconds(result.ms)}\n`);
    if (!ok) process.stdout.write(`${tail(result.output)}\n`);
    /* Turbo replays a previous identical run on the same inputs. That is a
       real result for this commit, but a reader deserves to know which rows
       came out of the cache rather than off the machine just now. */
    const cached = /cache hit, replaying logs/.test(result.output);
    results.push({ ...check, ...result, ok, cached });
  }

  /*
   * A green end-to-end run that produced no pictures is not an evidence pack.
   * Caught here rather than trusted, because the way this fails is silence:
   * the screenshot spec skips itself when its environment variable is missing.
   */
  const shots = (await readdir(join(OUT, "screenshots")).catch(() => [])).filter((name) =>
    name.endsWith(".png"),
  );
  const missingShots = shots.length === 0 ? [{ name: "screenshots", code: 1, output: "" }] : [];
  const failed = [...results.filter((result) => !result.ok), ...missingShots];
  const generated = new Date().toISOString();

  await writeFile(
    join(OUT, "checks.json"),
    `${JSON.stringify(
      {
        generated,
        commit: process.env.GITHUB_SHA ?? null,
        failed: failed.map((result) => result.name),
        checks: results.map((result) => ({
          name: result.name,
          what: result.what,
          ok: result.ok,
          cached: result.cached,
          code: result.code,
          ms: result.ms,
        })),
        skipped,
      },
      null,
      2,
    )}\n`,
  );

  const table = results
    .map(
      (result) =>
        `| \`${result.name}\` | ${result.ok ? (result.cached ? "pass (cached)" : "pass") : "**FAIL**"} | ${seconds(result.ms)} | ${result.what} |`,
    )
    .join("\n");

  const failures = failed
    .map(
      (result) =>
        `### \`${result.name}\` exited ${result.code}\n\n\`\`\`\n${tail(result.output)}\n\`\`\``,
    )
    .join("\n\n");

  const notRun = skipped.length
    ? `\n## Not run\n\n${skipped.map((item) => `- \`${item.name}\` — needs \`${item.why}\`.`).join("\n")}\n`
    : "";

  await writeFile(
    join(OUT, "summary.md"),
    `# Evidence pack

Generated ${generated} from \`${process.env.GITHUB_SHA ?? "a local working tree"}\`.

| Check | Result | Time | What it covers |
| --- | --- | --- | --- |
${table}

${results.some((result) => result.cached) ? "A row marked `pass (cached)` came out of Turbo's cache: an identical earlier run on the same inputs. That is a real result for this commit, but it was not produced just now — run the same command again after `pnpm build --force`, or look at a CI run, for a fresh one.\n" : ""}
${failed.length === 0 ? "Nothing failed." : `## Failures\n\n${failures || "The end-to-end run finished green but wrote no screenshots."}`}
${notRun}
## Reproducing this

\`\`\`sh
pnpm install
pnpm evidence            # add --links, --lighthouse, or both for the slow checks
\`\`\`

${shots.length} screenshot(s) from the end-to-end run are in \`evidence/screenshots/\` and are
attached to the release pull request. This directory is not committed.
`,
  );

  process.stdout.write(
    `\n${results.length - failed.length}/${results.length} passed · wrote evidence/summary.md\n`,
  );
  if (skipped.length) {
    process.stdout.write(
      `Not run: ${skipped.map((item) => `${item.name} (${item.why})`).join(", ")}\n`,
    );
  }
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

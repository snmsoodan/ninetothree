/*
 * Writes the four store artefacts from `store.json`, or — with `--check` —
 * fails when they, `app.json` or `eas.json` disagree with it.
 *
 * The check is the point. Apple's manifest, Play's answers and both listings
 * are one product; the failure they are prone to is not being wrong, it is
 * being edited in one place. This prints the diff, which is the whole
 * instruction somebody needs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  appConfigFindings,
  easFindings,
  findings,
  renderStore,
  type StoreSource,
} from "./render.ts";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const check = process.argv.includes("--check");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

const source = readJson(join(here, "store.json")) as StoreSource;
const problems = [
  ...findings(source),
  ...appConfigFindings(source, readJson(join(app, "app.json"))),
  ...easFindings(readJson(join(app, "eas.json"))),
];

if (problems.length > 0) {
  process.stderr.write(
    `store: store.json and the app disagree\n\n${problems.map((line) => `  - ${line}`).join("\n")}\n\n`,
  );
  process.exit(1);
}

const files = renderStore(source);
let drift = 0;

for (const [name, expected] of Object.entries(files)) {
  const path = join(here, name);
  let actual: string | null = null;
  try {
    actual = readFileSync(path, "utf8");
  } catch {
    actual = null;
  }
  if (actual === expected) continue;
  if (check) {
    drift += 1;
    process.stderr.write(`store: ${path} does not match apps/mobile/store/store.json\n`);
    continue;
  }
  writeFileSync(path, expected);
  process.stdout.write(`store: wrote ${name}\n`);
}

if (drift > 0) {
  process.stderr.write(
    "\nRun `pnpm --filter @ninetothree/mobile store` and commit the result.\n" +
      "These files are generated; editing one by hand is the drift this check exists to stop.\n",
  );
  process.exit(1);
}

process.stdout.write(`store: ${Object.keys(files).length} files match store.json\n`);

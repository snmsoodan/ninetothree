/*
 * Writes `packages/ui/src/tokens.css` from `src/tokens.ts`, or — with
 * `--check` — fails when the two disagree.
 *
 * The check is the point. A stylesheet Tailwind reads and a token object a
 * phone reads are two compilers over one source, and the failure they are
 * prone to is not being wrong, it is being edited in one place. This prints
 * the diff, which is the whole instruction somebody needs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderTokensCss } from "../src/css.ts";

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, "../../ui/src/tokens.css");
const expected = renderTokensCss();
const check = process.argv.includes("--check");

let actual: string | null = null;
try {
  actual = readFileSync(target, "utf8");
} catch {
  actual = null;
}

if (actual === expected) {
  process.stdout.write(`tokens: ${target} is up to date\n`);
  process.exit(0);
}

if (check) {
  process.stderr.write(
    `tokens: ${target} does not match packages/tokens/src/tokens.ts\n\n` +
      `Run \`pnpm --filter @ninetothree/tokens tokens:emit\` and commit the result.\n` +
      `The stylesheet is generated; editing it by hand is the drift this check exists to stop.\n`,
  );
  process.exit(1);
}

writeFileSync(target, expected, "utf8");
process.stdout.write(`tokens: wrote ${target}\n`);

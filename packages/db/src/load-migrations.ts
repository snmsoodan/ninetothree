import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Migration } from "./migrate";

// Built with `join` rather than `new URL(..., import.meta.url)` on purpose: a
// literal `new URL` is statically resolvable, and webpack then tries to bundle
// the directory and fails the Next build. This module is test-only, but the
// mistake is one import away from coming back.
const MIGRATIONS_DIR = join(fileURLToPath(import.meta.url), "..", "..", "migrations");

/**
 * Reads every `NNNN_name.up.sql` and pairs it with its `.down.sql`.
 *
 * This is the CLI and test path. The app uses `MIGRATIONS`, which is the same
 * content inlined at build time, because a serverless deploy has no directory
 * to read.
 *
 * A migration without a down file is a migration that cannot be rolled back,
 * so it is an error rather than a warning — the whole point of the pair is
 * that the reverse was written and reviewed at the same time as the forward.
 */
export function loadMigrations(dir: string = MIGRATIONS_DIR): Migration[] {
  const entries = readdirSync(dir);
  const migrations = entries
    .filter((file) => file.endsWith(".up.sql"))
    .map((file) => {
      const name = file.slice(0, -".up.sql".length);
      const downFile = `${name}.down.sql`;
      if (!entries.includes(downFile)) {
        throw new Error(`${name} has no .down.sql`);
      }
      return {
        name,
        up: readFileSync(join(dir, file), "utf8"),
        down: readFileSync(join(dir, downFile), "utf8"),
      };
    });
  return migrations.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Parity, as a test rather than a promise.
 *
 * The manifest says which web routes exist, which of them the phone answers,
 * and which blocks each phone screen owes. These functions are the reading of
 * it: no React, no filesystem assumptions, so the rules can be tested on
 * strings and the repository paths only appear in the test that uses them.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, sep } from "node:path";

export type ParityClass = "full" | "native-substitute" | "web-only";

export interface ScreenEntry {
  /** The web route, with dynamic segments written as `[id]`. */
  route: string;
  /** The phone route, or null when the screen is web-only. */
  phone: string | null;
  parity: ParityClass;
  /** Required for `native-substitute` and `web-only`: why the screen differs. */
  reason?: string;
  /** testIDs the phone screen renders, in the order it renders them. */
  blocks: string[];
}

const CLASSES: readonly ParityClass[] = ["full", "native-substitute", "web-only"];

/** A manifest entry that cannot be trusted is a failure, not a skipped row. */
export function parseManifest(text: string): ScreenEntry[] {
  const raw: unknown = JSON.parse(text);
  if (!Array.isArray(raw)) throw new Error("screens.json must be an array");
  return raw.map((entry, index) => {
    if (typeof entry !== "object" || entry === null)
      throw new Error(`row ${index} is not an object`);
    const row = entry as Record<string, unknown>;
    if (typeof row.route !== "string" || !row.route.startsWith("/")) {
      throw new Error(`row ${index} has no route`);
    }
    if (row.phone !== null && typeof row.phone !== "string") {
      throw new Error(`row ${index} (${row.route}) has no phone field`);
    }
    if (typeof row.parity !== "string" || !CLASSES.includes(row.parity as ParityClass)) {
      throw new Error(`row ${index} (${row.route}) has an unknown parity class`);
    }
    if (row.reason !== undefined && typeof row.reason !== "string") {
      throw new Error(`row ${index} (${row.route}) has a non-string reason`);
    }
    if (!Array.isArray(row.blocks) || row.blocks.some((block) => typeof block !== "string")) {
      throw new Error(`row ${index} (${row.route}) has no blocks array`);
    }
    return {
      route: row.route,
      phone: row.phone as string | null,
      parity: row.parity as ParityClass,
      ...(row.reason !== undefined ? { reason: row.reason as string } : {}),
      blocks: row.blocks as string[],
    };
  });
}

/** Every `page.tsx` under `app`, as a route. `/` is a route, not an empty string. */
export function webRoutes(appDir: string): string[] {
  const routes: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full, `${prefix}/${entry}`);
      } else if (entry === "page.tsx") {
        routes.push(prefix || "/");
      }
    }
  };
  walk(appDir, "");
  return routes.sort();
}

/** The three places a phone route may live: a stack file, a tab, or a directory with an index. */
export function mobileCandidates(phone: string): string[] {
  return [`app${phone}.tsx`, `app${sep}(tabs)${phone}.tsx`, `app${phone}${sep}index.tsx`];
}

/** The first block's marker that is missing, or the first pair that is out of order. */
export function blockOrderErrors(source: string, blocks: readonly string[]): string[] {
  const errors: string[] = [];
  let cursor = 0;
  for (const block of blocks) {
    const marker = `testID="${block}"`;
    const at = source.indexOf(marker, cursor);
    if (at === -1) {
      errors.push(
        source.includes(block)
          ? `"${block}" is rendered before the block it follows`
          : `"${block}" is not rendered`,
      );
      continue;
    }
    cursor = at + marker.length;
  }
  return errors;
}

/**
 * A route file plus the local modules it imports, in the order it imports them.
 *
 * The phone keeps its copy and its layout in `src/*-screen.tsx` and its route file
 * two lines thick, so reading only the route would find no testIDs and prove
 * nothing. Aliased packages are not followed: their testIDs belong to the
 * primitives, not to the screen.
 */
export function sourceWithImports(file: string, read: (path: string) => string | null): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  const walk = (path: string) => {
    if (seen.has(path)) return;
    seen.add(path);
    const text = read(path);
    if (text === null) return;
    parts.push(text);
    for (const match of text.matchAll(/from\s+"(\.{1,2}\/[^"]+)"/g)) {
      const target = join(dirname(path), String(match[1]));
      const resolved = [target, `${target}.tsx`, `${target}.ts`, join(target, "index.tsx")].find(
        (candidate) => read(candidate) !== null,
      );
      if (resolved) walk(resolved);
    }
  };
  walk(file);
  return parts.join("\n");
}

/**
 * Every rule the manifest has to keep, as strings a failing test can print.
 *
 * Deliberately not a boolean: when parity breaks, the useful output is which
 * route and which block, not that "the manifest is invalid".
 */
export function parityErrors(
  entries: readonly ScreenEntry[],
  routes: readonly string[],
  mobileExists: (candidate: string) => boolean,
  mobileSource: (candidate: string) => string | null,
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.route)) errors.push(`${entry.route} appears more than once`);
    seen.add(entry.route);

    if (entry.parity !== "full" && !entry.reason) {
      errors.push(`${entry.route} is ${entry.parity} without a reason`);
    }
    if (entry.parity === "web-only" && entry.phone !== null) {
      errors.push(`${entry.route} is web-only but names a phone route`);
    }
    if (entry.parity !== "web-only" && entry.phone === null) {
      errors.push(`${entry.route} is ${entry.parity} without a phone route`);
    }
    if (entry.parity === "full" && entry.blocks.length === 0) {
      errors.push(`${entry.route} names no blocks, so it proves nothing`);
    }
  }

  for (const route of routes) {
    if (!seen.has(route)) errors.push(`${route} is not in the manifest`);
  }
  for (const route of seen) {
    if (!routes.includes(route)) errors.push(`${route} is in the manifest but is not a page`);
  }

  for (const entry of entries) {
    if (entry.parity === "web-only" || !entry.phone) continue;
    const candidates = mobileCandidates(entry.phone);
    const file = candidates.find((candidate) => mobileExists(candidate));
    if (!file) {
      errors.push(`${entry.route} has no phone file (${candidates.join(" or ")})`);
      continue;
    }
    const source = mobileSource(file) ?? "";
    for (const error of blockOrderErrors(source, entry.blocks)) {
      errors.push(`${entry.route} → ${file}: ${error}`);
    }
  }

  return errors;
}

/** The manifest, parsed from the package's own copy. Used by the tests, not by the app. */
export function readManifest(path: string): ScreenEntry[] {
  return parseManifest(readFileSync(path, "utf8"));
}

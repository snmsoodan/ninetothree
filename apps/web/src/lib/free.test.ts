import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/* The product is free. These tests are the tripwire on that sentence: they do
   not check a feature, they check that the machinery for taking money — and
   for hiding a week until somebody pays — has not crept back in. */

const SRC = join(__dirname, "..");

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...filesUnder(path));
    else out.push(path);
  }
  return out;
}

const SOURCES = filesUnder(SRC).filter(
  (path) => /\.(tsx?|mdx?)$/.test(path) && !/\.test\.|stories\./.test(path),
);

describe("nothing here is for sale", () => {
  it("has no gate, no plan check and no checkout left in the app", () => {
    const forbidden = /useEntitlements|useWeekGate|entitlementsFor|FREE_LIMITS|stripe/i;
    const offenders = SOURCES.filter((path) => forbidden.test(readFileSync(path, "utf8"))).map(
      (path) => relative(SRC, path),
    );
    expect(offenders).toEqual([]);
  });

  it("has no billing routes and no paywall component", () => {
    expect(existsSync(join(SRC, "app/api/billing"))).toBe(false);
    expect(existsSync(join(SRC, "components/Paywall.tsx"))).toBe(false);
    expect(existsSync(join(SRC, "lib/week-gate.ts"))).toBe(false);
  });

  it("does not sell a subscription in anything a parent reads", () => {
    const forbidden = /part of Plus|Upgrade to Plus|\$5\b|free trial|start your trial/i;
    const offenders = SOURCES.filter((path) => forbidden.test(readFileSync(path, "utf8"))).map(
      (path) => relative(SRC, path),
    );
    expect(offenders).toEqual([]);
  });
});

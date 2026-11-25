import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderTokensCss } from "./css.ts";
import { tokenCount } from "./tokens.ts";

const here = dirname(fileURLToPath(import.meta.url));

function read(relative: string): string {
  return readFileSync(join(here, relative), "utf8");
}

/**
 * `"  --color-paper: #fbf9f6;"` → `"color-paper=#fbf9f6"`.
 *
 * A list rather than a map, because `--font-sans` is declared twice on purpose
 * (Inter, then Atkinson Hyperlegible) and a map would silently drop one.
 */
function declarations(css: string): string[] {
  return [...css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(
    (match) => `${match[1] ?? ""}=${match[2]?.trim() ?? ""}`,
  );
}

/** The stylesheet this file is generated *into*, next to its consumers. */
const COMMITTED = read("../../ui/src/tokens.css");

/** The stylesheet before #148, kept so "nothing was dropped" has something to check against. */
const BEFORE = read("./fixtures/tokens.before.css");

describe("the generated stylesheet", () => {
  it("is exactly what the generator emits", () => {
    expect(COMMITTED).toBe(renderTokensCss());
  });

  it("declares the number of tokens the source claims", () => {
    expect(declarations(COMMITTED)).toHaveLength(tokenCount);
  });

  it("declares nothing the pre-#148 stylesheet did not already declare", () => {
    const added = declarations(COMMITTED).filter(
      (declaration) => !declarations(BEFORE).includes(declaration),
    );

    expect(added).toEqual([]);
  });

  it("drops nothing the pre-#148 stylesheet declared", () => {
    const dropped = declarations(BEFORE).filter(
      (declaration) => !declarations(COMMITTED).includes(declaration),
    );

    expect(dropped).toEqual([]);
  });

  it("differs from the pre-#148 stylesheet only in whitespace and the header note", () => {
    const strip = (css: string): string =>
      css
        .split("\n")
        .filter((line) => !/GENERATED FILE|tokens:check/.test(line))
        .join(" ")
        .replace(/\s+/g, " ");

    expect(strip(COMMITTED)).toBe(strip(BEFORE));
  });
});

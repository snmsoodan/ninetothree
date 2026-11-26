import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

import {
  blockOrderErrors,
  mobileCandidates,
  parityErrors,
  parseManifest,
  readManifest,
  sourceWithImports,
  webRoutes,
  type ScreenEntry,
} from "./index.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const WEB_APP = join(ROOT, "apps/web/src/app");
const MOBILE_APP = join(ROOT, "apps/mobile");

const entry = (overrides: Partial<ScreenEntry> = {}): ScreenEntry => ({
  route: "/today",
  phone: "/today",
  parity: "full",
  blocks: ["today-week"],
  ...overrides,
});

describe("the screens manifest", () => {
  it("covers every web page exactly once and every phone file it promises", () => {
    const entries = readManifest(join(ROOT, "packages/parity/src/screens.json"));
    const errors = parityErrors(
      entries,
      webRoutes(WEB_APP),
      (candidate) => {
        try {
          return statSync(join(MOBILE_APP, candidate)).isFile();
        } catch {
          return false;
        }
      },
      (candidate) =>
        sourceWithImports(join(MOBILE_APP, candidate), (path) => {
          try {
            return readFileSync(path, "utf8");
          } catch {
            return null;
          }
        }),
    );

    expect(errors).toEqual([]);
  });

  it("reads the real page directories, dynamic segments included", () => {
    const routes = webRoutes(WEB_APP);
    expect(routes).toContain("/");
    expect(routes).toContain("/week/[id]");
    expect(routes).toContain("/print/checklist/[id]");
    expect(routes).toHaveLength(30);
  });
});

describe("what the manifest refuses", () => {
  const exists = (candidate: string) => candidate === "app/(tabs)/today.tsx";
  const source = () => "today-week ... today-appointments ... today-pins";

  it("accepts a stand-in with no blocks", () => {
    expect(
      parityErrors(
        [entry({ parity: "native-substitute", blocks: [], reason: "still a skeleton" })],
        ["/today"],
        exists,
        source,
      ),
    ).toEqual([]);
  });

  it("accepts the happy row", () => {});

  it("reports a duplicate, an unknown page and a missing one", () => {
    const errors = parityErrors(
      [entry(), entry(), entry({ route: "/week/[id]" })],
      ["/today", "/shelf"],
      exists,
      source,
    );
    expect(errors).toContain("/today appears more than once");
    expect(errors).toContain("/shelf is not in the manifest");
    expect(errors).toContain("/week/[id] is in the manifest but is not a page");
  });

  it("requires a reason for anything that is not full parity", () => {
    const errors = parityErrors(
      [
        entry({ parity: "native-substitute" }),
        entry({ route: "/week", parity: "web-only", phone: null }),
      ],
      ["/today", "/week"],
      exists,
      source,
    );
    expect(errors).toContain("/today is native-substitute without a reason");
    expect(errors).toContain("/week is web-only without a reason");
  });

  it("refuses a web-only row that still names a phone route", () => {
    const errors = parityErrors(
      [entry({ parity: "web-only", phone: "/today", reason: "why" })],
      ["/today"],
      exists,
      source,
    );
    expect(errors).toContain("/today is web-only but names a phone route");
  });

  it("refuses a full row with no phone route and no blocks", () => {
    const errors = parityErrors(
      [entry({ phone: null, blocks: [], reason: "why" })],
      ["/today"],
      exists,
      source,
    );
    expect(errors).toContain("/today is full without a phone route");
    expect(errors).toContain("/today names no blocks, so it proves nothing");
  });

  it("names the file when neither candidate exists", () => {
    const errors = parityErrors(
      [entry()],
      ["/today"],
      () => false,
      () => null,
    );
    expect(errors[0]).toBe(
      "/today has no phone file (app/today.tsx or app/(tabs)/today.tsx or app/today/index.tsx)",
    );
  });

  it("checks blocks against the file it found, not the route", () => {
    const errors = parityErrors([entry()], ["/today"], exists, () => "nothing here");
    expect(errors.join()).toContain('"today-week" is not rendered');
  });

  it("treats an unreadable file as an empty one", () => {
    const errors = parityErrors([entry()], ["/today"], exists, () => null);
    expect(errors.join()).toContain('"today-week" is not rendered');
  });
});

describe("block order", () => {
  it("passes when each block appears after the previous one", () => {
    expect(blockOrderErrors('a testID="a" b testID="c"', ["a", "c"])).toEqual([]);
  });

  it("distinguishes missing from out of order", () => {
    expect(blockOrderErrors('testID="c" testID="a"', ["a", "c"])).toEqual([
      '"c" is rendered before the block it follows',
    ]);
    expect(blockOrderErrors('testID="a"', ["a", "b"])).toEqual(['"b" is not rendered']);
  });
});

describe("reading a manifest", () => {
  const broken = [
    ["not an array", "{}", "must be an array"],
    ["a non-object row", "[1]", "is not an object"],
    ["a row with no route", '[{"phone":null,"parity":"web-only","blocks":[]}]', "has no route"],
    [
      "a missing phone field",
      '[{"route":"/a","parity":"full","blocks":["x"]}]',
      "has no phone field",
    ],
    [
      "an unknown class",
      '[{"route":"/a","phone":null,"parity":"nope","blocks":[]}]',
      "unknown parity class",
    ],
    [
      "a non-string reason",
      '[{"route":"/a","phone":null,"parity":"web-only","reason":1,"blocks":[]}]',
      "non-string reason",
    ],
    [
      "a row with no blocks",
      '[{"route":"/a","phone":null,"parity":"web-only"}]',
      "has no blocks array",
    ],
    [
      "a block that is not a string",
      '[{"route":"/a","phone":null,"parity":"web-only","blocks":[1]}]',
      "has no blocks array",
    ],
  ] as const;

  for (const [label, text, message] of broken) {
    it(`refuses ${label}`, () => {
      expect(() => parseManifest(text)).toThrow(message);
    });
  }

  it("keeps a reason when one is given", () => {
    expect(
      parseManifest('[{"route":"/a","phone":null,"parity":"web-only","reason":"why","blocks":[]}]'),
    ).toEqual([{ route: "/a", phone: null, parity: "web-only", reason: "why", blocks: [] }]);
  });
});

describe("following a route into its screen", () => {
  const files: Record<string, string> = {
    "app/today.tsx":
      'import { Today } from "./src/today";\nimport { x } from "@ninetothree/ui-native";',
    "app/src/today.tsx": 'import { y } from "./parts/deep";\n<Card testID="week" />',
    "app/src/parts/deep.tsx": '<View testID="pins" />',
    "app/src/parts/loop.tsx": 'import { z } from "./loop";\nimport { q } from "./missing";',
  };
  const read = (path: string) => files[path] ?? null;

  it("reads the route, then its local imports, once each", () => {
    expect(sourceWithImports("app/today.tsx", read)).toBe(
      [files["app/today.tsx"], files["app/src/today.tsx"], files["app/src/parts/deep.tsx"]].join(
        "\n",
      ),
    );
  });

  it("survives a cycle and an import that does not resolve", () => {
    expect(sourceWithImports("app/src/parts/loop.tsx", read)).toBe(files["app/src/parts/loop.tsx"]);
    expect(sourceWithImports("app/nothing.tsx", read)).toBe("");
  });
});

describe("walking a page directory", () => {
  const tree = mkdtempSync(join(tmpdir(), "parity-"));
  mkdirSync(join(tree, "week/[id]"), { recursive: true });
  writeFileSync(join(tree, "page.tsx"), "root");
  writeFileSync(join(tree, "week/[id]/page.tsx"), "week");
  writeFileSync(join(tree, "week/[id]/layout.tsx"), "not a page");
  afterAll(() => rmSync(tree, { recursive: true, force: true }));

  it("finds pages at any depth and ignores layouts", () => {
    expect(webRoutes(tree)).toEqual(["/", "/week/[id]"]);
  });

  it("knows the two places a phone route lives", () => {
    expect(mobileCandidates("/today")).toEqual([
      "app/today.tsx",
      "app/(tabs)/today.tsx",
      "app/today/index.tsx",
    ]);
  });
});

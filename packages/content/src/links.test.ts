import { describe, expect, it } from "vitest";
import {
  assertValidLinks,
  groupByType,
  linksForDomain,
  linksForStage,
  loadLinks,
  searchLinks,
  stageOrdinal,
  type LinkEntry,
} from "./links";
import { LINKS, LINKS_BY_ID, getLink } from "./link-registry";

function link(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "test-link",
    title: "A place to go",
    url: "https://example.com/",
    publisher: "Example",
    type: "authoritative",
    domains: ["sleep"],
    stages: { from: { kind: "pregnancy", index: 4 }, to: { kind: "toddler", index: 36 } },
    cost: "free",
    why: "Because it helps.",
    lastChecked: "2026-10-20",
    reviewedBy: "Clinical review pending",
    ...overrides,
  };
}

function parsed(overrides: Record<string, unknown> = {}): LinkEntry {
  const { links, issues } = loadLinks([link(overrides)]);
  expect(issues).toEqual([]);
  return links[0]!;
}

describe("stageOrdinal", () => {
  it("orders the timeline pregnancy → postpartum → infant → toddler", () => {
    const points = [
      { kind: "pregnancy", index: 40 },
      { kind: "postpartum", index: 0 },
      { kind: "infant", index: 0 },
      { kind: "toddler", index: 0 },
    ] as const;
    const ordinals = points.map((point) => stageOrdinal(point));
    expect(ordinals).toEqual([...ordinals].sort((a, b) => a - b));
    expect(new Set(ordinals).size).toBe(4);
  });

  it("increases with the index inside a kind", () => {
    expect(stageOrdinal({ kind: "infant", index: 6 })).toBeGreaterThan(
      stageOrdinal({ kind: "infant", index: 2 }),
    );
  });
});

describe("LinkEntry", () => {
  it("accepts a well-formed entry and fills the defaults", () => {
    const entry = parsed();
    expect(entry.country).toEqual(["US"]);
    expect(entry.language).toBe("en-US");
    expect(entry.affiliate).toBe(false);
  });

  it("rejects an app with no platforms", () => {
    const { issues } = loadLinks([link({ type: "app" })]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("platforms");
    expect(issues[0]?.message).toMatch(/which platforms/);
  });

  it("accepts an app that names its platforms", () => {
    const { issues } = loadLinks([link({ type: "app", platforms: ["ios"] })]);
    expect(issues).toEqual([]);
  });

  it("rejects an affiliate flag on a non-commercial link", () => {
    const { issues } = loadLinks([link({ affiliate: true })]);
    expect(issues[0]?.path).toBe("affiliate");
    expect(issues[0]?.message).toMatch(/only commercial/);
  });

  it("accepts an affiliate flag on a commercial link", () => {
    const { issues } = loadLinks([link({ type: "commercial", affiliate: true })]);
    expect(issues).toEqual([]);
  });

  it("rejects a stage range that runs backwards", () => {
    const { issues } = loadLinks([
      link({
        stages: { from: { kind: "toddler", index: 12 }, to: { kind: "pregnancy", index: 4 } },
      }),
    ]);
    expect(issues[0]?.path).toBe("stages");
    expect(issues[0]?.message).toMatch(/must not be after/);
  });

  it("rejects a non-kebab-case id", () => {
    const { issues } = loadLinks([link({ id: "Not Kebab" })]);
    expect(issues[0]?.path).toBe("id");
  });

  it("rejects a bad url", () => {
    const { issues } = loadLinks([link({ url: "not a url" })]);
    expect(issues[0]?.path).toBe("url");
  });

  it("rejects a malformed lastChecked", () => {
    const { issues } = loadLinks([link({ lastChecked: "20-10-2026" })]);
    expect(issues[0]?.path).toBe("lastChecked");
  });

  it("rejects a malformed language", () => {
    const { issues } = loadLinks([link({ language: "english" })]);
    expect(issues[0]?.path).toBe("language");
  });

  it("rejects an entry with no domain", () => {
    const { issues } = loadLinks([link({ domains: [] })]);
    expect(issues[0]?.path).toBe("domains");
  });

  it("reports an unknown id as <unknown>", () => {
    const { issues } = loadLinks([{ title: "no id" }]);
    expect(issues[0]?.linkId).toBe("<unknown>");
  });

  it("reports a root-level problem against <root>", () => {
    const { issues } = loadLinks([null]);
    expect(issues[0]?.linkId).toBe("<unknown>");
    expect(issues[0]?.path).toBe("<root>");
  });

  it("reports every problem at once rather than one per run", () => {
    const { issues } = loadLinks([link({ id: "Bad Id", url: "nope" })]);
    expect(issues.length).toBeGreaterThan(1);
  });
});

describe("assertValidLinks", () => {
  it("returns the links when everything is valid", () => {
    expect(assertValidLinks([link()])).toHaveLength(1);
  });

  it("throws with the offending id and path", () => {
    expect(() => assertValidLinks([link({ type: "app" })])).toThrow(/test-link → platforms/);
  });

  it("throws on a duplicate id", () => {
    expect(() => assertValidLinks([link(), link()])).toThrow(/Duplicate link id: test-link/);
  });
});

describe("linksForStage", () => {
  const links = [
    parsed({
      id: "early",
      stages: { from: { kind: "pregnancy", index: 4 }, to: { kind: "pregnancy", index: 12 } },
    }),
    parsed({
      id: "late",
      stages: { from: { kind: "pregnancy", index: 28 }, to: { kind: "toddler", index: 36 } },
    }),
  ];

  it("includes a link whose window covers the stage", () => {
    expect(linksForStage(links, { kind: "pregnancy", index: 8 }).map((l) => l.id)).toEqual([
      "early",
    ]);
  });

  it("includes both ends of the window", () => {
    expect(linksForStage(links, { kind: "pregnancy", index: 4 }).map((l) => l.id)).toEqual([
      "early",
    ]);
    expect(linksForStage(links, { kind: "pregnancy", index: 12 }).map((l) => l.id)).toEqual([
      "early",
    ]);
  });

  it("excludes a link that has not started yet", () => {
    expect(linksForStage(links, { kind: "pregnancy", index: 20 })).toEqual([]);
  });

  it("excludes a link that has finished", () => {
    expect(linksForStage(links, { kind: "toddler", index: 40 }).map((l) => l.id)).toEqual([]);
  });

  it("does not confuse a pregnancy week with an infant month", () => {
    const onlyPregnancy = [
      parsed({
        id: "ppp",
        stages: { from: { kind: "pregnancy", index: 4 }, to: { kind: "pregnancy", index: 40 } },
      }),
    ];
    expect(linksForStage(onlyPregnancy, { kind: "infant", index: 4 })).toEqual([]);
  });
});

describe("linksForDomain", () => {
  const links = [
    parsed({ id: "aaa", domains: ["sleep", "safety"] }),
    parsed({ id: "bbb", domains: ["money"] }),
  ];

  it("returns every link that answers the need", () => {
    expect(linksForDomain(links, "sleep").map((l) => l.id)).toEqual(["aaa"]);
  });

  it("matches a link that lists several domains", () => {
    expect(linksForDomain(links, "safety").map((l) => l.id)).toEqual(["aaa"]);
  });

  it("returns nothing for a need with no links", () => {
    expect(linksForDomain(links, "play")).toEqual([]);
  });
});

describe("searchLinks", () => {
  const links = [
    parsed({ id: "aaa", title: "Safe to Sleep", publisher: "NIH", why: "The safe-sleep rules." }),
    parsed({ id: "bbb", title: "WIC", publisher: "USDA", why: "Food benefits." }),
  ];

  it("matches the title", () => {
    expect(searchLinks(links, "sleep").map((l) => l.id)).toEqual(["aaa"]);
  });

  it("matches the publisher, because people search by name", () => {
    expect(searchLinks(links, "usda").map((l) => l.id)).toEqual(["bbb"]);
  });

  it("matches the why", () => {
    expect(searchLinks(links, "benefits").map((l) => l.id)).toEqual(["bbb"]);
  });

  it("is case-insensitive", () => {
    expect(searchLinks(links, "WIC").map((l) => l.id)).toEqual(["bbb"]);
  });

  it("returns nothing for an empty query rather than everything", () => {
    expect(searchLinks(links, "   ")).toEqual([]);
  });

  it("returns nothing when nothing matches", () => {
    expect(searchLinks(links, "stroller")).toEqual([]);
  });
});

describe("groupByType", () => {
  it("groups in the order the catalogue presents them", () => {
    const links = [
      parsed({ id: "shop", type: "commercial" }),
      parsed({ id: "official", type: "authoritative" }),
    ];
    expect([...groupByType(links).keys()]).toEqual(["authoritative", "commercial"]);
  });

  it("omits a type with no links", () => {
    expect(groupByType([parsed()]).size).toBe(1);
  });

  it("returns an empty map for no links", () => {
    expect(groupByType([]).size).toBe(0);
  });
});

describe("the shipped catalogue", () => {
  it("loads every entry", () => {
    expect(LINKS.length).toBeGreaterThan(50);
  });

  it("has a unique id for every entry", () => {
    expect(new Set(LINKS.map((l) => l.id)).size).toBe(LINKS.length);
  });

  it("indexes every entry by id", () => {
    expect(LINKS_BY_ID.size).toBe(LINKS.length);
    expect(getLink(LINKS[0]!.id)).toBe(LINKS[0]);
    expect(getLink("no-such-link")).toBeUndefined();
  });

  it("covers every stage of the timeline, so no week is empty", () => {
    const stages = [
      { kind: "pregnancy", index: 8 },
      { kind: "pregnancy", index: 28 },
      { kind: "postpartum", index: 1 },
      { kind: "infant", index: 2 },
      { kind: "infant", index: 6 },
      { kind: "toddler", index: 18 },
      { kind: "toddler", index: 36 },
    ] as const;
    for (const stage of stages) {
      expect(linksForStage(LINKS, stage).length, `${stage.kind} ${stage.index}`).toBeGreaterThan(0);
    }
  });

  it("offers more than one option for every domain a parent has to act on", () => {
    for (const domain of ["feeding", "sleep", "safety", "money", "mind"] as const) {
      expect(linksForDomain(LINKS, domain).length, domain).toBeGreaterThan(1);
    }
  });

  it("never marks a non-commercial link as affiliate", () => {
    for (const entry of LINKS) {
      if (entry.affiliate) expect(entry.type).toBe("commercial");
    }
  });

  it("gives every app a platform", () => {
    for (const entry of LINKS.filter((l) => l.type === "app")) {
      expect(entry.platforms, entry.id).toBeDefined();
    }
  });

  it("is US-first", () => {
    for (const entry of LINKS) {
      expect(entry.country, entry.id).toContain("US");
      expect(entry.language, entry.id).toBe("en-US");
    }
  });
});

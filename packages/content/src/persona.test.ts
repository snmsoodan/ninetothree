import { describe, expect, it } from "vitest";

import {
  BAND_LABELS,
  BANDS,
  LENS_PERSONAS,
  PERSONA_LIGHT,
  PERSONA_META,
  PERSONA_TRACKS,
  bandFor,
  findView,
  isLensPersona,
  isPersona,
  lensFor,
  lightFor,
} from "./persona";
import { PERSONAS, StagePack, type PersonaView } from "./schema";

const view = (overrides: Partial<PersonaView> = {}): PersonaView => ({
  persona: "partner",
  headline: "You are on call now",
  body: 'From 37 weeks the answer to "is this it?" can be yes.',
  actions: [],
  ...overrides,
});

const action = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  type: "do" as const,
  priority: "recommended" as const,
  domain: "home" as const,
  title: "Put the bag in the car",
  why: "The bag by the door is a plan. The bag in the car is a decision made.",
  options: [],
  ...overrides,
});

describe("who is reading", () => {
  it("offers four personas, and every one has a label and a hint", () => {
    expect(PERSONAS).toHaveLength(4);
    for (const persona of PERSONAS) {
      expect(PERSONA_META[persona].label.length).toBeGreaterThan(0);
      expect(PERSONA_META[persona].hint.length).toBeGreaterThan(0);
      expect(PERSONA_META[persona].lensTitle.length).toBeGreaterThan(0);
    }
  });

  it("keeps the parent out of the lens list, because the pack is the parent's week", () => {
    expect(LENS_PERSONAS).not.toContain("parent");
    expect(LENS_PERSONAS).toHaveLength(PERSONAS.length - 1);
  });

  it("validates a stored persona, and refuses anything else", () => {
    expect(isPersona("grandparent")).toBe(true);
    expect(isPersona("mother")).toBe(false);
    expect(isPersona(undefined)).toBe(false);
    expect(isPersona(3)).toBe(false);
    expect(isLensPersona("extended")).toBe(true);
    expect(isLensPersona("parent")).toBe(false);
  });
});

describe("bandFor", () => {
  it("splits pregnancy at the end of the first trimester and the start of the third", () => {
    expect(bandFor({ kind: "pregnancy", stageIndex: 4 })).toBe("pregnancy-early");
    expect(bandFor({ kind: "pregnancy", stageIndex: 13 })).toBe("pregnancy-early");
    expect(bandFor({ kind: "pregnancy", stageIndex: 14 })).toBe("pregnancy-mid");
    expect(bandFor({ kind: "pregnancy", stageIndex: 27 })).toBe("pregnancy-mid");
    expect(bandFor({ kind: "pregnancy", stageIndex: 28 })).toBe("pregnancy-late");
    expect(bandFor({ kind: "pregnancy", stageIndex: 42 })).toBe("pregnancy-late");
  });

  it("reads postpartum as the newborn band and infant months as the first year", () => {
    expect(bandFor({ kind: "postpartum", stageIndex: 1 })).toBe("newborn");
    expect(bandFor({ kind: "postpartum", stageIndex: 12 })).toBe("newborn");
    expect(bandFor({ kind: "infant", stageIndex: 3 })).toBe("first-year");
    expect(bandFor({ kind: "toddler", stageIndex: 24 })).toBe("toddler");
  });

  it("treats an event pack as the first year, because that is where the events are", () => {
    expect(bandFor({ kind: "event", stageIndex: 0 })).toBe("first-year");
  });
});

describe("the tracks", () => {
  it("has one for every non-parent persona and every band, with three suggestions each", () => {
    for (const persona of LENS_PERSONAS) {
      for (const band of BANDS) {
        const track = PERSONA_TRACKS[persona][band];
        expect(track.headline.length, `${persona}/${band}`).toBeGreaterThan(0);
        expect(track.body.length, `${persona}/${band}`).toBeGreaterThan(0);
        expect(track.suggestions, `${persona}/${band}`).toHaveLength(3);
      }
    }
  });

  it("gives every suggestion a unique id, a title and a reason", () => {
    const ids = new Set<string>();
    for (const persona of LENS_PERSONAS) {
      for (const band of BANDS) {
        for (const suggestion of PERSONA_TRACKS[persona][band].suggestions) {
          expect(ids.has(suggestion.id), `${suggestion.id} is used twice`).toBe(false);
          ids.add(suggestion.id);
          expect(suggestion.title.length).toBeGreaterThan(0);
          expect(suggestion.why.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("never claims a week, because a track is true of the whole band", () => {
    for (const persona of LENS_PERSONAS) {
      for (const band of BANDS) {
        const track = PERSONA_TRACKS[persona][band];
        const prose = `${track.headline} ${track.body}`.toLowerCase();
        expect(prose, `${persona}/${band}`).not.toMatch(/\bthis week\b/);
        expect(prose, `${persona}/${band}`).not.toMatch(/\bweek \d/);
      }
    }
  });

  it("labels every band in words a reader would use", () => {
    for (const band of BANDS) expect(BAND_LABELS[band].length).toBeGreaterThan(0);
  });
});

describe("the light line", () => {
  it("gives every persona a pool of eight", () => {
    for (const persona of PERSONAS) expect(PERSONA_LIGHT[persona]).toHaveLength(8);
  });

  it("rotates through the pool as the stage advances, rather than repeating", () => {
    const lines = [8, 9, 10, 11].map((stageIndex) =>
      lightFor("partner", { kind: "pregnancy", stageIndex }),
    );
    expect(new Set(lines).size).toBe(lines.length);
  });

  it("gives two personas a different line in the same week", () => {
    const stage = { kind: "pregnancy" as const, stageIndex: 20 };
    expect(lightFor("parent", stage)).not.toBe(lightFor("partner", stage));
    expect(lightFor("grandparent", stage)).not.toBe(lightFor("extended", stage));
  });

  it("is the same line every time for the same week, so nothing moves on its own", () => {
    const stage = { kind: "toddler" as const, stageIndex: 24 };
    expect(lightFor("extended", stage)).toBe(lightFor("extended", stage));
  });

  it("goes quiet when the reader turns humour off", () => {
    const stage = { kind: "pregnancy" as const, stageIndex: 20 };
    expect(lightFor("partner", stage, { enabled: false })).toBeNull();
  });
});

describe("lensFor", () => {
  const stage = { kind: "pregnancy" as const, stageIndex: 37, personas: [view()] };

  it("uses the authored view when the week has one", () => {
    const lens = lensFor(stage, "partner");
    expect(lens.source).toBe("authored");
    expect(lens.headline).toBe("You are on call now");
    expect(lens.suggestions).toEqual([]);
    expect(lens.bandLabel).toBe(BAND_LABELS["pregnancy-late"]);
  });

  it("falls back to the track for a persona the week was not written for", () => {
    const lens = lensFor(stage, "grandparent");
    expect(lens.source).toBe("track");
    expect(lens.suggestions).toHaveLength(3);
    expect(lens.actions).toEqual([]);
  });

  it("finds the view a pack carries, and says so when there is none", () => {
    expect(findView(stage, "partner")?.persona).toBe("partner");
    expect(findView(stage, "extended")).toBeUndefined();
    expect(findView({}, "partner")).toBeUndefined();
  });

  it("prefers the authored light line over the pool", () => {
    const withLight = { ...stage, personas: [view({ light: "A line about a pram." })] };
    expect(lensFor(withLight, "partner").light).toBe("A line about a pram.");
  });

  it("falls back to the pool when the view carries no light line", () => {
    expect(lensFor(stage, "partner").light).toBe(
      lightFor("partner", { kind: "pregnancy", stageIndex: 37 }),
    );
  });

  it("gives the parent no headline, because the pack is already their week", () => {
    const lens = lensFor(stage, "parent");
    expect(lens.headline).toBe("");
    expect(lens.body).toBe("");
    expect(lens.actions).toEqual([]);
    expect(lens.suggestions).toEqual([]);
    expect(lens.light).not.toBeNull();
  });

  it("accepts the view explicitly, so a caller can pass one it already found", () => {
    const lens = lensFor({ kind: "pregnancy", stageIndex: 8 }, "partner", { view: view() });
    expect(lens.source).toBe("authored");
    expect(lens.headline).toBe("You are on call now");
  });

  it("goes quiet for everyone when humour is off", () => {
    expect(lensFor(stage, "partner", { enabled: false }).light).toBeNull();
    expect(lensFor(stage, "grandparent", { enabled: false }).light).toBeNull();
  });
});

describe("a pack's persona views", () => {
  const base = {
    id: "pregnancy-w37",
    kind: "pregnancy",
    stageIndex: 37,
    stageUnit: "week",
    locale: "en-US",
    country: "US",
    title: "Week 37",
    coreActions: [action({ id: "a1", priority: "essential" })],
    alsoKnow: [],
    redFlags: [{ id: "rf1", text: "Bleeding.", escalation: "call-911" }],
    appointments: [],
    sources: [
      {
        id: "s1",
        title: "ACOG",
        publisher: "ACOG",
        url: "https://www.acog.org/",
        kind: "clinical",
        accessed: "2026-01-01",
      },
    ],
    reviewedBy: "Clinical review pending",
    reviewedAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  const issuesFor = (personas: unknown[]): string[] => {
    const result = StagePack.safeParse({ ...base, personas });
    return result.success ? [] : result.error.issues.map((issue) => issue.message);
  };

  it("accepts a week written for somebody else", () => {
    expect(issuesFor([view()])).toEqual([]);
  });

  it("refuses a parent view, because the pack is already the parent's week", () => {
    expect(issuesFor([view({ persona: "parent" })])).toContain(
      "pack pregnancy-w37 has a parent view; the pack is already the parent's week",
    );
  });

  it("refuses two views for the same persona", () => {
    expect(issuesFor([view(), view()])).toContain('pack pregnancy-w37 has two views for "partner"');
  });

  it("refuses an essential persona action, because the three essentials are the parent's", () => {
    expect(issuesFor([view({ actions: [action({ priority: "essential" })] })])).toContain(
      'persona action "p1" is essential; the three essentials are the parent\'s',
    );
  });

  it("refuses an id the pack already uses, because progress is keyed on it", () => {
    expect(issuesFor([view({ actions: [action({ id: "a1" })] })])).toContain(
      'duplicate id "a1" within pack pregnancy-w37',
    );
  });

  it("refuses a fourth view", () => {
    const four = [
      view({ persona: "partner" }),
      view({ persona: "grandparent" }),
      view({ persona: "extended" }),
      view({ persona: "partner" }),
    ];
    expect(issuesFor(four).length).toBeGreaterThan(0);
  });

  it("refuses a third action in one view", () => {
    const three = [action({ id: "p1" }), action({ id: "p2" }), action({ id: "p3" })];
    expect(issuesFor([view({ actions: three })]).length).toBeGreaterThan(0);
  });
});

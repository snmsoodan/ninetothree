import { describe, expect, it } from "vitest";
import {
  assertValidChecklists,
  Checklist,
  checklistCount,
  checklistHref,
  checklistProse,
  checklistsForStage,
  loadChecklists,
  type Checklist as ChecklistType,
} from "./checklists";
import { CHECKLISTS, CHECKLISTS_BY_ID, getChecklist } from "./checklist-registry";

const base = CHECKLISTS[0] as ChecklistType;

function raw(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...(base as unknown as Record<string, unknown>), ...overrides };
}

describe("Checklist", () => {
  it("accepts the shipped checklist", () => {
    expect(Checklist.safeParse(base).success).toBe(true);
  });

  it("rejects a stage range that runs backwards", () => {
    const parsed = Checklist.safeParse(
      raw({
        stages: { from: { kind: "pregnancy", index: 40 }, to: { kind: "pregnancy", index: 10 } },
      }),
    );
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("a stage range cannot run backwards");
  });

  it("rejects two items sharing an id, even in different sections", () => {
    const sections = [
      { id: "one", title: "One", items: [{ id: "same-item", label: "A" }] },
      { id: "two", title: "Two", items: [{ id: "same-item", label: "B" }] },
    ];
    const parsed = Checklist.safeParse(raw({ sections }));
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("two items share this id");
    expect(parsed.error?.issues[0]?.path).toEqual(["sections", 1, "items", 0, "id"]);
  });

  it("rejects an id that is not kebab-case", () => {
    expect(Checklist.safeParse(raw({ id: "Hospital Bag" })).success).toBe(false);
  });

  it("rejects a checklist with no sources", () => {
    expect(Checklist.safeParse(raw({ sources: [] })).success).toBe(false);
  });

  it("rejects a section with no items", () => {
    const sections = [{ id: "empty", title: "Empty", items: [] }];
    expect(Checklist.safeParse(raw({ sections })).success).toBe(false);
  });
});

describe("loadChecklists", () => {
  it("returns the valid ones and every problem with the rest", () => {
    const { checklists, issues } = loadChecklists([
      base,
      raw({ id: "no-sources", sources: [] }),
      raw({
        id: "backwards",
        stages: { from: { kind: "pregnancy", index: 9 }, to: { kind: "pregnancy", index: 2 } },
      }),
    ]);
    expect(checklists).toHaveLength(1);
    expect(issues.map((i) => i.checklistId)).toEqual(["no-sources", "backwards"]);
    expect(issues[0]?.path).toBe("sources");
  });

  it("names an entry that has no id at all", () => {
    const { issues } = loadChecklists([{ title: "no id here" }]);
    expect(issues[0]?.checklistId).toBe("(no id)");
  });

  it("names a non-object entry", () => {
    const { issues } = loadChecklists(["just a string"]);
    expect(issues[0]?.checklistId).toBe("(no id)");
  });

  it("rejects two checklists sharing an id", () => {
    const { checklists, issues } = loadChecklists([base, base]);
    expect(checklists).toHaveLength(1);
    expect(issues[0]?.message).toBe("two checklists share this id");
  });

  it("reports a root-level problem as (root)", () => {
    const { issues } = loadChecklists([null]);
    expect(issues[0]?.path).toBe("(root)");
  });
});

describe("assertValidChecklists", () => {
  it("returns the checklists when they are all valid", () => {
    expect(assertValidChecklists([base])).toHaveLength(1);
  });

  it("throws with the file, the path and the reason", () => {
    expect(() => assertValidChecklists([raw({ id: "broken", sources: [] })])).toThrow(
      /broken → sources: /,
    );
  });
});

describe("checklistProse", () => {
  it("joins the title, the summary, the sections and the items", () => {
    const prose = checklistProse(base);
    expect(prose).toContain(base.title);
    expect(prose).toContain(base.summary);
    for (const section of base.sections) {
      expect(prose).toContain(section.title);
      if (section.note) expect(prose).toContain(section.note);
      for (const item of section.items) {
        expect(prose).toContain(item.label);
        if (item.detail) expect(prose).toContain(item.detail);
      }
    }
  });

  it("leaves out a note and a detail that are not there", () => {
    const bare = {
      ...base,
      sections: [{ id: "only", title: "Only", items: [{ id: "one-item", label: "One" }] }],
    } as ChecklistType;
    expect(checklistProse(bare)).toBe(`${base.title} ${base.summary} Only One`);
  });
});

describe("checklistsForStage", () => {
  it("finds the hospital bag in the third trimester", () => {
    expect(checklistsForStage(CHECKLISTS, "pregnancy", 30).map((c) => c.id)).toContain(base.id);
  });

  it("does not offer it at week 4", () => {
    expect(checklistsForStage(CHECKLISTS, "pregnancy", 4)).toEqual([]);
  });

  it("does not offer it after the birth", () => {
    expect(checklistsForStage(CHECKLISTS, "infant", 1)).toEqual([]);
  });
});

describe("checklistHref", () => {
  it("points at the print route, not the week route", () => {
    expect(checklistHref(base)).toBe(`/print/checklist/${base.id}`);
  });
});

describe("checklistCount", () => {
  it("counts every item across every section", () => {
    const expected = base.sections.reduce((total, section) => total + section.items.length, 0);
    expect(checklistCount(base)).toBe(expected);
  });
});

describe("the checklist registry", () => {
  it("exposes the hospital bag", () => {
    expect(CHECKLISTS.map((c) => c.id)).toContain("hospital-bag");
  });

  it("indexes every checklist by id", () => {
    expect(CHECKLISTS_BY_ID.size).toBe(CHECKLISTS.length);
  });

  it("finds one by id, and returns undefined for an unknown one", () => {
    expect(getChecklist("hospital-bag")?.title).toBe(base.title);
    expect(getChecklist("not-a-checklist")).toBeUndefined();
  });
});

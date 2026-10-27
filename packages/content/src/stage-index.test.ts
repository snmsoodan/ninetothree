import { describe, expect, it } from "vitest";
import { PACKS } from "./registry";
import { STAGE_INDEX, findStageIndex } from "./stage-index";

describe("findStageIndex", () => {
  it("finds every pack that exists, so a stage always resolves to its week", () => {
    const found = STAGE_INDEX.map((entry) => findStageIndex(entry.kind, entry.stageIndex));
    expect(found).toEqual(STAGE_INDEX);
  });

  it("keeps the registry's ordering, so a stage never points at the wrong week", () => {
    expect(STAGE_INDEX.map((entry) => entry.id)).toEqual(PACKS.map((pack) => pack.id));
  });

  it("returns undefined for a stage the guide does not have yet", () => {
    expect(findStageIndex("pregnancy", 3)).toBeUndefined();
    expect(findStageIndex("pregnancy", 43)).toBeUndefined();
    expect(findStageIndex("toddler", 37)).toBeUndefined();
    expect(findStageIndex("baby", 999)).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { ACTION_INDEX, findIndexedAction } from "./action-index";
import { findPackAtOrBefore, findPackIndex, nextPackIndex, previousPackIndex } from "./pack-index";
import { PACKS } from "./registry";
import { findRulePack, findRulePackAtOrBefore } from "./rule-index";
import {
  STAGE_INDEX,
  findStageAtOrBefore,
  findStageIndex,
  nextStage,
  previousStage,
} from "./stage-index";

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
  });
});

describe("findStageAtOrBefore", () => {
  it("is exact when the stage is written", () => {
    expect(findStageAtOrBefore("pregnancy", 28)?.id).toBe("pregnancy-w28");
  });

  it("lands on the last written stage when the guide has run out", () => {
    // The behaviour the dashboard and the paywall gate rely on: 43 weeks
    // pregnant is week 42's guide, not an empty screen.
    expect(findStageAtOrBefore("pregnancy", 43)?.id).toBe("pregnancy-w42");
    expect(findStageAtOrBefore("toddler", 99)?.id).toBe("toddler-month-36");
  });

  it("returns undefined before the guide starts", () => {
    expect(findStageAtOrBefore("pregnancy", 3)).toBeUndefined();
  });

  it("agrees with the pack index, which is the same data in a wider shape", () => {
    for (const entry of STAGE_INDEX) {
      expect(findPackAtOrBefore(entry.kind, entry.stageIndex)?.id).toBe(entry.id);
      expect(findRulePackAtOrBefore(entry.kind, entry.stageIndex)?.id).toBe(entry.id);
    }
  });
});

describe("nextStage and previousStage", () => {
  const w28 = STAGE_INDEX.find((entry) => entry.id === "pregnancy-w28")!;

  it("steps within a kind and stops at the ends", () => {
    expect(nextStage(w28)?.id).toBe("pregnancy-w29");
    expect(previousStage(w28)?.id).toBe("pregnancy-w27");
    expect(previousStage(STAGE_INDEX[0]!)).toBeUndefined();
    expect(nextStage(STAGE_INDEX.at(-1)!)).toBeUndefined();
  });

  it("returns undefined for an entry that is not in the index", () => {
    expect(nextStage({ id: "pregnancy-w28x", kind: "pregnancy", stageIndex: 28 })).toBeUndefined();
  });
});

describe("the pack index", () => {
  it("finds a pack by id and steps through a kind", () => {
    const pack = findPackIndex("infant-month-3");
    expect(pack?.title).toBe(PACKS.find((candidate) => candidate.id === "infant-month-3")?.title);
    expect(pack && nextPackIndex(pack)?.id).toBe("infant-month-4");
    expect(pack && previousPackIndex(pack)?.id).toBeUndefined();
  });

  it("carries the ids of the steps a week is measured by", () => {
    for (const pack of PACKS) {
      expect(findPackIndex(pack.id)?.coreActionIds).toEqual(pack.coreActions.map((a) => a.id));
    }
  });

  it("returns undefined for an id that is not in the guide", () => {
    expect(findPackIndex("pregnancy-w99")).toBeUndefined();
  });
});

describe("the action and rule indexes", () => {
  it("resolves every action to its own week", () => {
    for (const pack of PACKS) {
      for (const action of pack.coreActions) {
        expect(findIndexedAction(action.id, ACTION_INDEX)?.packId).toBe(pack.id);
        expect(findRulePack(pack.id)?.actions.some((a) => a.id === action.id)).toBe(true);
      }
    }
  });

  it("returns undefined for an action that has been retired", () => {
    expect(findIndexedAction("pregnancy-w28-gone", ACTION_INDEX)).toBeUndefined();
    expect(findRulePack("pregnancy-w99")).toBeUndefined();
  });
});

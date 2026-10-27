import { describe, expect, it } from "vitest";
import { appointmentsFor, findPackForStage } from "@ninetothree/content";
import { PACKS } from "@ninetothree/content/registry";
import { personalizePack, type Profile } from "@ninetothree/rules";

/**
 * Issue #16's acceptance criterion is "every answer changes the first week
 * card". That cannot hold for a single week: the five rules that fire against
 * shipped content are spread across the whole guide, and none of them touch
 * week 28. The honest reading is "every answer changes the first week card at
 * some starting point", which is what this file proves — one answer at a time,
 * at the starting point where it matters.
 *
 * Country is outside "every answer" because it is detected rather than asked,
 * and because the week card's appointments come from the pack, not from the
 * schedule. It changes `/appointments`, which is the second test.
 */

const TODAY = "2026-10-20";

function firstWeekCard(profile: Profile, kind: "pregnancy" | "postpartum", index: number) {
  const pack = findPackForStage(PACKS, kind, index);
  if (!pack) throw new Error(`no pack for ${kind} ${index}`);
  return { pack, result: personalizePack(pack, profile) };
}

function titles(profile: Profile, kind: "pregnancy" | "postpartum", index: number) {
  return firstWeekCard(profile, kind, index).result.pack.coreActions.map((action) => action.id);
}

describe("every onboarding answer changes the first week card somewhere", () => {
  it("the status and the date decide which card it is", () => {
    expect(firstWeekCard({}, "pregnancy", 28).pack.id).toBe("pregnancy-w28");
    expect(firstWeekCard({}, "postpartum", 1).pack.id).toBe("postpartum-week-1");
  });

  it("feeding formula removes the breastfeeding support from the first postpartum week", () => {
    const before = firstWeekCard({}, "postpartum", 1).result;
    const after = firstWeekCard({ feeding: "formula" }, "postpartum", 1).result;

    expect(before.trimmed).toEqual([]);
    expect(after.trimmed.map((entry) => entry.optionId)).toEqual([
      "pp1-lc-insurance",
      "pp1-lc-llli",
    ]);
    // The step stays: eight to twelve feeds a day is true of a bottle too.
    expect(after.pack.coreActions.map((action) => action.id)).toContain("pp1-feed");
  });

  it("not being a first baby removes the first-visit step from week 8", () => {
    expect(titles({}, "pregnancy", 8)).toContain("w8-first-visit");
    expect(titles({ firstBaby: false }, "pregnancy", 8)).not.toContain("w8-first-visit");
  });

  it("says which rule did it, so the parent can see why", () => {
    const { result } = firstWeekCard({ firstBaby: false }, "pregnancy", 8);
    expect(result.hidden.map((entry) => entry.ruleId)).toContain("not-first-baby");
    expect(result.hidden[0]?.reason).toMatch(/first/i);
  });

  it("leaves the week alone when the answer is the default", () => {
    const { result } = firstWeekCard({}, "pregnancy", 8);
    expect(result.hidden).toEqual([]);
    expect(result.trimmed).toEqual([]);
  });
});

describe("country changes the schedule, not the week card", () => {
  const dueDate = "2027-04-01";

  it("gives a US parent the ACOG cadence", () => {
    const us = appointmentsFor({ dueDate, today: TODAY, locale: "en-US" });
    expect(us.map((entry) => entry.id)).toContain("us-glucose");
  });

  it("gives a UK parent the NICE cadence", () => {
    const uk = appointmentsFor({ dueDate, today: TODAY, locale: "en-GB" });
    expect(uk.map((entry) => entry.id)).toContain("uk-booking");
    expect(uk.map((entry) => entry.id)).not.toContain("us-glucose");
  });

  it("does not change the week card, because the card's appointments are content", () => {
    const us = firstWeekCard({ country: "US" }, "pregnancy", 28).pack;
    const uk = firstWeekCard({ country: "UK" }, "pregnancy", 28).pack;
    expect(uk.appointments).toEqual(us.appointments);
  });
});

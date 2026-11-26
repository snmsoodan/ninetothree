import { describe, expect, it } from "vitest";
import { ESCALATION_COPY } from "@ninetothree/content";
import { PACK_INDEX } from "@ninetothree/content/pack-index";
import {
  HELP_NUMBERS,
  SAFETY_FLAGS_HEADING,
  SAFETY_HEADING,
  SAFETY_MORE_URL,
} from "@ninetothree/domain";
import { safetyModel, type SafetyPack } from "./safety";

/**
 * The safety page, before it is drawn.
 *
 * The point of these tests is that the phone's list is the same list the
 * website shows — same order, same numbers, same week each flag came from —
 * because a parent who reads one and then rings the other must not find that
 * the app has quietly dropped a number.
 */

const model = safetyModel(PACK_INDEX);

describe("safetyModel", () => {
  it("uses the same words as the website for the page itself", () => {
    expect(model.heading).toBe(SAFETY_HEADING);
    expect(model.flags.heading).toBe(SAFETY_FLAGS_HEADING);
    expect(model.more.url).toBe(SAFETY_MORE_URL);
    expect(model.footer.length).toBeGreaterThan(0);
    expect(model.cta.length).toBeGreaterThan(0);
  });

  it("lists the five numbers in the order a parent needs them", () => {
    expect(model.numbers.items.map((number) => number.key)).toEqual(
      HELP_NUMBERS.map((number) => number.key),
    );
  });

  it("gives every number its label, its detail and a dialler URL", () => {
    for (const number of model.numbers.items) {
      const copy = ESCALATION_COPY[number.key];
      expect(number.label).toBe(copy.label);
      expect(number.detail.length).toBeGreaterThan(0);
      expect(number.phone).toBe(copy.phone ?? null);
      if (copy.phone) {
        expect(number.tel).toBe(`tel:${copy.phone.replace(/[^0-9+]/g, "")}`);
      } else {
        expect(number.tel).toBeNull();
      }
    }
  });

  it("keeps emergency numbers short enough to dial in a hurry", () => {
    const nineOneOne = model.numbers.items.find((number) => number.key === "call-911")!;
    expect(nineOneOne.tel).toBe("tel:911");
    expect(nineOneOne.phone).toBe("911");

    const poison = model.numbers.items.find((number) => number.key === "call-poison-control")!;
    expect(poison.tel).toBe("tel:18002221222");
  });

  it("shows every red flag in the guide, none duplicated", () => {
    const expected = PACK_INDEX.reduce((total, pack) => total + pack.redFlags.length, 0);
    expect(model.flags.items).toHaveLength(expected);
    const ids = model.flags.items.map((flag) => flag.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("says which week each flag came from, so a parent can read around it", () => {
    const firstPack = PACK_INDEX.find((pack) => pack.redFlags.length > 0)!;
    const firstFlag = model.flags.items.find((flag) => flag.packId === firstPack.id)!;
    expect(firstFlag.from).toBe(firstPack.title);
    expect(firstFlag.text).toBe(firstPack.redFlags[0]!.text);
    expect(firstFlag.action.length).toBeGreaterThan(0);
  });

  it("dials a flag's own number when it has one, and borrows otherwise", () => {
    const borrowed: SafetyPack = {
      id: "test-pack",
      title: "Test week",
      redFlags: [
        { id: "no-number", text: "Bleeding.", escalation: "call-911" },
        {
          id: "own-number",
          text: "Call the ward.",
          escalation: "call-ob-triage",
          phone: "555-0100",
        },
      ],
    } as SafetyPack;

    const rows = safetyModel([borrowed]).flags.items;
    expect(rows[0]!.tel).toBe("tel:911");
    expect(rows[1]!.tel).toBe("tel:5550100");
    expect(rows[1]!.action).toBe(ESCALATION_COPY["call-ob-triage"].label);
  });
});

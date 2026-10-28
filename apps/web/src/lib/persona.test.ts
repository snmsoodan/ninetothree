import { describe, expect, it } from "vitest";
import { PERSONAS } from "@ninetothree/content/core";
import {
  DEFAULT_HUMOUR,
  DEFAULT_PERSONA,
  PERSONA_NOTE,
  PERSONA_ORDER,
  dateQuestion,
  migrateHumour,
  migratePersona,
  statusOptions,
} from "./persona";

describe("migratePersona", () => {
  it("keeps an answer it recognises", () => {
    for (const persona of PERSONAS) expect(migratePersona(persona)).toBe(persona);
  });

  it("falls back to the parent for anything else", () => {
    // Storage written before V2 has no persona at all, and every one of those
    // readers was the parent.
    for (const raw of [undefined, null, "", "mother", 7, {}, []]) {
      expect(migratePersona(raw)).toBe(DEFAULT_PERSONA);
    }
  });
});

describe("migrateHumour", () => {
  it("keeps either answer", () => {
    expect(migrateHumour(true)).toBe(true);
    expect(migrateHumour(false)).toBe(false);
  });

  it("is on for a reader who has never been asked", () => {
    expect(migrateHumour(undefined)).toBe(DEFAULT_HUMOUR);
    expect(DEFAULT_HUMOUR).toBe(true);
  });

  it("does not read a string as an answer", () => {
    expect(migrateHumour("false")).toBe(DEFAULT_HUMOUR);
    expect(migrateHumour(0)).toBe(DEFAULT_HUMOUR);
  });
});

describe("PERSONA_ORDER", () => {
  it("offers all four readers once each, parent first", () => {
    expect(PERSONA_ORDER).toEqual([...PERSONAS]);
    expect(PERSONA_ORDER[0]).toBe("parent");
    expect(new Set(PERSONA_ORDER).size).toBe(4);
  });
});

describe("statusOptions", () => {
  it("asks the parent in the first person", () => {
    expect(statusOptions("parent")).toEqual([
      { value: "pregnant", label: "I am pregnant" },
      { value: "parent", label: "My baby is here" },
    ]);
  });

  it("never asks anyone else whether they are pregnant", () => {
    for (const persona of PERSONAS) {
      for (const option of statusOptions(persona)) {
        if (persona === "parent") continue;
        expect(option.label).not.toMatch(/^I am pregnant/);
      }
    }
  });

  it("answers in the reader's own situation", () => {
    expect(statusOptions("partner").map((o) => o.label)).toEqual([
      "My partner is pregnant",
      "Our baby is here",
    ]);
    expect(statusOptions("grandparent").map((o) => o.label)).toEqual([
      "My grandchild is on the way",
      "My grandchild is here",
    ]);
    expect(statusOptions("extended").map((o) => o.label)).toEqual([
      "Someone close is pregnant",
      "Their baby is here",
    ]);
  });

  it("keeps the same two values for everyone, so the rest of the flow is unchanged", () => {
    for (const persona of PERSONAS) {
      expect(statusOptions(persona).map((o) => o.value)).toEqual(["pregnant", "parent"]);
    }
  });
});

describe("dateQuestion", () => {
  it("asks the parent about their own due date", () => {
    expect(dateQuestion("parent", "pregnant").label).toBe("When is your due date?");
  });

  it("does not call it yours when it is not", () => {
    for (const persona of ["partner", "grandparent", "extended"] as const) {
      expect(dateQuestion(persona, "pregnant").label).toBe("When is the baby due?");
    }
  });

  it("asks everyone the same birth-date question", () => {
    for (const persona of PERSONAS) {
      expect(dateQuestion(persona, "parent").label).toBe("When was the baby born?");
    }
  });

  it("always gives a hint that the answer can be an estimate", () => {
    for (const persona of PERSONAS) {
      expect(dateQuestion(persona, "pregnant").hint).toMatch(/estimate is fine/);
    }
  });
});

describe("PERSONA_NOTE", () => {
  it("says the choice is reversible and does not change safety", () => {
    expect(PERSONA_NOTE).toMatch(/settings/);
    expect(PERSONA_NOTE).toMatch(/never what we warn you about/);
  });
});

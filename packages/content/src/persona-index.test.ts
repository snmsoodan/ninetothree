import { describe, expect, it } from "vitest";
import { PERSONA_VIEWS, findPersonaViews } from "./persona-index";
import { lensFor } from "./persona";
import { PACKS } from "./registry";

describe("PERSONA_VIEWS", () => {
  it("holds exactly the weeks that were written for someone other than the parent", () => {
    const authored = PACKS.filter((pack) => (pack.personas ?? []).length > 0).map(
      (pack) => pack.id,
    );
    expect(Object.keys(PERSONA_VIEWS)).toEqual(authored);
  });

  it("says the same thing as the pack it was projected from", () => {
    // The projection is generated, so the only thing worth asserting is that
    // it has not drifted from the source it claims to be a copy of.
    for (const pack of PACKS) {
      const views = findPersonaViews(pack.id);
      if (!views) continue;
      expect(views).toEqual(
        (pack.personas ?? []).map((view) => ({
          ...view,
          actions: view.actions.map((action) => ({ ...action, options: action.options ?? [] })),
        })),
      );
    }
  });

  it("gives the lens the same answer the full pack would", () => {
    for (const pack of PACKS) {
      const projected = findPersonaViews(pack.id) ?? [];
      for (const persona of ["partner", "grandparent", "extended"] as const) {
        expect(lensFor({ ...pack, personas: projected }, persona)).toEqual(lensFor(pack, persona));
      }
    }
  });

  it("has nothing for a week that was written for the parent", () => {
    expect(findPersonaViews("pregnancy-w4")).toBeUndefined();
  });

  it("has nothing for a week that does not exist", () => {
    expect(findPersonaViews("pregnancy-w99")).toBeUndefined();
  });
});

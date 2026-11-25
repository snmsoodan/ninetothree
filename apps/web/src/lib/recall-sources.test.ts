import { describe, expect, it } from "vitest";
import { Recall } from "@ninetothree/content";

import {
  agencyId,
  clamp,
  daysBefore,
  normalizeCpsc,
  normalizeCpscRecord,
  normalizeFda,
  normalizeFdaRecord,
} from "./recall-sources";

const TODAY = "2026-10-20";

/** A CPSC record, trimmed from a real response. */
function cpsc(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    RecallNumber: "26099",
    RecallDate: "2026-10-08T00:00:00",
    Title: "CooCooBaby recalls baby loungers",
    Description: "Sold at stores that also carry cribs and strollers.",
    URL: "https://www.cpsc.gov/Recalls/2026/coocoobaby-recalls-baby-loungers",
    Products: [{ Name: "CooCooBaby baby loungers" }],
    Hazards: [{ Name: "The sides are too low, so a baby can roll out." }],
    Remedies: [{ Name: "Stop using it and contact the firm for a refund." }],
    ...over,
  };
}

/** An openFDA food enforcement report, trimmed from a real response. */
function fda(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event_id: "98765",
    recall_number: "F-1234-2026",
    report_date: "20260729",
    classification: "Class I",
    product_description: "Peter Rabbit Organics fruit puree pouches",
    reason_for_recall: "Possible Clostridium botulinum contamination.",
    recalling_firm: "Peter Rabbit Farms",
    status: "Ongoing",
    ...over,
  };
}

/** Every normalizer output has to survive the schema, or the page breaks later. */
function parses(recall: Recall | null): boolean {
  return Recall.safeParse(recall).success;
}

describe("daysBefore", () => {
  it("counts back across a month boundary", () => {
    expect(daysBefore("2026-10-20", 30)).toBe("2026-09-20");
  });

  it("counts back across a year boundary", () => {
    expect(daysBefore("2026-01-10", 20)).toBe("2025-12-21");
  });

  it("counts forward for a negative number of days", () => {
    expect(daysBefore("2026-10-20", -10)).toBe("2026-10-30");
  });

  it("is a no-op for zero", () => {
    expect(daysBefore(TODAY, 0)).toBe(TODAY);
  });
});

describe("clamp", () => {
  it("leaves a short string exactly as it is", () => {
    expect(clamp("A crib", 20)).toBe("A crib");
  });

  it("collapses the whitespace an agency sends", () => {
    expect(clamp("  a   crib\n was  recalled ", 40)).toBe("a crib was recalled");
  });

  it("cuts on a word boundary and says so", () => {
    expect(clamp("The sides are too low so a baby can roll out", 20)).toBe("The sides are too…");
  });

  it("does not leave a dangling comma before the ellipsis", () => {
    expect(clamp("Stop using it, contact the firm, and wait", 16)).toBe("Stop using it…");
  });

  it("cuts a single long word even though there is no space", () => {
    const long = "supercalifragilisticexpialidocious";
    expect(clamp(long, 10)).toBe("supercali…");
  });

  it("never returns more than the limit", () => {
    for (const max of [4, 10, 40, 120]) {
      expect(clamp("word ".repeat(60), max).length).toBeLessThanOrEqual(max);
    }
  });
});

describe("agencyId", () => {
  it("makes a kebab id from an agency number", () => {
    expect(agencyId("cpsc", "26099")).toBe("cpsc-26099");
  });

  it("lowercases and replaces the punctuation FDA numbers carry", () => {
    expect(agencyId("fda", "F-1234-2026")).toBe("fda-f-1234-2026");
  });

  it("trims leading and trailing separators", () => {
    expect(agencyId("cpsc", "//26099//")).toBe("cpsc-26099");
  });

  it("stays inside the schema's sixty characters", () => {
    expect(agencyId("cpsc", "9".repeat(200)).length).toBeLessThanOrEqual(60);
  });
});

describe("normalizeCpscRecord", () => {
  it("turns a record into a recall the schema accepts", () => {
    const recall = normalizeCpscRecord(cpsc(), TODAY);
    expect(parses(recall)).toBe(true);
    expect(recall?.id).toBe("cpsc-26099");
    expect(recall?.category).toBe("sleep");
    expect(recall?.publishedAt).toBe("2026-10-08");
    expect(recall?.source.publisher).toBe("CPSC");
    // Empty on purpose: a register knows nothing about what this parent owns,
    // so the age window is the only way it reaches them.
    expect(recall?.matches).toEqual({ optionIds: [], actionIds: [], keywords: [] });
  });

  it("takes the day out of a timestamp", () => {
    expect(normalizeCpscRecord(cpsc(), TODAY)?.publishedAt).toBe("2026-10-08");
  });

  it("uses the agency's own hazard and remedy words", () => {
    const recall = normalizeCpscRecord(cpsc(), TODAY);
    expect(recall?.hazard).toBe("The sides are too low, so a baby can roll out.");
    expect(recall?.action).toBe("Stop using it and contact the firm for a refund.");
  });

  it("drops a record whose product is not a baby product", () => {
    const fuelCan = cpsc({
      Title: "Briggs & Stratton recalls fuel cans",
      Products: [{ Name: "Fuel can" }],
      Hazards: [{ Name: "Risk of child poisoning." }],
    });
    expect(normalizeCpscRecord(fuelCan, TODAY)).toBeNull();
  });

  it("drops a record with no recall number", () => {
    expect(normalizeCpscRecord(cpsc({ RecallNumber: "" }), TODAY)).toBeNull();
  });

  it("drops a record with no title", () => {
    expect(normalizeCpscRecord(cpsc({ Title: undefined }), TODAY)).toBeNull();
  });

  it("drops a record whose date is not a date", () => {
    expect(normalizeCpscRecord(cpsc({ RecallDate: "last Tuesday" }), TODAY)).toBeNull();
  });

  it("drops a link that is not https", () => {
    // A recall link is the one thing on the page a parent is asked to click
    // through to. It does not get to be plain http or javascript:.
    expect(normalizeCpscRecord(cpsc({ URL: "http://www.cpsc.gov/x" }), TODAY)).toBeNull();
    expect(normalizeCpscRecord(cpsc({ URL: "javascript:alert(1)" }), TODAY)).toBeNull();
    expect(normalizeCpscRecord(cpsc({ URL: 42 }), TODAY)).toBeNull();
  });

  it("falls back to the title when the agency sent no product name", () => {
    const recall = normalizeCpscRecord(cpsc({ Products: [] }), TODAY);
    expect(recall?.product).toBe("CooCooBaby recalls baby loungers");
  });

  it("says something true when the agency sent no hazard", () => {
    const recall = normalizeCpscRecord(cpsc({ Hazards: [], Remedies: [] }), TODAY);
    expect(recall?.hazard).toBe("The agency has recalled this product.");
    expect(recall?.action).toBe("Stop using it and follow the agency's notice.");
  });

  it("drops a record that is not an object", () => {
    expect(normalizeCpscRecord("a string", TODAY)).toBeNull();
    expect(normalizeCpscRecord(null, TODAY)).toBeNull();
  });
});

describe("normalizeCpsc", () => {
  it("keeps the records it understands and drops the rest", () => {
    const body = [cpsc(), { Title: "nothing else" }, cpsc({ RecallNumber: "26100" })];
    expect(normalizeCpsc(body, TODAY).map((r) => r.id)).toEqual(["cpsc-26099", "cpsc-26100"]);
  });

  it("returns nothing for a body that is not a list", () => {
    expect(normalizeCpsc({ error: "nope" }, TODAY)).toEqual([]);
    expect(normalizeCpsc(null, TODAY)).toEqual([]);
  });

  it("returns nothing for an empty list", () => {
    expect(normalizeCpsc([], TODAY)).toEqual([]);
  });
});

describe("normalizeFdaRecord", () => {
  it("turns a report into a recall the schema accepts", () => {
    const recall = normalizeFdaRecord(fda(), TODAY);
    expect(parses(recall)).toBe(true);
    expect(recall?.id).toBe("fda-f-1234-2026");
    expect(recall?.category).toBe("food");
    expect(recall?.publishedAt).toBe("2026-07-29");
    expect(recall?.brand).toBe("Peter Rabbit Farms");
    expect(recall?.title).toBe(
      "Peter Rabbit Farms recalls Peter Rabbit Organics fruit puree pouches",
    );
  });

  it("links to the report itself, with the event id encoded", () => {
    const recall = normalizeFdaRecord(fda({ event_id: "98 765" }), TODAY);
    expect(recall?.source.url).toContain("id=98%20765");
  });

  it("reads Class I as stop using it", () => {
    expect(normalizeFdaRecord(fda(), TODAY)?.severity).toBe("stop-use");
  });

  it("reads Class II as worth checking", () => {
    expect(normalizeFdaRecord(fda({ classification: "Class II" }), TODAY)?.severity).toBe("check");
  });

  it("reads Class III, and anything unlabelled, as information", () => {
    expect(normalizeFdaRecord(fda({ classification: "Class III" }), TODAY)?.severity).toBe("info");
    expect(normalizeFdaRecord(fda({ classification: "" }), TODAY)?.severity).toBe("info");
  });

  it("drops a report with no event id, because there is nowhere to link", () => {
    expect(normalizeFdaRecord(fda({ event_id: "" }), TODAY)).toBeNull();
  });

  it("drops a report with no recall number", () => {
    expect(normalizeFdaRecord(fda({ recall_number: "" }), TODAY)).toBeNull();
  });

  it("drops a report with no product description", () => {
    expect(normalizeFdaRecord(fda({ product_description: "" }), TODAY)).toBeNull();
  });

  it("drops a report whose date is not the compact form", () => {
    expect(normalizeFdaRecord(fda({ report_date: "2026-07-29" }), TODAY)).toBeNull();
  });

  it("drops a report that is not about food a baby eats", () => {
    expect(
      normalizeFdaRecord(
        fda({ product_description: "Frozen shrimp", reason_for_recall: "Undeclared sulfites." }),
        TODAY,
      ),
    ).toBeNull();
  });

  it("writes a title without the firm when the firm is unknown", () => {
    const recall = normalizeFdaRecord(fda({ recalling_firm: "" }), TODAY);
    expect(recall?.title).toBe("Recall of Peter Rabbit Organics fruit puree pouches");
    expect(recall?.brand).toBeUndefined();
  });

  it("says something true when there is no stated reason", () => {
    expect(normalizeFdaRecord(fda({ reason_for_recall: "" }), TODAY)?.hazard).toBe(
      "The agency has recalled this product.",
    );
  });
});

describe("normalizeFda", () => {
  it("keeps the reports it understands and drops the rest", () => {
    const body = { results: [fda(), { event_id: "1" }, fda({ recall_number: "F-2-2026" })] };
    expect(normalizeFda(body, TODAY).map((r) => r.id)).toEqual(["fda-f-1234-2026", "fda-f-2-2026"]);
  });

  it("returns nothing for a body with no results", () => {
    expect(normalizeFda({}, TODAY)).toEqual([]);
    expect(normalizeFda({ results: "nope" }, TODAY)).toEqual([]);
    expect(normalizeFda(null, TODAY)).toEqual([]);
  });
});

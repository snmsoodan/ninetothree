import { describe, expect, it } from "vitest";
import type { StagePack } from "./schema";
import { LINKS } from "./link-registry";
import { PACKS } from "./registry";
import {
  FUZZY_FLOOR,
  buildIndex,
  parseQuery,
  search,
  similarity,
  trigrams,
  type SearchDoc,
} from "./search";

const INDEX = buildIndex(PACKS, LINKS);

function ids(query: string, limit = 5): string[] {
  return search(INDEX, query, limit).map((hit) => hit.id);
}

describe("parseQuery", () => {
  it("drops the words that carry no signal", () => {
    expect(parseQuery("What should I do about sleep")).toEqual(["sleep"]);
  });

  it("strips punctuation and lowercases", () => {
    expect(parseQuery("Car-seat, and the BAG!")).toEqual(["car", "seat", "bag"]);
  });

  it("keeps numbers, because 988 and 211 are the query", () => {
    expect(parseQuery("988")).toEqual(["988"]);
    expect(parseQuery("211")).toEqual(["211"]);
  });

  it("de-duplicates", () => {
    expect(parseQuery("sleep sleep sleep")).toEqual(["sleep"]);
  });

  it("returns nothing for a query that is all stopwords", () => {
    expect(parseQuery("what should I do")).toEqual([]);
  });
});

describe("trigrams and similarity", () => {
  it("gives a word three grams per character plus padding", () => {
    expect(trigrams("cat").size).toBe(4);
  });

  it("scores a word against itself as 1", () => {
    expect(similarity("glucose", "glucose")).toBe(1);
  });

  it("scores a typo above the floor and an unrelated word below it", () => {
    expect(similarity("gloucose", "glucose")).toBeGreaterThan(FUZZY_FLOOR);
    expect(similarity("gloucose", "stroller")).toBeLessThan(FUZZY_FLOOR);
  });

  it("scores an empty string as 0 rather than dividing by zero", () => {
    expect(similarity("", "glucose")).toBe(0);
  });
});

describe("buildIndex", () => {
  it("indexes a step that declares no keywords", () => {
    const pack = {
      id: "test-week",
      title: "Week 1",
      subtitle: "A week.",
      coreActions: [{ id: "a1", title: "Do a thing", why: "Because.", options: [] }],
      alsoKnow: [],
      sources: [{ id: "s1" }],
    } as unknown as StagePack;
    const docs = buildIndex([pack], []);
    expect(docs.find((doc) => doc.id === "step-test-week-a1")?.keywords).toBe("");
  });

  it("gives every doc a citation", () => {
    for (const doc of INDEX) expect(doc.sourceIds.length).toBeGreaterThan(0);
  });

  it("indexes every step, every week and every catalogue entry", () => {
    const steps = PACKS.reduce((total, pack) => total + pack.coreActions.length, 0);
    expect(INDEX.filter((doc) => doc.kind === "step")).toHaveLength(
      steps + PACKS.reduce((total, pack) => total + pack.alsoKnow.length, 0),
    );
    expect(INDEX.filter((doc) => doc.kind === "week")).toHaveLength(PACKS.length);
    expect(INDEX.filter((doc) => doc.kind === "link")).toHaveLength(LINKS.length);
  });
});

describe("search", () => {
  it("returns nothing for an empty query", () => {
    expect(search(INDEX, "   ")).toEqual([]);
  });

  it("returns nothing for a query that is all stopwords", () => {
    expect(search(INDEX, "what should I do")).toEqual([]);
  });

  it("ranks a title match above a body match", () => {
    // A synthetic index, because the real one now has five actions about the
    // glucose test and the point here is the ranking rule, not the corpus.
    const doc = (id: string, title: string, body: string) =>
      ({
        id,
        kind: "step" as const,
        title,
        body,
        keywords: "",
        href: `/${id}`,
        packId: "p",
        packTitle: "P",
        sourceIds: ["s"],
      }) satisfies SearchDoc;
    const index = [
      doc("body", "Something else entirely", "the glucose test happens this week"),
      doc("title", "Book the glucose test", "nothing relevant here"),
    ];
    expect(search(index, "glucose", 5).map((hit) => hit.id)).toEqual(["title", "body"]);
  });

  it("matches a word prefix, not a substring", () => {
    // "aid" must not find "paid". This is how a search for legal aid used to
    // return paid leave.
    const doc = {
      id: "paid",
      kind: "step" as const,
      title: "Check your paid leave",
      body: "paid leave",
      keywords: "paid leave",
      href: "/paid",
      packId: "p",
      packTitle: "P",
      sourceIds: ["s"],
    } satisfies SearchDoc;
    expect(search([doc], "aid", 5)).toEqual([]);
    expect(search([doc], "paid", 5)).toHaveLength(1);
  });

  it("does not fuzzy-match a different word that happens to look close", () => {
    // "stroller" and "stronger" share enough trigrams to clear the old 0.55
    // floor, so a parent looking for a stroller got Braxton Hicks.
    const doc = {
      id: "hicks",
      kind: "week" as const,
      title: "Braxton Hicks get stronger near the end",
      body: "stronger",
      keywords: "",
      href: "/hicks",
      packId: "p",
      packTitle: "P",
      sourceIds: ["s"],
    } satisfies SearchDoc;
    expect(search([doc], "stroller", 5)).toEqual([]);
    // A real typo still lands.
    expect(search([doc], "strongr", 5)).toHaveLength(1);
  });

  it("says which terms matched, so the result can explain itself", () => {
    const [hit] = search(INDEX, "car seat", 1);
    expect(hit?.matched).toEqual(["car", "seat"]);
  });

  it("cites every result", () => {
    for (const hit of search(INDEX, "sleep", 10)) {
      expect(hit.sourceIds.length).toBeGreaterThan(0);
    }
  });

  it("finds a step by a typo in its title", () => {
    expect(ids("gloucose")).toContain("step-pregnancy-w28-w28-glucose");
  });

  it("does not return nonsense for a typo of nothing", () => {
    expect(search(INDEX, "zzzqqq")).toEqual([]);
  });

  it("respects the limit", () => {
    expect(search(INDEX, "the", 3)).toHaveLength(0);
    expect(search(INDEX, "baby", 3)).toHaveLength(3);
  });
});

/**
 * The acceptance criterion: the top 100 queries a parent would actually type
 * each return a relevant, cited result in the top five.
 */
const QUERIES: [string, string][] = [
  ["prenatal visit", "step-pregnancy-w8-w8-first-visit"],
  ["folic acid", "step-pregnancy-w8-w8-folic-acid"],
  ["prenatal vitamin", "step-pregnancy-w8-w8-folic-acid"],
  ["insurance", "step-pregnancy-w8-w8-insurance"],
  ["what does my insurance cover", "step-pregnancy-w8-w8-insurance"],
  ["first trimester screening", "step-pregnancy-w12-w12-nt-scan"],
  ["screening", "step-pregnancy-w12-w12-nt-scan"],
  ["dental cleaning", "step-pregnancy-w12-w12-dental"],
  ["dentist", "step-pregnancy-w12-w12-dental"],
  ["leave policy", "step-pregnancy-w12-w12-tell-work"],
  ["maternity leave", "step-pregnancy-w12-w12-tell-work"],
  ["anatomy scan", "step-pregnancy-w20-w20-anatomy"],
  ["ultrasound", "step-pregnancy-w20-w20-anatomy"],
  ["movement", "step-pregnancy-w21-w21-kick-counts"],
  ["childbirth class", "step-pregnancy-w20-w20-childbirth-class"],
  ["glucose", "step-pregnancy-w28-w28-glucose"],
  ["gestational diabetes", "step-pregnancy-w28-w28-glucose"],
  ["tdap", "step-pregnancy-w28-w28-tdap"],
  ["whooping cough", "step-pregnancy-w28-w28-tdap"],
  ["kick counts", "step-pregnancy-w28-w28-kick-counts"],
  ["group b strep", "step-pregnancy-w36-w36-gbs"],
  ["hospital bag", "step-pregnancy-w36-w36-bag"],
  ["car seat", "step-pregnancy-w36-w36-car-seat"],
  ["install car seat", "step-pregnancy-w36-w36-car-seat"],
  ["early labor", "step-pregnancy-w39-w39-know-labor"],
  ["contractions", "step-pregnancy-w39-w39-know-labor"],
  ["induction", "step-pregnancy-w39-w39-induction"],
  ["rest", "step-pregnancy-w39-w39-rest"],
  ["feeding", "step-postpartum-week-1-pp1-feed"],
  ["breastfeeding", "link-cdc-breastfeeding"],
  ["pediatrician", "step-pregnancy-w30-w30-pediatrician"],
  ["postpartum", "step-postpartum-week-1-pp1-you"],
  ["2 month visit", "step-postpartum-week-12-pp12-visit"],
  ["vaccines", "know-postpartum-week-8-pp8-shots"],
  ["safe sleep", "step-postpartum-week-4-pp4-safe-sleep"],
  ["crib", "link-cpsc-crib-safety"],
  ["crying", "know-postpartum-week-8-pp8-crying-peak"],
  ["solids", "step-infant-month-6-m6-solids"],
  ["high chair", "step-infant-month-6-m6-highchair"],
  ["childcare", "step-infant-month-6-m6-sitter"],
  ["daycare", "step-infant-month-6-m6-sitter"],
  ["acog", "link-acog-womens-health"],
  ["cdc pregnancy", "link-cdc-pregnancy"],
  ["immunization schedule", "link-cdc-vaccine-schedule"],
  ["milestones", "link-cdc-milestones"],
  ["aap", "link-healthychildren"],
  ["march of dimes", "link-march-of-dimes"],
  ["lactmed", "link-lactmed"],
  ["safe to sleep", "link-safetosleep"],
  ["nhtsa", "link-nhtsa-car-seats"],
  ["recalls", "link-cpsc-recalls"],
  ["formula", "link-cdc-formula-feeding"],
  ["wic", "link-usda-wic"],
  ["snap", "link-snap"],
  ["medicaid", "link-medicaid-pregnancy"],
  ["chip", "link-insurekidsnow"],
  ["fmla", "link-dol-fmla"],
  ["child tax credit", "link-irs-child-tax-credit"],
  ["988", "link-988-lifeline"],
  ["maternal mental health hotline", "link-maternal-mental-health-hotline"],
  ["poison control", "link-poison-control"],
  ["postpartum support", "link-psi"],
  ["nami", "link-nami"],
  ["zero to three", "link-zerotothree"],
  ["speech", "link-asha-speech"],
  ["autism", "link-cdc-autism"],
  ["early intervention", "link-ecta-center"],
  ["naeyc", "link-naeyc"],
  ["head start", "link-head-start"],
  ["nurse family partnership", "link-nurse-family-partnership"],
  ["safe kids", "link-safekids"],
  ["la leche", "link-llli"],
  ["lactation consultant", "link-uslca"],
  ["doula", "link-dona"],
  ["midwife", "link-acnm"],
  ["vbac", "link-ican"],
  ["fed is best", "link-fed-is-best"],
  ["solid starts", "link-solid-starts"],
  ["211", "link-211"],
  ["lead", "link-cdc-lead"],
  ["drowning", "link-cdc-drowning"],
  ["huckleberry", "link-app-huckleberry"],
  ["kinedu", "link-app-kinedu"],
  ["lovevery", "link-app-lovevery"],
  ["peanut", "link-app-peanut"],
  ["ovia", "link-app-ovia"],
  ["expectful", "link-app-expectful"],
  ["hatch", "link-app-hatch"],
  ["nanit", "link-app-nanit"],
  ["expecting better", "link-book-expecting-better"],
  ["parentdata", "link-parentdata"],
  ["happiest baby", "link-happiest-baby"],
  ["precious little sleep", "link-book-precious-little-sleep"],
  ["whole brain child", "link-book-whole-brain-child"],
  ["how to talk", "link-book-how-to-talk"],
  ["black mamas matter", "link-black-mamas-matter"],
  ["domestic violence", "link-dv-hotline"],
  ["legal aid", "link-legal-aid"],
  ["feeding america", "link-feeding-america"],
  ["wirecutter", "link-wirecutter-baby"],
];

describe("the top 100 queries", () => {
  it("has exactly 100 of them", () => {
    expect(QUERIES).toHaveLength(100);
  });

  it.each(QUERIES)("%s finds %s in the top five", (query, expected) => {
    expect(ids(query)).toContain(expected);
  });

  it("answers every one of them in under 300ms, p95", () => {
    const timings: number[] = [];
    for (const [query] of QUERIES) {
      const started = performance.now();
      search(INDEX, query, 20);
      timings.push(performance.now() - started);
    }
    timings.sort((a, b) => a - b);
    const p95 = timings[Math.floor(timings.length * 0.95)] as number;
    expect(p95).toBeLessThan(300);
  });
});

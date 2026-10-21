import { describe, expect, it } from "vitest";
import { LINKS } from "./link-registry";
import {
  lintArticle,
  lintArticles,
  lintLink,
  lintLinks,
  lintPack,
  lintPacks,
  lintRecall,
  lintRecalls,
  lintTriage,
  lintTriages,
  MAX_GRADE,
  proseFields,
  readingGrade,
  type LintFinding,
} from "./lint";
import { ARTICLES } from "./article-registry";
import { TRIAGE } from "./triage-registry";
import { RECALLS } from "./recall-registry";
import type { Recall } from "./recalls";
import type { TriageResult, TriageTree } from "./triage";
import { PACKS } from "./registry";
import type { Article } from "./articles";
import type { LinkEntry } from "./links";
import type { StagePack } from "./schema";

const base = PACKS[0] as StagePack;

function withDetail(detail: string): StagePack {
  const action = base.coreActions[0]!;
  return {
    ...base,
    coreActions: [{ ...action, detail }, ...base.coreActions.slice(1)],
  };
}

function rules(findings: LintFinding[]): string[] {
  return findings.map((f) => f.rule);
}

describe("readingGrade", () => {
  it("scores a short simple sentence below grade 3", () => {
    expect(readingGrade("The baby is here. Feed the baby. Sleep when you can.")).toBeLessThan(3);
  });

  it("scores a dense clinical sentence above grade 12", () => {
    const dense =
      "Maternal physiological adaptations during the antepartum period necessitate " +
      "comprehensive evaluation of hematologic parameters prior to administration of " +
      "neuraxial analgesia in the peripartum interval.";
    expect(readingGrade(dense)).toBeGreaterThan(12);
  });

  it("returns 0 for text with no words", () => {
    expect(readingGrade("")).toBe(0);
    expect(readingGrade("...")).toBe(0);
  });

  it("counts a three-letter word as one syllable", () => {
    expect(readingGrade("Cat sat mat.")).toBeLessThan(1);
  });

  it("counts a word with no vowels as one syllable", () => {
    expect(readingGrade("Crwth.")).toBeLessThan(0);
  });
});

describe("proseFields", () => {
  it("finds the subtitle, the stage prose, and every action field", () => {
    const paths = proseFields(base).map((f) => f.path);
    expect(paths).toContain("subtitle");
    expect(paths.some((p) => p.startsWith("coreActions[0]."))).toBe(true);
    expect(paths.some((p) => p.startsWith("redFlags[0]."))).toBe(true);
  });

  it("skips empty and missing fields", () => {
    const bare: StagePack = { ...base, subtitle: undefined, you: undefined, baby: undefined };
    const paths = proseFields(bare).map((f) => f.path);
    expect(paths).not.toContain("subtitle");
    expect(paths).not.toContain("you.body");
  });

  it("walks options, alsoKnow and appointments", () => {
    const paths = proseFields(base).map((f) => f.path);
    expect(paths.some((p) => p.includes(".options[0]."))).toBe(true);
    expect(paths.some((p) => p.startsWith("alsoKnow["))).toBe(true);
    expect(paths.some((p) => p.startsWith("appointments["))).toBe(true);
  });
});

describe("absolute claims", () => {
  it("fails a pack that says 'this will cure'", () => {
    const findings = lintPack(withDetail("This will cure your morning sickness."));
    expect(rules(findings)).toContain("absolute-claim");
    expect(findings[0]?.path).toBe("coreActions[0].detail");
    expect(findings[0]?.excerpt).toContain("will cure");
  });

  it.each([
    "It can cure colic.",
    "This cures reflux.",
    "We guarantee a full night's sleep.",
    "It is 100% safe.",
    "The seat is completely safe.",
    "There is no risk.",
    "It is risk-free.",
    "Proven to reduce crying.",
    "It never fails.",
    "It eliminates the risk of SIDS.",
  ])("rejects %s", (detail) => {
    expect(rules(lintPack(withDetail(detail)))).toContain("absolute-claim");
  });

  it("allows a clinical fact that uses the word safe", () => {
    const findings = lintPack(
      withDetail("Cleanings are safe in pregnancy and often covered twice a year."),
    );
    expect(rules(findings)).not.toContain("absolute-claim");
  });

  it("elides the text on both sides when the match is in the middle", () => {
    const long =
      "Your provider will talk through the options at your next visit and answer anything you " +
      "want to ask, and this will cure the worry you have been carrying since the first scan, " +
      "which is a relief for most people who have been waiting a long time for an answer.";
    const finding = lintPack(withDetail(long)).find((f) => f.rule === "absolute-claim");
    expect(finding?.excerpt.startsWith("…")).toBe(true);
    expect(finding?.excerpt.endsWith("…")).toBe(true);
  });

  it("quotes the whole sentence when the match is at the very start", () => {
    const finding = lintPack(withDetail("Guaranteed to work.")).find(
      (f) => f.rule === "absolute-claim",
    );
    expect(finding?.excerpt.startsWith("…")).toBe(false);
  });

  it("quotes the whole sentence when the match is at the very end", () => {
    const finding = lintPack(withDetail("A full night of sleep is guaranteed")).find(
      (f) => f.rule === "absolute-claim",
    );
    expect(finding?.excerpt.endsWith("…")).toBe(false);
  });

  it("allows a proper noun that contains the word safe", () => {
    const findings = lintPack(withDetail("Check the setup against the Safe to Sleep rules."));
    expect(rules(findings)).not.toContain("absolute-claim");
  });
});

describe("obligations", () => {
  it.each([
    "You should call your provider.",
    "You must call today.",
    "You need to book it.",
    "You have to decide.",
  ])("rejects %s", (detail) => {
    expect(rules(lintPack(withDetail(detail)))).toContain("obligation");
  });

  it("allows a physical requirement that is not addressed to the parent", () => {
    const findings = lintPack(
      withDetail("The seat should not move more than an inch at the belt path."),
    );
    expect(rules(findings)).not.toContain("obligation");
  });
});

describe("norms", () => {
  it("rejects a claim about what normal babies do", () => {
    expect(rules(lintPack(withDetail("Normal babies sleep through by three months.")))).toContain(
      "normative",
    );
  });

  it("allows reassurance that uses the word normal", () => {
    const findings = lintPack(withDetail("That is normal and not a sign your supply is dropping."));
    expect(rules(findings)).not.toContain("normative");
  });
});

describe("reading level", () => {
  it("fails a pack written above the ceiling", () => {
    const dense =
      "Maternal physiological adaptations during the antepartum period necessitate comprehensive " +
      "evaluation of hematologic parameters prior to administration of neuraxial analgesia in the " +
      "peripartum interval, and subsequent postpartum surveillance requires meticulous attention to " +
      "hemodynamic stability, thromboprophylaxis, and the early identification of preeclamptic " +
      "deterioration.";
    const findings = lintPack(withDetail(dense));
    const level = findings.find((f) => f.rule === "reading-level");
    expect(level).toBeDefined();
    expect(level?.message).toContain(`ceiling is ${MAX_GRADE}`);
  });

  it("passes every shipped pack", () => {
    for (const pack of PACKS) {
      const grade = readingGrade(
        proseFields(pack)
          .map((f) => f.text)
          .join(" "),
      );
      expect(grade, `${pack.id} reads at grade ${grade.toFixed(1)}`).toBeLessThanOrEqual(MAX_GRADE);
    }
  });
});

describe("alt text", () => {
  it("fails an image with no alt text", () => {
    const withImage = { ...base, hero: { image: { src: "/x.png" } } } as unknown as StagePack;
    expect(rules(lintPack(withImage))).toContain("alt-text");
  });

  it("passes an image with alt text", () => {
    const withImage = {
      ...base,
      hero: { image: { src: "/x.png", alt: "A crib" } },
    } as unknown as StagePack;
    expect(rules(lintPack(withImage))).not.toContain("alt-text");
  });

  it("fails an image whose value is a bare string", () => {
    const withImage = { ...base, hero: { image: "/x.png" } } as unknown as StagePack;
    expect(rules(lintPack(withImage))).toContain("alt-text");
  });

  it("finds an image nested inside an array", () => {
    const withImage = { ...base, gallery: [{ img: { src: "/x.png" } }] } as unknown as StagePack;
    const finding = lintPack(withImage).find((f) => f.rule === "alt-text");
    expect(finding?.path).toBe("gallery[0].img");
  });
});

describe("sources", () => {
  it("fails a pack whose red flags have no clinical or government source", () => {
    const unsourced: StagePack = {
      ...base,
      sources: base.sources.map((s) => ({ ...s, kind: "vendor" as const })),
    };
    expect(rules(lintPack(unsourced))).toContain("unsourced-red-flag");
  });

  it("does not ask for a source when there are no red flags", () => {
    const noFlags: StagePack = {
      ...base,
      redFlags: [],
      sources: base.sources.map((s) => ({ ...s, kind: "vendor" as const })),
    };
    expect(rules(lintPack(noFlags))).not.toContain("unsourced-red-flag");
  });

  it("passes a pack with a government source", () => {
    const sourced: StagePack = {
      ...base,
      sources: base.sources.map((s) => ({ ...s, kind: "government" as const })),
    };
    expect(rules(lintPack(sourced))).not.toContain("unsourced-red-flag");
  });
});

describe("the shipped content", () => {
  it("passes every pack", () => {
    expect(lintPacks(PACKS)).toEqual([]);
  });

  it("passes every catalogue entry", () => {
    expect(lintLinks(LINKS)).toEqual([]);
  });

  it("lints a link's title, why and note", () => {
    const link: LinkEntry = {
      ...(LINKS[0] as LinkEntry),
      id: "test-link",
      title: "A guide",
      why: "You should read this.",
      note: "It is 100% safe.",
    };
    const found = rules(lintLink(link));
    expect(found).toContain("obligation");
    expect(found).toContain("absolute-claim");
  });

  it("skips the note when there is none", () => {
    const link: LinkEntry = { ...(LINKS[0] as LinkEntry), id: "test-link", note: undefined };
    expect(lintLink(link)).toEqual([]);
  });
});

const ARTICLE_SOURCE = {
  id: "src-one",
  title: "A source",
  publisher: "A publisher",
  url: "https://example.com/a",
  kind: "clinical" as const,
  accessed: "2026-10-20",
};

function article(overrides: Partial<Article> = {}): Article {
  return {
    id: "a-test-article",
    title: "A test article",
    summary: "One sentence about the thing.",
    domain: "health-parent",
    stages: { from: { kind: "pregnancy", index: 28 }, to: { kind: "pregnancy", index: 28 } },
    sources: [ARTICLE_SOURCE],
    reviewedBy: "Clinical review pending",
    reviewedAt: "2026-10-20",
    updatedAt: "2026-10-20",
    body: "## A heading\n\nA short paragraph. It has two sentences.",
    ...overrides,
  };
}

describe("articles", () => {
  it("passes a plain article", () => {
    expect(lintArticle(article())).toEqual([]);
  });

  it("catches a claim in the title", () => {
    expect(rules(lintArticle(article({ title: "This will cure reflux" })))).toContain(
      "absolute-claim",
    );
  });

  it("catches a claim in the summary", () => {
    expect(rules(lintArticle(article({ summary: "It is completely safe." })))).toContain(
      "absolute-claim",
    );
  });

  it("catches an obligation in the body", () => {
    expect(rules(lintArticle(article({ body: "You should do this every day." })))).toContain(
      "obligation",
    );
  });

  it("measures the reading level of the body, not of the Markdown", () => {
    const dense =
      "Maternal physiological adaptations during the antepartum period necessitate " +
      "comprehensive evaluation of hematologic parameters prior to administration of " +
      "neuraxial analgesia in the peripartum interval.";
    const findings = lintArticle(article({ body: `## ${dense}\n\n${dense}` }));
    expect(rules(findings)).toContain("reading-level");
  });

  it("does not count a heading marker as a word", () => {
    // The same sentence, once with Markdown and once without, must score the
    // same. If `##` counted, the article would look harder than it reads.
    const plain = "A short paragraph. It has two sentences.";
    const marked = `## A heading\n\n${plain}`;
    const a = lintArticle(article({ body: plain }));
    const b = lintArticle(article({ body: marked }));
    expect(rules(a)).toEqual(rules(b));
  });

  it("refuses a health article with no clinical or government source", () => {
    const findings = lintArticle(article({ sources: [{ ...ARTICLE_SOURCE, kind: "editorial" }] }));
    expect(rules(findings)).toContain("unsourced-article");
  });

  it("allows a non-health article to cite an editorial source", () => {
    const findings = lintArticle(
      article({ domain: "money", sources: [{ ...ARTICLE_SOURCE, kind: "editorial" }] }),
    );
    expect(rules(findings)).not.toContain("unsourced-article");
  });

  it("flattens every article's findings", () => {
    const findings = lintArticles([
      article({ id: "one", title: "This will cure reflux" }),
      article({ id: "two", body: "You should do this." }),
    ]);
    expect(findings.map((f) => f.subject)).toEqual(["one", "two"]);
  });

  it("passes every shipped article", () => {
    expect(lintArticles(ARTICLES)).toEqual([]);
  });
});

describe("triage", () => {
  function outcome(over: Partial<TriageResult> & { id: string }): TriageResult {
    return {
      kind: "urgent",
      headline: "Call your OB triage line now.",
      body: "They will tell you whether to come in.",
      escalation: "call-ob-triage",
      sources: [
        {
          id: "s1",
          title: "A source",
          publisher: "ACOG",
          url: "https://example.com/a-source",
          kind: "clinical",
          accessed: "2026-10-20",
        },
      ],
      reviewedBy: "Clinical review pending",
      reviewedAt: "2026-10-20",
      ...over,
    };
  }

  function tree(results: TriageResult[]): TriageTree {
    return {
      id: "triage",
      title: "If something is wrong",
      root: "start",
      nodes: [
        {
          id: "start",
          question: "Who is this about?",
          answers: results.map((result, index) => ({
            id: `answer-${String(index)}`,
            label: "An answer",
            next: result.id,
          })),
        },
      ],
      results,
    };
  }

  it("passes an outcome that only says what to do", () => {
    expect(lintTriage(tree([outcome({ id: "urgent" })]))).toEqual([]);
  });

  it("catches an outcome that reassures", () => {
    const findings = lintTriage(tree([outcome({ id: "urgent", body: "You're fine." })]));
    expect(rules(findings)).toContain("reassurance");
    expect(findings[0]?.excerpt).toBe("You're fine");
  });

  it("catches reassurance in what to watch for", () => {
    const findings = lintTriage(
      tree([outcome({ id: "urgent", watchFor: ["Nothing to worry about"] })]),
    );
    expect(rules(findings)).toContain("reassurance");
  });

  it("catches an outcome with no review record", () => {
    const findings = lintTriage(tree([outcome({ id: "urgent", reviewedBy: "   " })]));
    expect(rules(findings)).toContain("unreviewed");
  });

  it("flattens every tree it is given", () => {
    const findings = lintTriages([
      tree([outcome({ id: "one", body: "You're fine." })]),
      tree([outcome({ id: "two", reviewedBy: "" })]),
    ]);
    expect(findings.map((finding) => finding.subject)).toEqual(["one", "two"]);
  });

  it("passes every outcome we ship", () => {
    expect(lintTriages([TRIAGE])).toEqual([]);
  });
});

describe("recalls", () => {
  function recall(over: Partial<Recall> & { id: string }): Recall {
    return {
      title: "A high chair was recalled",
      product: "The chair",
      hazard: "The seat can come off the frame.",
      action: "Stop using it and ask the maker for a refund.",
      severity: "stop-use",
      publishedAt: "2026-01-01",
      source: {
        id: "s1",
        title: "A recall notice",
        publisher: "CPSC",
        url: "https://example.com/a-recall",
        kind: "government",
        accessed: "2026-10-20",
      },
      matches: { optionIds: [], actionIds: ["a-step"], keywords: [] },
      ...over,
    };
  }

  it("passes a recall that only says what happened and what to do", () => {
    expect(lintRecall(recall({ id: "clean" }))).toEqual([]);
  });

  it("catches a claim in the hazard", () => {
    const findings = lintRecall(recall({ id: "claim", hazard: "The fix is completely safe." }));
    expect(rules(findings)).toContain("absolute-claim");
    expect(findings[0]?.path).toBe("hazard");
  });

  it("catches an obligation in what to do", () => {
    const findings = lintRecall(recall({ id: "must", action: "You must stop using it today." }));
    expect(rules(findings)).toContain("obligation");
    expect(findings[0]?.path).toBe("action");
  });

  it("catches a claim in the title", () => {
    const findings = lintRecall(recall({ id: "title", title: "A chair that is always safe" }));
    expect(rules(findings)).toContain("absolute-claim");
    expect(findings[0]?.path).toBe("title");
  });

  it("flattens every feed it is given", () => {
    const findings = lintRecalls([
      recall({ id: "one", hazard: "The fix is completely safe." }),
      recall({ id: "two", action: "You must stop using it today." }),
    ]);
    expect(findings.map((finding) => finding.subject)).toEqual(["one", "two"]);
  });

  it("passes every recall we ship", () => {
    expect(lintRecalls(RECALLS)).toEqual([]);
  });
});

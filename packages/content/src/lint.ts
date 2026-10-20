import type { LinkEntry } from "./links";
import type { StagePack } from "./schema";

/**
 * The content lint. It is not a spell-checker and it is not a proof: it is a
 * list of sentences that a parent should never read, and a reading level that
 * a tired person at 3am should not have to climb.
 *
 * The rules are deliberately narrow. A blanket ban on the word "safe" would
 * reject "cleanings are safe in pregnancy", which is a clinical fact, and a
 * blanket ban on "normal" would reject "that is normal and not a sign your
 * supply is dropping", which is the most reassuring sentence in the pack. What
 * is banned is the *promise*, the *obligation*, and the *norm* — not the word.
 */

export type LintRule =
  | "absolute-claim"
  | "obligation"
  | "normative"
  | "reading-level"
  | "alt-text"
  | "unsourced-red-flag";

export interface LintFinding {
  /** The pack or link id, so a finding can be traced to a file. */
  subject: string;
  /** Where in the pack, e.g. `coreActions[1].detail`. */
  path: string;
  rule: LintRule;
  message: string;
  /** The sentence that tripped the rule, so the fix is obvious. */
  excerpt: string;
}

interface TextRule {
  rule: LintRule;
  pattern: RegExp;
  message: string;
}

/**
 * A promise of an outcome. Every one of these is a claim no week-by-week guide
 * is entitled to make, whatever the source says.
 */
const CLAIM_RULES: TextRule[] = [
  {
    rule: "absolute-claim",
    pattern: /\bwill cure\b/i,
    message: "Nothing here cures anything. Say what the source found.",
  },
  {
    rule: "absolute-claim",
    pattern: /\bcan cure\b/i,
    message: "Nothing here cures anything. Say what the source found.",
  },
  {
    rule: "absolute-claim",
    pattern: /\bcures\b/i,
    message: "Nothing here cures anything. Say what the source found.",
  },
  {
    rule: "absolute-claim",
    pattern: /\bguarantee/i,
    message: "A guarantee is a promise this product cannot keep.",
  },
  {
    rule: "absolute-claim",
    pattern: /\b100\s*%\s*(safe|effective|accurate|reliable)/i,
    message: "No intervention is 100% anything. Give the number the study gave.",
  },
  {
    rule: "absolute-claim",
    pattern: /\b(completely|perfectly|totally|always|absolutely)\s+safe\b/i,
    message: "Absolute safety is not a thing. Say what the risk actually is.",
  },
  {
    rule: "absolute-claim",
    pattern: /\b(no risk|risk[- ]free|zero risk)\b/i,
    message: "Absolute safety is not a thing. Say what the risk actually is.",
  },
  {
    rule: "absolute-claim",
    pattern: /\bproven to\b/i,
    message: "Evidence is not proof. Say what the study showed.",
  },
  {
    rule: "absolute-claim",
    pattern: /\bnever fails?\b/i,
    message: "Nothing works every time. Say how often it works.",
  },
  {
    rule: "absolute-claim",
    pattern: /\beliminat\w*\s+(the\s+)?risk\b/i,
    message: "Risk is reduced, not eliminated. Say by how much.",
  },
];

/**
 * A debt the parent did not agree to. "The seat should not move an inch" is a
 * physical requirement and passes; "you should call your provider" is an
 * obligation and does not.
 */
const OBLIGATION_RULES: TextRule[] = [
  {
    rule: "obligation",
    pattern: /\byou should\b/i,
    message: "Say what happens, not what the parent owes. 'You should' is a debt.",
  },
  {
    rule: "obligation",
    pattern: /\byou must\b/i,
    message: "Say what happens, not what the parent owes. 'You must' is a debt.",
  },
  {
    rule: "obligation",
    pattern: /\byou (need|have) to\b/i,
    message: "Say what happens, not what the parent owes. Offer, do not assign.",
  },
];

/**
 * A norm to fail. "That is normal" reassures; "normal babies sleep through"
 * tells a parent their baby is wrong.
 */
const NORMATIVE_RULES: TextRule[] = [
  {
    rule: "normative",
    pattern:
      /\bnormal\s+(baby|babies|mother|mothers|parent|parents|pregnancy|pregnancies|birth|births|child|children|newborn|newborns)\b/i,
    message: "There is no normal. Say what is common, or what this baby is doing.",
  },
];

const TEXT_RULES: TextRule[] = [...CLAIM_RULES, ...OBLIGATION_RULES, ...NORMATIVE_RULES];

/** Grade 8 is the ceiling. The shipped packs score 4.6 to 7.4. */
export const MAX_GRADE = 8;

function syllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned.length <= 3) return 1;
  const trimmed = cleaned.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

/**
 * Flesch-Kincaid grade level. Approximate by design: it counts vowel groups,
 * which is wrong for a handful of English words and right for the question
 * "is this too dense for someone who has not slept".
 */
export function readingGrade(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const words = text.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  if (sentences === 0 || words.length === 0) return 0;
  const total = words.reduce((sum, word) => sum + syllables(word), 0);
  const wordsPerSentence = words.length / sentences;
  const syllablesPerWord = total / words.length;
  return 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
}

function excerpt(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 40);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function checkText(subject: string, path: string, text: string): LintFinding[] {
  const findings: LintFinding[] = [];
  for (const rule of TEXT_RULES) {
    const match = rule.pattern.exec(text);
    if (match) {
      findings.push({
        subject,
        path,
        rule: rule.rule,
        message: rule.message,
        excerpt: excerpt(text, match.index, match[0].length),
      });
    }
  }
  return findings;
}

interface Prose {
  path: string;
  text: string;
}

/** Every parent-facing sentence in a pack, with the path that produced it. */
export function proseFields(pack: StagePack): Prose[] {
  const fields: Prose[] = [];
  const push = (path: string, text: string | undefined) => {
    if (typeof text === "string" && text.trim().length > 0) fields.push({ path, text });
  };

  push("subtitle", pack.subtitle);
  push("baby.development", pack.baby?.development);
  push("you.body", pack.you?.body);
  push("you.mind", pack.you?.mind);

  pack.coreActions.forEach((action, i) => {
    push(`coreActions[${i}].title`, action.title);
    push(`coreActions[${i}].why`, action.why);
    push(`coreActions[${i}].detail`, action.detail);
    push(`coreActions[${i}].skipIf`, action.skipIf);
    action.options.forEach((option, j) => {
      push(`coreActions[${i}].options[${j}].label`, option.label);
      push(`coreActions[${i}].options[${j}].detail`, option.detail);
      push(`coreActions[${i}].options[${j}].note`, option.note);
    });
  });

  pack.alsoKnow.forEach((item, i) => {
    push(`alsoKnow[${i}].title`, item.title);
    push(`alsoKnow[${i}].body`, item.body);
  });

  pack.redFlags.forEach((flag, i) => {
    push(`redFlags[${i}].text`, flag.text);
  });

  pack.appointments.forEach((appointment, i) => {
    push(`appointments[${i}].label`, appointment.label);
    push(`appointments[${i}].note`, appointment.note);
  });

  return fields;
}

/**
 * The schema has no images today, so this rule is a guard rather than a check.
 * It fires the day someone adds one without alt text, which is the day it
 * starts mattering.
 */
function findImages(value: unknown, path: string): { path: string; alt?: unknown }[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => findImages(item, `${path}[${i}]`));
  }
  if (typeof value !== "object" || value === null) return [];
  const record = value as Record<string, unknown>;
  const found: { path: string; alt?: unknown }[] = [];
  for (const [key, child] of Object.entries(record)) {
    const childPath = path === "" ? key : `${path}.${key}`;
    if (key === "image" || key === "img") {
      const alt =
        typeof child === "object" && child !== null
          ? (child as Record<string, unknown>).alt
          : undefined;
      found.push({ path: childPath, alt });
      continue;
    }
    found.push(...findImages(child, childPath));
  }
  return found;
}

/** A red flag is a clinical claim. It needs a clinical or government source. */
const CLINICAL_SOURCE_KINDS = new Set(["clinical", "government"]);

export function lintPack(pack: StagePack): LintFinding[] {
  const findings: LintFinding[] = [];

  for (const field of proseFields(pack)) {
    findings.push(...checkText(pack.id, field.path, field.text));
  }

  const grade = readingGrade(
    proseFields(pack)
      .map((f) => f.text)
      .join(" "),
  );
  if (grade > MAX_GRADE) {
    findings.push({
      subject: pack.id,
      path: "<pack>",
      rule: "reading-level",
      message: `Reads at grade ${grade.toFixed(1)}. The ceiling is ${MAX_GRADE}. Shorten the sentences.`,
      excerpt: `grade ${grade.toFixed(1)}`,
    });
  }

  for (const image of findImages(pack, "")) {
    if (typeof image.alt !== "string" || image.alt.trim().length === 0) {
      findings.push({
        subject: pack.id,
        path: image.path,
        rule: "alt-text",
        message: "An image without alt text is an image a screen reader cannot describe.",
        excerpt: image.path,
      });
    }
  }

  if (pack.redFlags.length > 0) {
    const backed = pack.sources.some((source) => CLINICAL_SOURCE_KINDS.has(source.kind));
    if (!backed) {
      findings.push({
        subject: pack.id,
        path: "sources",
        rule: "unsourced-red-flag",
        message: "A red flag is a clinical claim. Cite a clinical or government source.",
        excerpt: pack.sources.map((s) => s.publisher).join(", "),
      });
    }
  }

  return findings;
}

export function lintPacks(packs: StagePack[]): LintFinding[] {
  return packs.flatMap(lintPack);
}

/**
 * The catalogue's `why` is parent-facing prose too, so the same claim and
 * obligation rules apply. Reading level is skipped: a single sentence is too
 * short to score honestly.
 */
export function lintLink(link: LinkEntry): LintFinding[] {
  const findings: LintFinding[] = [];
  findings.push(...checkText(link.id, "title", link.title));
  findings.push(...checkText(link.id, "why", link.why));
  if (link.note) findings.push(...checkText(link.id, "note", link.note));
  return findings;
}

export function lintLinks(links: LinkEntry[]): LintFinding[] {
  return links.flatMap(lintLink);
}

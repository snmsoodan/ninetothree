import type { LinkEntry } from "./links";
import type { StagePack } from "./schema";

/**
 * Search over the whole guide, in the browser.
 *
 * There is no Postgres here and there does not need to be: nine packs and
 * eighty-nine catalogue entries are a few hundred kilobytes of text, and a
 * parent searching at 3am should not wait for a round trip. The index is
 * built once at module load and searched in memory.
 */

export type SearchKind = "step" | "week" | "link";

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  title: string;
  /** Everything else that is searchable, already lowercased. */
  body: string;
  /** The words a parent would type, when they differ from the title. */
  keywords: string;
  /** Where the result goes. */
  href: string;
  /** What the result is cited by. A step is cited by its pack's sources. */
  packId?: string;
  packTitle?: string;
  sourceIds: string[];
}

export interface SearchHit extends SearchDoc {
  score: number;
  /** The query terms this result actually matched, for the "why this" line. */
  matched: string[];
}

/**
 * Words that carry no signal in this corpus. "What should I do about sleep"
 * must search for "sleep", not for "what", "should", "i", "do" or "about".
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
  "a",
  "about",
  "after",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "been",
  "before",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "for",
  "from",
  "get",
  "had",
  "has",
  "have",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "just",
  "me",
  "my",
  "no",
  "not",
  "of",
  "on",
  "or",
  "our",
  "out",
  "should",
  "so",
  "some",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "too",
  "up",
  "us",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "will",
  "with",
  "would",
  "you",
  "your",
]);

/** Lowercase, strip punctuation, split, drop stopwords and one-letter words. */
export function parseQuery(query: string): string[] {
  const words = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
  return [...new Set(words)];
}

/** Character trigrams, padded so a short word still has three of them. */
export function trigrams(word: string): Set<string> {
  const padded = `  ${word} `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 2; i += 1) out.add(padded.slice(i, i + 3));
  return out;
}

/**
 * Dice coefficient over trigrams. Used only when no term matched exactly, so
 * a typo ("gloucose") still finds the glucose screening.
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  // trigrams() pads, so it is never empty — no divide-by-zero guard needed.
  const left = trigrams(a);
  const right = trigrams(b);
  let shared = 0;
  for (const gram of left) if (right.has(gram)) shared += 1;
  return (2 * shared) / (left.size + right.size);
}

/** Below this, a fuzzy match is noise rather than a typo. */
export const FUZZY_FLOOR = 0.55;

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function scoreTerm(
  term: string,
  doc: SearchDoc,
  titleWords: string[],
  bodyWords: string[],
): number {
  if (titleWords.includes(term)) return 10;
  // A declared keyword is the content author saying "a parent calls this
  // ultrasound". It outranks a body match but not the title itself.
  if (doc.keywords.includes(term)) return 8;
  if (titleWords.some((word) => word.startsWith(term))) return 6;
  if (doc.title.toLowerCase().includes(term)) return 4;
  if (bodyWords.includes(term)) return 3;
  if (doc.body.includes(term)) return 2;

  // Nothing matched exactly. Try the typo path, on the title only — a fuzzy
  // hit in the body is how search starts returning nonsense.
  let best = 0;
  for (const word of titleWords) {
    const score = similarity(term, word);
    if (score >= FUZZY_FLOOR && score > best) best = score;
  }
  return best === 0 ? 0 : 3 * best;
}

/**
 * Ranks the index against a query. A result must match at least one term;
 * matching more terms ranks higher, and a title match outranks a body match.
 */
export function search(index: readonly SearchDoc[], query: string, limit = 20): SearchHit[] {
  const terms = parseQuery(query);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const doc of index) {
    const titleWords = words(doc.title);
    const bodyWords = words(doc.body);
    let score = 0;
    const matched: string[] = [];
    for (const term of terms) {
      const termScore = scoreTerm(term, doc, titleWords, bodyWords);
      if (termScore > 0) {
        score += termScore;
        matched.push(term);
      }
    }
    if (matched.length === 0) continue;
    // Every term matching is worth more than the sum of its parts.
    if (matched.length === terms.length) score *= 1.5;
    hits.push({ ...doc, score, matched });
  }

  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return hits.slice(0, limit);
}

/** Builds the index from the packs and the catalogue. Pure, so it is testable. */
export function buildIndex(packs: readonly StagePack[], links: readonly LinkEntry[]): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const pack of packs) {
    const sourceIds = pack.sources.map((source) => source.id);
    docs.push({
      id: `week-${pack.id}`,
      kind: "week",
      title: pack.title,
      body: [pack.subtitle, pack.baby?.development, pack.you?.body, pack.you?.mind]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      keywords: "",
      href: `/week/${pack.id}`,
      packId: pack.id,
      packTitle: pack.title,
      sourceIds,
    });

    for (const action of pack.coreActions) {
      docs.push({
        id: `step-${pack.id}-${action.id}`,
        kind: "step",
        title: action.title,
        body: [action.why, action.detail, action.skipIf, ...action.options.map((o) => o.label)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
        keywords: (action.keywords ?? []).join(" ").toLowerCase(),
        href: `/week/${pack.id}#${action.id}-title`,
        packId: pack.id,
        packTitle: pack.title,
        sourceIds,
      });
    }

    for (const item of pack.alsoKnow) {
      docs.push({
        id: `know-${pack.id}-${item.id}`,
        kind: "step",
        title: item.title,
        body: item.body.toLowerCase(),
        keywords: "",
        href: `/week/${pack.id}#also-heading`,
        packId: pack.id,
        packTitle: pack.title,
        sourceIds,
      });
    }
  }

  for (const link of links) {
    docs.push({
      id: `link-${link.id}`,
      kind: "link",
      title: link.title,
      body: [link.publisher, link.why, link.note, ...link.domains]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
      keywords: "",
      href: `/library#${link.id}`,
      sourceIds: [link.id],
    });
  }

  return docs;
}

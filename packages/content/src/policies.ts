/**
 * The policies, as data.
 *
 * The footer and the tests both read this one list, so a policy that exists but
 * is not linked — or is linked but does not exist — is a test failure rather
 * than something a parent discovers by looking for it.
 */

export interface PolicyLink {
  href: string;
  label: string;
}

export const POLICIES = [
  {
    href: "/privacy",
    label: "Privacy",
  },
  {
    href: "/terms",
    label: "Terms",
  },
  {
    href: "/editorial",
    label: "How we write",
  },
  {
    href: "/corrections",
    label: "Corrections",
  },
] as const satisfies readonly PolicyLink[];

/** The day this version of the policies took effect. */
export const POLICIES_EFFECTIVE = "2026-10-27";

/**
 * The corrections log.
 *
 * It starts empty on purpose. A corrections log that opens with a few
 * plausible-looking entries is a marketing device; one that is empty and says
 * so is a promise. The first real correction goes here, and the shape below is
 * what the person filing it has to be able to answer.
 */
export interface Correction {
  id: string;
  /** The day the correction was published, `YYYY-MM-DD`. */
  published: string;
  /** Where the reader saw it: "Week 28", "Library · car seats". */
  where: string;
  /** What it said. Quoted, not paraphrased, so the record cannot drift. */
  was: string;
  /** What it says now. */
  now: string;
  /** What caught it — a parent, the link check, a clinician. */
  foundBy: string;
}

export const CORRECTIONS: readonly Correction[] = [];

/**
 * What counts as a correction, and how fast each kind has to be fixed.
 *
 * These are commitments, so they are data with a test rather than prose that
 * quietly goes stale.
 */
export const CORRECTION_WINDOWS = [
  {
    kind: "Something that could hurt someone",
    window: "the same day",
    detail:
      "A wrong dose, a wrong number, a red flag described in a way that could delay care. The page is corrected or taken down before anything else happens, and the log entry follows within the day.",
  },
  {
    kind: "A clinical fact",
    window: "within two weeks",
    detail:
      "A guideline that changed, a recommendation we got wrong. Corrected after the source is re-read and, where the change is not obvious, a clinician signs off.",
  },
  {
    kind: "A link that moved or broke",
    window: "within two weeks",
    detail:
      "The weekly link check reports it; a person confirms the replacement is the same document and not a similar-sounding one.",
  },
  {
    kind: "A typo, a tone that landed wrong",
    window: "with the next release",
    detail:
      "Still logged. A parent who writes in about a sentence that made them feel judged deserves to see that it changed.",
  },
] as const;

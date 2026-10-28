import { PERSONAS, isPersona, type Persona } from "@ninetothree/content/core";

/**
 * Who is reading.
 *
 * A view preference, like `reading` — deliberately not part of `Profile`.
 * `Profile` feeds the rules engine that decides what is hidden for a loss, a
 * NICU stay or a formula-fed baby; a persona must never reach it, or a
 * grandparent switching views could change what the baby's rules hide.
 *
 * See PERSONAS.md for the design.
 */

export const DEFAULT_PERSONA: Persona = "parent";

export function migratePersona(raw: unknown): Persona {
  return isPersona(raw) ? raw : DEFAULT_PERSONA;
}

/**
 * On by default. The light line is the only part of the product that is
 * allowed to be funny, and it is already suppressed for a loss; the toggle
 * exists for everyone who simply does not want it.
 */
export const DEFAULT_HUMOUR = true;

export function migrateHumour(raw: unknown): boolean {
  return typeof raw === "boolean" ? raw : DEFAULT_HUMOUR;
}

/** The four answers, in the order they are offered. */
export const PERSONA_ORDER: Persona[] = [...PERSONAS];

/**
 * The status question, in the reader's own words.
 *
 * "I am pregnant" is only true for the parent. A grandparent asked that
 * question has to translate it into their own situation before they can
 * answer, which is exactly the moment this product loses people.
 */
export function statusOptions(persona: Persona): { value: "pregnant" | "parent"; label: string }[] {
  switch (persona) {
    case "parent":
      return [
        { value: "pregnant", label: "I am pregnant" },
        { value: "parent", label: "My baby is here" },
      ];
    case "partner":
      return [
        { value: "pregnant", label: "My partner is pregnant" },
        { value: "parent", label: "Our baby is here" },
      ];
    case "grandparent":
      return [
        { value: "pregnant", label: "My grandchild is on the way" },
        { value: "parent", label: "My grandchild is here" },
      ];
    case "extended":
      return [
        { value: "pregnant", label: "Someone close is pregnant" },
        { value: "parent", label: "Their baby is here" },
      ];
  }
}

export interface DateQuestion {
  label: string;
  hint: string;
}

/** The date question. "Your due date" is the parent's, not the reader's. */
export function dateQuestion(persona: Persona, status: "pregnant" | "parent"): DateQuestion {
  if (status === "parent") {
    return { label: "When was the baby born?", hint: "The date on the birth certificate." };
  }
  return persona === "parent"
    ? { label: "When is your due date?", hint: "An estimate is fine. You can change it later." }
    : {
        label: "When is the baby due?",
        hint: "An estimate is fine. You can change it later.",
      };
}

/** One line under the persona step, so the choice is obviously reversible. */
export const PERSONA_NOTE =
  "This changes what we show you, never what we warn you about. You can change it in settings.";

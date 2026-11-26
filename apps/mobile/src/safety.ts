/**
 * The safety page, as a model.
 *
 * The numbers and the red flags come from the same shared copy the website
 * reads, so the two can never disagree about who to call; this file only
 * flattens them into rows the phone can draw.
 */
import { ESCALATION_COPY, type Escalation } from "@ninetothree/content";
import {
  HELP_NUMBERS,
  SAFETY_CTA,
  SAFETY_CTA_NOTE,
  SAFETY_FLAGS_HEADING,
  SAFETY_FLAGS_INTRO,
  SAFETY_FOOTER,
  SAFETY_HEADING,
  SAFETY_INTRO,
  SAFETY_MORE,
  SAFETY_MORE_URL,
  SAFETY_NUMBERS_HEADING,
  safetyFlags,
} from "@ninetothree/domain";

export interface SafetyNumber {
  readonly key: Escalation;
  readonly label: string;
  readonly phone: string | null;
  readonly tel: string | null;
  readonly detail: string;
}

export interface SafetyFlagRow {
  readonly id: string;
  readonly text: string;
  /** "Call 911", or the answer that has no fixed number. */
  readonly action: string;
  /** The week it came from, so a parent can read around it. */
  readonly from: string;
  readonly packId: string;
  /** The number to print beside the action, or `null` when there is none. */
  readonly phone: string | null;
  readonly tel: string | null;
}

export interface SafetyModel {
  readonly heading: string;
  readonly intro: string;
  readonly cta: string;
  readonly ctaNote: string;
  readonly numbers: { readonly heading: string; readonly items: readonly SafetyNumber[] };
  readonly flags: {
    readonly heading: string;
    readonly intro: string;
    readonly items: readonly SafetyFlagRow[];
  };
  readonly footer: string;
  readonly more: { readonly label: string; readonly url: string };
}

export type SafetyPack = Parameters<typeof safetyFlags>[0][number];

export function safetyModel(packs: readonly SafetyPack[]): SafetyModel {
  return {
    heading: SAFETY_HEADING,
    intro: SAFETY_INTRO,
    cta: SAFETY_CTA,
    ctaNote: SAFETY_CTA_NOTE,
    numbers: {
      heading: SAFETY_NUMBERS_HEADING,
      items: HELP_NUMBERS.map((number) => {
        const copy = ESCALATION_COPY[number.key];
        const phone = copy.phone ?? null;
        return {
          key: number.key,
          label: copy.label,
          phone,
          tel: phone === null ? null : `tel:${phone.replace(/[^0-9+]/g, "")}`,
          detail: number.detail,
        };
      }),
    },
    flags: {
      heading: SAFETY_FLAGS_HEADING,
      intro: SAFETY_FLAGS_INTRO,
      items: safetyFlags(packs).map((flag) => ({
        id: flag.id,
        text: flag.text,
        action: flag.action,
        from: flag.packTitle,
        packId: flag.packId,
        phone: flag.phone,
        tel: flag.tel,
      })),
    },
    footer: SAFETY_FOOTER,
    more: { label: SAFETY_MORE, url: SAFETY_MORE_URL },
  };
}

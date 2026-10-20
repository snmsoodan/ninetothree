import type { Escalation } from "@ninetothree/content";

export interface HelpNumber {
  key: Escalation;
  detail: string;
}

/**
 * The five numbers, in the order a parent is most likely to need them.
 *
 * One list, read by the safety page and by the drawer, so the two cannot
 * disagree about what to call. The label and the number come from
 * `ESCALATION_COPY`; only the sentence under each one lives here.
 */
export const HELP_NUMBERS: HelpNumber[] = [
  { key: "call-911", detail: "Anything that feels like an emergency. Trust that." },
  { key: "call-poison-control", detail: "Swallowed something, or a question about a dose." },
  { key: "call-988", detail: "If you are thinking about hurting yourself." },
  { key: "call-psi", detail: "Someone to talk to about how you feel." },
  { key: "call-dv-hotline", detail: "Free, confidential, 24 hours." },
];

import { ESCALATION_COPY } from "@ninetothree/content";

/*
 * Both of these carry a number in ESCALATION_COPY. The type says `phone?`
 * because three of the eight escalations are a line you already have, not a
 * number we can print — so the values are read straight through rather than
 * guarded with a fallback that could never run.
 */
const CRISIS = ESCALATION_COPY["call-988"];
const SUPPORT = ESCALATION_COPY["call-psi"];

/**
 * The crisis footer, on every page whose subject is how a parent feels.
 *
 * It sits at the bottom of the page rather than in a banner, because a
 * banner is something you learn to stop seeing. It is not a dialog, not a
 * dismissible card, and it has no close button: a parent who comes back to
 * the page a week later finds it in the same place.
 */
export function CrisisFooter() {
  return (
    <footer
      aria-labelledby="crisis-heading"
      className="mt-10 rounded-lg border border-line bg-paper-sunken p-5"
    >
      <h2 id="crisis-heading" className="font-display text-lg text-ink">
        If you are thinking about hurting yourself
      </h2>
      <p className="mt-2 text-base text-ink-muted">
        Call or text{" "}
        <a href={CRISIS.href} className="font-medium text-ink underline underline-offset-2">
          {CRISIS.phone}
        </a>
        . It is free, it is answered day and night, and calling it is not an overreaction.
      </p>
      <p className="mt-3 text-base text-ink-muted">
        For how you feel when it is not an emergency, the PSI Helpline is{" "}
        <a href={SUPPORT.href} className="font-medium text-ink underline underline-offset-2">
          {SUPPORT.phone}
        </a>
        .
      </p>
    </footer>
  );
}

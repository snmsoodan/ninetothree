import {
  CRISIS,
  CRISIS_HEADING,
  CRISIS_LEAD,
  CRISIS_TAIL,
  SUPPORT,
  SUPPORT_LEAD,
  SUPPORT_TAIL,
} from "@ninetothree/domain";

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
        {CRISIS_HEADING}
      </h2>
      <p className="mt-2 text-base text-ink-muted">
        {CRISIS_LEAD}{" "}
        <a href={CRISIS.href} className="font-medium text-ink underline underline-offset-2">
          {CRISIS.phone}
        </a>
        {CRISIS_TAIL}
      </p>
      <p className="mt-3 text-base text-ink-muted">
        {SUPPORT_LEAD}{" "}
        <a href={SUPPORT.href} className="font-medium text-ink underline underline-offset-2">
          {SUPPORT.phone}
        </a>
        {SUPPORT_TAIL}
      </p>
    </footer>
  );
}

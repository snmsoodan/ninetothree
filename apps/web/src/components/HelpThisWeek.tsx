import { Card, CardBody } from "@ninetothree/ui";

export interface HelpItem {
  id: string;
  title: string;
  type: "do" | "book" | "buy" | "know" | "watch" | "ask";
  minutes: number | null;
}

export interface HelpThisWeekProps {
  week: {
    id: string;
    title: string;
    subtitle: string | null;
    body: string | null;
    mind: string | null;
    help: HelpItem[];
  } | null;
  /**
   * Hands one of the week's jobs to the other person. Absent when there is
   * nobody to hand it to, so the button never offers to assign to nobody.
   */
  onAssign?: (item: HelpItem) => void;
  /** The other person's name, for the button's label. */
  assignTo?: string;
}

const VERB: Record<HelpItem["type"], string> = {
  do: "Do",
  book: "Book",
  buy: "Pick up",
  know: "Know",
  watch: "Watch for",
  ask: "Ask about",
};

/**
 * What the week asks of the person who is not carrying it.
 *
 * The copy is deliberately about the other person's load, not about the baby.
 * A partner who reads "the baby is the size of a lime" has learned something
 * charming and nothing useful; a partner who reads "she is not sleeping and it
 * is not about you" has been handed the actual job.
 */
export function HelpThisWeek({ week, onAssign, assignTo }: HelpThisWeekProps) {
  if (!week) {
    return (
      <section aria-labelledby="help-heading">
        <h2 id="help-heading" className="font-display text-xl text-ink">
          How to help this week
        </h2>
        <Card tone="sunken" className="mt-3">
          <CardBody className="pt-5">
            <p className="text-base text-ink">There is no week to show yet.</p>
            <p className="mt-1 text-base text-ink-muted">
              Once the person you are with has set their dates, this fills in with what the week
              actually asks of them.
            </p>
          </CardBody>
        </Card>
      </section>
    );
  }

  return (
    <section aria-labelledby="help-heading">
      <h2 id="help-heading" className="font-display text-xl text-ink">
        How to help this week
      </h2>
      <p className="mt-1 text-sm text-ink-faint">{week.title}</p>

      {week.body || week.mind ? (
        <Card tone="sunken" className="mt-3">
          <CardBody className="space-y-3 pt-5">
            {week.body ? <p className="text-base text-ink">{week.body}</p> : null}
            {week.mind ? <p className="text-base text-ink-muted">{week.mind}</p> : null}
          </CardBody>
        </Card>
      ) : null}

      {week.help.length > 0 ? (
        <>
          <h3 className="mt-5 text-base text-ink">What you can take off their plate</h3>
          <ul className="mt-2 space-y-2">
            {week.help.map((item) => (
              <li key={item.id}>
                <Card tone="sunken">
                  <CardBody className="py-4">
                    <p className="text-base text-ink">
                      <span className="text-ink-faint">{VERB[item.type]}. </span>
                      {item.title}
                    </p>
                    {item.minutes ? (
                      <p className="mt-0.5 text-sm text-ink-faint tabular">
                        About {item.minutes} minutes.
                      </p>
                    ) : null}
                    {onAssign ? (
                      <button
                        type="button"
                        onClick={() => onAssign(item)}
                        className="mt-3 rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      >
                        {assignTo ? `Ask ${assignTo} to do this` : "Ask them to do this"}
                      </button>
                    ) : null}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-base text-ink-muted">
          Nothing on the list this week. Being there is the whole job.
        </p>
      )}
    </section>
  );
}

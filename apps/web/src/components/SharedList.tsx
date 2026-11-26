import { Card, CardBody } from "@ninetothree/ui";
import {
  TOGETHER_NO_SHARED,
  TOGETHER_NO_SHARED_BODY,
  TOGETHER_SHARED_HEADING,
  type SharedLine,
} from "@ninetothree/domain";

export interface SharedListProps {
  /** Lines already decided by the shared model — title, week, and whose it is. */
  lines: SharedLine[];
}

/**
 * Pins somebody chose to share.
 *
 * There is no note here and there never will be: a note lives in the private
 * row, and this list is built from a table that has no column for one. That is
 * why the empty state can promise what it promises.
 */
export function SharedList({ lines }: SharedListProps) {
  return (
    <section aria-labelledby="shared-heading">
      <h2 id="shared-heading" className="font-display text-xl text-ink">
        {TOGETHER_SHARED_HEADING}
      </h2>

      {lines.length === 0 ? (
        <Card tone="sunken" className="mt-3">
          <CardBody className="pt-5">
            <p className="text-base text-ink">{TOGETHER_NO_SHARED}</p>
            <p className="mt-1 text-base text-ink-muted">{TOGETHER_NO_SHARED_BODY}</p>
          </CardBody>
        </Card>
      ) : (
        <ul className="mt-3 space-y-2">
          {lines.map((line) => (
            <li key={line.itemId}>
              <Card tone="sunken">
                <CardBody className="py-4">
                  <p className="text-base text-ink">{line.title}</p>
                  <p className="mt-0.5 text-sm text-ink-faint">{line.detail}</p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

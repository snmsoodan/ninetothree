import { Card, CardBody } from "@ninetothree/ui";

export interface SharedItem {
  itemId: string;
  title: string;
  packTitle: string | null;
  stagePackId: string | null;
  sharedBy: string;
  isYours: boolean;
}

export interface SharedListProps {
  items: SharedItem[];
  /** The name to show for the other person, when there is one. */
  otherName?: string;
}

/**
 * Pins somebody chose to share.
 *
 * There is no note here and there never will be: a note lives in the private
 * row, and this list is built from a table that has no column for one. That is
 * why the empty state can promise what it promises.
 */
export function SharedList({ items, otherName }: SharedListProps) {
  return (
    <section aria-labelledby="shared-heading">
      <h2 id="shared-heading" className="font-display text-xl text-ink">
        Shared
      </h2>

      {items.length === 0 ? (
        <Card tone="sunken" className="mt-3">
          <CardBody className="pt-5">
            <p className="text-base text-ink">Nothing shared yet.</p>
            <p className="mt-1 text-base text-ink-muted">
              Pin something on your shelf and share it, and it shows up here. Your notes stay yours
              — only the title travels.
            </p>
          </CardBody>
        </Card>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.itemId}>
              <Card tone="sunken">
                <CardBody className="py-4">
                  <p className="text-base text-ink">{item.title}</p>
                  <p className="mt-0.5 text-sm text-ink-faint">
                    {item.packTitle ?? "Pinned"}
                    {item.isYours ? " · shared by you" : otherName ? ` · from ${otherName}` : ""}
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { Card, CardBody } from "@ninetothree/ui";

export interface PinItem {
  id: string;
  title: string;
  /** The week the pin came from, so it can be found again. */
  packTitle: string;
  packId: string;
}

export interface PinListProps {
  pins: PinItem[];
  /** The dashboard shows six. The shelf shows all of them. */
  max?: number;
  onUnpin?: (id: string) => void;
}

export const PIN_LIMIT = 6;

/**
 * Pins are the parent's own shortlist. The dashboard shows the first six and
 * says so, rather than silently hiding the rest — a pin that disappears is
 * worse than a pin that is one tap away.
 */
export function PinList({ pins, max = PIN_LIMIT, onUnpin }: PinListProps) {
  const shown = pins.slice(0, max);
  const hidden = pins.length - shown.length;

  return (
    <section aria-labelledby="pins-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="pins-heading" className="font-display text-xl text-ink">
          Pinned
        </h2>
        {pins.length > 0 ? (
          <Link
            href="/shelf"
            className="text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            See all
          </Link>
        ) : null}
      </div>

      {pins.length === 0 ? (
        <Card tone="sunken" className="mt-3">
          <CardBody className="pt-5">
            <p className="text-base text-ink">Nothing pinned yet.</p>
            <p className="mt-1 text-base text-ink-muted">
              Pin the things you keep needing — the pediatrician&rsquo;s number, your birth
              preferences, the safe-sleep checklist.
            </p>
            <Link
              href="/shelf"
              className="mt-3 inline-block text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              See what you can pin
            </Link>
          </CardBody>
        </Card>
      ) : (
        <ul className="mt-3 space-y-2">
          {shown.map((pin) => (
            <li key={pin.id}>
              <Card tone="sunken">
                <CardBody className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <Link
                      href={`/week/${pin.packId}`}
                      className="text-base text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                    >
                      {pin.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink-faint">{pin.packTitle}</p>
                  </div>
                  {onUnpin ? (
                    <button
                      type="button"
                      onClick={() => onUnpin(pin.id)}
                      aria-label={`Unpin ${pin.title}`}
                      className="shrink-0 rounded-sm px-2 py-1 text-sm text-ink-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                    >
                      Unpin
                    </button>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {hidden > 0 ? (
        <p className="mt-2 text-sm text-ink-faint tabular">{hidden} more on your shelf.</p>
      ) : null}
    </section>
  );
}

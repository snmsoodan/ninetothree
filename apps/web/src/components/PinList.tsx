"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Card, CardBody } from "@ninetothree/ui";

import { formatDate } from "@/lib/i18n";

export interface PinItem {
  id: string;
  title: string;
  /** The week the pin came from, so it can be found again. */
  packTitle: string;
  packId: string;
  /** The action is gone from the registry; only the snapshot is left. */
  stale?: boolean;
  /** ISO date, YYYY-MM-DD. The day the parent asked to be reminded. */
  remindOn?: string;
  /** Whether this pin is on the household's shared list. */
  shared?: boolean;
}

export interface PinListProps {
  pins: PinItem[];
  /** The dashboard shows six. The shelf shows all of them. */
  max?: number;
  onUnpin?: (id: string) => void;
  onRemind?: (id: string, date?: string) => void;
  /** Absent when the household has one person in it, so no control is shown. */
  onShare?: (id: string, shared: boolean) => void;
}

export const PIN_LIMIT = 6;

/**
 * Pins are the parent's own shortlist. The dashboard shows the first six and
 * says so, rather than silently hiding the rest — a pin that disappears is
 * worse than a pin that is one tap away.
 */
function formatDay(date: string): string {
  return formatDate(date, { month: "short", day: "numeric" });
}

interface ReminderControlProps {
  pin: PinItem;
  onRemind: (id: string, date?: string) => void;
}

/**
 * A reminder is a day, not a time. The parent picks the day and the dashboard
 * says so on the morning of it — no alarm, no countdown.
 */
function ReminderControl({ pin, onRemind }: ReminderControlProps) {
  const [open, setOpen] = useState(false);
  const inputId = useId();

  if (pin.remindOn) {
    return (
      <p className="mt-1 text-sm text-ink-faint">
        Reminder {formatDay(pin.remindOn)}.{" "}
        <button
          type="button"
          onClick={() => onRemind(pin.id, undefined)}
          className="rounded-sm underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
        >
          Clear
        </button>
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 rounded-sm text-sm text-ink-faint underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
      >
        Remind me
      </button>
    );
  }

  return (
    <div className="mt-2">
      <label htmlFor={inputId} className="block text-sm text-ink-muted">
        Remind me on
      </label>
      <input
        id={inputId}
        type="date"
        defaultValue={pin.remindOn ?? ""}
        onChange={(event) => {
          if (event.target.value) {
            onRemind(pin.id, event.target.value);
            setOpen(false);
          }
        }}
        className="mt-1 rounded-sm border border-line-strong bg-surface px-2 py-1 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
      />
    </div>
  );
}

export function PinList({ pins, max = PIN_LIMIT, onUnpin, onRemind, onShare }: PinListProps) {
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
                    {pin.stale ? (
                      <span className="text-base text-ink">{pin.title}</span>
                    ) : (
                      <Link
                        href={`/week/${pin.packId}`}
                        className="text-base text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      >
                        {pin.title}
                      </Link>
                    )}
                    <p className="mt-0.5 text-sm text-ink-faint">
                      {pin.stale ? "This step has changed since you pinned it." : pin.packTitle}
                    </p>
                    {onRemind ? <ReminderControl pin={pin} onRemind={onRemind} /> : null}
                    {onShare ? (
                      <button
                        type="button"
                        onClick={() => onShare(pin.id, !pin.shared)}
                        aria-pressed={pin.shared === true}
                        className="mt-1 rounded-sm text-sm text-ink-faint underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      >
                        {pin.shared ? "Shared with your household" : "Share with your household"}
                      </button>
                    ) : null}
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

"use client";

import {
  APPOINTMENTS_DELETE,
  APPOINTMENTS_EDIT,
  APPOINTMENTS_WINDOW_BADGE,
  APPOINTMENTS_WITH,
  firstNowIndex,
  formatWindow,
  type ScheduleItem,
} from "@ninetothree/domain";
import { Badge, Card, CardBody } from "@ninetothree/ui";

export type { ScheduleItem };

export interface ScheduleListProps {
  items: ScheduleItem[];
  emptyCopy: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * A dated list, not a calendar. A parent does not need a month grid at 3am;
 * they need to know whether anything is coming and roughly when.
 */
export function ScheduleList({ items, emptyCopy, onEdit, onDelete }: ScheduleListProps) {
  if (items.length === 0) {
    return (
      <Card tone="sunken" className="mt-3">
        <CardBody className="pt-5">
          <p className="text-base text-ink-muted">{emptyCopy}</p>
        </CardBody>
      </Card>
    );
  }

  // Several windows can overlap — at 28 weeks the glucose test, the Tdap
  // dose and the 28-week visit are all open. Marking all of them would be
  // four badges saying the same thing, so only the first one is marked.
  const firstNow = firstNowIndex(items);

  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, index) => (
        <li key={item.id}>
          <Card tone={item.status === "now" ? "raised" : "sunken"}>
            <CardBody className="py-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base text-ink">{item.label}</h3>
                <span className="shrink-0 text-sm text-ink-faint tabular">
                  {formatWindow(item.from, item.to)}
                </span>
              </div>
              {index === firstNow ? (
                <p className="mt-1">
                  <Badge tone="sage">{APPOINTMENTS_WINDOW_BADGE}</Badge>
                </p>
              ) : null}
              {item.who ? (
                <p className="mt-0.5 text-sm text-ink-muted">
                  {APPOINTMENTS_WITH}
                  {item.who}
                </p>
              ) : null}
              {item.note ? <p className="mt-1 text-sm text-ink-muted">{item.note}</p> : null}
              {item.own && (onEdit || onDelete) ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {onEdit ? (
                    <button
                      type="button"
                      onClick={() => onEdit(item.id)}
                      aria-label={`Edit ${item.label}`}
                      className="rounded-sm px-2 py-1 text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                    >
                      {APPOINTMENTS_EDIT}
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      aria-label={`Delete ${item.label}`}
                      className="rounded-sm px-2 py-1 text-sm text-ink-faint underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                    >
                      {APPOINTMENTS_DELETE}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}

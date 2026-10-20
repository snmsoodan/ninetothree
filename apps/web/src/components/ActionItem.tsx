"use client";

import { useState } from "react";
import Link from "next/link";
import type { Action } from "@ninetothree/content";
import { Badge, Button, Dialog, RadioGroup, TextLink, cn } from "@ninetothree/ui";
import {
  clearProgress,
  isDone,
  isPinned,
  isSkipped,
  isSnoozed,
  markDone,
  markSkipped,
  snooze,
  togglePin,
  useAppState,
} from "@/lib/store";

const SKIP_REASONS = [
  { value: "not-now", label: "Not this week", hint: "It will not come back on its own." },
  { value: "already-done", label: "Already done", hint: "You did this before you got here." },
  { value: "not-for-me", label: "Not for me", hint: "We will stop showing this kind of thing." },
  { value: "no-reason", label: "Skip without saying why", hint: "That is allowed." },
];

const LATER_OPTIONS = [
  { value: "1", label: "Tomorrow", hint: "Back on the list in the morning." },
  { value: "3", label: "In a few days", hint: "Back before the week is out." },
  { value: "7", label: "Next week", hint: "Back when the next week starts." },
];

/** ISO date `days` from `today`. UTC, so a clock change cannot move it. */
export function addDays(today: string, days: number): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const PRIORITY_LABEL: Record<Action["priority"], string | null> = {
  essential: "Do this one",
  recommended: null,
  optional: null,
  "skip-if": null,
};

export interface ActionItemProps {
  action: Action;
  /** The pack this action belongs to, for the pin label and the pin snapshot. */
  packId: string;
  packTitle: string;
  /** ISO date. Passed in so the snooze answer is the same on server and client. */
  today: string;
  /** The long read that explains this step, if there is one. */
  readMore?: { href: string; title: string };
}

export function ActionItem({ action, packId, packTitle, today, readMore }: ActionItemProps) {
  const state = useAppState();
  const done = isDone(state, action.id);
  const skipped = isSkipped(state, action.id);
  const pinned = isPinned(state, action.id);
  const snoozed = isSnoozed(state, action.id, today);
  const [expanded, setExpanded] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [laterOpen, setLaterOpen] = useState(false);
  const [reason, setReason] = useState("not-now");
  const [later, setLater] = useState("7");

  const priorityLabel = PRIORITY_LABEL[action.priority];

  return (
    <article
      className={cn(
        "rounded-lg border p-5 transition-colors duration-[var(--duration-base)] ease-[var(--ease-calm)]",
        done ? "border-sage/30 bg-sage-wash/50" : "border-line bg-paper-raised",
        skipped && "opacity-60",
      )}
      aria-labelledby={`${action.id}-title`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {priorityLabel ? (
            <Badge tone="clay" className="mb-2">
              {priorityLabel}
            </Badge>
          ) : null}
          <h3
            id={`${action.id}-title`}
            className={cn(
              "font-display text-xl text-ink",
              done && "line-through decoration-sage/50 decoration-1",
            )}
          >
            {action.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => togglePin({ id: action.id, title: action.title, packId, packTitle })}
          aria-pressed={pinned}
          aria-label={pinned ? `Unpin ${action.title}` : `Pin ${action.title}`}
          className={cn(
            "shrink-0 rounded-sm p-1.5 transition-colors duration-[var(--duration-fast)]",
            pinned ? "text-clay" : "text-ink-faint hover:text-ink",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
          )}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
            <path
              d="M6 1.5h4l-.6 4.2 2.1 2.1v1.2H8.6V14L8 15l-.6-1V9H4.5V7.8l2.1-2.1L6 1.5Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
              fill={pinned ? "currentColor" : "none"}
            />
          </svg>
        </button>
      </div>

      <p className="mt-2 text-base text-ink-muted">{action.why}</p>

      {action.minutes ? (
        <p className="mt-2 text-sm text-ink-faint tabular">
          About {action.minutes} {action.minutes === 1 ? "minute" : "minutes"}
        </p>
      ) : null}

      {action.detail ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="text-sm text-ink-muted underline decoration-line-strong underline-offset-2 hover:text-ink"
          >
            {expanded ? "Less" : "More detail"}
          </button>
          {expanded ? <p className="mt-2 text-base text-ink-muted">{action.detail}</p> : null}
        </div>
      ) : null}

      {readMore ? (
        <p className="mt-3 text-sm text-ink-muted">
          Long read —{" "}
          <Link
            href={readMore.href}
            className="text-ink underline decoration-line-strong decoration-1 underline-offset-[3px] hover:decoration-ink"
          >
            {readMore.title}
          </Link>
        </p>
      ) : null}

      {action.options.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {action.options.map((option) => (
            <li key={option.id} className="rounded-md bg-paper-sunken p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base text-ink">
                  {option.url ? (
                    <TextLink href={option.url} external>
                      {option.label}
                    </TextLink>
                  ) : (
                    option.label
                  )}
                </span>
                {option.cost ? (
                  <span className="shrink-0 text-xs text-ink-faint tabular">{option.cost}</span>
                ) : null}
              </div>
              {option.detail ? (
                <p className="mt-1 text-sm text-ink-muted">{option.detail}</p>
              ) : null}
              {option.note ? <p className="mt-1 text-xs text-ink-faint">{option.note}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {action.skipIf ? (
        <p className="mt-3 text-sm text-ink-faint">Skip this if: {action.skipIf}</p>
      ) : null}

      {/*
        The status word sits where the button was, so a second tap on a phone
        lands on text rather than on Undo. A double tap is one intention.
      */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {done ? (
          <span className="text-sm text-sage">Done</span>
        ) : skipped ? (
          <span className="text-sm text-ink-faint">Skipped</span>
        ) : (
          <>
            <Button
              size="sm"
              onClick={() => markDone({ id: action.id, title: action.title, packId, packTitle })}
            >
              Done
            </Button>
            <Button variant="quiet" size="sm" onClick={() => setSkipOpen(true)}>
              Skip
            </Button>
            <Button variant="quiet" size="sm" onClick={() => setLaterOpen(true)}>
              Later
            </Button>
          </>
        )}
        {done || skipped ? (
          <Button variant="quiet" size="sm" onClick={() => clearProgress(action.id)}>
            Undo
          </Button>
        ) : null}
        {snoozed ? <span className="text-sm text-ink-faint">Set aside for now</span> : null}
      </div>

      <Dialog
        open={skipOpen}
        onOpenChange={setSkipOpen}
        title="Skip this one?"
        description="Nothing bad happens. It will not nag you, and it will not count against you."
        footer={
          <>
            <Button variant="quiet" onClick={() => setSkipOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                markSkipped(
                  { id: action.id, title: action.title, packId, packTitle },
                  reason === "no-reason" ? undefined : reason,
                );
                setSkipOpen(false);
              }}
            >
              Skip it
            </Button>
          </>
        }
      >
        <RadioGroup
          name={`skip-${action.id}`}
          label="Why are you skipping?"
          value={reason}
          onValueChange={setReason}
          options={SKIP_REASONS}
        />
      </Dialog>

      <Dialog
        open={laterOpen}
        onOpenChange={setLaterOpen}
        title="Come back to this later?"
        description="It leaves this week and comes back on its own. Nothing is lost, and nothing counts against you."
        footer={
          <>
            <Button variant="quiet" onClick={() => setLaterOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                snooze(
                  { id: action.id, title: action.title, packId, packTitle },
                  addDays(today, Number(later)),
                );
                setLaterOpen(false);
              }}
            >
              Set it aside
            </Button>
          </>
        }
      >
        <RadioGroup
          name={`later-${action.id}`}
          label="When should it come back?"
          value={later}
          onValueChange={setLater}
          options={LATER_OPTIONS}
        />
      </Dialog>

      <span className="sr-only">{packTitle}</span>
    </article>
  );
}

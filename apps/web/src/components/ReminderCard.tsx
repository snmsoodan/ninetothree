"use client";

import { Card, CardBody } from "@ninetothree/ui";
import type { Reminder } from "@/lib/reminders";

export interface ReminderCardProps {
  today: Reminder[];
  tomorrow: Reminder[];
  onDismiss: (reminders: Reminder[]) => void;
}

interface GroupProps {
  label: string;
  reminders: Reminder[];
  tone: "raised" | "sunken";
  onDismiss: (reminders: Reminder[]) => void;
}

function Group({ label, reminders, tone, onDismiss }: GroupProps) {
  return (
    <Card tone={tone}>
      <CardBody className="py-4">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <ul className="mt-2 space-y-2">
          {reminders.map((reminder) => (
            <li key={reminder.id}>
              <p className="text-base text-ink">{reminder.title}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{reminder.detail}</p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onDismiss(reminders)}
          aria-label={`Got it — ${label.toLowerCase()}`}
          className="mt-3 rounded-sm text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
        >
          Got it
        </button>
      </CardBody>
    </Card>
  );
}

/**
 * The two things that are about a date rather than a week.
 *
 * It sits above the week card because an appointment tomorrow outranks a step
 * that can wait until Sunday. It is not a notification: the parent opened the
 * app, so this is information, and it is not gated by quiet hours or by the
 * push toggle. What the gate decides is whether it would also be pushed.
 */
export function ReminderCard({ today, tomorrow, onDismiss }: ReminderCardProps) {
  if (today.length === 0 && tomorrow.length === 0) return null;

  return (
    <section aria-labelledby="reminders-heading">
      <h2 id="reminders-heading" className="font-display text-xl text-ink">
        Coming up
      </h2>
      <div className="mt-3 space-y-2">
        {tomorrow.length > 0 ? (
          <Group label="Tomorrow" reminders={tomorrow} tone="raised" onDismiss={onDismiss} />
        ) : null}
        {today.length > 0 ? (
          <Group label="Today" reminders={today} tone="sunken" onDismiss={onDismiss} />
        ) : null}
      </div>
    </section>
  );
}

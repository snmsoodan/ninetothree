"use client";

import Link from "next/link";
import type { Appointment } from "@ninetothree/content";
import { Card, CardBody } from "@ninetothree/ui";

export interface AppointmentListProps {
  appointments: readonly Appointment[];
  /** "week" or "month", so the window reads correctly. */
  unit: "week" | "month" | "day";
}

function windowLabel(appointment: Appointment, unit: AppointmentListProps["unit"]): string {
  const noun = unit === "month" ? "month" : unit === "day" ? "day" : "week";
  if (appointment.from === appointment.to) return `${noun} ${appointment.from}`;
  return `${noun}s ${appointment.from}–${appointment.to}`;
}

/**
 * Appointments for the current stretch. Not a calendar — a parent does not
 * need a calendar at 3am, they need to know whether anything is coming.
 */
export function AppointmentList({ appointments, unit }: AppointmentListProps) {
  return (
    <section aria-labelledby="appointments-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="appointments-heading" className="font-display text-xl text-ink">
          Appointments
        </h2>
        <Link
          href="/appointments"
          className="rounded-sm text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
        >
          See the whole schedule
        </Link>
      </div>

      {appointments.length === 0 ? (
        <Card tone="sunken" className="mt-3">
          <CardBody className="pt-5">
            <p className="text-base text-ink">Nothing booked in this stretch.</p>
            <p className="mt-1 text-base text-ink-muted">
              We will add them here as they come up, so you are not counting weeks in your head.
            </p>
          </CardBody>
        </Card>
      ) : (
        <ul className="mt-3 space-y-2">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <Card tone="sunken">
                <CardBody className="py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-base text-ink">{appointment.label}</h3>
                    <span className="shrink-0 text-sm text-ink-faint tabular">
                      {windowLabel(appointment, unit)}
                    </span>
                  </div>
                  {appointment.who ? (
                    <p className="mt-0.5 text-sm text-ink-muted">With {appointment.who}</p>
                  ) : null}
                  {appointment.note ? (
                    <p className="mt-1 text-sm text-ink-muted">{appointment.note}</p>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

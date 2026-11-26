import Link from "next/link";
import { Card, CardBody } from "@ninetothree/ui";
import type { JobStatus, Together } from "@ninetothree/contracts";
import {
  TOGETHER_COMING_UP,
  TOGETHER_INVITE,
  TOGETHER_NO_APPOINTMENTS,
  TOGETHER_NO_APPOINTMENTS_BODY,
  TOGETHER_PRIVACY,
  TOGETHER_WHO,
  appointmentDetail,
  togetherModel,
} from "@ninetothree/domain";

import { formatDate } from "@/lib/i18n";
import { HelpThisWeek, type HelpItem } from "./HelpThisWeek";
import { JobList } from "./JobList";
import { SharedList } from "./SharedList";

/** The payload is the contract, so the phone and the browser read one shape. */
export type TogetherPayload = Together;
export type { TogetherAppointment, TogetherMember } from "@ninetothree/contracts";

/**
 * The shared page with the data already in hand.
 *
 * Kept apart from the fetching so the design system can show a real household
 * without a database behind it, and so the four sections can be read in one
 * place. Every decision about who is named, what is open and what is settled
 * comes from `togetherModel`, which the phone renders from as well.
 */
export interface TogetherBodyProps {
  data: TogetherPayload;
  onAssign?: (item: HelpItem, to: string, packId: string | null, packTitle: string | null) => void;
  onJobStatus?: (id: string, status: JobStatus) => void;
  onJobRemove?: (id: string) => void;
}

export function TogetherBody({ data, onAssign, onJobStatus, onJobRemove }: TogetherBodyProps) {
  const model = togetherModel(data);
  const to = data.members.find((member) => !member.isYou)?.userId;

  return (
    <div className="space-y-8">
      <HelpThisWeek
        week={data.week}
        onAssign={
          model.canAssign && onAssign && to
            ? (item) => onAssign(item, to, data.week?.id ?? null, data.week?.title ?? null)
            : undefined
        }
        assignTo={model.otherName}
      />

      <JobList
        sections={model.jobs}
        hasJobs={model.hasJobs}
        onStatus={onJobStatus}
        onRemove={onJobRemove}
      />

      <SharedList lines={model.shared} />

      <section aria-labelledby="coming-up-heading">
        <h2 id="coming-up-heading" className="font-display text-xl text-ink">
          {TOGETHER_COMING_UP}
        </h2>
        {model.upcoming.length === 0 ? (
          <Card tone="sunken" className="mt-3">
            <CardBody className="pt-5">
              <p className="text-base text-ink">{TOGETHER_NO_APPOINTMENTS}</p>
              <p className="mt-1 text-base text-ink-muted">{TOGETHER_NO_APPOINTMENTS_BODY}</p>
            </CardBody>
          </Card>
        ) : (
          <ul className="mt-3 space-y-2">
            {model.upcoming.map((appointment) => (
              <li key={appointment.id}>
                <Card tone="sunken">
                  <CardBody className="py-4">
                    <p className="text-base text-ink">{appointment.title}</p>
                    <p className="mt-0.5 text-sm text-ink-faint">
                      {appointmentDetail(
                        appointment,
                        formatDate(appointment.dueAt, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }),
                      )}
                    </p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="who-heading">
        <h2 id="who-heading" className="font-display text-xl text-ink">
          {TOGETHER_WHO}
        </h2>
        <ul className="mt-3 space-y-2">
          {model.members.map((member) => (
            <li key={member.userId}>
              <Card tone="sunken">
                <CardBody className="py-4">
                  <p className="text-base text-ink">
                    {member.label}
                    <span className="text-ink-faint"> · {member.role}</span>
                  </p>
                  {member.email ? (
                    <p className="mt-0.5 text-sm text-ink-faint">{member.email}</p>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink-faint">
          {TOGETHER_PRIVACY}{" "}
          <Link
            href="/settings"
            className="underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            {TOGETHER_INVITE}
          </Link>
        </p>
      </section>
    </div>
  );
}

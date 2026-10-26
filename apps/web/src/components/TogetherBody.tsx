import Link from "next/link";
import { Card, CardBody } from "@ninetothree/ui";

import { HelpThisWeek, type HelpItem } from "./HelpThisWeek";
import { SharedList, type SharedItem } from "./SharedList";

export interface TogetherMember {
  userId: string;
  role: "parent" | "partner" | "grandparent" | "carer";
  email: string;
  name: string | null;
  isYou: boolean;
}

export interface TogetherAppointment {
  id: string;
  title: string;
  kind: string | null;
  dueAt: string | null;
  who: string | null;
  location: string | null;
}

export interface TogetherPayload {
  id: string;
  role: TogetherMember["role"];
  members: TogetherMember[];
  shared: SharedItem[];
  appointments: TogetherAppointment[];
  week: {
    id: string;
    title: string;
    subtitle: string | null;
    body: string | null;
    mind: string | null;
    help: HelpItem[];
  } | null;
}

function who(member: TogetherMember): string {
  return member.name?.trim() || member.email;
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * The shared page with the data already in hand.
 *
 * Kept apart from the fetching so the design system can show a real household
 * without a database behind it, and so the four sections can be read in one
 * place.
 */
export function TogetherBody({ data }: { data: TogetherPayload }) {
  const others = data.members.filter((member) => !member.isYou);
  // Only name the other person when there is exactly one of them; with two,
  // "from Sam" would be a guess.
  const otherName = others.length === 1 ? who(others[0]!) : undefined;
  const upcoming = data.appointments.filter((appointment) => appointment.dueAt);

  return (
    <div className="space-y-8">
      <HelpThisWeek week={data.week} />

      <SharedList items={data.shared} otherName={otherName} />

      <section aria-labelledby="coming-up-heading">
        <h2 id="coming-up-heading" className="font-display text-xl text-ink">
          Coming up
        </h2>
        {upcoming.length === 0 ? (
          <Card tone="sunken" className="mt-3">
            <CardBody className="pt-5">
              <p className="text-base text-ink">Nothing in the calendar.</p>
              <p className="mt-1 text-base text-ink-muted">
                Appointments you add on the appointments page show up here for everyone.
              </p>
            </CardBody>
          </Card>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcoming.map((appointment) => (
              <li key={appointment.id}>
                <Card tone="sunken">
                  <CardBody className="py-4">
                    <p className="text-base text-ink">{appointment.title}</p>
                    <p className="mt-0.5 text-sm text-ink-faint">
                      {formatDay(appointment.dueAt!)}
                      {appointment.who ? ` · ${appointment.who}` : ""}
                      {appointment.location ? ` · ${appointment.location}` : ""}
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
          Who is here
        </h2>
        <ul className="mt-3 space-y-2">
          {data.members.map((member) => (
            <li key={member.userId}>
              <Card tone="sunken">
                <CardBody className="py-4">
                  <p className="text-base text-ink">
                    {member.isYou ? "You" : who(member)}
                    <span className="text-ink-faint"> · {member.role}</span>
                  </p>
                  {member.isYou && member.name ? (
                    <p className="mt-0.5 text-sm text-ink-faint">{member.email}</p>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink-faint">
          Notes, mood answers and anything you have not shared stay with the person who wrote them.{" "}
          <Link
            href="/settings"
            className="underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Invite someone
          </Link>
        </p>
      </section>
    </div>
  );
}

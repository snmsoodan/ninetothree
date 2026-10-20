"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { appointmentsFor, buildIcs, type DatedAppointment } from "@ninetothree/content";
import { Button, Card, CardBody } from "@ninetothree/ui";
import { AppShell } from "@/components/AppShell";
import { ScheduleList, type ScheduleItem } from "@/components/ScheduleList";
import {
  addAppointment,
  removeAppointment,
  updateAppointment,
  useAppState,
  useHydrated,
} from "@/lib/store";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function stamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

interface Draft {
  id?: string;
  label: string;
  date: string;
  who: string;
  note: string;
}

const EMPTY_DRAFT: Draft = { label: "", date: "", who: "", note: "" };

export default function AppointmentsPage() {
  const router = useRouter();
  const state = useAppState();
  const hydrated = useHydrated();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [today] = useState(todayIso);

  useEffect(() => {
    if (hydrated && !state.onboarded) router.replace("/onboarding");
  }, [hydrated, state.onboarded, router]);

  const generated = useMemo<DatedAppointment[]>(() => {
    if (!state.dueDate) return [];
    return appointmentsFor({
      dueDate: state.dueDate,
      today,
      firstBaby: state.profile.firstBaby ?? true,
    });
  }, [state.dueDate, state.profile.firstBaby, today]);

  const items = useMemo<ScheduleItem[]>(() => {
    const own: ScheduleItem[] = state.appointments.map((appointment) => ({
      id: appointment.id,
      label: appointment.label,
      from: appointment.date,
      to: appointment.date,
      ...(appointment.who ? { who: appointment.who } : {}),
      ...(appointment.note ? { note: appointment.note } : {}),
      status: appointment.date < today ? "past" : appointment.date === today ? "now" : "upcoming",
      own: true,
    }));
    return [...generated, ...own].sort((a, b) => a.from.localeCompare(b.from));
  }, [generated, state.appointments, today]);

  const coming = items.filter((item) => item.status !== "past");
  const past = items.filter((item) => item.status === "past").reverse();

  function download() {
    const ics = buildIcs(coming, stamp());
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nine-to-three-appointments.ics";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function save() {
    if (!draft || draft.label.trim() === "" || draft.date === "") return;
    const payload = {
      label: draft.label.trim(),
      date: draft.date,
      ...(draft.who.trim() ? { who: draft.who.trim() } : {}),
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    };
    if (draft.id) updateAppointment(draft.id, payload);
    else addAppointment(payload);
    setDraft(null);
  }

  function edit(id: string) {
    const appointment = state.appointments.find((candidate) => candidate.id === id);
    if (!appointment) return;
    setDraft({
      id: appointment.id,
      label: appointment.label,
      date: appointment.date,
      who: appointment.who ?? "",
      note: appointment.note ?? "",
    });
  }

  return (
    <AppShell stage="Appointments">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">Appointments</h1>
        <p className="mt-2 text-base text-ink-muted">
          Worked out from your due date, so you are not counting weeks in your head. Add your own
          and they sit in the same list.
        </p>

        {state.dueDate ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={download} disabled={coming.length === 0}>
              Add to calendar
            </Button>
            <span className="text-sm text-ink-faint">
              A calendar file with the {coming.length} still to come.
            </span>
          </div>
        ) : null}

        <section aria-labelledby="coming-heading" className="mt-8">
          <h2 id="coming-heading" className="font-display text-2xl text-ink">
            Coming up
          </h2>
          <ScheduleList
            items={coming}
            emptyCopy="Nothing left on the schedule. If something comes up, add it here."
            onEdit={edit}
            onDelete={removeAppointment}
          />
        </section>

        <section aria-labelledby="own-heading" className="mt-10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="own-heading" className="font-display text-2xl text-ink">
              Add your own
            </h2>
            {draft ? null : (
              <button
                type="button"
                onClick={() => setDraft({ ...EMPTY_DRAFT, date: today })}
                className="rounded-sm px-2 py-1 text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
              >
                Add an appointment
              </button>
            )}
          </div>

          {draft ? (
            <Card className="mt-3">
              <CardBody className="pt-5">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    save();
                  }}
                >
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="appt-label" className="block text-sm text-ink-muted">
                        What is it
                      </label>
                      <input
                        id="appt-label"
                        value={draft.label}
                        onChange={(event) => setDraft({ ...draft, label: event.target.value })}
                        className="mt-1 w-full rounded-sm border border-line-strong bg-paper px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      />
                    </div>
                    <div>
                      <label htmlFor="appt-date" className="block text-sm text-ink-muted">
                        When
                      </label>
                      <input
                        id="appt-date"
                        type="date"
                        value={draft.date}
                        onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                        className="mt-1 w-full rounded-sm border border-line-strong bg-paper px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      />
                    </div>
                    <div>
                      <label htmlFor="appt-who" className="block text-sm text-ink-muted">
                        Who with, if you know
                      </label>
                      <input
                        id="appt-who"
                        value={draft.who}
                        onChange={(event) => setDraft({ ...draft, who: event.target.value })}
                        className="mt-1 w-full rounded-sm border border-line-strong bg-paper px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      />
                    </div>
                    <div>
                      <label htmlFor="appt-note" className="block text-sm text-ink-muted">
                        Anything to remember
                      </label>
                      <input
                        id="appt-note"
                        value={draft.note}
                        onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                        className="mt-1 w-full rounded-sm border border-line-strong bg-paper px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={draft.label.trim() === "" || draft.date === ""}>
                      {draft.id ? "Save" : "Add it"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDraft(null)}
                      className="rounded-sm px-2 py-1 text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </CardBody>
            </Card>
          ) : state.appointments.length === 0 ? (
            <Card tone="sunken" className="mt-3">
              <CardBody className="pt-5">
                <p className="text-base text-ink-muted">
                  Nothing of your own yet. A scan you booked, a class, a pediatrician visit — they
                  all go here.
                </p>
              </CardBody>
            </Card>
          ) : null}
        </section>

        {past.length > 0 ? (
          <section aria-labelledby="past-heading" className="mt-10">
            <h2 id="past-heading" className="font-display text-2xl text-ink">
              Already past
            </h2>
            <p className="mt-1 text-sm text-ink-faint">
              Kept so you can see what you have already done.
            </p>
            <ScheduleList items={past} emptyCopy="" onEdit={edit} onDelete={removeAppointment} />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildIcs } from "@ninetothree/content";
import {
  APPOINTMENTS_ADD,
  APPOINTMENTS_CALENDAR,
  APPOINTMENTS_CANCEL,
  APPOINTMENTS_COMING,
  APPOINTMENTS_CREATE,
  APPOINTMENTS_DATE,
  APPOINTMENTS_EMPTY_COMING,
  APPOINTMENTS_EMPTY_OWN,
  APPOINTMENTS_HEADING,
  APPOINTMENTS_ICS_FILENAME,
  APPOINTMENTS_INTRO,
  APPOINTMENTS_LABEL,
  APPOINTMENTS_NOTE,
  APPOINTMENTS_OWN,
  APPOINTMENTS_PAST,
  APPOINTMENTS_PAST_INTRO,
  APPOINTMENTS_SAVE,
  APPOINTMENTS_WHO,
  calendarLine,
  icsStamp,
  scheduleItems,
  splitSchedule,
} from "@ninetothree/domain";
import { Button, Card, CardBody } from "@ninetothree/ui";
import { AppShell } from "@/components/AppShell";
import { ScheduleList } from "@/components/ScheduleList";
import { localDate } from "@/lib/reminders";
import {
  addAppointment,
  removeAppointment,
  updateAppointment,
  useAppState,
  useHydrated,
} from "@/lib/store";

function todayIso(): string {
  return localDate(new Date());
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

  const items = useMemo(() => scheduleItems(state, today), [state, today]);
  const { coming, past } = splitSchedule(items);

  function download() {
    const ics = buildIcs(coming, icsStamp(new Date()));
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = APPOINTMENTS_ICS_FILENAME;
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
        <h1 className="font-display text-3xl text-ink">{APPOINTMENTS_HEADING}</h1>
        <p className="mt-2 text-base text-ink-muted">{APPOINTMENTS_INTRO}</p>

        {state.dueDate ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={download} disabled={coming.length === 0}>
              {APPOINTMENTS_CALENDAR}
            </Button>
            <span className="text-sm text-ink-faint">{calendarLine(coming.length)}</span>
          </div>
        ) : null}

        <section aria-labelledby="coming-heading" className="mt-8">
          <h2 id="coming-heading" className="font-display text-2xl text-ink">
            {APPOINTMENTS_COMING}
          </h2>
          <ScheduleList
            items={coming}
            emptyCopy={APPOINTMENTS_EMPTY_COMING}
            onEdit={edit}
            onDelete={removeAppointment}
          />
        </section>

        <section aria-labelledby="own-heading" className="mt-10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="own-heading" className="font-display text-2xl text-ink">
              {APPOINTMENTS_OWN}
            </h2>
            {draft ? null : (
              <button
                type="button"
                onClick={() => setDraft({ ...EMPTY_DRAFT, date: today })}
                className="rounded-sm px-2 py-1 text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
              >
                {APPOINTMENTS_ADD}
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
                        {APPOINTMENTS_LABEL}
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
                        {APPOINTMENTS_DATE}
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
                        {APPOINTMENTS_WHO}
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
                        {APPOINTMENTS_NOTE}
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
                      {draft.id ? APPOINTMENTS_SAVE : APPOINTMENTS_CREATE}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDraft(null)}
                      className="rounded-sm px-2 py-1 text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                    >
                      {APPOINTMENTS_CANCEL}
                    </button>
                  </div>
                </form>
              </CardBody>
            </Card>
          ) : state.appointments.length === 0 ? (
            <Card tone="sunken" className="mt-3">
              <CardBody className="pt-5">
                <p className="text-base text-ink-muted">{APPOINTMENTS_EMPTY_OWN}</p>
              </CardBody>
            </Card>
          ) : null}
        </section>

        {past.length > 0 ? (
          <section aria-labelledby="past-heading" className="mt-10">
            <h2 id="past-heading" className="font-display text-2xl text-ink">
              {APPOINTMENTS_PAST}
            </h2>
            <p className="mt-1 text-sm text-ink-faint">{APPOINTMENTS_PAST_INTRO}</p>
            <ScheduleList items={past} emptyCopy="" onEdit={edit} onDelete={removeAppointment} />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RECALLS } from "@ninetothree/content";
import { getPack } from "@ninetothree/content/registry";
import { lensFor } from "@ninetothree/content/core";
import { ACTION_INDEX } from "@ninetothree/content/action-index";
import { PACK_INDEX, findPackAtOrBefore, nextPackIndex } from "@ninetothree/content/pack-index";
import { computeStage, stageLabel } from "@ninetothree/rules";
import { AppShell } from "@/components/AppShell";
import { AppointmentList } from "@/components/AppointmentList";
import { PinList, type PinItem } from "@/components/PinList";
import { RecallList } from "@/components/RecallList";
import { ReminderCard } from "@/components/ReminderCard";
import { ProgressLine } from "@/components/ProgressLine";
import { ShareCard } from "@/components/ShareCard";
import { WeekSummaryCard } from "@/components/WeekSummaryCard";
import { PersonaLensCard } from "@/components/PersonaLensCard";
import { QuietWeek } from "@/components/QuietWeek";
import { datedAppointments } from "@/lib/appointments";
import { useHousehold } from "@/lib/household";
import { TogetherCard } from "@/components/TogetherCard";
import { YourJobsCard } from "@/components/YourJobsCard";
import { resolvePins } from "@/lib/pins";
import { dueReminders, localDate, reminderKey, unseen } from "@/lib/reminders";
import { syncNotices } from "@/lib/recalls";
import {
  dismissNotice,
  markReminded,
  removePin,
  setPinReminder,
  stageInput,
  useAppState,
  useHydrated,
  visibleNotices,
} from "@/lib/store";
import { weekProgress } from "@/lib/week";

/**
 * The dashboard, which lives at `/today`.
 *
 * `/` is a signpost in front of this, not this page itself. That split is the
 * whole point: while `/` *was* the dashboard, a first visit had to download the
 * dashboard's JavaScript before the redirect to onboarding could even run, and
 * the two chunk waterfalls in series cost 5.3 seconds before the first question
 * painted. A signpost ships almost nothing, so the redirect is immediate.
 */
export function Dashboard() {
  const state = useAppState();
  const ready = useHydrated();
  const router = useRouter();
  const input = stageInput(state);
  const [now] = useState(() => new Date());

  useEffect(() => {
    if (ready && !state.onboarded) router.replace("/onboarding");
  }, [ready, state.onboarded, router]);

  const { household, share } = useHousehold();
  const sharedIds = useMemo(() => household?.sharedItemIds ?? [], [household]);
  const people = household?.members.length ?? 0;
  const jobsForYou = useMemo(() => household?.jobsForYou ?? [], [household]);
  const together = people > 1;

  const pins = useMemo<PinItem[]>(
    () =>
      resolvePins(state.pins, ACTION_INDEX).map((pin) => ({
        ...pin,
        shared: sharedIds.includes(pin.id),
      })),
    [state.pins, sharedIds],
  );
  const notices = useMemo(() => visibleNotices(state), [state]);

  // Reminders are about a date, so they are computed from the local calendar
  // rather than from the stage. A parent whose visit is tomorrow should see it
  // whatever week the guide thinks they are in.
  const reminders = useMemo(() => {
    const due = dueReminders(
      { appointments: datedAppointments(state, localDate(now)), pins: state.pins },
      now,
    );
    return {
      today: unseen(due.today, state.reminded),
      tomorrow: unseen(due.tomorrow, state.reminded),
    };
  }, [state, now]);

  // The queue is filled on the dashboard, not on a timer: a recall is
  // something a parent looks at, not something that interrupts them.
  useEffect(() => {
    if (ready) syncNotices(state, RECALLS);
  }, [ready, state]);

  const { weeksDone, actionsDone } = useMemo(() => {
    const settled = new Set(
      Object.entries(state.progress)
        .filter(([, entry]) => entry.status === "done" || entry.status === "skipped")
        .map(([id]) => id),
    );
    const weeks = PACK_INDEX.filter(
      (pack) => pack.coreActionIds.length > 0 && pack.coreActionIds.every((id) => settled.has(id)),
    ).length;
    return { weeksDone: weeks, actionsDone: settled.size };
  }, [state.progress]);

  if (!ready || !input) {
    return (
      <AppShell>
        <p className="text-base text-ink-muted">One moment.</p>
      </AppShell>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const stage = computeStage(input, today);
  const pack = findPackAtOrBefore(stage.kind, stage.index);
  const label = stageLabel(stage);

  if (!pack) {
    return (
      <AppShell stage={label}>
        <h1 className="font-display text-3xl text-ink">Nothing for this week yet</h1>
        <p className="mt-2 text-base text-ink-muted">
          We are still writing this one. Your last guide is still on your shelf.
        </p>
      </AppShell>
    );
  }

  const progress = weekProgress(pack, state);
  const ahead = nextPackIndex(pack);
  const quiet = state.profile.loss !== undefined;

  // The lens needs the pack's prose, which the index deliberately does not
  // carry. A loss has no light line and no cheerful lens: the quiet week
  // stands in for every reader.
  const full = getPack(pack.id);
  const lens = full ? lensFor(full, state.persona, { enabled: state.humour && !quiet }) : null;

  return (
    <AppShell stage={label}>
      <div className="space-y-10">
        <ReminderCard
          today={reminders.today}
          tomorrow={reminders.tomorrow}
          onDismiss={(items) => markReminded(items.map(reminderKey))}
        />
        {quiet ? (
          <QuietWeek />
        ) : state.persona === "parent" ? (
          <WeekSummaryCard
            pack={pack}
            progress={progress}
            stage={label}
            href={`/week/${pack.id}`}
            nextHref={ahead ? `/week/${ahead.id}` : undefined}
          />
        ) : lens ? (
          <PersonaLensCard
            lens={lens}
            packId={pack.id}
            packTitle={pack.title}
            today={today}
            href={`/week/${pack.id}`}
          />
        ) : null}
        <RecallList notices={notices} recalls={RECALLS} onDismiss={dismissNotice} />
        <PinList
          pins={pins}
          onUnpin={removePin}
          onRemind={setPinReminder}
          onShare={
            together
              ? (id, shared) => {
                  const pin = pins.find((candidate) => candidate.id === id);
                  if (pin) void share(pin, shared);
                }
              : undefined
          }
        />
        <YourJobsCard jobs={jobsForYou} />
        {together ? <TogetherCard people={people} /> : null}
        <AppointmentList appointments={pack.appointments} unit={pack.stageUnit} />
        <ShareCard stage={label} />
        <ProgressLine weeksDone={weeksDone} actionsDone={actionsDone} />
      </div>
    </AppShell>
  );
}

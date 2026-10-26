"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PACKS, RECALLS, findPackForStage, nextPack } from "@ninetothree/content";
import { computeStage, stageLabel } from "@ninetothree/rules";
import { AppShell } from "@/components/AppShell";
import { AppointmentList } from "@/components/AppointmentList";
import { PinList, type PinItem } from "@/components/PinList";
import { RecallList } from "@/components/RecallList";
import { ReminderCard } from "@/components/ReminderCard";
import { ProgressLine } from "@/components/ProgressLine";
import { ShareCard } from "@/components/ShareCard";
import { WeekSummaryCard } from "@/components/WeekSummaryCard";
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

export default function DashboardPage() {
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
      resolvePins(state.pins, PACKS).map((pin) => ({
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
    const weeks = PACKS.filter(
      (pack) => pack.coreActions.length > 0 && pack.coreActions.every((a) => settled.has(a.id)),
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

  const stage = computeStage(input, new Date().toISOString().slice(0, 10));
  const pack = findPackForStage(PACKS, stage.kind, stage.index);
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
  const ahead = nextPack(PACKS, pack);
  const quiet = state.profile.loss !== undefined;

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
        ) : (
          <WeekSummaryCard
            pack={pack}
            progress={progress}
            stage={label}
            href={`/week/${pack.id}`}
            nextHref={ahead ? `/week/${ahead.id}` : undefined}
          />
        )}
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

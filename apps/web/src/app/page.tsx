"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { PACKS, findPackForStage, nextPack } from "@ninetothree/content";
import { computeStage, stageLabel } from "@ninetothree/rules";
import { AppShell } from "@/components/AppShell";
import { AppointmentList } from "@/components/AppointmentList";
import { PinList, type PinItem } from "@/components/PinList";
import { ProgressLine } from "@/components/ProgressLine";
import { ShareCard } from "@/components/ShareCard";
import { WeekSummaryCard } from "@/components/WeekSummaryCard";
import { QuietWeek } from "@/components/QuietWeek";
import { resolvePins } from "@/lib/pins";
import { removePin, stageInput, useAppState, useHydrated } from "@/lib/store";
import { weekProgress } from "@/lib/week";

export default function DashboardPage() {
  const state = useAppState();
  const ready = useHydrated();
  const router = useRouter();
  const input = stageInput(state);

  useEffect(() => {
    if (ready && !state.onboarded) router.replace("/onboarding");
  }, [ready, state.onboarded, router]);

  const pins = useMemo<PinItem[]>(() => resolvePins(state.pins, PACKS), [state.pins]);

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
        <PinList pins={pins} onUnpin={removePin} />
        <AppointmentList appointments={pack.appointments} unit={pack.stageUnit} />
        <ShareCard stage={label} />
        <ProgressLine weeksDone={weeksDone} actionsDone={actionsDone} />
      </div>
    </AppShell>
  );
}

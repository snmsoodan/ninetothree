"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PACKS, findPackForStage, nextPack, previousPack } from "@ninetothree/content";
import { computeStage } from "@ninetothree/rules";
import { stageInput, useAppState, useHydrated } from "@/lib/store";
import { WeekView } from "@/components/WeekView";

export default function CurrentWeekPage() {
  const state = useAppState();
  const ready = useHydrated();
  const router = useRouter();
  const input = stageInput(state);

  useEffect(() => {
    if (ready && !state.onboarded) router.replace("/onboarding");
  }, [ready, state.onboarded, router]);

  if (!input) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <p className="text-base text-ink-muted">Setting up your week.</p>
      </main>
    );
  }

  const stage = computeStage(input, new Date().toISOString().slice(0, 10));
  const pack = findPackForStage(PACKS, stage.kind, stage.index);

  if (!pack) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="font-display text-2xl text-ink">Nothing for this week yet</h1>
        <p className="mt-2 text-base text-ink-muted">
          We are still writing this one. Your last guide is still on your shelf.
        </p>
      </main>
    );
  }

  return (
    <WeekView
      pack={pack}
      nextId={nextPack(PACKS, pack)?.id}
      previousId={previousPack(PACKS, pack)?.id}
    />
  );
}

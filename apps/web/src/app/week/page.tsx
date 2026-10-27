"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { findStageIndex } from "@ninetothree/content/stage-index";
import { computeStage } from "@ninetothree/rules";
import { stageInput, useAppState, useHydrated } from "@/lib/store";

/**
 * `/week` is a signpost, not a page.
 *
 * Which week it is lives in local storage, so this has to run on the client —
 * but the week itself is a static page. Redirecting means the parent lands on
 * a URL they can bookmark, share with a partner, and print, and this route
 * stops shipping the guide to render one week of it.
 */
export default function CurrentWeekPage() {
  const state = useAppState();
  const ready = useHydrated();
  const router = useRouter();
  const input = stageInput(state);

  const stage = input ? computeStage(input, new Date().toISOString().slice(0, 10)) : null;
  const pack = stage ? findStageIndex(stage.kind, stage.index) : undefined;

  useEffect(() => {
    if (!ready) return;
    if (!state.onboarded) {
      router.replace("/onboarding");
      return;
    }
    if (pack) router.replace(`/week/${pack.id}`);
  }, [ready, state.onboarded, pack, router]);

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-lg px-5 py-16">
      {ready && state.onboarded && !pack ? (
        <>
          <h1 className="font-display text-2xl text-ink">Nothing for this week yet</h1>
          <p className="mt-2 text-base text-ink-muted">
            We are still writing this one. Your last guide is still on your shelf.
          </p>
        </>
      ) : (
        <p className="text-base text-ink-muted">Setting up your week.</p>
      )}
    </main>
  );
}

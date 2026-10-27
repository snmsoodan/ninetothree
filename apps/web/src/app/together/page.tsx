"use client";

import { useMemo } from "react";
import { findPackAtOrBefore } from "@ninetothree/content/pack-index";
import { computeStage } from "@ninetothree/rules";
import { AppShell } from "@/components/AppShell";
import { PartnerView } from "@/components/PartnerView";
import { stageInput, useAppState } from "@/lib/store";

/**
 * The stage lives in localStorage, so the page reads it here and hands the id
 * to the API. The pack itself is looked up on the server, which keeps the
 * guide out of this route.
 */
export default function TogetherPage() {
  const state = useAppState();
  const input = stageInput(state);

  const stageId = useMemo(() => {
    if (!input) return undefined;
    const stage = computeStage(input, new Date().toISOString().slice(0, 10));
    return findPackAtOrBefore(stage.kind, stage.index)?.id;
  }, [input]);

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-ink">Together</h1>
      <p className="mt-2 text-base text-ink-muted">
        What this week asks of the people around you, and the things you have chosen to share.
      </p>
      <div className="mt-6">
        <PartnerView stageId={stageId} />
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ACTION_INDEX } from "@ninetothree/content/action-index";
import { PACK_INDEX } from "@ninetothree/content/pack-index";
import { AppShell } from "@/components/AppShell";
import { ExportButtons } from "@/components/ExportButtons";
import { HistoryList } from "@/components/HistoryList";
import { buildHistory, historyLine } from "@ninetothree/domain";
import { useAppState, useHydrated } from "@/lib/store";

export default function HistoryPage() {
  const state = useAppState();
  const hydrated = useHydrated();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.onboarded) router.replace("/onboarding");
  }, [hydrated, state.onboarded, router]);

  const history = useMemo(() => buildHistory(state, ACTION_INDEX, PACK_INDEX), [state]);

  if (!hydrated || !state.onboarded) return null;

  const weeks = history.weeks.length;

  return (
    <AppShell stage="History">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">Your history</h1>
        <p className="mt-2 text-base text-ink-muted">{historyLine(history.total, weeks)}</p>

        <div className="mt-4">
          <ExportButtons state={state} history={history} />
        </div>

        <div className="mt-8">
          <HistoryList history={history} />
        </div>

        {history.pins.length > 0 ? (
          <section aria-labelledby="history-pins-heading" className="mt-10">
            <h2 id="history-pins-heading" className="font-display text-2xl text-ink">
              Pinned
            </h2>
            <ul className="mt-3 space-y-1">
              {history.pins.map((pin) => (
                <li key={pin.id} className="text-base text-ink-muted">
                  {pin.title}
                  {pin.packTitle ? (
                    <span className="text-ink-faint"> — {pin.packTitle}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

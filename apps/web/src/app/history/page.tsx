"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PACKS } from "@ninetothree/content/registry";
import { AppShell } from "@/components/AppShell";
import { ExportButtons } from "@/components/ExportButtons";
import { HistoryList } from "@/components/HistoryList";
import { buildHistory } from "@/lib/history";
import { useAppState, useHydrated } from "@/lib/store";

export default function HistoryPage() {
  const state = useAppState();
  const hydrated = useHydrated();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.onboarded) router.replace("/onboarding");
  }, [hydrated, state.onboarded, router]);

  const history = useMemo(() => buildHistory(state, PACKS), [state]);

  if (!hydrated || !state.onboarded) return null;

  const weeks = history.weeks.length;

  return (
    <AppShell stage="History">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">Your history</h1>
        <p className="mt-2 text-base text-ink-muted">
          {history.total === 0
            ? "Nothing recorded yet. This fills in as you go."
            : `${history.total} step${history.total === 1 ? "" : "s"} across ${weeks} week${
                weeks === 1 ? "" : "s"
              }. Nothing here expires.`}
        </p>

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

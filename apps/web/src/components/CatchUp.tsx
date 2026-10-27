"use client";

import Link from "next/link";
import { useState } from "react";
import type { CatchUpItem } from "@ninetothree/rules";
import { Button } from "@ninetothree/ui";
import { markDone } from "@/lib/store";

export interface CatchUpProps {
  items: CatchUpItem[];
  /** "Week 30", "Month 2" — where the parent is now. */
  stageLabel: string;
}

/**
 * Catch-up, not backlog.
 *
 * A parent who joins late has not failed the weeks they missed. This is
 * one line and a disclosure, never a list of twenty-six things. It is
 * closed by default, because the week's own three things come first.
 */
export function CatchUp({ items, stageLabel }: CatchUpProps) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const count = items.length;

  return (
    <section aria-labelledby="catchup-heading" className="mt-8">
      <h2 id="catchup-heading" className="font-display text-2xl text-ink">
        Before this week
      </h2>
      <p className="mt-1 text-base text-ink-muted">
        You are on {stageLabel}. The last few weeks are still here if you want them — nothing
        expires.
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="catchup-list"
        className="mt-3 text-sm text-ink-muted underline decoration-line-strong underline-offset-2 hover:text-ink"
      >
        {open ? "Hide them" : `Show the ${count} thing${count === 1 ? "" : "s"}`}
      </button>

      {open ? (
        <ul id="catchup-list" className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.actionId} className="rounded-lg border border-line bg-paper-raised p-4">
              <p className="text-xs text-ink-faint">{item.stageLabel}</p>
              <h3 className="mt-1 font-display text-lg text-ink">{item.title}</h3>
              <p className="mt-1 text-base text-ink-muted">{item.why}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() =>
                    markDone({
                      id: item.actionId,
                      title: item.title,
                      packId: item.packId,
                      packTitle: item.packTitle,
                    })
                  }
                >
                  Done
                </Button>
                <Link
                  href={`/week/${item.packId}`}
                  className="text-sm text-ink-muted underline decoration-line-strong underline-offset-2 hover:text-ink"
                >
                  Open {item.stageLabel}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

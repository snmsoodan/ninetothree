"use client";

import { Button } from "@ninetothree/ui";
import { toCsv, toJson } from "@/lib/export";
import type { History } from "@/lib/history";
import type { AppState } from "@/lib/store";

export interface ExportButtonsProps {
  state: AppState;
  history: History;
  /** Injected in tests so the filename is deterministic. */
  today?: string;
}

function download(name: string, body: string, type: string): void {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Two buttons, no dialog, no "choose your format" step. A parent who wants
 * their history should get it in one tap, and the format is named in the
 * button rather than hidden behind a menu.
 */
export function ExportButtons({ state, history, today }: ExportButtonsProps) {
  const stamp = today ?? new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="quiet"
        onClick={() =>
          download(`ninetothree-history-${stamp}.json`, toJson(state, history), "application/json")
        }
      >
        Download JSON
      </Button>
      <Button
        variant="quiet"
        onClick={() =>
          download(`ninetothree-history-${stamp}.csv`, toCsv(state, history), "text/csv")
        }
      >
        Download CSV
      </Button>
    </div>
  );
}

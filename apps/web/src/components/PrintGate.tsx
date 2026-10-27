"use client";

import type { ReactNode } from "react";

import { useWeekGate } from "@/lib/week-gate";
import { Paywall } from "./Paywall";

export interface PrintGateProps {
  packId: string;
  /** The week's title, for the sentence that says which week this is. */
  title: string;
  /**
   * ISO date. Optional, and read on the client rather than passed from the
   * server: the sheet is statically generated, so a date baked in at build time
   * would compare every future visit against the day the site was built.
   */
  today?: string;
  /** The sheet itself. Rendered by a server component and passed through. */
  children: ReactNode;
}

/**
 * The print sheet, behind the same week rule as the week page.
 *
 * This is a client wrapper because the stage lives in `localStorage`, and the
 * sheet is a server component that must stay one — it is static, complete in
 * the first response, and prints identically with JavaScript off.
 *
 * **The honest limitation:** with JavaScript off there is no gate, because
 * there is no way to know which week the parent is in. The sheet prints. That
 * is a deliberate trade — a parent who has turned JavaScript off and wants the
 * week on paper is not the person to make an example of — and it is written
 * down in `EVIDENCE.md` rather than pretended away.
 */
export function PrintGate({ packId, title, today, children }: PrintGateProps) {
  const gated = useWeekGate(packId, today ?? new Date().toISOString().slice(0, 10));

  if (gated) {
    return (
      <Paywall
        title="This one is part of Plus."
        body={`${title} is not the week you are in.`}
        free="The week you are in prints free, and so does the hospital-bag checklist. Plus prints every week."
      />
    );
  }

  return <>{children}</>;
}

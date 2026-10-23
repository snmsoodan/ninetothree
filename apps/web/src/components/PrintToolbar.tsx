"use client";

import Link from "next/link";
import { Button } from "@ninetothree/ui";

export interface PrintToolbarProps {
  /** Where "Back" goes. Never a dead end. */
  backHref: string;
  backLabel: string;
}

/**
 * The only interactive thing on a print page, and it disappears on paper.
 * A parent who lands here on a phone gets one obvious action; a parent who
 * prints gets a clean sheet.
 */
export function PrintToolbar({ backHref, backLabel }: PrintToolbarProps) {
  return (
    <div className="no-print mb-6 flex flex-wrap items-center gap-3">
      <Button type="button" onClick={() => window.print()}>
        Print this page
      </Button>
      <Link
        href={backHref}
        className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        {backLabel}
      </Link>
    </div>
  );
}

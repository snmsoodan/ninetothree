import type { ReactNode } from "react";
import { POLICIES_EFFECTIVE } from "@ninetothree/content";

import { AppShell } from "./AppShell";

/**
 * The shell every policy page shares.
 *
 * These pages are read by someone who is worried, or annoyed, or looking for a
 * way out — so they are server-rendered, they work without JavaScript, and they
 * keep the app's navigation so a parent is never stranded on a page with no way
 * back to the week they were on.
 */
export interface PolicyPageProps {
  title: string;
  /** One sentence under the heading. What this page is for. */
  lede: string;
  children: ReactNode;
}

export function PolicyPage({ title, lede, children }: PolicyPageProps) {
  return (
    <AppShell stage="Policies">
      <article className="measure">
        <h1 className="font-display text-3xl text-ink">{title}</h1>
        <p className="mt-2 text-base text-ink-muted">{lede}</p>

        {/*
          Honest by construction. The alternative — publishing a policy and
          quietly hoping nobody reads the part where it claims to be
          lawyer-reviewed — is the failure mode this notice exists to prevent.
          It comes off in one commit, when it is true.
        */}
        <p className="mt-6 rounded-md border border-line-strong bg-paper-sunken px-4 py-3 text-sm text-ink-muted">
          <strong className="font-medium text-ink">This page is a draft.</strong> It describes what
          the software actually does today, and that part is accurate. It has not yet been reviewed
          by a lawyer, and it is not legal advice.
        </p>

        <div className="article-body mt-8">{children}</div>

        <p className="mt-10 text-sm text-ink-faint">In effect from {POLICIES_EFFECTIVE}.</p>
      </article>
    </AppShell>
  );
}

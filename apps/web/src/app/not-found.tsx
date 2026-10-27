import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/**
 * Every dead address lands here: a mistyped URL, an invite link an email client
 * cut in half, and the `notFound()` calls in `/week/[id]`, `/read/[slug]`,
 * `/choose/[actionId]` and the two print routes.
 *
 * Next's own 404 is a black sentence on white with no header, no tab bar and no
 * `main` landmark — for a parent who followed a link we sent, that reads as the
 * site being broken rather than the address being wrong. So the page keeps the
 * shell, says one plain thing, and offers the three doors that actually help.
 * It is a server component and asks for nothing, so it is safe signed out.
 */
export default function NotFound() {
  return (
    <AppShell>
      <h1 className="font-display text-3xl text-ink">This page is not here</h1>
      <p className="mt-2 text-ink-muted">
        Nothing is wrong with your account or the guide. The address just does not point at anything
        we have.
      </p>
      <p className="mt-4 text-ink-muted">
        If you followed a link from an email, check that the whole of it came through — mail apps
        sometimes stop at a line break.
      </p>

      <ul className="mt-8 space-y-3">
        <li>
          <Link
            href="/today"
            className="text-ink underline decoration-1 underline-offset-2 hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Go to this week
          </Link>
        </li>
        <li>
          <Link
            href="/search"
            className="text-ink underline decoration-1 underline-offset-2 hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Search the guide
          </Link>
        </li>
        <li>
          <Link
            href="/library"
            className="text-ink underline decoration-1 underline-offset-2 hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            The library
          </Link>
        </li>
      </ul>
    </AppShell>
  );
}

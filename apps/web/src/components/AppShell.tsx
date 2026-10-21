"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { RedFlag } from "@ninetothree/content";
import { cn } from "@ninetothree/ui";
import { HelpNow } from "./HelpNow";
import { OfflineNote } from "./OfflineNote";

const NAV = [
  // The week view is a detail page of "This week", so it keeps the tab lit.
  { href: "/", label: "This week", also: ["/week"] },
  { href: "/shelf", label: "Shelf", also: [] },
  { href: "/library", label: "Library", also: [] },
  { href: "/safety", label: "Safety", also: [] },
  { href: "/settings", label: "Settings", also: [] },
] as const;

export interface AppShellProps {
  children: ReactNode;
  /** Shown in the header. "Week 28", "Month 6". */
  stage?: string;
  /** The current week's warning signs, so the drawer can show them. */
  flags?: RedFlag[];
  /**
   * Set on the safety page and the triage tree. Offline, those two pages get
   * different words, because their content is the reason the note exists: the
   * phone numbers are always right and the list of warning signs may not be.
   */
  safetyContent?: boolean;
}

export function AppShell({ children, stage, flags, safetyContent = false }: AppShellProps) {
  const pathname = usePathname();

  // A soft settle, not a transition. Transform only — dimming the text
  // would drop the whole page below AA for the length of the fade, which
  // is a real cost to a low-vision parent, not a test artifact. The
  // duration tokens collapse to 0ms under prefers-reduced-motion, and
  // tokens.css removes the transform entirely for [data-settle] so the
  // settle cannot become a 4px flash.
  const [settling, setSettling] = useState(false);
  useEffect(() => {
    setSettling(true);
    const timer = setTimeout(() => setSettling(false), 160);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-paper">
      <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <Link
            href="/"
            className="font-display text-lg text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Nine to Three
          </Link>
          <div className="flex items-center gap-3">
            {/* The stage is repeated in the body of every page, so it is the
                first thing to go when the header runs out of room. */}
            {stage ? (
              <span className="hidden text-sm text-ink-muted tabular sm:inline">{stage}</span>
            ) : null}
            <HelpNow flags={flags} />
            <Link
              href="/search"
              className="text-sm text-ink-muted underline decoration-1 underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              Search
            </Link>
          </div>
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        data-settle=""
        className={cn(
          "mx-auto max-w-2xl px-5 pb-28 pt-6",
          "transition-transform duration-[var(--duration-base)] ease-[var(--ease-calm)]",
          settling ? "translate-y-1" : "translate-y-0",
        )}
      >
        <OfflineNote safety={safetyContent} />
        {children}
      </main>

      <nav
        aria-label="Main"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
      >
        <ul className="mx-auto flex max-w-2xl">
          {NAV.map((item) => {
            // "/" would prefix-match every route, so it is compared exactly.
            const active =
              pathname === item.href ||
              item.also.some((base) => pathname === base || pathname.startsWith(`${base}/`));
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 items-center justify-center border-t-2 px-1 text-center",
                    "text-xs leading-tight sm:text-sm",
                    "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-calm)]",
                    // The active tab is marked by position and weight, not
                    // colour alone — a shade difference is not a signal.
                    active
                      ? "border-clay font-medium text-ink"
                      : "border-transparent text-ink-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

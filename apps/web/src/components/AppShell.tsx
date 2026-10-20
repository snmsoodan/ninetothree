"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@ninetothree/ui";

const NAV = [
  { href: "/week", label: "This week" },
  { href: "/shelf", label: "Shelf" },
  { href: "/library", label: "Library" },
  { href: "/safety", label: "Safety" },
  { href: "/settings", label: "Settings" },
] as const;

export interface AppShellProps {
  children: ReactNode;
  /** Shown in the header. "Week 28", "Month 6". */
  stage?: string;
}

export function AppShell({ children, stage }: AppShellProps) {
  const pathname = usePathname();

  // A soft settle, not a transition. Transform only — dimming the text
  // would drop the whole page below AA for the length of the fade, which
  // is a real cost to a low-vision parent, not a test artifact. The
  // duration tokens collapse to 0ms under prefers-reduced-motion.
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
            href="/week"
            className="font-display text-lg text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Nine to Three
          </Link>
          {stage ? <span className="text-sm text-ink-muted tabular">{stage}</span> : null}
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className={cn(
          "mx-auto max-w-2xl px-5 pb-28 pt-6",
          "transition-transform duration-[var(--duration-base)] ease-[var(--ease-calm)]",
          settling ? "translate-y-1" : "translate-y-0",
        )}
      >
        {children}
      </main>

      <nav
        aria-label="Main"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
      >
        <ul className="mx-auto flex max-w-2xl">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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

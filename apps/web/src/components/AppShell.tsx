"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@ninetothree/ui";

const NAV = [
  { href: "/week", label: "This week" },
  { href: "/shelf", label: "Shelf" },
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

      <main id="main" className="mx-auto max-w-2xl px-5 pb-28 pt-6">
        {children}
      </main>

      <nav
        aria-label="Main"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-sm"
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
                    "flex h-16 items-center justify-center text-sm",
                    "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-calm)]",
                    active ? "text-ink" : "text-ink-muted hover:text-ink",
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

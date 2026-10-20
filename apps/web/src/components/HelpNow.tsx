"use client";

import { useState, type MouseEvent } from "react";
import { ESCALATION_COPY, type RedFlag } from "@ninetothree/content";
import { Dialog, cn } from "@ninetothree/ui";
import { HELP_NUMBERS } from "@/lib/help";
import { ButtonLink } from "./ButtonLink";

export interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The current week's flags, when the screen knows them. */
  flags?: RedFlag[];
}

/**
 * The numbers, without leaving the page.
 *
 * A parent who taps this is in a hurry, so the numbers come first and the
 * week's own warning signs come second. Nothing here is behind a sign-in,
 * and nothing here is personalized.
 */
export function HelpDialog({ open, onOpenChange, flags = [] }: HelpDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="If something is wrong"
      description="Call one of these. You will not be wasting anyone's time."
      footer={
        <>
          <ButtonLink href="/safety" variant="secondary">
            Every warning sign
          </ButtonLink>
          <ButtonLink href="/triage" variant="primary">
            Help me work out who to call
          </ButtonLink>
        </>
      }
    >
      <ul className="space-y-3">
        {HELP_NUMBERS.map(({ key, detail }) => {
          const copy = ESCALATION_COPY[key];
          return (
            <li key={key}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base font-medium text-ink">{copy.label}</span>
                {/* Every entry in HELP_NUMBERS is one of the five escalations
                    that has a number, so there is no fallback to write. */}
                <a
                  href={copy.href}
                  className="text-base text-ink tabular underline underline-offset-2"
                >
                  {copy.phone}
                </a>
              </div>
              <p className="mt-0.5 text-sm text-ink-muted">{detail}</p>
            </li>
          );
        })}
      </ul>

      {flags.length > 0 ? (
        <div className="mt-5 rounded-lg border border-red-wash bg-red-wash/60 p-4">
          <h3 className="font-display text-base text-ink">This week</h3>
          <ul className="mt-2 space-y-2">
            {flags.map((flag) => (
              <li key={flag.id} className="text-sm text-ink">
                {flag.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Dialog>
  );
}

/** The parts of a click that decide whether the parent meant the drawer. */
export interface ClickIntent {
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  button: number;
}

/**
 * True when the click should open the drawer rather than follow the link.
 *
 * A modified click is a request for the page — a new tab, a new window, a
 * middle click — and is left alone. Exported so the five ways a click can
 * be modified are each tested, rather than hidden inside a handler.
 */
export function isPlainClick(event: ClickIntent): boolean {
  return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0);
}

export interface HelpNowProps {
  /** The current week's flags, when the screen knows them. */
  flags?: RedFlag[];
  className?: string;
}

/**
 * The persistent way out, on every screen.
 *
 * It is a real link to the safety page, so it works with JavaScript off, in
 * a new tab, and with the back button. When JavaScript is on, a plain click
 * opens the drawer instead of navigating — the numbers without losing the
 * page you were reading. A modified click (new tab, new window) is left
 * alone, because the parent asked for the page, not the drawer.
 */
export function HelpNow({ flags, className }: HelpNowProps) {
  const [open, setOpen] = useState(false);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    setOpen(true);
  }

  return (
    <>
      <a
        href="/safety"
        onClick={handleClick}
        className={cn(
          "rounded-md border border-line-strong px-2.5 py-1 text-sm font-medium text-ink",
          "hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
          className,
        )}
      >
        Get help now
      </a>
      <HelpDialog open={open} onOpenChange={setOpen} flags={flags} />
    </>
  );
}

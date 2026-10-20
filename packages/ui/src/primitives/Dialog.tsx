"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, type ReactNode } from "react";
import { cn } from "../cn";

/**
 * Radix hides the background from assistive tech with aria-hidden, but leaves
 * it focusable. `inert` does both, so the skip link and the page behind a modal
 * cannot be tabbed into. The dialog itself is portaled to <body>, outside the
 * inert subtree.
 */
let openDialogs = 0;

function useInertBackground(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const root = document.getElementById("app-root");
    if (!root) return;
    openDialogs += 1;
    root.setAttribute("inert", "");
    return () => {
      openDialogs -= 1;
      if (openDialogs === 0) root.removeAttribute("inert");
    };
  }, [open]);
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** One sentence. If it needs two, the dialog is doing too much. */
  description?: string;
  children?: ReactNode;
  /** The actions. Always include a way out that is not "confirm". */
  footer?: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  useInertBackground(open);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2",
            // A dialog taller than the screen must scroll, or its confirm button
            // ends up off-screen and unreachable on a phone in landscape.
            "max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain",
            "rounded-xl border border-line bg-paper-raised p-6 shadow-lg",
            "focus:outline-none",
            className,
          )}
        >
          <DialogPrimitive.Title className="font-display text-xl text-ink">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-2 text-base text-ink-muted">
              {description}
            </DialogPrimitive.Description>
          ) : null}
          {children ? <div className="mt-4">{children}</div> : null}
          {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div> : null}
          <DialogPrimitive.Close
            aria-label="Close"
            className={cn(
              "absolute right-4 top-4 rounded-sm p-1 text-ink-faint",
              "hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

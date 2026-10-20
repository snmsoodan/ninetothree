"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { forwardRef } from "react";
import { cn } from "../cn";

export interface CheckboxProps extends Omit<CheckboxPrimitive.CheckboxProps, "asChild"> {
  label: string;
  /** A short line under the label. Use it for the "why", not for more instructions. */
  hint?: string;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { label, hint, className, id, ...props },
  ref,
) {
  const inputId = id ?? `cb-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const labelId = `${inputId}-label`;
  const hintId = `${inputId}-hint`;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <CheckboxPrimitive.Root
        ref={ref}
        id={inputId}
        // A <label for> does not name a role="checkbox" button in Chromium.
        aria-labelledby={labelId}
        aria-describedby={hint ? hintId : undefined}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm",
          "border border-line-strong bg-paper-raised",
          "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-calm)]",
          "data-[state=checked]:border-sage data-[state=checked]:bg-sage",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
          "disabled:opacity-45",
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="text-paper">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <div className="min-w-0">
        <label id={labelId} htmlFor={inputId} className="block cursor-pointer text-base text-ink">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="mt-0.5 text-sm text-ink-muted">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
});

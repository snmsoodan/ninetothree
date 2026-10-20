import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export type BadgeTone = "neutral" | "sage" | "clay" | "amber" | "red";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  neutral: "bg-paper-sunken text-ink-muted",
  sage: "bg-sage-wash text-sage",
  clay: "bg-clay-wash text-clay",
  amber: "bg-amber-wash text-amber",
  red: "bg-red-wash text-red",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

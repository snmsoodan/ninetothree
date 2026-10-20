import { cn } from "../cn";

export interface ProgressRingProps {
  /** 0–100. Clamped. */
  value: number;
  label: string;
  /** Pixel diameter. 56 is the size that sits beside a heading without shouting. */
  size?: number;
  className?: string;
}

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A ring, not a bar, because the week page has one number and a bar reads as a
 * scoreboard. There is no percentage in the middle: a number there turns a
 * week into a grade. A muted tick appears when the ring closes, which is the
 * only celebration the design system allows.
 */
export function ProgressRing({ value, label, size = 56, className }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" focusable="false">
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          strokeWidth="3"
          className="stroke-paper-sunken"
        />
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 20 20)"
          className="stroke-sage transition-[stroke-dashoffset] duration-[var(--duration-slow)] ease-[var(--ease-calm)] motion-reduce:transition-none"
        />
      </svg>
      {clamped === 100 ? (
        <svg
          viewBox="0 0 16 16"
          width={size * 0.32}
          height={size * 0.32}
          aria-hidden="true"
          focusable="false"
          className="absolute"
        >
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-sage"
          />
        </svg>
      ) : null}
    </div>
  );
}

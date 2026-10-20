import { cn } from "../cn";

export interface ProgressProps {
  /** 0–100. Clamped. */
  value: number;
  label: string;
  /** Hides the numeric readout. Use when the number would feel like a score. */
  hideValue?: boolean;
  className?: string;
}

export function Progress({ value, label, hideValue = false, className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink-muted">{label}</span>
        {hideValue ? null : <span className="text-sm tabular-nums text-ink-muted">{clamped}%</span>}
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-paper-sunken"
      >
        <div
          className="h-full rounded-full bg-sage transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-calm)]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

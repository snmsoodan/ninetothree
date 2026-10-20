import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../cn";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a full-width button. The default on mobile for the one action that matters. */
  block?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/90 active:bg-ink/80 border border-transparent",
  secondary:
    "bg-paper-raised text-ink border border-line-strong hover:bg-paper-sunken active:bg-paper-sunken",
  quiet:
    "bg-transparent text-ink-muted border border-transparent hover:bg-paper-sunken hover:text-ink",
  danger: "bg-red text-paper hover:bg-red/90 active:bg-red/80 border border-transparent",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-base gap-2",
  lg: "h-13 px-6 text-lg gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block = false, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-colors duration-[var(--duration-base)] ease-[var(--ease-calm)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
        "disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...props}
    />
  );
});

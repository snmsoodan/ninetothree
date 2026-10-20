import type { AnchorHTMLAttributes, ElementType } from "react";
import { cn } from "../cn";
import type { ButtonSize, ButtonVariant } from "./Button";

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  /**
   * The element to render. Defaults to a plain anchor, which is a full page
   * load. An app that has a client-side router should pass its own link
   * component so a tap does not reload the page.
   */
  as?: ElementType;
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
  sm: "min-h-9 px-3 text-sm gap-1.5",
  md: "min-h-11 px-4 text-base gap-2",
  lg: "min-h-13 px-6 text-lg gap-2",
};

/**
 * A link that looks like a button. Use this instead of wrapping <Button> in
 * <Link> — nesting a button inside an anchor is invalid and leaves the anchor
 * with a hit area smaller than the button it contains.
 */
export function ButtonLink({
  variant = "primary",
  size = "md",
  block = false,
  as: Component = "a",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Component
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-colors duration-[var(--duration-base)] ease-[var(--ease-calm)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

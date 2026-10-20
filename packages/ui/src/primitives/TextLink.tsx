import type { AnchorHTMLAttributes } from "react";
import { cn } from "../cn";

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** External links always open in a new tab and say so to screen readers. */
  external?: boolean;
}

export function TextLink({ external = false, className, children, ...props }: TextLinkProps) {
  return (
    <a
      className={cn(
        "text-ink underline decoration-line-strong decoration-1 underline-offset-[3px]",
        "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-calm)]",
        "hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay",
        className,
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}

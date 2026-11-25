import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Raised cards sit on the paper. Sunken cards hold secondary content. */
  tone?: "raised" | "sunken" | "plain";
}

const tones = {
  raised: "bg-paper-raised border border-line shadow-sm",
  sunken: "bg-paper-sunken border border-transparent",
  plain: "bg-transparent border border-line",
} as const;

export function Card({ tone = "raised", className, ...props }: CardProps) {
  // `data-surface` is the hook Windows High Contrast Mode uses to give a
  // sunken card a border, because it throws the background colour away.
  return <div data-surface="" className={cn("rounded-lg", tones[tone], className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pt-5 pb-3", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5 pt-1", className)} {...props} />;
}

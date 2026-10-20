import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * Storybook has no Next.js router, so `next/link` is aliased to a plain
 * anchor. Stories are about how a component looks and reads, not about
 * client-side navigation.
 */
export default function Link({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

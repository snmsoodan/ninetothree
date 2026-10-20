"use client";

import Link from "next/link";
import { ButtonLink as UiButtonLink, type ButtonLinkProps } from "@ninetothree/ui";

/**
 * The design system's button-shaped link, rendered with the app's router so a
 * tap is a client-side navigation. Without this, every "Next →" reloads the
 * page and the parent loses their place.
 */
export function ButtonLink(props: ButtonLinkProps) {
  return <UiButtonLink as={Link} {...props} />;
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Next.js does not move focus when it swaps a route. A screen reader user
 * clicks "Shelf" and hears nothing — the page changed underneath them and
 * their focus is still on a link that now points somewhere else.
 *
 * So on every route change after the first, focus the new page's heading.
 * The heading is the "you are here" signal; focusing the whole main region
 * makes a screen reader read the entire page again.
 */
export function useRouteFocus(): void {
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const main = document.getElementById("main");
    if (!main) return;

    const target = main.querySelector("h1") ?? main;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }, [pathname]);
}

"use client";

import { useEffect } from "react";
import { applyReading, readingBootstrapScript } from "@/lib/reading";
import { useAppState, useHydrated } from "@/lib/store";

/**
 * Puts the reading preferences on `<html>`.
 *
 * Two halves, and both are needed. The inline script runs during parse, before
 * the first paint, so a parent who needs high contrast never sees a frame of
 * the low-contrast page. The effect keeps the attributes in step when the
 * parent changes a setting, and it waits for hydration: before localStorage is
 * read the store reports the defaults, and applying those would strip the
 * attributes the script had just set.
 */
export function ReadingAttributes() {
  const { reading } = useAppState();
  const ready = useHydrated();

  useEffect(() => {
    if (!ready) return;
    applyReading(reading, document.documentElement);
  }, [ready, reading]);

  return <script dangerouslySetInnerHTML={{ __html: readingBootstrapScript() }} />;
}

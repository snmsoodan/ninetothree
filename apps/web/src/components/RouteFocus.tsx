"use client";

import { useRouteFocus } from "./useRouteFocus";

/**
 * Lives in the root layout, not in AppShell. AppShell remounts on every
 * navigation, which would reset the hook's "first render" guard and it
 * would never fire. The layout persists, so the guard works.
 */
export function RouteFocus() {
  useRouteFocus();
  return null;
}

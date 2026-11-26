/**
 * The store, reachable from any screen.
 *
 * A context rather than a module-level singleton because the shell creates it
 * after storage has been read: screens render only once it exists, so
 * `useAppStore()` throwing is a bug in the shell, not a state a screen should
 * handle.
 */
import { createContext, useContext, type ReactNode } from "react";
import type { Store } from "@ninetothree/domain";
import type { BufferedIO } from "./storage";

export interface AppStore {
  readonly store: Store;
  readonly io: BufferedIO;
}

const StoreContext = createContext<AppStore | null>(null);

export function StoreProvider({ value, children }: { value: AppStore; children: ReactNode }) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useAppStore() outside the boot gate");
  return value;
}

/**
 * The phone's end of the store's port.
 *
 * `@ninetothree/domain` expects a synchronous `load`, because that is what
 * localStorage is. AsyncStorage is not, and putting an `await` in front of
 * every screen would mean every action becoming a promise. So this adapter
 * reads everything the store can ask for once, at boot, into memory, and
 * writes behind the caller's back: a tap returns immediately and the bytes
 * land a moment later.
 *
 * The cost of that choice is stated rather than hidden: a write can be lost if
 * the process is killed within the same frame. It is bounded — the store writes
 * after every action, so the window is milliseconds — and it is the same trade
 * the web already makes, where localStorage throws and the app carries on in
 * memory.
 */
import { DRAFT_KEY, STORAGE_KEY, type StoreIO } from "@ninetothree/domain";

/** The flag that lets the shell decide between onboarding and Today without the state. */
export const ONBOARDED_KEY = "ninetothree.onboarded";

/** Every key the store can read, so hydration is one round trip rather than four. */
export const PRELOAD_KEYS = [STORAGE_KEY, DRAFT_KEY, ONBOARDED_KEY] as const;

/** The slice of `@react-native-async-storage/async-storage` this file uses. */
export interface AsyncKeyValue {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface BufferedIO {
  /** Hand this to `createStore`. Synchronous, as the store requires. */
  readonly io: StoreIO;
  /** Read every preloaded key. Call once, before creating the store. */
  hydrate(): Promise<void>;
  /** Resolve when every queued write has landed. Tests and `AppState` changes use it. */
  flush(): Promise<void>;
  /** How many writes have been issued. Evidence, and the boot log's one number. */
  writes(): number;
  /** True once `hydrate()` has finished, however it finished. */
  isHydrated(): boolean;
  /** The last write failure, if any. A full disk is worth telling the parent about; it is not fatal. */
  lastError(): unknown;
}

/**
 * Wrap an async key-value store in the synchronous port the state machine wants.
 *
 * Writes for the same key are chained rather than fired in parallel, so the
 * last value always wins and a slow device cannot reorder two saves of the
 * same key. Different keys proceed independently.
 */
export function bufferedIO(
  storage: AsyncKeyValue,
  keys: readonly string[] = PRELOAD_KEYS,
): BufferedIO {
  const cache = new Map<string, string | null>();
  const chains = new Map<string, Promise<void>>();
  let hydrated = false;
  let writeCount = 0;
  let lastError: unknown = null;

  function write(key: string, value: string | null): void {
    writeCount += 1;
    const previous = chains.get(key) ?? Promise.resolve();
    const next = previous
      .then(() => (value === null ? storage.removeItem(key) : storage.setItem(key, value)))
      .catch((error: unknown) => {
        // A failed write must not become an unhandled rejection, and it must not
        // stop the next write: the app stays usable on the in-memory copy.
        lastError = error;
      });
    chains.set(key, next);
  }

  const io: StoreIO = {
    load(key) {
      return cache.get(key) ?? null;
    },
    save(key, value) {
      cache.set(key, value);
      write(key, value);
    },
    remove(key) {
      cache.set(key, null);
      write(key, null);
    },
    onOnboarded(onboarded) {
      // The flag is the shell's, not the state machine's: it is a boolean the
      // phone can answer without parsing JSON, exactly like the web's cookie.
      if ((cache.get(ONBOARDED_KEY) === "1") === onboarded) return;
      io.save(ONBOARDED_KEY, onboarded ? "1" : "");
    },
  };

  return {
    io,
    async hydrate() {
      if (hydrated) return;
      await Promise.all(
        keys.map(async (key) => {
          try {
            cache.set(key, await storage.getItem(key));
          } catch (error: unknown) {
            // A blocked keychain or a corrupt database is a cold start, not a
            // crash: the parent sees onboarding again rather than a white screen.
            lastError = error;
            cache.set(key, null);
          }
        }),
      );
      hydrated = true;
    },
    async flush() {
      // Chains can grow while flushing, so settle repeatedly until quiet.
      let pending = [...chains.values()];
      while (pending.length > 0) {
        await Promise.all(pending);
        const now = [...chains.values()];
        pending = now.filter((chain) => !pending.includes(chain));
      }
    },
    writes: () => writeCount,
    isHydrated: () => hydrated,
    lastError: () => lastError,
  };
}

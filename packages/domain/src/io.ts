/**
 * The one thing this package cannot own: where the bytes live.
 *
 * Everything else in `@ninetothree/domain` is a pure function of `AppState`,
 * which is what lets the same state machine run on the web, on iOS and on
 * Android. The three platforms disagree about exactly one thing — what a
 * key-value store is called — so that is the only seam.
 *
 * The port is synchronous because the machine is: every action reads the
 * current state, computes the next one, and returns. An async port would turn
 * every tap into a promise and every selector into a loading state, and the
 * dashboard would flicker through "unknown" on each pin.
 */

export interface StoreIO {
  /** The stored JSON for `key`, or `null` when nothing has been written. */
  load(key: string): string | null;
  save(key: string, value: string): void;
  remove(key: string): void;
  /**
   * Called after every write of the state itself, so a platform that can
   * answer "has this parent onboarded?" without the state — a cookie on the
   * web, a flag in UserDefaults on iOS — stays in step with storage.
   *
   * Separate from `save` because the two fail independently: a browser with a
   * full localStorage still has room for a cookie, and a parent stranded on
   * the wrong front door because of that would be a bug, not a limitation.
   */
  onOnboarded?(onboarded: boolean): void;
}

/**
 * A store that forgets everything when the process does.
 *
 * This is the default, and it is what a server render and a unit test want:
 * the machine works, the actions apply, and nothing is written anywhere. A
 * native app that has not yet wired AsyncStorage gets the same graceful
 * degradation the web gets from a blocked localStorage — a working session
 * that does not survive a relaunch.
 */
export function memoryIO(seed: Record<string, string> = {}): StoreIO & {
  dump(): Record<string, string>;
} {
  const cells = new Map(Object.entries(seed));
  return {
    load(key) {
      return cells.get(key) ?? null;
    },
    save(key, value) {
      cells.set(key, value);
    },
    remove(key) {
      cells.delete(key);
    },
    dump() {
      return Object.fromEntries(cells);
    },
  };
}

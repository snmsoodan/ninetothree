/**
 * The boot gate: one function that decides where the app opens.
 *
 * The rule the issue states is "never a flash of onboarding", which is a
 * timing claim rather than a layout one: the store must have read storage
 * before the first frame, or a returning parent sees the welcome screen for a
 * frame and then Today. So the shell renders a splash until `bootScreen()`
 * answers, and the answer is computed from bytes, not from a default.
 */
import { createStore, type AppState, type Store } from "@ninetothree/domain";
import { bufferedIO, ONBOARDED_KEY, type AsyncKeyValue, type BufferedIO } from "./storage";

export interface Booted {
  readonly store: Store;
  readonly io: BufferedIO;
  /** Where the shell should land. `/today` for a returning parent. */
  readonly screen: "/today" | "/onboarding";
}

/**
 * Where a parent lands, given what storage said.
 *
 * The state's own `onboarded` flag wins when it exists, because a parent can
 * have finished onboarding on the web and arrived here with a linked account.
 * The flag is the fallback for the case where the JSON is unreadable but the
 * boolean survived — the one thing worth keeping when everything else is lost.
 */
export function bootScreen(state: AppState, flag: string | null): "/today" | "/onboarding" {
  if (state.onboarded) return "/today";
  return flag === "1" ? "/today" : "/onboarding";
}

/**
 * Read storage, build the store, and answer where to go.
 *
 * Two orderings matter here, and both are load-bearing. The adapter has to
 * finish reading before the store exists, because its `load` is synchronous.
 * And the store has to be told to hydrate eagerly: `createStore` fills itself
 * lazily, on `subscribe()`, which is right for a hook and wrong for a boot
 * gate — asking its snapshot before anyone has subscribed would answer
 * `onboarded: false` for a parent who finished onboarding a year ago. The web
 * never noticed because its first render reads a cookie instead.
 */
export async function bootStorage(storage: AsyncKeyValue): Promise<Booted> {
  const io = bufferedIO(storage);
  await io.hydrate();
  const store = createStore(io.io);
  store.hydrate();
  const flag = io.io.load(ONBOARDED_KEY);
  return { store, io, screen: bootScreen(store.getSnapshot(), flag) };
}

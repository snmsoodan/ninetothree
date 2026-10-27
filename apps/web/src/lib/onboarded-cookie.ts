/**
 * The one-bit cookie that lets `/` choose a door on the server.
 *
 * It lives in its own module, not in `store.ts`, because `store.ts` is the
 * whole local-first data layer: importing a constant from it from a server
 * component drags that entire module into the client bundle. `/` is a server
 * redirect and should ship nothing, so the constant has to be reachable
 * without the store.
 *
 * The value is `"1"` or `"0"` and nothing else: no id, no date, nothing that
 * identifies a parent. localStorage stays the source of truth; this is a
 * routing hint rebuilt from it on every write, so it cannot drift for longer
 * than one page load.
 */
export const ONBOARDED_COOKIE = "ntt_onboarded";

/** One year, which is longer than a parent's gap between visits. */
export const ONBOARDED_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

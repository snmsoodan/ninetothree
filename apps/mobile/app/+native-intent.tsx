/**
 * Every inbound URL passes through `parseIncomingUrl()`, so the phone refuses
 * a link it does not recognise instead of guessing a screen. Expo Router also
 * resolves the same paths directly; this is the belt for the links that arrive
 * as `ninetothree://` or through an unverified universal-link association.
 */
import { parseIncomingUrl } from "../src/routes";

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return parseIncomingUrl(path) ?? "/today";
}

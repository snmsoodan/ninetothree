import { findIndexedAction, type ActionIndexEntry } from "@ninetothree/content/action-index";
import type { Pin } from "./store";

export interface ResolvedPin {
  id: string;
  title: string;
  packId: string;
  packTitle: string;
  /**
   * True when the action is no longer in the registry and only the snapshot
   * remains. The pin is still shown — it is the parent's, not ours — but it
   * cannot link anywhere, and the shelf offers to remove it.
   */
  stale: boolean;
  /** ISO date, YYYY-MM-DD. Carried through so the row can show it. */
  remindOn?: string;
}

/**
 * Resolve stored pins against the current content.
 *
 * Live content wins when the action still exists, so a pin follows a corrected
 * title. The snapshot is the fallback, which is what makes a pin survive a
 * rename or a retirement. A legacy pin with no snapshot and no action is
 * dropped: there is nothing left to show.
 */
export function resolvePins(pins: Pin[], index: Record<string, ActionIndexEntry>): ResolvedPin[] {
  const resolved: ResolvedPin[] = [];
  for (const pin of pins) {
    const hit = findIndexedAction(pin.id, index);
    if (hit) {
      resolved.push({
        id: pin.id,
        title: hit.title,
        packId: hit.packId,
        packTitle: hit.packTitle,
        stale: false,
        ...(pin.remindOn ? { remindOn: pin.remindOn } : {}),
      });
    } else if (pin.title) {
      resolved.push({
        id: pin.id,
        title: pin.title,
        packId: pin.packId,
        packTitle: pin.packTitle,
        stale: true,
        ...(pin.remindOn ? { remindOn: pin.remindOn } : {}),
      });
    }
  }
  return resolved;
}

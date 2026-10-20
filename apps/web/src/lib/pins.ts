import { findAction, type StagePack } from "@ninetothree/content";
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
}

/**
 * Resolve stored pins against the current content.
 *
 * Live content wins when the action still exists, so a pin follows a corrected
 * title. The snapshot is the fallback, which is what makes a pin survive a
 * rename or a retirement. A legacy pin with no snapshot and no action is
 * dropped: there is nothing left to show.
 */
export function resolvePins(pins: Pin[], packs: StagePack[]): ResolvedPin[] {
  const resolved: ResolvedPin[] = [];
  for (const pin of pins) {
    const hit = findAction(packs, pin.id);
    if (hit) {
      resolved.push({
        id: pin.id,
        title: hit.action.title,
        packId: hit.pack.id,
        packTitle: hit.pack.title,
        stale: false,
      });
    } else if (pin.title) {
      resolved.push({
        id: pin.id,
        title: pin.title,
        packId: pin.packId,
        packTitle: pin.packTitle,
        stale: true,
      });
    }
  }
  return resolved;
}

import type { Action, StageKind, StagePack, StageUnit } from "@ninetothree/content";

/**
 * Catch-up, not backlog.
 *
 * A parent who joins at week 30 has not failed twenty-six weeks of
 * homework. Most of what they missed is either already done, already
 * decided, or no longer possible. So this looks back a short, fixed
 * distance — three stages — and returns at most five things that are
 * still worth doing. It never returns a list that grows with how late
 * the parent is.
 *
 * The window is deliberately small. A parent who joins at month six of
 * the baby's life does not need the first-trimester screening; they need
 * the two or three things from the last few months that still matter.
 */

export const CATCH_UP_WINDOW = 3;
export const CATCH_UP_LIMIT = 5;

/** The order stages run in. `event` packs are not part of the sequence. */
const KIND_ORDER: Record<StageKind, number> = {
  pregnancy: 0,
  postpartum: 1,
  infant: 2,
  toddler: 3,
  event: 4,
};

export interface CatchUpItem {
  action: Action;
  /** The pack the action came from, so the UI can say where it is from. */
  packId: string;
  packTitle: string;
  /** "Week 28", "Month 2" — the stage the action belongs to. */
  stageLabel: string;
}

export interface CatchUpResult {
  items: CatchUpItem[];
  /** How many earlier stages were actually looked at. */
  lookedBack: number;
  /** True when there is nothing to catch up on. */
  empty: boolean;
}

export interface CatchUpOptions {
  /** How many earlier stages to look at. Defaults to 3. */
  window?: number;
  /** The most items to return. Defaults to 5. */
  limit?: number;
}

const UNIT_LABEL: Record<StageUnit, string> = { week: "Week", month: "Month", day: "Day" };

function stageLabelFor(pack: StagePack): string {
  return `${UNIT_LABEL[pack.stageUnit]} ${pack.stageIndex}`;
}

function sequence(packs: readonly StagePack[]): StagePack[] {
  return packs
    .filter((pack) => pack.kind !== "event")
    .slice()
    .sort((a, b) => {
      const byKind = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
      return byKind !== 0 ? byKind : a.stageIndex - b.stageIndex;
    });
}

/**
 * The things from the last few stages that are still worth doing.
 *
 * Only `essential` and `recommended` actions qualify — an optional step
 * from three weeks ago is not a catch-up, it is noise. Anything already
 * done or deliberately skipped is left out, because a skip is a decision
 * and this product does not re-ask.
 */
export function catchUp(
  packs: readonly StagePack[],
  current: StagePack,
  doneIds: readonly string[],
  options: CatchUpOptions = {},
): CatchUpResult {
  const window = options.window ?? CATCH_UP_WINDOW;
  const limit = options.limit ?? CATCH_UP_LIMIT;

  const ordered = sequence(packs);
  const at = ordered.findIndex((pack) => pack.id === current.id);
  if (at <= 0) return { items: [], lookedBack: 0, empty: true };

  // The window never crosses a stage kind. A pregnancy step is not a
  // catch-up for a parent holding a two-month-old; it is a mistake.
  const earlier = ordered
    .slice(Math.max(0, at - window), at)
    .filter((pack) => pack.kind === current.kind);
  const done = new Set(doneIds);

  const candidates: CatchUpItem[] = [];
  for (const pack of earlier) {
    for (const action of pack.coreActions) {
      if (action.priority !== "essential" && action.priority !== "recommended") continue;
      if (done.has(action.id)) continue;
      candidates.push({
        action,
        packId: pack.id,
        packTitle: pack.title,
        stageLabel: stageLabelFor(pack),
      });
    }
  }

  // Most recent stage first, and an essential outranks a recommended from
  // a later stage — the thing that mattered most is the thing to say first.
  const rank = (item: CatchUpItem) => (item.action.priority === "essential" ? 0 : 1);
  const stageOf = (item: CatchUpItem) => earlier.findIndex((pack) => pack.id === item.packId);

  candidates.sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    return stageOf(b) - stageOf(a);
  });

  const items = candidates.slice(0, Math.max(0, limit));
  return { items, lookedBack: earlier.length, empty: items.length === 0 };
}

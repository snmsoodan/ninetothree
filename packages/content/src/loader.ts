import { StagePack } from "./schema";
import type { Action } from "./schema";

export interface PackIssue {
  packId: string;
  path: string;
  message: string;
}

export interface LoadResult {
  packs: StagePack[];
  issues: PackIssue[];
}

/**
 * Validates raw pack data. Never throws on bad content: a single broken
 * pack must not take the site down, and the build must be able to report
 * every problem at once rather than one per run.
 */
export function loadPacks(raw: unknown[]): LoadResult {
  const packs: StagePack[] = [];
  const issues: PackIssue[] = [];

  for (const entry of raw) {
    const parsed = StagePack.safeParse(entry);
    if (parsed.success) {
      packs.push(parsed.data);
      continue;
    }
    const packId =
      typeof entry === "object" && entry !== null && "id" in entry
        ? String((entry as { id: unknown }).id)
        : "<unknown>";
    for (const issue of parsed.error.issues) {
      issues.push({
        packId,
        path: issue.path.join(".") || "<root>",
        message: issue.message,
      });
    }
  }

  return { packs: sortPacks(packs), issues };
}

/** Chronological order. Pregnancy weeks first, then days, then months. */
export function sortPacks(packs: StagePack[]): StagePack[] {
  const kindOrder: Record<StagePack["kind"], number> = {
    pregnancy: 0,
    postpartum: 1,
    infant: 2,
    toddler: 3,
    event: 4,
  };
  return [...packs].sort((a, b) => {
    const byKind = kindOrder[a.kind] - kindOrder[b.kind];
    if (byKind !== 0) return byKind;
    if (a.stageIndex !== b.stageIndex) return a.stageIndex - b.stageIndex;
    return a.id.localeCompare(b.id);
  });
}

/** Throws if any pack is invalid. Used by the build and by CI. */
export function assertValidPacks(raw: unknown[]): StagePack[] {
  const { packs, issues } = loadPacks(raw);
  if (issues.length > 0) {
    const lines = issues.map((i) => `  ${i.packId} → ${i.path}: ${i.message}`);
    throw new Error(`Invalid stage packs:\n${lines.join("\n")}`);
  }
  return packs;
}

/** Finds the pack for a given stage, or the nearest earlier one. */
export function findPackForStage(
  packs: StagePack[],
  kind: StagePack["kind"],
  stageIndex: number,
): StagePack | undefined {
  const candidates = packs.filter((p) => p.kind === kind && p.stageIndex <= stageIndex);
  return candidates.at(-1);
}

/** The pack after this one, in the same kind. Used for "next week". */
export function nextPack(packs: StagePack[], current: StagePack): StagePack | undefined {
  const sameKind = packs.filter((p) => p.kind === current.kind);
  const index = sameKind.findIndex((p) => p.id === current.id);
  if (index === -1) return undefined;
  return sameKind[index + 1];
}

/** The pack before this one, in the same kind. Used for "last week". */
export function previousPack(packs: StagePack[], current: StagePack): StagePack | undefined {
  const sameKind = packs.filter((p) => p.kind === current.kind);
  const index = sameKind.findIndex((p) => p.id === current.id);
  if (index <= 0) return undefined;
  return sameKind[index - 1];
}

/**
 * Resolve an action id back to the pack that owns it. Pins are stored as bare
 * ids, so the dashboard needs this to render a pin without knowing which week
 * it came from.
 */
export function findAction(
  packs: StagePack[],
  actionId: string,
): { pack: StagePack; action: Action } | undefined {
  for (const pack of packs) {
    const action = pack.coreActions.find((a) => a.id === actionId);
    if (action) return { pack, action };
  }
  return undefined;
}

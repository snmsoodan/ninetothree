import { TriageTree, treeIssues } from "./triage";

import triageV1 from "../triage/triage.json";

/**
 * The triage tree, validated at module load. A tree with an unreachable
 * outcome, a dangling answer, or an emergency that escalates to a phone
 * number nobody answers fails the build rather than reaching a parent who
 * is already frightened.
 */
export function loadTriage(raw: unknown): TriageTree {
  const parsed = TriageTree.safeParse(raw);
  if (parsed.success) return parsed.data;

  // `treeIssues` reads the tree, so it can only run once the tree is at least
  // the right shape. A tree that is not gets the schema's own complaints.
  const shape = raw as { root?: unknown; nodes?: unknown; results?: unknown } | null;
  const structural =
    shape !== null &&
    typeof shape.root === "string" &&
    Array.isArray(shape.nodes) &&
    Array.isArray(shape.results)
      ? treeIssues(shape as Parameters<typeof treeIssues>[0])
      : [];

  const messages = [
    ...parsed.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`),
    ...structural,
  ];
  throw new Error(
    `The triage tree is not valid:\n${messages.map((message) => `  - ${message}`).join("\n")}`,
  );
}

export const TRIAGE: TriageTree = loadTriage(triageV1);

export const TRIAGE_BY_ID: ReadonlyMap<string, TriageTree> = new Map([[TRIAGE.id, TRIAGE]]);

export function getTriage(id: string): TriageTree | undefined {
  return TRIAGE_BY_ID.get(id);
}

import { z } from "zod";
import { StageRef, stageOrdinal } from "./links";
import { Source } from "./schema";

/**
 * A checklist.
 *
 * A stage pack says what to do this week. A checklist is the thing a parent
 * prints and puts in a bag: it is not tied to a week, it is not something you
 * finish, and it is read standing up in a hospital corridor at two in the
 * morning. That is a different shape from a pack, so it is a different type.
 *
 * The hospital bag is the first one. It is the only piece of preparation in
 * the whole guide that a parent does once, in advance, and then needs in a
 * hurry — which is exactly the case for paper.
 *
 * Held to the same rules as everything else: a source, a review date, the same
 * lint, the same reading-level ceiling.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

const kebab = z
  .string()
  .regex(/^[a-z0-9-]+$/, "id must be kebab-case")
  .min(3)
  .max(60);

export const ChecklistItem = z.object({
  id: kebab,
  /** What to put in the bag. One line, because it is read at a glance. */
  label: z.string().min(1).max(120),
  /** Why, or which one. Optional — most items do not need it. */
  detail: z.string().min(1).max(240).optional(),
  /**
   * Not everyone needs this. Rendered in a separate group at the end so the
   * main list stays short enough to scan.
   */
  optional: z.boolean().optional(),
});

export type ChecklistItem = z.infer<typeof ChecklistItem>;

export const ChecklistSection = z.object({
  id: kebab,
  title: z.string().min(1).max(80),
  /** One line under the heading, for the thing that applies to the section. */
  note: z.string().min(1).max(240).optional(),
  items: z.array(ChecklistItem).min(1).max(20),
});

export type ChecklistSection = z.infer<typeof ChecklistSection>;

export const Checklist = z
  .object({
    id: kebab,
    title: z.string().min(1).max(80),
    /** One sentence, shown under the title and in the print header. */
    summary: z.string().min(1).max(240),
    /** The window this is worth reading in. Inclusive at both ends. */
    stages: z.object({ from: StageRef, to: StageRef }),
    sections: z.array(ChecklistSection).min(1).max(12),
    sources: z.array(Source).min(1),
    reviewedBy: z.string().min(1).max(120),
    reviewedAt: isoDate,
    updatedAt: isoDate,
  })
  .superRefine((checklist, ctx) => {
    if (stageOrdinal(checklist.stages.to) < stageOrdinal(checklist.stages.from)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stages"],
        message: "a stage range cannot run backwards",
      });
    }

    // An item id is what a parent's tick is stored against, so two items
    // sharing one would tick each other.
    const seen = new Set<string>();
    checklist.sections.forEach((section, sectionIndex) => {
      section.items.forEach((item, itemIndex) => {
        if (seen.has(item.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sections", sectionIndex, "items", itemIndex, "id"],
            message: "two items share this id",
          });
        }
        seen.add(item.id);
      });
    });
  });

export type Checklist = z.infer<typeof Checklist>;

export interface ChecklistIssue {
  checklistId: string;
  path: string;
  message: string;
}

export interface ChecklistLoadResult {
  checklists: Checklist[];
  issues: ChecklistIssue[];
}

/** Validate a list of raw checklists, collecting every problem rather than the first. */
export function loadChecklists(raw: unknown[]): ChecklistLoadResult {
  const checklists: Checklist[] = [];
  const issues: ChecklistIssue[] = [];

  for (const entry of raw) {
    const parsed = Checklist.safeParse(entry);
    if (!parsed.success) {
      const id =
        typeof entry === "object" && entry !== null && "id" in entry
          ? String((entry as { id: unknown }).id)
          : "(no id)";
      for (const issue of parsed.error.issues) {
        issues.push({
          checklistId: id,
          path: issue.path.join(".") || "(root)",
          message: issue.message,
        });
      }
      continue;
    }
    if (checklists.some((checklist) => checklist.id === parsed.data.id)) {
      issues.push({
        checklistId: parsed.data.id,
        path: "id",
        message: "two checklists share this id",
      });
      continue;
    }
    checklists.push(parsed.data);
  }

  return { checklists, issues };
}

export function assertValidChecklists(raw: unknown[]): Checklist[] {
  const { checklists, issues } = loadChecklists(raw);
  if (issues.length > 0) {
    const detail = issues.map((i) => `${i.checklistId} → ${i.path}: ${i.message}`).join("\n");
    throw new Error(`Invalid checklists:\n${detail}`);
  }
  return checklists;
}

/**
 * Every sentence a parent reads on the printed page, joined.
 *
 * The reading level is a measure of the prose, not of the structure. Section
 * titles and item labels are prose; ids are not, and neither is a URL.
 */
export function checklistProse(checklist: Checklist): string {
  const parts: string[] = [checklist.title, checklist.summary];
  for (const section of checklist.sections) {
    parts.push(section.title);
    if (section.note) parts.push(section.note);
    for (const item of section.items) {
      parts.push(item.label);
      if (item.detail) parts.push(item.detail);
    }
  }
  return parts.join(" ");
}

/** Every checklist whose window contains this point on the timeline. */
export function checklistsForStage(
  checklists: readonly Checklist[],
  kind: StageRef["kind"],
  index: number,
): Checklist[] {
  const point = stageOrdinal({ kind, index });
  return checklists.filter(
    (checklist) =>
      stageOrdinal(checklist.stages.from) <= point && point <= stageOrdinal(checklist.stages.to),
  );
}

export function checklistHref(checklist: Checklist): string {
  return `/print/checklist/${checklist.id}`;
}

/** How many items a parent is being asked to gather. */
export function checklistCount(checklist: Checklist): number {
  return checklist.sections.reduce((total, section) => total + section.items.length, 0);
}

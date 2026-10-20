import { z } from "zod";
import { Cost, Domain, StageKind } from "./schema";

/**
 * The link catalogue.
 *
 * A stage pack says what to do. The catalogue says where to go to do it —
 * and it always offers more than one place, because a parent in rural
 * Montana and a parent in Brooklyn need different answers to the same
 * question.
 *
 * See CONTENT_LIBRARY.md for the editorial policy. The short version:
 * authoritative and charity sources first, commercial only when a parent
 * has to buy something, and never a link we have not opened ourselves.
 */

export const LINK_TYPES = [
  "authoritative",
  "charity",
  "community",
  "editorial",
  "commercial",
  "app",
  "course",
  "book",
  "local-service",
] as const;
export const LinkType = z.enum(LINK_TYPES);
export type LinkType = z.infer<typeof LinkType>;

export const PLATFORMS = ["ios", "android", "web"] as const;
export const Platform = z.enum(PLATFORMS);
export type Platform = z.infer<typeof Platform>;

/** A point on the timeline. `index` is in the kind's own unit. */
export const StageRef = z.object({
  kind: StageKind,
  index: z.number().int().min(0).max(200),
});
export type StageRef = z.infer<typeof StageRef>;

/**
 * A single position on the whole timeline, so a range can be compared.
 *
 * The gaps are deliberate: they leave room to add stages without
 * renumbering everything, and they make a printed ordinal readable.
 */
const KIND_BASE: Record<StageKind, number> = {
  pregnancy: 0,
  postpartum: 100,
  infant: 200,
  toddler: 300,
  event: 1000,
};

export function stageOrdinal(ref: StageRef): number {
  return KIND_BASE[ref.kind] + ref.index;
}

export const LinkEntry = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9-]+$/, "id must be kebab-case")
      .min(3)
      .max(60),
    title: z.string().min(1).max(80),
    url: z.string().url(),
    publisher: z.string().min(1).max(80),
    type: LinkType,
    /** What need this answers. At least one, or it is not in the catalogue. */
    domains: z.array(Domain).min(1),
    /** The window this is useful in. Inclusive at both ends. */
    stages: z.object({ from: StageRef, to: StageRef }),
    cost: Cost,
    /** One sentence on when this is the right place to go. */
    why: z.string().min(1).max(240),
    /** Honest caveat. "US only." "Requires a subscription." */
    note: z.string().max(160).optional(),
    /** Required for apps, because "an app" with no platform is not a link. */
    platforms: z.array(Platform).min(1).optional(),
    country: z.array(z.string().length(2)).min(1).default(["US"]),
    language: z
      .string()
      .regex(/^[a-z]{2}-[A-Z]{2}$/, "language must be like en-US")
      .default("en-US"),
    /** ISO date the link was last opened and confirmed. */
    lastChecked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "lastChecked must be YYYY-MM-DD"),
    affiliate: z.boolean().default(false),
    reviewedBy: z.string().min(1).max(120),
  })
  .superRefine((link, ctx) => {
    if (link.type === "app" && !link.platforms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["platforms"],
        message: "an app must say which platforms it runs on",
      });
    }
    if (link.affiliate && link.type !== "commercial") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["affiliate"],
        message: "only commercial links may be affiliate links",
      });
    }
    if (stageOrdinal(link.stages.from) > stageOrdinal(link.stages.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stages"],
        message: "stages.from must not be after stages.to",
      });
    }
  });
export type LinkEntry = z.infer<typeof LinkEntry>;

export interface LinkIssue {
  linkId: string;
  path: string;
  message: string;
}

export interface LinkLoadResult {
  links: LinkEntry[];
  issues: LinkIssue[];
}

/** Validates raw catalogue data. Reports every problem at once, never throws. */
export function loadLinks(raw: unknown[]): LinkLoadResult {
  const links: LinkEntry[] = [];
  const issues: LinkIssue[] = [];

  for (const entry of raw) {
    const parsed = LinkEntry.safeParse(entry);
    if (parsed.success) {
      links.push(parsed.data);
      continue;
    }
    const linkId =
      typeof entry === "object" && entry !== null && "id" in entry
        ? String((entry as { id: unknown }).id)
        : "<unknown>";
    for (const issue of parsed.error.issues) {
      issues.push({ linkId, path: issue.path.join(".") || "<root>", message: issue.message });
    }
  }

  return { links, issues };
}

/** Throws if any link is invalid. Used by the build and by CI. */
export function assertValidLinks(raw: unknown[]): LinkEntry[] {
  const { links, issues } = loadLinks(raw);
  if (issues.length > 0) {
    const lines = issues.map((i) => `  ${i.linkId} → ${i.path}: ${i.message}`);
    throw new Error(`Invalid link catalogue:\n${lines.join("\n")}`);
  }
  const seen = new Set<string>();
  for (const link of links) {
    if (seen.has(link.id)) throw new Error(`Duplicate link id: ${link.id}`);
    seen.add(link.id);
  }
  return links;
}

/** Every link whose window covers this stage. */
export function linksForStage(links: readonly LinkEntry[], ref: StageRef): LinkEntry[] {
  const at = stageOrdinal(ref);
  return links.filter(
    (link) => stageOrdinal(link.stages.from) <= at && at <= stageOrdinal(link.stages.to),
  );
}

/** Every link that answers this need. */
export function linksForDomain(links: readonly LinkEntry[], domain: Domain): LinkEntry[] {
  return links.filter((link) => link.domains.includes(domain));
}

/**
 * Free-text search over the fields a parent would actually type.
 * Case-insensitive, and it matches the publisher too, because "ACOG" is
 * a thing people look for by name.
 */
export function searchLinks(links: readonly LinkEntry[], query: string): LinkEntry[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [];
  return links.filter((link) =>
    [link.title, link.publisher, link.why].some((field) => field.toLowerCase().includes(needle)),
  );
}

/** Groups by type, in the order the catalogue presents them. */
export function groupByType(links: readonly LinkEntry[]): Map<LinkType, LinkEntry[]> {
  const groups = new Map<LinkType, LinkEntry[]>();
  for (const type of LINK_TYPES) {
    const inGroup = links.filter((link) => link.type === type);
    if (inGroup.length > 0) groups.set(type, inGroup);
  }
  return groups;
}

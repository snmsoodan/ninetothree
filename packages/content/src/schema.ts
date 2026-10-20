import { z } from "zod";

/**
 * The Stage Pack is the core object of the product.
 *
 * One pack per pregnancy week, one per week or month of the first three
 * years, plus event-triggered packs. The schema is the product's
 * constitution: the limits here are the product rules, enforced at build
 * time so a well-meaning content edit cannot break the calm.
 *
 * See CONTENT_BLUEPRINT.md for the editorial intent and
 * ARCHITECTURE.md §4 for how packs are loaded.
 */

export const DOMAINS = [
  "health-parent",
  "health-baby",
  "feeding",
  "sleep",
  "nutrition",
  "play",
  "safety",
  "gear",
  "money",
  "mind",
  "childcare",
  "home",
  "milestones",
] as const;

export const Domain = z.enum(DOMAINS);
export type Domain = z.infer<typeof Domain>;

export const ACTION_TYPES = ["do", "buy", "book", "know", "watch", "ask"] as const;
export const ActionType = z.enum(ACTION_TYPES);
export type ActionType = z.infer<typeof ActionType>;

export const PRIORITIES = ["essential", "recommended", "optional", "skip-if"] as const;
export const Priority = z.enum(PRIORITIES);
export type Priority = z.infer<typeof Priority>;

export const COSTS = ["free", "$", "$$", "$$$", "varies"] as const;
export const Cost = z.enum(COSTS);
export type Cost = z.infer<typeof Cost>;

export const SOURCE_KINDS = ["clinical", "government", "charity", "editorial", "vendor"] as const;
export const SourceKind = z.enum(SOURCE_KINDS);
export type SourceKind = z.infer<typeof SourceKind>;

export const STAGE_KINDS = ["pregnancy", "postpartum", "infant", "toddler", "event"] as const;
export const StageKind = z.enum(STAGE_KINDS);
export type StageKind = z.infer<typeof StageKind>;

export const STAGE_UNITS = ["week", "month", "day"] as const;
export const StageUnit = z.enum(STAGE_UNITS);
export type StageUnit = z.infer<typeof StageUnit>;

/**
 * What to do when a red flag fires. These are the only escalation paths,
 * and each one maps to a real, free, 24-hour service.
 */
export const ESCALATIONS = [
  "call-911",
  "call-ob-triage",
  "call-pediatrician",
  "go-to-er",
  "call-poison-control",
  "call-988",
  "call-psi",
  "call-dv-hotline",
] as const;
export const Escalation = z.enum(ESCALATIONS);
export type Escalation = z.infer<typeof Escalation>;

/** One of the two or three ways to do a thing. Never more than four. */
export const Option = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(80),
  /** One sentence on when this option is the right one. */
  detail: z.string().max(240).optional(),
  url: z.string().url().optional(),
  vendor: z.string().max(60).optional(),
  cost: Cost.optional(),
  /** Honest caveat. "Runs small." "Only ships in the US." */
  note: z.string().max(160).optional(),
});
export type Option = z.infer<typeof Option>;

export const Action = z.object({
  id: z.string().min(1),
  type: ActionType,
  priority: Priority,
  domain: Domain,
  /** Imperative, under 60 characters, no "should". */
  title: z.string().min(1).max(60),
  /** The one-line reason this matters. Not a paragraph. */
  why: z.string().min(1).max(240),
  /** Optional expansion, shown only if the user asks for it. */
  detail: z.string().max(1200).optional(),
  /** Realistic time cost. Shown so the user can decide, not to pressure. */
  minutes: z.number().int().positive().max(600).optional(),
  options: z.array(Option).max(4).default([]),
  /** When it is fine to ignore this. Skip is a first-class action. */
  skipIf: z.string().max(200).optional(),
});
export type Action = z.infer<typeof Action>;

export const RedFlag = z.object({
  id: z.string().min(1),
  /** Plain language, no hedging, no diagnosis. */
  text: z.string().min(1).max(200),
  escalation: Escalation,
  /** Shown next to the escalation. Always a real number. */
  phone: z.string().max(30).optional(),
});
export type RedFlag = z.infer<typeof RedFlag>;

export const Appointment = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(80),
  /** Inclusive window, in the pack's own unit. */
  from: z.number().int().min(0),
  to: z.number().int().min(0),
  who: z.string().max(60).optional(),
  note: z.string().max(240).optional(),
});
export type Appointment = z.infer<typeof Appointment>;

export const Source = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(160),
  publisher: z.string().min(1).max(80),
  url: z.string().url(),
  kind: SourceKind,
  /** ISO date the link was last confirmed live. */
  accessed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "accessed must be YYYY-MM-DD"),
});
export type Source = z.infer<typeof Source>;

/** Something worth knowing that is not an action. Max 8, and most packs need 2. */
export const AlsoKnow = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(600),
  domain: Domain.optional(),
});
export type AlsoKnow = z.infer<typeof AlsoKnow>;

/**
 * A step that only appears for some parents. `when` names a rule in
 * `packages/rules`; the rule decides whether, the pack decides what. This
 * keeps added content inside the schema, the lint, and clinical review.
 */
export const ProfileAction = z.object({
  when: z.string().min(1).max(60),
  action: Action,
});
export type ProfileAction = z.infer<typeof ProfileAction>;

export const StagePack = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9-]+$/, "id must be kebab-case")
      .min(3)
      .max(60),
    kind: StageKind,
    /** Week number for pregnancy, week or month for the first year, month after. */
    stageIndex: z.number().int().min(0).max(200),
    stageUnit: StageUnit,
    locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/, "locale must be like en-US"),
    country: z.string().length(2),
    title: z.string().min(1).max(80),
    /** One line under the title. Sets the tone for the whole week. */
    subtitle: z.string().max(160).optional(),

    baby: z
      .object({
        /** "About the size of a lime." Optional — some weeks have no good comparison. */
        size: z.string().max(60).optional(),
        development: z.string().min(1).max(600),
      })
      .optional(),

    you: z
      .object({
        body: z.string().max(600).optional(),
        mind: z.string().max(600).optional(),
      })
      .optional(),

    /** The product rule: at most three. Enforced here, not in review. */
    coreActions: z.array(Action).min(1).max(3),
    /** Steps that only some parents see. Never counted against the three. */
    profileActions: z.array(ProfileAction).max(3).optional(),
    alsoKnow: z.array(AlsoKnow).max(8).default([]),
    /** At least one. A pack with no red flags is a pack that has not been thought about. */
    redFlags: z.array(RedFlag).min(1),
    appointments: z.array(Appointment).default([]),
    /** At least one. A pack that cannot cite itself does not ship. */
    sources: z.array(Source).min(1),

    reviewedBy: z.string().min(1).max(120),
    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "reviewedAt must be YYYY-MM-DD"),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "updatedAt must be YYYY-MM-DD"),
  })
  .superRefine((pack, ctx) => {
    // Ids must be unique within a pack, because progress is keyed on them.
    const seen = new Set<string>();
    const all = [
      ...pack.coreActions.map((a) => a.id),
      ...(pack.profileActions ?? []).map((a) => a.action.id),
      ...pack.alsoKnow.map((a) => a.id),
      ...pack.redFlags.map((a) => a.id),
      ...pack.appointments.map((a) => a.id),
      ...pack.sources.map((a) => a.id),
    ];
    for (const id of all) {
      if (seen.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate id "${id}" within pack ${pack.id}`,
          path: ["id"],
        });
      }
      seen.add(id);
    }

    // An appointment window must not run backwards.
    for (const appt of pack.appointments) {
      if (appt.to < appt.from) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `appointment "${appt.id}" has to < from`,
          path: ["appointments"],
        });
      }
    }

    // A red flag that escalates to a phone number must carry the number.
    for (const flag of pack.redFlags) {
      const needsPhone =
        flag.escalation === "call-poison-control" ||
        flag.escalation === "call-988" ||
        flag.escalation === "call-psi" ||
        flag.escalation === "call-dv-hotline";
      if (needsPhone && !flag.phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `red flag "${flag.id}" escalates to ${flag.escalation} but has no phone`,
          path: ["redFlags"],
        });
      }
    }

    // A "buy" action with no options is a dead end.
    for (const action of pack.coreActions) {
      if (action.type === "buy" && action.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `buy action "${action.id}" has no options`,
          path: ["coreActions"],
        });
      }
    }

    // Only one essential action per pack. Two essentials is zero essentials.
    const essentials = pack.coreActions.filter((a) => a.priority === "essential");
    if (essentials.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `pack ${pack.id} has ${essentials.length} essential actions; at most one is allowed`,
        path: ["coreActions"],
      });
    }
  });

export type StagePack = z.infer<typeof StagePack>;

/** The escalation targets, with the number to show and the words to say. */
export const ESCALATION_COPY: Record<Escalation, { label: string; phone?: string; href?: string }> =
  {
    "call-911": { label: "Call 911", phone: "911", href: "tel:911" },
    "call-ob-triage": { label: "Call your OB triage line" },
    "call-pediatrician": { label: "Call your pediatrician" },
    "go-to-er": { label: "Go to the ER" },
    "call-poison-control": {
      label: "Call Poison Control",
      phone: "1-800-222-1222",
      href: "tel:18002221222",
    },
    "call-988": { label: "Call or text 988", phone: "988", href: "tel:988" },
    "call-psi": {
      label: "Call the PSI Helpline",
      phone: "1-800-944-4773",
      href: "tel:18009444773",
    },
    "call-dv-hotline": {
      label: "Call the National Domestic Violence Hotline",
      phone: "1-800-799-7233",
      href: "tel:18007997233",
    },
  };

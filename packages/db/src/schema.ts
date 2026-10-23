import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  char,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * `citext` is a case-insensitive text type. It is a contrib extension rather
 * than a built-in, so it is declared here instead of imported.
 */
const citext = customType<{ data: string }>({
  dataType: () => "citext",
});

const createdAt = timestamp("created_at", { withTimezone: true, mode: "date" })
  .notNull()
  .defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: citext("email").notNull().unique(),
  name: text("name"),
  locale: text("locale").notNull().default("en-US"),
  country: char("country", { length: 2 }).notNull().default("US"),
  timezone: text("timezone").notNull().default("America/New_York"),
  createdAt,
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
});

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  createdAt,
});

export const householdMembers = pgTable(
  "household_members",
  {
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.householdId, t.userId] }),
    index("household_members_user_idx").on(t.userId),
    check(
      "household_members_role_check",
      sql`${t.role} in ('parent', 'partner', 'grandparent', 'carer')`,
    ),
  ],
);

export const pregnancies = pgTable(
  "pregnancies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    startDate: date("start_date", { mode: "string" }),
    parity: integer("parity").notNull().default(0),
    multiples: boolean("multiples").notNull().default(false),
    status: text("status").notNull().default("active"),
    createdAt,
  },
  (t) => [
    index("pregnancies_household_idx").on(t.householdId),
    check("pregnancies_parity_check", sql`${t.parity} >= 0`),
    check("pregnancies_status_check", sql`${t.status} in ('active', 'paused', 'loss', 'ended')`),
  ],
);

export const children = pgTable(
  "children",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    birthDate: date("birth_date", { mode: "string" }).notNull(),
    dueDate: date("due_date", { mode: "string" }),
    correctedAge: boolean("corrected_age").notNull().default(false),
    sex: text("sex"),
    feeding: text("feeding"),
    birthType: text("birth_type"),
    createdAt,
  },
  (t) => [
    index("children_household_idx").on(t.householdId),
    check(
      "children_feeding_check",
      sql`${t.feeding} is null or ${t.feeding} in ('breast', 'formula', 'mixed', 'undecided')`,
    ),
    check(
      "children_birth_type_check",
      sql`${t.birthType} is null or ${t.birthType} in ('vaginal', 'assisted', 'c-section', 'unknown')`,
    ),
  ],
);

export const stagePacks = pgTable(
  "stage_packs",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    stageIndex: integer("stage_index").notNull(),
    stageUnit: text("stage_unit").notNull().default("week"),
    locale: text("locale").notNull().default("en-US"),
    country: char("country", { length: 2 }).notNull().default("US"),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    baby: text("baby"),
    you: text("you"),
    payload: jsonb("payload").notNull(),
    version: integer("version").notNull().default(1),
    status: text("status").notNull().default("draft"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: date("reviewed_at", { mode: "string" }),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    createdAt,
  },
  (t) => [
    index("stage_packs_stage_idx").on(t.kind, t.stageIndex),
    check(
      "stage_packs_kind_check",
      sql`${t.kind} in ('pregnancy', 'postpartum', 'infant', 'toddler', 'event')`,
    ),
    check("stage_packs_stage_index_check", sql`${t.stageIndex} >= 0`),
    check("stage_packs_stage_unit_check", sql`${t.stageUnit} in ('week', 'month', 'day')`),
    check("stage_packs_version_check", sql`${t.version} >= 1`),
    check(
      "stage_packs_status_check",
      sql`${t.status} in ('draft', 'in_review', 'published', 'retired')`,
    ),
  ],
);

export const contentSources = pgTable(
  "content_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stagePackId: text("stage_pack_id")
      .notNull()
      .references(() => stagePacks.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    url: text("url").notNull(),
    publisher: text("publisher"),
    kind: text("kind").notNull().default("clinical"),
    lastChecked: date("last_checked", { mode: "string" }).notNull(),
    reviewedBy: text("reviewed_by"),
  },
  (t) => [
    index("content_sources_pack_idx").on(t.stagePackId),
    check(
      "content_sources_kind_check",
      sql`${t.kind} in ('clinical', 'government', 'charity', 'editorial', 'vendor')`,
    ),
  ],
);

export const linkCatalogue = pgTable(
  "link_catalogue",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    publisher: text("publisher"),
    country: text("country")
      .array()
      .notNull()
      .default(sql`'{US}'`),
    type: text("type").notNull(),
    domains: text("domains").array().notNull(),
    platforms: text("platforms")
      .array()
      .notNull()
      .default(sql`'{}'`),
    cost: text("cost"),
    why: text("why"),
    affiliate: boolean("affiliate").notNull().default(false),
    lastChecked: date("last_checked", { mode: "string" }).notNull(),
    status: text("status").notNull().default("active"),
  },
  (t) => [
    index("link_catalogue_domains_idx").using("gin", t.domains),
    index("link_catalogue_title_trgm_idx").using("gin", sql`${t.title} gin_trgm_ops`),
    check(
      "link_catalogue_type_check",
      sql`${t.type} in ('authoritative', 'charity', 'community', 'editorial', 'commercial', 'app', 'course', 'book', 'local-service')`,
    ),
    check(
      "link_catalogue_cost_check",
      sql`${t.cost} is null or ${t.cost} in ('free', '$', '$$', '$$$', 'varies')`,
    ),
    check("link_catalogue_status_check", sql`${t.status} in ('active', 'broken', 'retired')`),
    check(
      "link_catalogue_affiliate_is_commercial",
      sql`not ${t.affiliate} or ${t.type} = 'commercial'`,
    ),
  ],
);

export const stageProgress = pgTable(
  "stage_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stagePackId: text("stage_pack_id")
      .notNull()
      .references(() => stagePacks.id, { onDelete: "cascade" }),
    state: text("state").notNull().default("not_started"),
    forced: boolean("forced").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.stagePackId] }),
    index("stage_progress_pack_idx").on(t.stagePackId),
    check(
      "stage_progress_state_check",
      sql`${t.state} in ('not_started', 'in_progress', 'complete', 'skipped')`,
    ),
  ],
);

export const itemState = pgTable(
  "item_state",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    stagePackId: text("stage_pack_id").references(() => stagePacks.id, {
      onDelete: "set null",
    }),
    state: text("state").notNull().default("not_started"),
    skipReason: text("skip_reason"),
    pinned: boolean("pinned").notNull().default(false),
    pinnedAt: timestamp("pinned_at", { withTimezone: true, mode: "date" }),
    remindOn: date("remind_on", { mode: "string" }),
    snoozedUntil: date("snoozed_until", { mode: "string" }),
    note: text("note"),
    title: text("title"),
    packTitle: text("pack_title"),
    choiceOptionId: text("choice_option_id"),
    choiceLabel: text("choice_label"),
    chosenAt: timestamp("chosen_at", { withTimezone: true, mode: "date" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.itemId] }),
    index("item_state_user_pack_idx").on(t.userId, t.stagePackId),
    index("item_state_pinned_idx")
      .on(t.userId, t.pinnedAt.desc())
      .where(sql`pinned`),
    check(
      "item_state_state_check",
      sql`${t.state} in ('not_started', 'done', 'skipped', 'snoozed')`,
    ),
    check(
      "item_state_skip_reason_check",
      sql`${t.skipReason} is null or ${t.skipReason} in ('not-now', 'already-done', 'not-for-me')`,
    ),
    check(
      "item_state_skip_reason_needs_skip",
      sql`${t.skipReason} is null or ${t.state} = 'skipped'`,
    ),
    check(
      "item_state_snooze_needs_date",
      sql`${t.state} <> 'snoozed' or ${t.snoozedUntil} is not null`,
    ),
    check("item_state_pin_needs_time", sql`not ${t.pinned} or ${t.pinnedAt} is not null`),
  ],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: text("kind"),
    dueAt: timestamp("due_at", { withTimezone: true, mode: "date" }),
    who: text("who"),
    location: text("location"),
    notes: text("notes"),
    source: text("source").notNull().default("auto"),
    createdAt,
  },
  (t) => [
    index("appointments_household_idx").on(t.householdId),
    index("appointments_due_idx").on(t.householdId, t.dueAt),
    check("appointments_source_check", sql`${t.source} in ('auto', 'user')`),
  ],
);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: text("item_id"),
    title: text("title").notNull(),
    remindAt: timestamp("remind_at", { withTimezone: true, mode: "date" }).notNull(),
    channel: text("channel").notNull().default("email"),
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [
    index("reminders_remind_at_idx")
      .on(t.remindAt)
      .where(sql`sent_at is null`),
    check("reminders_channel_check", sql`${t.channel} in ('email', 'push')`),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    plan: text("plan").notNull(),
    status: text("status").notNull(),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt,
  },
  (t) => [
    index("subscriptions_household_idx").on(t.householdId),
    check("subscriptions_plan_check", sql`${t.plan} in ('free', 'plus', 'family', 'b2b')`),
  ],
);

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  payload: jsonb("payload"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const contentEvents = pgTable(
  "content_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    event: text("event").notNull(),
    stagePackId: text("stage_pack_id"),
    itemId: text("item_id"),
    properties: jsonb("properties"),
    createdAt,
  },
  (t) => [index("content_events_user_time_idx").on(t.userId, t.createdAt.desc())],
);

/** Every table, in dependency order. Used by the schema test and the seeder. */
export const TABLES = [
  users,
  households,
  householdMembers,
  pregnancies,
  children,
  stagePacks,
  contentSources,
  linkCatalogue,
  stageProgress,
  itemState,
  appointments,
  reminders,
  subscriptions,
  featureFlags,
  contentEvents,
] as const;

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
  uniqueIndex,
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
  emailVerified: timestamp("email_verified", { withTimezone: true, mode: "date" }),
  image: text("image"),
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

export const householdInvites = pgTable(
  "household_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [
    index("household_invites_household_idx").on(t.householdId),
    index("household_invites_expires_idx").on(t.expiresAt),
    check(
      "household_invites_role_check",
      sql`${t.role} in ('parent', 'partner', 'grandparent', 'carer')`,
    ),
  ],
);

/**
 * A pin that has been deliberately shared with the household.
 *
 * There is no `note` column, and that is the point: a private note lives in
 * `item_state`, which is self-only by policy, so a partner cannot read it
 * because there is nowhere for it to be read from.
 */
export const sharedItems = pgTable(
  "shared_items",
  {
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    stagePackId: text("stage_pack_id").references(() => stagePacks.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    packTitle: text("pack_title"),
    sharedBy: uuid("shared_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt,
  },
  (t) => [
    primaryKey({ columns: [t.householdId, t.itemId] }),
    index("shared_items_household_idx").on(t.householdId),
  ],
);

/**
 * A job is an action one person has handed to another.
 *
 * It is not a shared pin with an owner. A shared pin says "this matters to us";
 * a job says "you are doing this one", and it has a status that only moves
 * forward. `dropped` is separate from `open` so a job somebody took back does
 * not look like a job somebody is ignoring.
 */
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    stagePackId: text("stage_pack_id").references(() => stagePacks.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    packTitle: text("pack_title"),
    assignedTo: uuid("assigned_to")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("open"),
    doneAt: timestamp("done_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [
    index("jobs_household_idx").on(t.householdId),
    index("jobs_assigned_to_idx").on(t.assignedTo, t.status),
    uniqueIndex("jobs_one_open_per_item_idx")
      .on(t.householdId, t.itemId)
      .where(sql`${t.status} = 'open'`),
    check("jobs_status_check", sql`${t.status} in ('open', 'done', 'dropped')`),
    check("jobs_done_needs_time", sql`(${t.status} = 'done') = (${t.doneAt} is not null)`),
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

// Auth.js ---------------------------------------------------------------------
//
// These four tables are shaped by @auth/drizzle-adapter, not by us. The column
// names are the adapter's contract; renaming one breaks sign-in silently.

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("accounts_user_id_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.identifier, table.token] }),
    index("verification_tokens_expires_idx").on(table.expires),
  ],
);

export const authAttempts = pgTable(
  "auth_attempts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    key: text("key").notNull(),
    at: timestamp("at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("auth_attempts_key_at_idx").on(table.key, table.at.desc())],
);

export const TABLES = [
  users,
  households,
  householdMembers,
  householdInvites,
  sharedItems,
  jobs,
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
  accounts,
  sessions,
  verificationTokens,
  authAttempts,
] as const;

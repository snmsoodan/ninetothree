import type { SqlClient } from "./migrate";
import { asUser, type HouseholdRole, type Scope } from "./scope";

/*
 * Every function here takes a `Scope` as its first argument and runs inside
 * `asUser`, which sets `app.user_id` for the transaction. Two things follow:
 *
 *   1. There is no function that takes a bare household or user id, so a
 *      caller cannot pass the wrong one — the type system has nothing to
 *      accept.
 *   2. Even if the SQL below were wrong, row-level security would return no
 *      rows, because the policy reads the same setting.
 *
 * The `where` clauses are therefore belt and braces. They are kept because a
 * query that relies only on RLS is a query that silently returns everything
 * the day someone connects as the table owner.
 */

// The person -----------------------------------------------------------------

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  locale: string;
  country: string;
  timezone: string;
  created_at: Date;
  deleted_at: Date | null;
}

export async function getUser(db: SqlClient, scope: Scope): Promise<UserRow | undefined> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<UserRow>("select * from users where id = $1", [scope.userId]);
    return rows[0];
  });
}

export interface UserPatch {
  name?: string;
  locale?: string;
  country?: string;
  timezone?: string;
}

export async function updateUser(
  db: SqlClient,
  scope: Scope,
  patch: UserPatch,
): Promise<UserRow | undefined> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<UserRow>(
      `update users set
         name = coalesce($2, name),
         locale = coalesce($3, locale),
         country = coalesce($4, country),
         timezone = coalesce($5, timezone)
       where id = $1
       returning *`,
      [
        scope.userId,
        patch.name ?? null,
        patch.locale ?? null,
        patch.country ?? null,
        patch.timezone ?? null,
      ],
    );
    return rows[0];
  });
}

// The household --------------------------------------------------------------

export interface HouseholdRow {
  id: string;
  name: string | null;
  created_at: Date;
}

export async function getHousehold(db: SqlClient, scope: Scope): Promise<HouseholdRow | undefined> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<HouseholdRow>("select * from households where id = $1", [
      scope.householdId,
    ]);
    return rows[0];
  });
}

export interface MemberRow {
  household_id: string;
  user_id: string;
  role: HouseholdRole;
}

export async function listMembers(db: SqlClient, scope: Scope): Promise<MemberRow[]> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<MemberRow>(
      "select * from household_members where household_id = $1 order by user_id",
      [scope.householdId],
    );
    return rows;
  });
}

// The journey ----------------------------------------------------------------

export interface PregnancyRow {
  id: string;
  household_id: string;
  due_date: Date;
  start_date: Date | null;
  parity: number;
  multiples: boolean;
  status: "active" | "paused" | "loss" | "ended";
  created_at: Date;
}

export async function getPregnancy(db: SqlClient, scope: Scope): Promise<PregnancyRow | undefined> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<PregnancyRow>(
      `select * from pregnancies
        where household_id = $1 and status = 'active'
        order by created_at desc
        limit 1`,
      [scope.householdId],
    );
    return rows[0];
  });
}

export interface PregnancyInput {
  dueDate: string;
  startDate?: string;
  parity?: number;
  multiples?: boolean;
}

export async function upsertPregnancy(
  db: SqlClient,
  scope: Scope,
  input: PregnancyInput,
): Promise<PregnancyRow> {
  return asUser(db, scope.userId, async () => {
    const existing = await db.query<{ id: string }>(
      `select id from pregnancies where household_id = $1 and status = 'active' limit 1`,
      [scope.householdId],
    );
    const id = existing.rows[0]?.id;
    if (id) {
      const { rows } = await db.query<PregnancyRow>(
        `update pregnancies set
           due_date = $2,
           start_date = coalesce($3, start_date),
           parity = coalesce($4, parity),
           multiples = coalesce($5, multiples)
         where id = $1
         returning *`,
        [id, input.dueDate, input.startDate ?? null, input.parity ?? null, input.multiples ?? null],
      );
      return rows[0]!;
    }
    const { rows } = await db.query<PregnancyRow>(
      `insert into pregnancies (household_id, due_date, start_date, parity, multiples)
       values ($1, $2, $3, coalesce($4, 0), coalesce($5, false))
       returning *`,
      [
        scope.householdId,
        input.dueDate,
        input.startDate ?? null,
        input.parity ?? null,
        input.multiples ?? null,
      ],
    );
    return rows[0]!;
  });
}

export interface ChildRow {
  id: string;
  household_id: string;
  birth_date: Date;
  due_date: Date | null;
  corrected_age: boolean;
  sex: string | null;
  feeding: "breast" | "formula" | "mixed" | "undecided" | null;
  birth_type: "vaginal" | "assisted" | "c-section" | "unknown" | null;
  created_at: Date;
}

export async function getChild(db: SqlClient, scope: Scope): Promise<ChildRow | undefined> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<ChildRow>(
      "select * from children where household_id = $1 order by birth_date desc limit 1",
      [scope.householdId],
    );
    return rows[0];
  });
}

export interface ChildInput {
  birthDate: string;
  dueDate?: string;
  correctedAge?: boolean;
  sex?: string;
  feeding?: ChildRow["feeding"];
  birthType?: ChildRow["birth_type"];
}

export async function upsertChild(
  db: SqlClient,
  scope: Scope,
  input: ChildInput,
): Promise<ChildRow> {
  return asUser(db, scope.userId, async () => {
    const existing = await db.query<{ id: string }>(
      "select id from children where household_id = $1 order by birth_date desc limit 1",
      [scope.householdId],
    );
    const id = existing.rows[0]?.id;
    if (id) {
      const { rows } = await db.query<ChildRow>(
        `update children set
           birth_date = $2,
           due_date = coalesce($3, due_date),
           corrected_age = coalesce($4, corrected_age),
           sex = coalesce($5, sex),
           feeding = coalesce($6, feeding),
           birth_type = coalesce($7, birth_type)
         where id = $1
         returning *`,
        [
          id,
          input.birthDate,
          input.dueDate ?? null,
          input.correctedAge ?? null,
          input.sex ?? null,
          input.feeding ?? null,
          input.birthType ?? null,
        ],
      );
      return rows[0]!;
    }
    const { rows } = await db.query<ChildRow>(
      `insert into children (household_id, birth_date, due_date, corrected_age, sex, feeding, birth_type)
       values ($1, $2, $3, coalesce($4, false), $5, $6, $7)
       returning *`,
      [
        scope.householdId,
        input.birthDate,
        input.dueDate ?? null,
        input.correctedAge ?? null,
        input.sex ?? null,
        input.feeding ?? null,
        input.birthType ?? null,
      ],
    );
    return rows[0]!;
  });
}

// Progress -------------------------------------------------------------------

export interface ProgressRow {
  user_id: string;
  stage_pack_id: string;
  state: "not_started" | "in_progress" | "complete" | "skipped";
  forced: boolean;
  completed_at: Date | null;
}

export async function listProgress(db: SqlClient, scope: Scope): Promise<ProgressRow[]> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<ProgressRow>(
      "select * from stage_progress where user_id = $1 order by stage_pack_id",
      [scope.userId],
    );
    return rows;
  });
}

export interface ProgressInput {
  stagePackId: string;
  state: ProgressRow["state"];
  forced?: boolean;
  completedAt?: Date;
}

export async function setProgress(
  db: SqlClient,
  scope: Scope,
  input: ProgressInput,
): Promise<ProgressRow> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<ProgressRow>(
      `insert into stage_progress (user_id, stage_pack_id, state, forced, completed_at)
       values ($1, $2, $3, coalesce($4, false), $5)
       on conflict (user_id, stage_pack_id) do update set
         state = excluded.state,
         forced = excluded.forced,
         completed_at = excluded.completed_at
       returning *`,
      [
        scope.userId,
        input.stagePackId,
        input.state,
        input.forced ?? null,
        input.completedAt ?? null,
      ],
    );
    return rows[0]!;
  });
}

// Item state -----------------------------------------------------------------

export interface ItemStateRow {
  user_id: string;
  item_id: string;
  stage_pack_id: string | null;
  state: "not_started" | "done" | "skipped" | "snoozed";
  skip_reason: "not-now" | "already-done" | "not-for-me" | null;
  pinned: boolean;
  pinned_at: Date | null;
  remind_on: Date | null;
  snoozed_until: Date | null;
  note: string | null;
  title: string | null;
  pack_title: string | null;
  choice_option_id: string | null;
  choice_label: string | null;
  chosen_at: Date | null;
  updated_at: Date;
}

export async function listItemState(db: SqlClient, scope: Scope): Promise<ItemStateRow[]> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<ItemStateRow>(
      "select * from item_state where user_id = $1 order by item_id",
      [scope.userId],
    );
    return rows;
  });
}

export async function listPinned(db: SqlClient, scope: Scope): Promise<ItemStateRow[]> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<ItemStateRow>(
      `select * from item_state
        where user_id = $1 and pinned
        order by pinned_at desc nulls last`,
      [scope.userId],
    );
    return rows;
  });
}

export interface ItemStateInput {
  itemId: string;
  stagePackId?: string;
  state: ItemStateRow["state"];
  skipReason?: ItemStateRow["skip_reason"];
  pinned?: boolean;
  pinnedAt?: Date;
  remindOn?: string;
  snoozedUntil?: string;
  note?: string;
  title?: string;
  packTitle?: string;
  choiceOptionId?: string;
  choiceLabel?: string;
  chosenAt?: Date;
}

export async function setItemState(
  db: SqlClient,
  scope: Scope,
  input: ItemStateInput,
): Promise<ItemStateRow> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<ItemStateRow>(
      `insert into item_state (
         user_id, item_id, stage_pack_id, state, skip_reason, pinned, pinned_at,
         remind_on, snoozed_until, note, title, pack_title,
         choice_option_id, choice_label, chosen_at
       ) values (
         $1,$2,$3,$4,$5,
         coalesce($6, false),
         case when coalesce($6, false) then coalesce($7, now()) else null end,
         $8,$9,$10,$11,$12,$13,$14,$15
       )
       on conflict (user_id, item_id) do update set
         stage_pack_id = coalesce(excluded.stage_pack_id, item_state.stage_pack_id),
         state = excluded.state,
         skip_reason = excluded.skip_reason,
         pinned = coalesce($6, item_state.pinned),
         pinned_at = case
           when coalesce($6, item_state.pinned)
             then coalesce($7, item_state.pinned_at, now())
             else null
         end,
         remind_on = excluded.remind_on,
         snoozed_until = excluded.snoozed_until,
         note = coalesce(excluded.note, item_state.note),
         title = coalesce(excluded.title, item_state.title),
         pack_title = coalesce(excluded.pack_title, item_state.pack_title),
         choice_option_id = coalesce(excluded.choice_option_id, item_state.choice_option_id),
         choice_label = coalesce(excluded.choice_label, item_state.choice_label),
         chosen_at = coalesce(excluded.chosen_at, item_state.chosen_at),
         updated_at = now()
       returning *`,
      [
        scope.userId,
        input.itemId,
        input.stagePackId ?? null,
        input.state,
        input.skipReason ?? null,
        input.pinned ?? null,
        input.pinnedAt ?? null,
        input.remindOn ?? null,
        input.snoozedUntil ?? null,
        input.note ?? null,
        input.title ?? null,
        input.packTitle ?? null,
        input.choiceOptionId ?? null,
        input.choiceLabel ?? null,
        input.chosenAt ?? null,
      ],
    );
    return rows[0]!;
  });
}

// Appointments ---------------------------------------------------------------

export interface AppointmentRow {
  id: string;
  household_id: string;
  title: string;
  kind: string | null;
  due_at: Date | null;
  who: string | null;
  location: string | null;
  notes: string | null;
  source: "auto" | "user";
  created_at: Date;
}

export async function listAppointments(db: SqlClient, scope: Scope): Promise<AppointmentRow[]> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<AppointmentRow>(
      `select * from appointments
        where household_id = $1
        order by due_at nulls last, created_at`,
      [scope.householdId],
    );
    return rows;
  });
}

export interface AppointmentInput {
  title: string;
  kind?: string;
  dueAt?: Date;
  who?: string;
  location?: string;
  notes?: string;
  source?: "auto" | "user";
}

export async function createAppointment(
  db: SqlClient,
  scope: Scope,
  input: AppointmentInput,
): Promise<AppointmentRow> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<AppointmentRow>(
      `insert into appointments (household_id, title, kind, due_at, who, location, notes, source)
       values ($1,$2,$3,$4,$5,$6,$7,coalesce($8,'user'))
       returning *`,
      [
        scope.householdId,
        input.title,
        input.kind ?? null,
        input.dueAt ?? null,
        input.who ?? null,
        input.location ?? null,
        input.notes ?? null,
        input.source ?? null,
      ],
    );
    return rows[0]!;
  });
}

export async function deleteAppointment(db: SqlClient, scope: Scope, id: string): Promise<boolean> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{ id: string }>(
      "delete from appointments where id = $1 and household_id = $2 returning id",
      [id, scope.householdId],
    );
    return rows.length > 0;
  });
}

// Reminders ------------------------------------------------------------------

export interface ReminderRow {
  id: string;
  user_id: string;
  item_id: string | null;
  title: string;
  remind_at: Date;
  channel: "email" | "push";
  sent_at: Date | null;
}

export async function listReminders(db: SqlClient, scope: Scope): Promise<ReminderRow[]> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<ReminderRow>(
      "select * from reminders where user_id = $1 order by remind_at",
      [scope.userId],
    );
    return rows;
  });
}

export interface ReminderInput {
  title: string;
  remindAt: Date;
  itemId?: string;
  channel?: "email" | "push";
}

export async function createReminder(
  db: SqlClient,
  scope: Scope,
  input: ReminderInput,
): Promise<ReminderRow> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<ReminderRow>(
      `insert into reminders (user_id, item_id, title, remind_at, channel)
       values ($1,$2,$3,$4,coalesce($5,'email'))
       returning *`,
      [scope.userId, input.itemId ?? null, input.title, input.remindAt, input.channel ?? null],
    );
    return rows[0]!;
  });
}

export async function markReminderSent(
  db: SqlClient,
  scope: Scope,
  id: string,
  at: Date = new Date(),
): Promise<boolean> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{ id: string }>(
      "update reminders set sent_at = $2 where id = $1 and user_id = $3 returning id",
      [id, at, scope.userId],
    );
    return rows.length > 0;
  });
}

// Commerce -------------------------------------------------------------------

export interface SubscriptionRow {
  id: string;
  household_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: "free" | "plus" | "family" | "b2b";
  status: string;
  current_period_end: Date | null;
  created_at: Date;
}

export async function getSubscription(
  db: SqlClient,
  scope: Scope,
): Promise<SubscriptionRow | undefined> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<SubscriptionRow>(
      "select * from subscriptions where household_id = $1 order by created_at desc limit 1",
      [scope.householdId],
    );
    return rows[0];
  });
}

export interface SubscriptionInput {
  plan: SubscriptionRow["plan"];
  status: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
}

export async function upsertSubscription(
  db: SqlClient,
  scope: Scope,
  input: SubscriptionInput,
): Promise<SubscriptionRow> {
  return asUser(db, scope.userId, async () => {
    const existing = await db.query<{ id: string }>(
      "select id from subscriptions where household_id = $1 order by created_at desc limit 1",
      [scope.householdId],
    );
    const id = existing.rows[0]?.id;
    if (id) {
      const { rows } = await db.query<SubscriptionRow>(
        `update subscriptions set
           plan = $2,
           status = $3,
           stripe_customer_id = coalesce($4, stripe_customer_id),
           stripe_subscription_id = coalesce($5, stripe_subscription_id),
           current_period_end = coalesce($6, current_period_end)
         where id = $1
         returning *`,
        [
          id,
          input.plan,
          input.status,
          input.stripeCustomerId ?? null,
          input.stripeSubscriptionId ?? null,
          input.currentPeriodEnd ?? null,
        ],
      );
      return rows[0]!;
    }
    const { rows } = await db.query<SubscriptionRow>(
      `insert into subscriptions (
         household_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end
       ) values ($1,$2,$3,$4,$5,$6)
       returning *`,
      [
        scope.householdId,
        input.plan,
        input.status,
        input.stripeCustomerId ?? null,
        input.stripeSubscriptionId ?? null,
        input.currentPeriodEnd ?? null,
      ],
    );
    return rows[0]!;
  });
}

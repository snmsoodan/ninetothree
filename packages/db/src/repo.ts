import { hashInviteToken, INVITE_TTL_MS } from "./invites";
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

/**
 * The members of the household, with the name and address to show for each.
 *
 * Separate from `listMembers` because that one is also the return type of
 * `setMemberRole`, which comes back from `returning *` and has no join to
 * carry. Two shapes, two jobs.
 */
export interface MemberDetailRow extends MemberRow {
  email: string;
  name: string | null;
}

export async function listMemberDetails(db: SqlClient, scope: Scope): Promise<MemberDetailRow[]> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<MemberDetailRow>(
      `select m.household_id, m.user_id, m.role, u.email, u.name
         from household_members m
         join users u on u.id = m.user_id
        where m.household_id = $1
        order by m.role, u.email`,
      [scope.householdId],
    );
    return rows;
  });
}

/**
 * Creates a household and makes `userId` its first parent.
 *
 * This is the one function here that cannot take a `Scope`, because the scope
 * is what it is creating. It takes a user id instead, and the two inserts run
 * in one transaction so a failure cannot leave a household with no members —
 * which would be a row nobody can see, delete, or ever find again.
 *
 * Idempotent by design: signing in twice must not produce two households. If
 * the person already belongs to one, that one is returned untouched.
 */
export async function createHousehold(
  db: SqlClient,
  userId: string,
  name?: string,
): Promise<{ id: string; created: boolean }> {
  return asUser(db, userId, async () => {
    const existing = await db.query<{ household_id: string }>(
      `select m.household_id
         from household_members m
         join households h on h.id = m.household_id
        where m.user_id = $1
        order by h.created_at, m.household_id
        limit 1`,
      [userId],
    );
    const found = existing.rows[0];
    if (found) return { id: found.household_id, created: false };

    // One statement, so the household and its first parent cannot come apart.
    const inserted = await db.query<{ household_id: string }>(
      `with h as (insert into households (name) values ($1) returning id)
       insert into household_members (household_id, user_id, role)
       select id, $2, 'parent' from h
       returning household_id`,
      [name ?? null, userId],
    );
    return { id: inserted.rows[0]!.household_id, created: true };
  });
}

/**
 * Removes the caller from their household.
 *
 * The last member out takes the household with them. A household with no
 * members is unreachable — every policy resolves through membership — so
 * leaving it behind would be leaving a row that no query can ever return and
 * no person can ever delete.
 *
 * Access is revoked by the delete itself: `app_household_ids()` reads this
 * table, so the next query in the next transaction sees nothing. There is no
 * cache to invalidate and no token to expire.
 */
export async function leaveHousehold(db: SqlClient, scope: Scope): Promise<boolean> {
  return asUser(db, scope.userId, async () => {
    const counted = await db.query<{ n: number }>(
      "select count(*)::int as n from household_members where household_id = $1",
      [scope.householdId],
    );
    const members = counted.rows[0]!.n;

    if (members <= 1) {
      const deleted = await db.query<{ id: string }>(
        "delete from households where id = $1 returning id",
        [scope.householdId],
      );
      return deleted.rows.length > 0;
    }

    const removed = await db.query<{ user_id: string }>(
      "delete from household_members where household_id = $1 and user_id = $2 returning user_id",
      [scope.householdId, scope.userId],
    );
    return removed.rows.length > 0;
  });
}

export class NotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotAllowedError";
  }
}

/**
 * Changes someone's role, including your own.
 *
 * Only a parent may do this, and the household must keep at least one parent.
 * Both rules are enforced here rather than in the UI, because a role is a
 * permission and a permission that is only checked in a form is not checked.
 */
export async function setMemberRole(
  db: SqlClient,
  scope: Scope,
  userId: string,
  role: HouseholdRole,
): Promise<MemberRow | undefined> {
  if (scope.role !== "parent") {
    throw new NotAllowedError("only a parent can change roles");
  }

  return asUser(db, scope.userId, async () => {
    if (role !== "parent") {
      const parents = await db.query<{ n: number }>(
        `select count(*)::int as n from household_members
          where household_id = $1 and role = 'parent'`,
        [scope.householdId],
      );
      const target = await db.query<{ role: HouseholdRole }>(
        "select role from household_members where household_id = $1 and user_id = $2",
        [scope.householdId, userId],
      );
      const wasParent = target.rows[0]?.role === "parent";
      if (wasParent && parents.rows[0]!.n <= 1) {
        throw new NotAllowedError("a household needs at least one parent");
      }
    }

    const { rows } = await db.query<MemberRow>(
      `update household_members set role = $3
        where household_id = $1 and user_id = $2
        returning *`,
      [scope.householdId, userId, role],
    );
    return rows[0];
  });
}

/**
 * Removes someone else from the household.
 *
 * A parent can remove anyone; anyone can remove themselves, which is what
 * `leaveHousehold` does. Removing the last parent is refused for the same
 * reason demoting them is.
 */
export async function removeMember(db: SqlClient, scope: Scope, userId: string): Promise<boolean> {
  if (scope.role !== "parent" && userId !== scope.userId) {
    throw new NotAllowedError("only a parent can remove someone else");
  }
  if (userId === scope.userId) return leaveHousehold(db, scope);

  return asUser(db, scope.userId, async () => {
    // No "last parent" guard here, unlike `setMemberRole`. Reaching this point
    // means the caller is a parent and is removing someone else, so if the
    // target is a parent there are at least two and one survives.
    const { rows } = await db.query<{ user_id: string }>(
      "delete from household_members where household_id = $1 and user_id = $2 returning user_id",
      [scope.householdId, userId],
    );
    return rows.length > 0;
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

// Invites --------------------------------------------------------------------

export interface InviteRow {
  id: string;
  household_id: string;
  role: HouseholdRole;
  created_by: string | null;
  expires_at: Date;
  used_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
}

export interface InvitePreview {
  householdName: string | null;
  inviterName: string | null;
  role: HouseholdRole;
}

/**
 * Issues an invite and returns the token, which is the only time it exists.
 *
 * Only a parent may invite, and only a parent may hand out the parent role —
 * otherwise a partner could promote themselves by inviting a second account.
 * The token is returned rather than stored, so the caller has to put it in a
 * link immediately; there is no way to read it back later.
 */
export async function createInvite(
  db: SqlClient,
  scope: Scope,
  role: HouseholdRole,
  options: { token: string; ttlMs?: number; now?: Date },
): Promise<{ id: string; expiresAt: Date }> {
  if (scope.role !== "parent") {
    throw new NotAllowedError("only a parent can invite someone");
  }

  const now = options.now ?? new Date();
  const expiresAt = new Date(now.getTime() + (options.ttlMs ?? INVITE_TTL_MS));

  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{ id: string; expires_at: Date }>(
      `insert into household_invites (household_id, role, token_hash, created_by, expires_at)
       values ($1, $2, $3, $4, $5)
       returning id, expires_at`,
      [scope.householdId, role, hashInviteToken(options.token), scope.userId, expiresAt],
    );
    const row = rows[0]!;
    return { id: row.id, expiresAt: row.expires_at };
  });
}

/**
 * The invites this household has issued that are still usable.
 *
 * Used and revoked ones are left out rather than shown greyed out: a list of
 * dead links is a list of things to worry about, and the only action on this
 * screen is "revoke".
 */
export async function listInvites(db: SqlClient, scope: Scope): Promise<InviteRow[]> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<InviteRow>(
      `select id, household_id, role, created_by, expires_at, used_at, revoked_at, created_at
         from household_invites
        where household_id = $1
          and used_at is null
          and revoked_at is null
          and expires_at > now()
        order by created_at desc`,
      [scope.householdId],
    );
    return rows;
  });
}

/**
 * Revokes an invite.
 *
 * Immediate, because the accept function checks `revoked_at` inside the same
 * transaction that consumes the token. There is no window between "revoked" and
 * "cannot be used".
 */
export async function revokeInvite(db: SqlClient, scope: Scope, id: string): Promise<boolean> {
  if (scope.role !== "parent") {
    throw new NotAllowedError("only a parent can revoke an invite");
  }
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{ id: string }>(
      `update household_invites set revoked_at = now()
        where id = $1 and household_id = $2 and used_at is null and revoked_at is null
        returning id`,
      [id, scope.householdId],
    );
    return rows.length > 0;
  });
}

/**
 * What the join page can say before anyone has signed in.
 *
 * Deliberately not scoped: the person holding the link is not a member yet, so
 * there is no scope to give. The function behind it returns nothing for an
 * expired, used or revoked invite, which is why the page can say "this link has
 * been used" without confirming that the household exists.
 */
export async function previewInvite(
  db: SqlClient,
  token: string,
): Promise<InvitePreview | undefined> {
  const { rows } = await db.query<{
    household_name: string | null;
    inviter_name: string | null;
    role: HouseholdRole;
  }>("select household_name, inviter_name, role from preview_household_invite($1)", [
    hashInviteToken(token),
  ]);
  const row = rows[0];
  if (!row) return undefined;
  return { householdName: row.household_name, inviterName: row.inviter_name, role: row.role };
}

/**
 * Accepts an invite, joining the household it points at.
 *
 * Returns `undefined` for a link that is expired, already used, or revoked —
 * the three cases are deliberately indistinguishable, because telling someone
 * which one it was tells them something about a household they are not in.
 *
 * Joining means leaving: a person is in one household at a time, and the
 * function deletes the old membership (and the old household, if it is now
 * empty) in the same transaction.
 */
export async function acceptInvite(
  db: SqlClient,
  userId: string,
  token: string,
): Promise<{ householdId: string } | undefined> {
  return asUser(db, userId, async () => {
    const { rows } = await db.query<{ household_id: string | null }>(
      "select accept_household_invite($1, $2) as household_id",
      [hashInviteToken(token), userId],
    );
    const householdId = rows[0]?.household_id;
    return householdId ? { householdId } : undefined;
  });
}

/* -------------------------------------------------------------------------- */
/* Shared pins                                                                */
/* -------------------------------------------------------------------------- */

export interface SharedItemRow {
  itemId: string;
  title: string;
  packTitle: string | null;
  stagePackId: string | null;
  sharedBy: string;
  createdAt: Date;
}

export interface ShareItemInput {
  itemId: string;
  title: string;
  stagePackId?: string | null;
  packTitle?: string | null;
}

/**
 * Sharing is a copy, not a flag.
 *
 * The private row stays in `item_state`, which is self-only by policy. What
 * lands here is the title and the week it came from — never the note, because
 * this table has no column to put one in.
 */
export async function shareItem(db: SqlClient, scope: Scope, item: ShareItemInput): Promise<void> {
  await asUser(db, scope.userId, async () => {
    await db.query(
      `insert into shared_items (household_id, item_id, stage_pack_id, title, pack_title, shared_by)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (household_id, item_id) do update
         set title = excluded.title,
             pack_title = excluded.pack_title,
             stage_pack_id = excluded.stage_pack_id`,
      [
        scope.householdId,
        item.itemId,
        item.stagePackId ?? null,
        item.title,
        item.packTitle ?? null,
        scope.userId,
      ],
    );
  });
}

/** Returns whether anything was there to remove. */
export async function unshareItem(db: SqlClient, scope: Scope, itemId: string): Promise<boolean> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{ item_id: string }>(
      "delete from shared_items where household_id = $1 and item_id = $2 returning item_id",
      [scope.householdId, itemId],
    );
    return rows.length > 0;
  });
}

export async function listSharedItems(db: SqlClient, scope: Scope): Promise<SharedItemRow[]> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{
      item_id: string;
      title: string;
      pack_title: string | null;
      stage_pack_id: string | null;
      shared_by: string;
      created_at: Date;
    }>(
      `select item_id, title, pack_title, stage_pack_id, shared_by, created_at
         from shared_items
        where household_id = $1
        order by created_at desc, item_id`,
      [scope.householdId],
    );
    return rows.map((r) => ({
      itemId: r.item_id,
      title: r.title,
      packTitle: r.pack_title,
      stagePackId: r.stage_pack_id,
      sharedBy: r.shared_by,
      createdAt: r.created_at,
    }));
  });
}

export type JobStatus = "open" | "done" | "dropped";

export interface JobRow {
  id: string;
  itemId: string;
  title: string;
  packTitle: string | null;
  stagePackId: string | null;
  assignedTo: string;
  assignedBy: string;
  status: JobStatus;
  doneAt: Date | null;
  createdAt: Date;
}

export interface AssignJobInput {
  itemId: string;
  title: string;
  packTitle?: string | null;
  stagePackId?: string | null;
  assignedTo: string;
}

/**
 * Hands an action to somebody else in the household.
 *
 * Assigning the same action twice replaces the open job rather than stacking a
 * second one, so a double tap does not leave two identical rows on the other
 * person's page. A job that is already done is left alone: re-assigning
 * something finished should not silently reopen it.
 */
export async function assignJob(
  db: SqlClient,
  scope: Scope,
  input: AssignJobInput,
): Promise<JobRow> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{
      id: string;
      item_id: string;
      title: string;
      pack_title: string | null;
      stage_pack_id: string | null;
      assigned_to: string;
      assigned_by: string;
      status: JobStatus;
      done_at: Date | null;
      created_at: Date;
    }>(
      `insert into jobs (
         household_id, item_id, stage_pack_id, title, pack_title, assigned_to, assigned_by
       ) values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (household_id, item_id) where status = 'open'
       do update set
         title = excluded.title,
         pack_title = excluded.pack_title,
         stage_pack_id = excluded.stage_pack_id,
         assigned_to = excluded.assigned_to,
         assigned_by = excluded.assigned_by
       returning id, item_id, title, pack_title, stage_pack_id,
                 assigned_to, assigned_by, status, done_at, created_at`,
      [
        scope.householdId,
        input.itemId,
        input.stagePackId ?? null,
        input.title,
        input.packTitle ?? null,
        input.assignedTo,
        scope.userId,
      ],
    );
    const row = rows[0]!;
    return {
      id: row.id,
      itemId: row.item_id,
      title: row.title,
      packTitle: row.pack_title,
      stagePackId: row.stage_pack_id,
      assignedTo: row.assigned_to,
      assignedBy: row.assigned_by,
      status: row.status,
      doneAt: row.done_at,
      createdAt: row.created_at,
    };
  });
}

/** Every job in the household, open ones first, then the newest. */
export async function listJobs(db: SqlClient, scope: Scope): Promise<JobRow[]> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{
      id: string;
      item_id: string;
      title: string;
      pack_title: string | null;
      stage_pack_id: string | null;
      assigned_to: string;
      assigned_by: string;
      status: JobStatus;
      done_at: Date | null;
      created_at: Date;
    }>(
      `select id, item_id, title, pack_title, stage_pack_id,
              assigned_to, assigned_by, status, done_at, created_at
         from jobs
        where household_id = $1
        order by (status = 'open') desc, created_at desc, id`,
      [scope.householdId],
    );
    return rows.map((r) => ({
      id: r.id,
      itemId: r.item_id,
      title: r.title,
      packTitle: r.pack_title,
      stagePackId: r.stage_pack_id,
      assignedTo: r.assigned_to,
      assignedBy: r.assigned_by,
      status: r.status,
      doneAt: r.done_at,
      createdAt: r.created_at,
    }));
  });
}

/**
 * Moves a job's status.
 *
 * Anyone in the household can do this, not just the person it was handed to.
 * A job is a shared fact about who is doing what, and the person who asked is
 * often the one who knows it is finished.
 */
export async function setJobStatus(
  db: SqlClient,
  scope: Scope,
  jobId: string,
  status: JobStatus,
): Promise<JobRow | undefined> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{
      id: string;
      item_id: string;
      title: string;
      pack_title: string | null;
      stage_pack_id: string | null;
      assigned_to: string;
      assigned_by: string;
      status: JobStatus;
      done_at: Date | null;
      created_at: Date;
    }>(
      `update jobs
          set status = $3,
              done_at = case when $3 = 'done' then now() else null end
        where household_id = $1 and id = $2
        returning id, item_id, title, pack_title, stage_pack_id,
                  assigned_to, assigned_by, status, done_at, created_at`,
      [scope.householdId, jobId, status],
    );
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      itemId: row.item_id,
      title: row.title,
      packTitle: row.pack_title,
      stagePackId: row.stage_pack_id,
      assignedTo: row.assigned_to,
      assignedBy: row.assigned_by,
      status: row.status,
      doneAt: row.done_at,
      createdAt: row.created_at,
    };
  });
}

/** Takes a job off the list entirely. Returns whether there was one. */
export async function removeJob(db: SqlClient, scope: Scope, jobId: string): Promise<boolean> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{ id: string }>(
      `delete from jobs where household_id = $1 and id = $2 returning id`,
      [scope.householdId, jobId],
    );
    return rows.length > 0;
  });
}

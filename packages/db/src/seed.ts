import { PACKS, type StagePack } from "@ninetothree/content";
import type { SqlClient } from "./migrate";

/*
 * A local database you can actually look at.
 *
 * Every id here is fixed, not generated. That is the whole point: a seed whose
 * ids change on every run cannot be used in a test, cannot be pasted into a
 * bug report, and cannot be referred to in a screenshot. `00000000-0000-4000-
 * 8000-0000000000NN` is a valid v4-shaped UUID, so nothing downstream has to
 * know it is synthetic.
 */

const id = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const SEED = {
  users: {
    maya: id(1),
    dev: id(2),
    priya: id(3),
    tom: id(4),
    ingrid: id(5),
  },
  households: {
    alvarez: id(101),
    okafor: id(102),
    lindqvist: id(103),
  },
  pregnancies: {
    alvarez: id(201),
    okafor: id(202),
  },
  children: {
    alvarez: id(301),
    lindqvist: id(302),
  },
  appointments: {
    datingScan: id(401),
    anomalyScan: id(402),
    glucose: id(403),
    fourMonth: id(404),
    custom: id(405),
  },
  reminders: {
    anomalyScan: id(501),
    pediatrician: id(502),
  },
  subscriptions: {
    alvarez: id(601),
    okafor: id(602),
    lindqvist: id(603),
  },
} as const;

export interface SeedReport {
  packs: number;
  users: number;
  households: number;
  pregnancies: number;
  children: number;
  itemStates: number;
  appointments: number;
  reminders: number;
  subscriptions: number;
  progress: number;
}

export interface SeedOptions {
  /** Insert the stage packs. Default true. */
  packs?: boolean;
  /** Which packs to insert. Defaults to the 85 shipped ones. */
  packList?: readonly StagePack[];
}

/**
 * Refuses to touch a database that is not obviously local.
 *
 * A seed deletes rows. The one thing it must never do is delete somebody's
 * real pregnancy because a `DATABASE_URL` was exported in the wrong shell.
 */
export function assertSafeToSeed(databaseUrl: string, force = false): void {
  if (force) return;
  let host: string;
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    throw new Error(`DATABASE_URL is not a URL: ${databaseUrl}`);
  }
  const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "";
  if (!local) {
    throw new Error(`refusing to seed ${host}: this deletes rows. Pass --force if you are sure.`);
  }
}

const ITEM_STATES: ReadonlyArray<{
  user: keyof typeof SEED.users;
  itemId: string;
  packId: string;
  state: "done" | "skipped" | "snoozed";
  title: string;
  packTitle: string;
  skipReason?: "not-now" | "already-done" | "not-for-me";
  pinned?: boolean;
  pinnedAt?: string;
  snoozedUntil?: string;
  remindOn?: string;
  choiceOptionId?: string;
  choiceLabel?: string;
}> = [
  // Maya, 28 weeks pregnant. The realistic middle: some done, one skipped,
  // two pinned because she keeps needing them.
  {
    user: "maya",
    itemId: "pregnancy-w28-book-antenatal",
    packId: "pregnancy-w28",
    state: "done",
    title: "Book your 28-week appointment",
    packTitle: "Week 28",
  },
  {
    user: "maya",
    itemId: "pregnancy-w28-count-kicks",
    packId: "pregnancy-w28",
    state: "done",
    title: "Start counting kicks",
    packTitle: "Week 28",
  },
  {
    user: "maya",
    itemId: "pregnancy-w28-glucose-test",
    packId: "pregnancy-w28",
    state: "done",
    title: "Have your glucose test",
    packTitle: "Week 28",
  },
  {
    user: "maya",
    itemId: "pregnancy-w28-buy-pillow",
    packId: "pregnancy-w28",
    state: "skipped",
    title: "Try a pregnancy pillow",
    packTitle: "Week 28",
    skipReason: "not-for-me",
  },
  {
    user: "maya",
    itemId: "pregnancy-w28-know-preeclampsia",
    packId: "pregnancy-w28",
    state: "done",
    title: "Know the signs of pre-eclampsia",
    packTitle: "Week 28",
    pinned: true,
    pinnedAt: "2026-09-14T09:00:00Z",
  },
  {
    user: "maya",
    itemId: "pregnancy-w28-ask-birth-plan",
    packId: "pregnancy-w28",
    state: "snoozed",
    title: "Start your birth preferences",
    packTitle: "Week 28",
    snoozedUntil: "2026-10-01",
    remindOn: "2026-09-28",
  },
  {
    user: "maya",
    itemId: "pregnancy-w24-buy-carrier",
    packId: "pregnancy-w24",
    state: "done",
    title: "Choose a baby carrier",
    packTitle: "Week 24",
    choiceOptionId: "ergobaby-omni-360",
    choiceLabel: "Ergobaby Omni 360",
  },
  {
    user: "maya",
    itemId: "pregnancy-w24-book-childbirth-class",
    packId: "pregnancy-w24",
    state: "done",
    title: "Book a childbirth class",
    packTitle: "Week 24",
  },
  {
    user: "maya",
    itemId: "pregnancy-w20-anomaly-scan",
    packId: "pregnancy-w20",
    state: "done",
    title: "Have your anomaly scan",
    packTitle: "Week 20",
  },
  {
    user: "maya",
    itemId: "pregnancy-w20-know-movements",
    packId: "pregnancy-w20",
    state: "done",
    title: "Learn what movements to expect",
    packTitle: "Week 20",
  },
  {
    user: "maya",
    itemId: "pregnancy-w16-book-dentist",
    packId: "pregnancy-w16",
    state: "skipped",
    title: "Book a dental check",
    packTitle: "Week 16",
    skipReason: "already-done",
  },
  {
    user: "maya",
    itemId: "pregnancy-w12-dating-scan",
    packId: "pregnancy-w12",
    state: "done",
    title: "Have your dating scan",
    packTitle: "Week 12",
  },
  {
    user: "maya",
    itemId: "pregnancy-w12-tell-work",
    packId: "pregnancy-w12",
    state: "done",
    title: "Tell your employer",
    packTitle: "Week 12",
  },
  {
    user: "maya",
    itemId: "pregnancy-w8-first-appointment",
    packId: "pregnancy-w8",
    state: "done",
    title: "Book your first appointment",
    packTitle: "Week 8",
  },
  {
    user: "maya",
    itemId: "pregnancy-w8-start-folic-acid",
    packId: "pregnancy-w8",
    state: "done",
    title: "Start a prenatal vitamin",
    packTitle: "Week 8",
  },
  {
    user: "maya",
    itemId: "pregnancy-w8-know-nausea",
    packId: "pregnancy-w8",
    state: "done",
    title: "Know what nausea is normal",
    packTitle: "Week 8",
  },
  {
    user: "maya",
    itemId: "pregnancy-w8-quit-alcohol",
    packId: "pregnancy-w8",
    state: "done",
    title: "Stop alcohol and smoking",
    packTitle: "Week 8",
  },
  {
    user: "maya",
    itemId: "pregnancy-w4-start-folic-acid",
    packId: "pregnancy-w4",
    state: "done",
    title: "Start folic acid",
    packTitle: "Week 4",
  },
  {
    user: "maya",
    itemId: "pregnancy-w4-know-ectopic",
    packId: "pregnancy-w4",
    state: "done",
    title: "Know the signs of ectopic pregnancy",
    packTitle: "Week 4",
    pinned: true,
    pinnedAt: "2026-06-02T09:00:00Z",
  },

  // Dev, Maya's partner. A short list, because a partner's list is short.
  {
    user: "dev",
    itemId: "pregnancy-w28-know-preeclampsia",
    packId: "pregnancy-w28",
    state: "done",
    title: "Know the signs of pre-eclampsia",
    packTitle: "Week 28",
  },
  {
    user: "dev",
    itemId: "pregnancy-w24-book-childbirth-class",
    packId: "pregnancy-w24",
    state: "done",
    title: "Book a childbirth class",
    packTitle: "Week 24",
  },
  {
    user: "dev",
    itemId: "pregnancy-w20-anomaly-scan",
    packId: "pregnancy-w20",
    state: "done",
    title: "Come to the anomaly scan",
    packTitle: "Week 20",
  },
  {
    user: "dev",
    itemId: "pregnancy-w12-tell-work",
    packId: "pregnancy-w12",
    state: "skipped",
    title: "Tell your employer",
    packTitle: "Week 12",
    skipReason: "not-now",
  },
  {
    user: "dev",
    itemId: "pregnancy-w8-know-nausea",
    packId: "pregnancy-w8",
    state: "done",
    title: "Know what nausea is normal",
    packTitle: "Week 8",
  },

  // Priya, 6 weeks pregnant with her second.
  {
    user: "priya",
    itemId: "pregnancy-w6-book-first-visit",
    packId: "pregnancy-w6",
    state: "done",
    title: "Book your first visit",
    packTitle: "Week 6",
  },
  {
    user: "priya",
    itemId: "pregnancy-w6-start-folic-acid",
    packId: "pregnancy-w6",
    state: "done",
    title: "Start folic acid",
    packTitle: "Week 6",
  },
  {
    user: "priya",
    itemId: "pregnancy-w6-tell-someone",
    packId: "pregnancy-w6",
    state: "snoozed",
    title: "Tell someone you trust",
    packTitle: "Week 6",
    snoozedUntil: "2026-11-01",
  },
  {
    user: "priya",
    itemId: "pregnancy-w6-know-ectopic",
    packId: "pregnancy-w6",
    state: "done",
    title: "Know the signs of ectopic pregnancy",
    packTitle: "Week 6",
    pinned: true,
    pinnedAt: "2026-10-10T09:00:00Z",
  },
  {
    user: "priya",
    itemId: "pregnancy-w6-buy-folic-acid",
    packId: "pregnancy-w6",
    state: "done",
    title: "Buy a prenatal vitamin",
    packTitle: "Week 6",
    choiceOptionId: "nature-made-prenatal",
    choiceLabel: "Nature Made Prenatal",
  },

  // Tom, Priya's partner.
  {
    user: "tom",
    itemId: "pregnancy-w6-know-ectopic",
    packId: "pregnancy-w6",
    state: "done",
    title: "Know the signs of ectopic pregnancy",
    packTitle: "Week 6",
  },
  {
    user: "tom",
    itemId: "pregnancy-w6-tell-someone",
    packId: "pregnancy-w6",
    state: "skipped",
    title: "Tell someone you trust",
    packTitle: "Week 6",
    skipReason: "not-now",
  },

  // Ingrid, whose daughter is 4 months old.
  {
    user: "ingrid",
    itemId: "infant-month-4-book-four-month",
    packId: "infant-month-4",
    state: "done",
    title: "Book the four-month visit",
    packTitle: "Month 4",
  },
  {
    user: "ingrid",
    itemId: "infant-month-4-know-rollover",
    packId: "infant-month-4",
    state: "done",
    title: "Know when rolling starts",
    packTitle: "Month 4",
  },
  {
    user: "ingrid",
    itemId: "infant-month-4-safe-sleep",
    packId: "infant-month-4",
    state: "done",
    title: "Check the sleep space",
    packTitle: "Month 4",
    pinned: true,
    pinnedAt: "2026-08-20T09:00:00Z",
  },
  {
    user: "ingrid",
    itemId: "infant-month-4-start-solids-talk",
    packId: "infant-month-4",
    state: "snoozed",
    title: "Ask about starting solids",
    packTitle: "Month 4",
    snoozedUntil: "2026-11-15",
    remindOn: "2026-11-10",
  },
  {
    user: "ingrid",
    itemId: "infant-month-3-book-three-month",
    packId: "infant-month-3",
    state: "done",
    title: "Book the three-month check",
    packTitle: "Month 3",
  },
  {
    user: "ingrid",
    itemId: "infant-month-3-tummy-time",
    packId: "infant-month-3",
    state: "done",
    title: "Try tummy time",
    packTitle: "Month 3",
  },
  {
    user: "ingrid",
    itemId: "postpartum-week-6-know-colic",
    packId: "postpartum-week-6",
    state: "skipped",
    title: "Read about colic",
    packTitle: "Week 6",
    skipReason: "not-for-me",
  },
  {
    user: "ingrid",
    itemId: "postpartum-week-1-first-visit",
    packId: "postpartum-week-1",
    state: "done",
    title: "Go to the first well visit",
    packTitle: "Week 1",
  },
  {
    user: "ingrid",
    itemId: "postpartum-week-1-safe-sleep",
    packId: "postpartum-week-1",
    state: "done",
    title: "Set up the sleep space",
    packTitle: "Week 1",
    pinned: true,
    pinnedAt: "2026-06-25T09:00:00Z",
  },
];

const PROGRESS: ReadonlyArray<{
  user: keyof typeof SEED.users;
  packId: string;
  state: "complete" | "in_progress";
  forced?: boolean;
  completedAt?: string;
}> = [
  { user: "maya", packId: "pregnancy-w4", state: "complete", completedAt: "2026-06-05T09:00:00Z" },
  { user: "maya", packId: "pregnancy-w8", state: "complete", completedAt: "2026-07-03T09:00:00Z" },
  { user: "maya", packId: "pregnancy-w12", state: "complete", completedAt: "2026-07-31T09:00:00Z" },
  {
    user: "maya",
    packId: "pregnancy-w16",
    state: "complete",
    forced: true,
    completedAt: "2026-08-28T09:00:00Z",
  },
  { user: "maya", packId: "pregnancy-w20", state: "complete", completedAt: "2026-09-04T09:00:00Z" },
  { user: "maya", packId: "pregnancy-w24", state: "complete", completedAt: "2026-09-11T09:00:00Z" },
  { user: "maya", packId: "pregnancy-w28", state: "in_progress" },
  { user: "dev", packId: "pregnancy-w8", state: "complete", completedAt: "2026-07-03T09:00:00Z" },
  { user: "dev", packId: "pregnancy-w20", state: "complete", completedAt: "2026-09-04T09:00:00Z" },
  { user: "priya", packId: "pregnancy-w6", state: "in_progress" },
  {
    user: "ingrid",
    packId: "postpartum-week-1",
    state: "complete",
    completedAt: "2026-06-25T09:00:00Z",
  },
  {
    user: "ingrid",
    packId: "postpartum-week-6",
    state: "complete",
    completedAt: "2026-07-30T09:00:00Z",
  },
  {
    user: "ingrid",
    packId: "infant-month-3",
    state: "complete",
    completedAt: "2026-09-02T09:00:00Z",
  },
  { user: "ingrid", packId: "infant-month-4", state: "in_progress" },
];

/**
 * Writes the fixtures. Idempotent: running it twice leaves the same rows.
 *
 * The personal tables are cleared first, in reverse dependency order, because
 * a seed that accumulates is a seed you cannot trust after the third run.
 * Content tables are upserted, never cleared — they are not fixtures.
 */
export async function seed(db: SqlClient, options: SeedOptions = {}): Promise<SeedReport> {
  const withPacks = options.packs ?? true;
  const packList = options.packList ?? PACKS;

  await db.exec("begin");
  try {
    await db.exec(`
      delete from content_events;
      delete from reminders;
      delete from item_state;
      delete from stage_progress;
      delete from appointments;
      delete from subscriptions;
      delete from children;
      delete from pregnancies;
      delete from household_members;
      delete from households;
      delete from users;
    `);

    let packs = 0;
    if (withPacks) {
      for (const pack of packList) {
        await db.query(
          `insert into stage_packs (
             id, kind, stage_index, stage_unit, locale, country, title, subtitle,
             baby, you, payload, status, reviewed_by, reviewed_at, published_at
           ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'published',$12,$13,now())
           on conflict (id) do update set
             kind = excluded.kind,
             stage_index = excluded.stage_index,
             stage_unit = excluded.stage_unit,
             title = excluded.title,
             subtitle = excluded.subtitle,
             baby = excluded.baby,
             you = excluded.you,
             payload = excluded.payload,
             status = excluded.status,
             reviewed_by = excluded.reviewed_by,
             reviewed_at = excluded.reviewed_at`,
          [
            pack.id,
            pack.kind,
            pack.stageIndex,
            pack.stageUnit,
            pack.locale,
            pack.country,
            pack.title,
            pack.subtitle ?? null,
            pack.baby?.development ?? null,
            pack.you?.body ?? null,
            JSON.stringify(pack),
            pack.reviewedBy,
            pack.reviewedAt,
          ],
        );
        packs += 1;
      }
    }

    const users: ReadonlyArray<[string, string, string, string]> = [
      [SEED.users.maya, "maya@example.com", "Maya Alvarez", "America/New_York"],
      [SEED.users.dev, "dev@example.com", "Dev Alvarez", "America/New_York"],
      [SEED.users.priya, "priya@example.com", "Priya Okafor", "America/Chicago"],
      [SEED.users.tom, "tom@example.com", "Tom Okafor", "America/Chicago"],
      [SEED.users.ingrid, "ingrid@example.com", "Ingrid Lindqvist", "America/Los_Angeles"],
    ];
    for (const [userId, email, name, timezone] of users) {
      await db.query("insert into users (id, email, name, timezone) values ($1,$2,$3,$4)", [
        userId,
        email,
        name,
        timezone,
      ]);
    }

    const households: ReadonlyArray<[string, string]> = [
      [SEED.households.alvarez, "The Alvarez family"],
      [SEED.households.okafor, "The Okafor family"],
      [SEED.households.lindqvist, "The Lindqvist family"],
    ];
    for (const [householdId, name] of households) {
      await db.query("insert into households (id, name) values ($1,$2)", [householdId, name]);
    }

    const members: ReadonlyArray<[string, string, string]> = [
      [SEED.households.alvarez, SEED.users.maya, "parent"],
      [SEED.households.alvarez, SEED.users.dev, "partner"],
      [SEED.households.okafor, SEED.users.priya, "parent"],
      [SEED.households.okafor, SEED.users.tom, "partner"],
      [SEED.households.lindqvist, SEED.users.ingrid, "parent"],
    ];
    for (const [householdId, userId, role] of members) {
      await db.query(
        "insert into household_members (household_id, user_id, role) values ($1,$2,$3)",
        [householdId, userId, role],
      );
    }

    await db.query(
      `insert into pregnancies (id, household_id, due_date, start_date, parity, status)
       values ($1,$2,'2026-12-21','2026-03-16',0,'active')`,
      [SEED.pregnancies.alvarez, SEED.households.alvarez],
    );
    await db.query(
      `insert into pregnancies (id, household_id, due_date, start_date, parity, status)
       values ($1,$2,'2027-06-02','2026-08-26',1,'active')`,
      [SEED.pregnancies.okafor, SEED.households.okafor],
    );

    await db.query(
      `insert into children (id, household_id, birth_date, due_date, corrected_age, feeding, birth_type)
       values ($1,$2,'2026-06-18','2026-06-25',true,'breast','vaginal')`,
      [SEED.children.alvarez, SEED.households.alvarez],
    );
    await db.query(
      `insert into children (id, household_id, birth_date, due_date, corrected_age, feeding, birth_type)
       values ($1,$2,'2026-06-01','2026-06-01',false,'mixed','c-section')`,
      [SEED.children.lindqvist, SEED.households.lindqvist],
    );

    for (const item of ITEM_STATES) {
      await db.query(
        `insert into item_state (
           user_id, item_id, stage_pack_id, state, skip_reason, pinned, pinned_at,
           snoozed_until, remind_on, title, pack_title, choice_option_id, choice_label, chosen_at
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          SEED.users[item.user],
          item.itemId,
          item.packId,
          item.state,
          item.skipReason ?? null,
          item.pinned ?? false,
          item.pinnedAt ?? null,
          item.snoozedUntil ?? null,
          item.remindOn ?? null,
          item.title,
          item.packTitle,
          item.choiceOptionId ?? null,
          item.choiceLabel ?? null,
          item.choiceOptionId ? "2026-09-01T09:00:00Z" : null,
        ],
      );
    }

    for (const row of PROGRESS) {
      await db.query(
        `insert into stage_progress (user_id, stage_pack_id, state, forced, completed_at)
         values ($1,$2,$3,$4,$5)`,
        [SEED.users[row.user], row.packId, row.state, row.forced ?? false, row.completedAt ?? null],
      );
    }

    const appointments: ReadonlyArray<[string, string, string, string, string, string, string]> = [
      [
        SEED.appointments.datingScan,
        SEED.households.alvarez,
        "Dating scan",
        "scan",
        "2026-06-04T14:30:00Z",
        "Dr Chen",
        "Riverside Women's Health",
      ],
      [
        SEED.appointments.anomalyScan,
        SEED.households.alvarez,
        "Anomaly scan",
        "scan",
        "2026-08-06T14:30:00Z",
        "Dr Chen",
        "Riverside Women's Health",
      ],
      [
        SEED.appointments.glucose,
        SEED.households.alvarez,
        "Glucose test",
        "test",
        "2026-09-24T08:00:00Z",
        "Nurse Adeyemi",
        "Riverside Women's Health",
      ],
      [
        SEED.appointments.fourMonth,
        SEED.households.lindqvist,
        "Four-month well visit",
        "well-visit",
        "2026-10-06T16:00:00Z",
        "Dr Park",
        "Sunset Pediatrics",
      ],
      [
        SEED.appointments.custom,
        SEED.households.okafor,
        "Call the midwife back",
        "call",
        "2026-10-28T17:00:00Z",
        null as unknown as string,
        null as unknown as string,
      ],
    ];
    for (const [appointmentId, householdId, title, kind, dueAt, who, location] of appointments) {
      await db.query(
        `insert into appointments (id, household_id, title, kind, due_at, who, location, source)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          appointmentId,
          householdId,
          title,
          kind,
          dueAt,
          who,
          location,
          appointmentId === SEED.appointments.custom ? "user" : "auto",
        ],
      );
    }

    await db.query(
      `insert into reminders (id, user_id, item_id, title, remind_at, channel)
       values ($1,$2,'pregnancy-w28-ask-birth-plan','Start your birth preferences','2026-09-28T09:00:00Z','email')`,
      [SEED.reminders.anomalyScan, SEED.users.maya],
    );
    await db.query(
      `insert into reminders (id, user_id, item_id, title, remind_at, channel)
       values ($1,$2,'infant-month-4-start-solids-talk','Ask about starting solids','2026-11-10T09:00:00Z','push')`,
      [SEED.reminders.pediatrician, SEED.users.ingrid],
    );

    const subscriptions: ReadonlyArray<[string, string, string, string]> = [
      [SEED.subscriptions.alvarez, SEED.households.alvarez, "plus", "active"],
      [SEED.subscriptions.okafor, SEED.households.okafor, "free", "active"],
      [SEED.subscriptions.lindqvist, SEED.households.lindqvist, "family", "active"],
    ];
    for (const [subscriptionId, householdId, plan, status] of subscriptions) {
      await db.query(
        "insert into subscriptions (id, household_id, plan, status) values ($1,$2,$3,$4)",
        [subscriptionId, householdId, plan, status],
      );
    }

    await db.exec("commit");

    return {
      packs,
      users: users.length,
      households: households.length,
      pregnancies: 2,
      children: 2,
      itemStates: ITEM_STATES.length,
      appointments: appointments.length,
      reminders: 2,
      subscriptions: subscriptions.length,
      progress: PROGRESS.length,
    };
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}

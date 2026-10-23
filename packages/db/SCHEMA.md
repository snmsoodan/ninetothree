# The database schema

Postgres 16 on Neon in production. Drizzle for the typed schema and the queries.
Migrations are hand-written SQL, in pairs, in `packages/db/migrations/`.

This file is the reference for what is in the database and why. `ARCHITECTURE.md`
§4 is the design; this is the record of what was actually built, including the
places where the design and the shipped code disagreed.

## How a migration works

Each migration is two files with the same stem:

```
migrations/0001_init.up.sql
migrations/0001_init.down.sql
```

`loadMigrations` refuses to load a migration whose down file is missing. That is
deliberate: a forward-only migration is a migration nobody has thought about
reversing, and the reverse is where the missing `on delete` and the forgotten
index show up.

`migrateUp` applies every unapplied file in name order. Each one runs inside its
own transaction together with the insert into `_migrations`, so a failure leaves
the database exactly as it was rather than half-migrated. `migrateDown` runs the
matching down files newest-first, and refuses to roll back more than has been
applied — a rollback that quietly did less than asked is how a deploy script
ends up believing it reverted something it did not.

The down files exist so the migration can be **proven reversible on a fresh
database**. They are not a production rollback plan. Once a migration has run
against a database holding a parent's data, the way back is a new forward
migration, not `down`.

`create extension` is in the up file and deliberately absent from the down.
`citext` and `pg_trgm` are shared with anything else in the database; dropping
them would be a destructive act disguised as a rollback. What the down
guarantees is that no table of ours survives it.

## The tables

Fifteen, in dependency order.

| Table               | Holds                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `users`             | One row per person. Email is `citext`, so `A@B.com` and `a@b.COM` are the same account.     |
| `households`        | The unit a subscription and a set of appointments belong to.                                |
| `household_members` | Who is in a household, and as what.                                                         |
| `pregnancies`       | A due date, and whether it is still active.                                                 |
| `children`          | A birth date, and whether the age should be corrected for prematurity.                      |
| `stage_packs`       | The published content. `payload` is the whole validated pack as JSON.                       |
| `content_sources`   | Where each pack's claims come from, one row per source.                                     |
| `link_catalogue`    | The 251 places we send people, with the domains they serve and when they were last checked. |
| `stage_progress`    | Whether a parent has finished a week, and whether they said so or the steps did.            |
| `item_state`        | Everything a parent did to one action: done, skipped, snoozed, pinned, noted, chosen.       |
| `appointments`      | What a parent typed. The generated schedule is derived from the due date and never stored.  |
| `reminders`         | A time to send something, and whether it has been sent.                                     |
| `subscriptions`     | The Stripe ids and the plan.                                                                |
| `feature_flags`     | A key, a boolean, and an optional payload.                                                  |
| `content_events`    | Append-only. What was shown, what was opened, what was skipped.                             |

## The indexes

The issue asked for three. There are more, because the queries exist.

| Index                                                                                                                                  | Serves                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `item_state_user_pack_idx` on `(user_id, stage_pack_id)`                                                                               | "what have I done in this week" — the week page's first query |
| `item_state_pinned_idx` on `(user_id, pinned_at desc) where pinned`                                                                    | the dashboard shelf, which only ever reads pinned rows        |
| `pregnancies_household_idx`, `children_household_idx`, `appointments_household_idx`, `subscriptions_household_idx` on `(household_id)` | every household-scoped read                                   |
| `reminders_remind_at_idx` on `(remind_at) where sent_at is null`                                                                       | the sender's only query: what is due and unsent               |
| `stage_progress_pack_idx` on `(stage_pack_id)`                                                                                         | "how many parents finished this week"                         |
| `content_sources_pack_idx` on `(stage_pack_id)`                                                                                        | rendering a pack's sources                                    |
| `stage_packs_stage_idx` on `(kind, stage_index)`                                                                                       | finding the pack for a stage                                  |
| `link_catalogue_domains_idx` (GIN) on `domains`                                                                                        | "what do we have for feeding"                                 |
| `link_catalogue_title_trgm_idx` (GIN, `gin_trgm_ops`) on `title`                                                                       | searching the catalogue by a misspelling                      |
| `appointments_due_idx` on `(household_id, due_at)`                                                                                     | the upcoming list                                             |
| `content_events_user_time_idx` on `(user_id, created_at desc)`                                                                         | a parent's recent history                                     |
| `household_members_user_idx` on `(user_id)`                                                                                            | "which households am I in" — the reverse of the primary key   |

`reminders_remind_at_idx` is partial rather than a plain index on `remind_at`.
The only query is "what is due and not yet sent", so a full index would be
larger and never used.

## Where this differs from `ARCHITECTURE.md`, and why

Three of these are corrections. The rest are columns the shipped app already
stores, which the design did not anticipate.

### 1. `stage_packs.kind` uses the content package's values

`ARCHITECTURE.md` said `('preconception','pregnancy','newborn','first-year','toddler','event')`.
The shipped content schema's `STAGE_KINDS` is `('pregnancy','postpartum','infant','toddler','event')`,
and all 85 packs use it. The design's values would have rejected every pack in
the product.

The database now matches the code. `preconception` is not a stage the product
has; `newborn` and `first-year` are one stage, `infant`, because the content is
monthly across both.

### 2. `item_state.skip_reason` uses the reasons the interface offers

`ARCHITECTURE.md` said `('not_relevant','already_done','too_expensive','too_much','other')`.
`ActionItem.tsx` offers `not-now`, `already-done`, `not-for-me`, plus "skip
without saying why", which is stored as no reason at all.

The interface wins, because it is what a parent can actually choose. A check
constraint that permits a value no screen can produce is a constraint that
documents a fiction. `too-expensive` and `too-much` are a real product question
— they are the two reasons worth counting — but they are a question for a later
issue, not a schema one.

### 3. `stage_packs` has no `unique (id, locale, country, version)`

`id` is the primary key, so that unique constraint could never be violated. It
also implied multi-version rows, which the primary key forbids. And
`content_sources.stage_pack_id references stage_packs(id)` requires `id` to stay
unique, so the primary key has to stay where it is. The redundant constraint is
gone.

### 4. `stage_packs` gained `stage_unit` and `subtitle`

The content schema has both. `subtitle` is the week page's `<h1>`; `stage_unit`
is what makes "Week 28" and "Month 4" different labels for the same table.

### 5. `content_sources` gained `kind`

`SOURCE_KINDS` is `clinical`, `government`, `charity`, `editorial`, `vendor`.
The content lint refuses a pack whose red flags have no clinical or government
source, so the kind has to be queryable rather than buried in the payload.

### 6. `link_catalogue` gained `platforms` and a constraint on `affiliate`

An `app` entry must declare its platforms, and the editorial rule is that
affiliate links are only legal on `commercial` entries. That rule was only in
Zod; it is now also a check constraint, so a bad row cannot be inserted by a
script that bypasses the content package.

### 7. `stage_progress` gained `forced`

A week is finished either because its steps are, or because a parent said so.
Those mean different things — only the second can be reopened — and the app
already records which happened.

### 8. `item_state` gained the snapshot columns

`title`, `pack_title`, `remind_on`, `snoozed_until`, `choice_option_id`,
`choice_label`, `chosen_at`.

A pin, a snooze and a choice are all snapshots, not pointers. Content is
versioned and an action can be renamed or retired between releases; a bare id
would let a rename silently rewrite a parent's history. The app already stores
these, and a schema that dropped them would make the first sync lossy.

`item_state.stage_pack_id` is `on delete set null` rather than `cascade`, for
the same reason: a pin has to survive the pack it came from. `stage_progress`
cascades, because progress is _about_ a pack and is meaningless without one.

### 9. `appointments` gained `who`

The design had `location` but not the person. A parent's own appointment is
"Dr Chen, Tuesday, the clinic" — three different fields.

### 10. `content_events` has no foreign keys on `stage_pack_id` or `item_id`

It is append-only. An event is a record of what happened, and it must not
disappear because the content it referred to was retired. `user_id` is
`on delete set null` for the same reason.

## The invariants the database enforces

These are product rules that were previously only in TypeScript. They are now
also in the database, so a script, a migration or a future service cannot
violate them.

- A skip reason can only exist on a skipped item.
- A snoozed item must have a date to come back on.
- A pinned item must have a time, because the shelf is ordered by it.
- An affiliate link must be commercial.
- A stage index cannot be negative, and a version cannot be below 1.
- A pregnancy's parity cannot be negative.

## How it is tested

`packages/db` runs against **PGlite** — Postgres compiled to WebAssembly, in the
test process, with no container. It is not an emulation: the same parser, the
same constraint checks, the same `information_schema`.

Two test files:

- `migrate.test.ts` — up on a fresh database creates all fifteen tables; up
  twice is idempotent; down leaves no table of ours; the round trip works twice;
  a migration that fails halfway leaves nothing behind; a down that fails leaves
  the table in place; rolling back more than was applied is an error; a
  migration whose file has vanished is an error.
- `schema.test.ts` — the drift guard. It compares the live database against the
  Drizzle schema column by column (name, type, nullability, whether a default
  exists), and compares the check constraints, foreign keys and indexes by name.
  A hand-written `create table` that drifts from `schema.ts` fails here rather
  than in production.

The type comparison is exhaustive on purpose: a column of a type nobody has
mapped fails the test rather than being skipped.

PGlite ships Postgres 18; Neon runs 16. Nothing in the schema is newer than 13,
and `gen_random_uuid()` has been built in since then, so no `pgcrypto` is
needed. That is an assumption about the production target, not a proof of it.

## Row-level security

`0002_rls` turns on row-level security for the eleven tables that hold
something about a person, and leaves the four that hold content alone.

| Table                                                         | Policy                   | Who can see a row       |
| ------------------------------------------------------------- | ------------------------ | ----------------------- |
| `users`                                                       | `users_self`             | the person themselves   |
| `household_members`                                           | `household_members_self` | the person themselves   |
| `households`                                                  | `households_member`      | anyone in the household |
| `pregnancies`, `children`, `appointments`, `subscriptions`    | `*_household`            | anyone in the household |
| `stage_progress`, `item_state`, `reminders`, `content_events` | `*_self`                 | the person themselves   |

`stage_packs`, `content_sources`, `link_catalogue` and `feature_flags` are
deliberately unprotected. They are the same for everybody, and a policy on them
would be a policy that says "yes" to every row.

The policies read two functions:

```sql
app_user_id()       -- nullif(current_setting('app.user_id', true), '')::uuid
app_household_ids() -- the households that user belongs to
```

`current_setting('app.user_id', true)` returns NULL when the setting was never
set, so the policy evaluates to NULL and the answer is no rows. It fails
closed. The `nullif(..., '')` is there because a setting that was explicitly
cleared comes back as the empty string, and `''::uuid` is an error rather than
a NULL — an error inside a policy is a 500, and a NULL is an empty page.

### The deployment requirement this creates

**Row-level security is only enforced for a role that is not a superuser and
does not own the table.** PGlite connects as `postgres`, which is a superuser,
and a superuser bypasses every policy even with `force row level security` set.
The first probe of this migration appeared to do nothing for exactly that
reason.

So the application must connect as an ordinary role — `app_user` in the tests —
that has been granted `usage` on the schema and the table privileges it needs.
If it connects as the owner, the policies are decorative and every query returns
everything. This is a runbook item, not a code item, and it is the one thing
about this migration that a test cannot prove for production.

The tests do prove it for a real Postgres: `repo.test.ts` creates `app_user`,
switches to it with `set local role`, and then runs `select ... from pregnancies`
with **no `where` clause at all**. It gets back one row, not two.

### Why both RLS and a `where` clause

The repository layer in `src/repo.ts` also filters by `scope.userId` or
`scope.householdId` in every query. That is belt and braces, and it is
deliberate. A query that relies only on RLS is a query that silently returns
everything the day someone connects as the owner, or runs a migration, or adds
a table and forgets the policy. A query that relies only on its `where` clause
is one typo away from a cross-household read. Neither alone is enough.

## What is deliberately not here

- **Soft delete on anything but `users`.** `users.deleted_at` exists because
  account deletion is a legal obligation with a grace period. Nothing else is
  soft-deleted, because a soft-deleted row that every query has to remember to
  filter is a bug waiting to happen.
- **Partitioning.** `content_events` is the only table that grows without bound,
  and it will not be large enough to matter for years.
- **A `sessions` table.** Auth is issue #14.

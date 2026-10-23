-- 0001_init — the first schema.
--
-- Forward-only in production. The paired .down.sql exists so the migration can
-- be proven reversible on a fresh database, not so it can be run against one
-- that holds a parent's data.
--
-- Every deviation from ARCHITECTURE.md is recorded in SCHEMA.md with its reason.

create extension if not exists citext;
create extension if not exists pg_trgm;

-- Identity ------------------------------------------------------------------

create table users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  name text,
  locale text not null default 'en-US',
  country char(2) not null default 'US',
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('parent', 'partner', 'grandparent', 'carer')),
  primary key (household_id, user_id)
);

-- The household_id half of the primary key already serves the lookup, so the
-- only index this table needs is the reverse one: "which households is this
-- person in".
create index household_members_user_idx on household_members (user_id);

-- The journey ---------------------------------------------------------------

create table pregnancies (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  due_date date not null,
  start_date date,
  parity int not null default 0 check (parity >= 0),
  multiples boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'paused', 'loss', 'ended')),
  created_at timestamptz not null default now()
);

create index pregnancies_household_idx on pregnancies (household_id);

create table children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  birth_date date not null,
  due_date date,
  corrected_age boolean not null default false,
  sex text,
  feeding text check (feeding in ('breast', 'formula', 'mixed', 'undecided')),
  birth_type text check (birth_type in ('vaginal', 'assisted', 'c-section', 'unknown')),
  created_at timestamptz not null default now()
);

create index children_household_idx on children (household_id);

-- Content -------------------------------------------------------------------

-- `kind` and `stage_unit` are the content package's enums, not the ones in
-- ARCHITECTURE.md. The 85 shipped packs use postpartum and infant; a check
-- constraint that rejected them would reject the product.
create table stage_packs (
  id text primary key,
  kind text not null
    check (kind in ('pregnancy', 'postpartum', 'infant', 'toddler', 'event')),
  stage_index int not null check (stage_index >= 0),
  stage_unit text not null default 'week'
    check (stage_unit in ('week', 'month', 'day')),
  locale text not null default 'en-US',
  country char(2) not null default 'US',
  title text not null,
  subtitle text,
  baby text,
  you text,
  payload jsonb not null,
  version int not null default 1 check (version >= 1),
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'published', 'retired')),
  reviewed_by text,
  reviewed_at date,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index stage_packs_stage_idx on stage_packs (kind, stage_index);

create table content_sources (
  id uuid primary key default gen_random_uuid(),
  stage_pack_id text not null references stage_packs(id) on delete cascade,
  label text not null,
  url text not null,
  publisher text,
  kind text not null default 'clinical'
    check (kind in ('clinical', 'government', 'charity', 'editorial', 'vendor')),
  last_checked date not null,
  reviewed_by text
);

create index content_sources_pack_idx on content_sources (stage_pack_id);

create table link_catalogue (
  id text primary key,
  title text not null,
  url text not null,
  publisher text,
  country text[] not null default '{US}',
  type text not null
    check (type in (
      'authoritative', 'charity', 'community', 'editorial',
      'commercial', 'app', 'course', 'book', 'local-service'
    )),
  domains text[] not null,
  platforms text[] not null default '{}',
  cost text check (cost in ('free', '$', '$$', '$$$', 'varies')),
  why text,
  affiliate boolean not null default false,
  last_checked date not null,
  status text not null default 'active'
    check (status in ('active', 'broken', 'retired')),
  -- The editorial rule, in the database: a charity or a government page cannot
  -- be marked as earning us money.
  constraint link_catalogue_affiliate_is_commercial
    check (not affiliate or type = 'commercial')
);

create index link_catalogue_domains_idx on link_catalogue using gin (domains);
create index link_catalogue_title_trgm_idx on link_catalogue using gin (title gin_trgm_ops);

-- User state ----------------------------------------------------------------

create table stage_progress (
  user_id uuid not null references users(id) on delete cascade,
  stage_pack_id text not null references stage_packs(id) on delete cascade,
  state text not null default 'not_started'
    check (state in ('not_started', 'in_progress', 'complete', 'skipped')),
  -- A week is finished either because its steps are, or because a parent said
  -- so. Those mean different things and only the second can be reopened.
  forced boolean not null default false,
  completed_at timestamptz,
  primary key (user_id, stage_pack_id)
);

create index stage_progress_pack_idx on stage_progress (stage_pack_id);

create table item_state (
  user_id uuid not null references users(id) on delete cascade,
  item_id text not null,
  -- Nullable, and set null rather than cascaded: a pin is a snapshot, and it
  -- has to survive the pack it came from. Progress is about a pack and is
  -- meaningless without one, which is why stage_progress cascades instead.
  stage_pack_id text references stage_packs(id) on delete set null,
  state text not null default 'not_started'
    check (state in ('not_started', 'done', 'skipped', 'snoozed')),
  skip_reason text check (skip_reason in ('not-now', 'already-done', 'not-for-me')),
  pinned boolean not null default false,
  pinned_at timestamptz,
  remind_on date,
  snoozed_until date,
  note text,
  -- Snapshots. Content is versioned and an action can be renamed or retired;
  -- a bare id would let a rename rewrite a parent's history.
  title text,
  pack_title text,
  choice_option_id text,
  choice_label text,
  chosen_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id),
  constraint item_state_skip_reason_needs_skip
    check (skip_reason is null or state = 'skipped'),
  constraint item_state_snooze_needs_date
    check (state <> 'snoozed' or snoozed_until is not null),
  constraint item_state_pin_needs_time
    check (not pinned or pinned_at is not null)
);

create index item_state_user_pack_idx on item_state (user_id, stage_pack_id);
create index item_state_pinned_idx on item_state (user_id, pinned_at desc) where pinned;

create table appointments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title text not null,
  kind text,
  due_at timestamptz,
  who text,
  location text,
  notes text,
  source text not null default 'auto' check (source in ('auto', 'user')),
  created_at timestamptz not null default now()
);

create index appointments_household_idx on appointments (household_id);
create index appointments_due_idx on appointments (household_id, due_at);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  item_id text,
  title text not null,
  remind_at timestamptz not null,
  channel text not null default 'email' check (channel in ('email', 'push')),
  sent_at timestamptz
);

-- The only query is "what is due and not yet sent", so the index is partial.
-- A full index on remind_at would be larger and never used.
create index reminders_remind_at_idx on reminders (remind_at) where sent_at is null;

-- Commerce ------------------------------------------------------------------

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null check (plan in ('free', 'plus', 'family', 'b2b')),
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index subscriptions_household_idx on subscriptions (household_id);

-- Ops -----------------------------------------------------------------------

create table feature_flags (
  key text primary key,
  enabled boolean not null default false,
  payload jsonb,
  updated_at timestamptz not null default now()
);

-- Append-only, and deliberately without foreign keys on stage_pack_id or
-- item_id: an event is a record of what happened, and it must not disappear
-- because the content it referred to was retired.
create table content_events (
  id bigserial primary key,
  user_id uuid references users(id) on delete set null,
  event text not null,
  stage_pack_id text,
  item_id text,
  properties jsonb,
  created_at timestamptz not null default now()
);

create index content_events_user_time_idx on content_events (user_id, created_at desc);

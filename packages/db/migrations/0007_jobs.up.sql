-- Assigned jobs.
--
-- A shared pin says "this matters to us". A job says "you are doing this one".
-- They are different tables because they have different owners: a shared pin
-- belongs to the household, a job belongs to a person and has a status that
-- only moves forward.
--
-- The status is a check rather than a boolean so "dropped" is distinguishable
-- from "not done yet" — a job somebody took back should not look like a job
-- somebody is ignoring.

create table jobs (
  id uuid primary key default gen_random_uuid (),
  household_id uuid not null references households (id) on delete cascade,
  item_id text not null,
  stage_pack_id text references stage_packs (id) on delete set null,
  title text not null,
  pack_title text,
  assigned_to uuid not null references users (id) on delete cascade,
  assigned_by uuid not null references users (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'done', 'dropped')),
  done_at timestamptz,
  created_at timestamptz not null default now(),
  constraint jobs_done_needs_time check ((status = 'done') = (done_at is not null))
);

create index jobs_household_idx on jobs (household_id);

-- One open job per action per household. Assigning the same thing twice
-- replaces the open job rather than stacking a second identical row on the
-- other person's page. A finished job is not covered, so re-assigning
-- something done starts a new one instead of reopening it.
create unique index jobs_one_open_per_item_idx on jobs (household_id, item_id)
  where status = 'open';
create index jobs_assigned_to_idx on jobs (assigned_to, status);

alter table jobs enable row level security;
alter table jobs force row level security;

-- Everyone in the household sees every job, which is the point: an assignment
-- nobody else can see is a private note with extra steps. Only the person
-- handing it out can create one, so `assigned_by` cannot be forged.
create policy jobs_household on jobs for all
  using (household_id in (select app_household_ids ()))
  with check (
    household_id in (select app_household_ids ())
    and assigned_by = app_user_id ()
  );

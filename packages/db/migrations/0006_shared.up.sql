-- Shared pins.
--
-- A pin is the parent's own shortlist, and `item_state` is self-only by policy:
-- a partner cannot read another person's row, which is what keeps a private
-- note private. But a household needs a shared surface, so sharing is a
-- deliberate copy into a table that has no note column at all.
--
-- That is the whole design. "A partner cannot see your notes" is not a rule
-- enforced by a query; it is true because there is nowhere for a note to be.

create table shared_items (
  household_id uuid not null references households (id) on delete cascade,
  item_id text not null,
  stage_pack_id text references stage_packs (id) on delete set null,
  title text not null,
  pack_title text,
  shared_by uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (household_id, item_id)
);

create index shared_items_household_idx on shared_items (household_id);

alter table shared_items enable row level security;
alter table shared_items force row level security;

-- Anyone in the household can read and remove a shared pin; only the person
-- who shared it can put it there, so `shared_by` cannot be forged.
create policy shared_items_household on shared_items for all
  using (household_id in (select app_household_ids ()))
  with check (
    household_id in (select app_household_ids ())
    and shared_by = app_user_id ()
  );

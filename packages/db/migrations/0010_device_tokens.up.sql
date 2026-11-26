-- One row per install, so a push goes to a phone rather than to a person.
--
-- The token is the identity the push service knows. It is unique across the
-- table because an install that signs into a second household moves with the
-- row rather than creating a second copy of the same phone; re-registering
-- updates the household and the user. Removing the row on sign-out is what
-- makes "removable on sign-out" true rather than a promise.

create table device_tokens (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique,
  platform text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_tokens_platform_check check (platform in ('ios', 'android'))
);

create index device_tokens_household_idx on device_tokens (household_id);
create index device_tokens_user_idx on device_tokens (user_id);

alter table device_tokens enable row level security;
alter table device_tokens force row level security;

-- The same household boundary as every other row about the family. One parent
-- can see the other's install because the sender has to fan out to both.
create policy device_tokens_household on device_tokens for all
  using (household_id in (select app_household_ids ()))
  with check (
    household_id in (select app_household_ids ())
    and user_id = app_user_id ()
  );

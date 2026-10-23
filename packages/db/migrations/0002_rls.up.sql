-- Row-level security.
--
-- The repository layer scopes every query by household or user in TypeScript,
-- and that is the API. This is the guarantee underneath it: a query that
-- forgets the scope returns nothing rather than someone else's pregnancy.
--
-- The setting is read with `missing_ok = true`, so a connection that never
-- called `set_config` gets NULL, the policy evaluates to NULL, and the answer
-- is no rows. Failing closed is the whole point — a missing setting must not
-- mean "see everything".
--
-- `nullif(..., '')` because a setting that was explicitly cleared comes back
-- as an empty string, and `''::uuid` is an error rather than a NULL.

create or replace function app_user_id() returns uuid
  language sql stable
  as $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;

-- The households this person belongs to. Used by every household-scoped
-- policy below. It reads `household_members`, which has its own policy, so the
-- nested read is filtered to the same person — no recursion, because the
-- policy on `household_members` does not read `household_members`.
create or replace function app_household_ids() returns setof uuid
  language sql stable
  as $$ select household_id from household_members where user_id = app_user_id() $$;

-- The person ----------------------------------------------------------------

alter table users enable row level security;
alter table users force row level security;
create policy users_self on users
  for all
  using (id = app_user_id())
  with check (id = app_user_id());

alter table household_members enable row level security;
alter table household_members force row level security;
create policy household_members_self on household_members
  for all
  using (user_id = app_user_id())
  with check (user_id = app_user_id());

alter table households enable row level security;
alter table households force row level security;
create policy households_member on households
  for all
  using (id in (select app_household_ids()))
  with check (id in (select app_household_ids()));

-- The journey ---------------------------------------------------------------

alter table pregnancies enable row level security;
alter table pregnancies force row level security;
create policy pregnancies_household on pregnancies
  for all
  using (household_id in (select app_household_ids()))
  with check (household_id in (select app_household_ids()));

alter table children enable row level security;
alter table children force row level security;
create policy children_household on children
  for all
  using (household_id in (select app_household_ids()))
  with check (household_id in (select app_household_ids()));

alter table stage_progress enable row level security;
alter table stage_progress force row level security;
create policy stage_progress_self on stage_progress
  for all
  using (user_id = app_user_id())
  with check (user_id = app_user_id());

alter table item_state enable row level security;
alter table item_state force row level security;
create policy item_state_self on item_state
  for all
  using (user_id = app_user_id())
  with check (user_id = app_user_id());

alter table appointments enable row level security;
alter table appointments force row level security;
create policy appointments_household on appointments
  for all
  using (household_id in (select app_household_ids()))
  with check (household_id in (select app_household_ids()));

alter table reminders enable row level security;
alter table reminders force row level security;
create policy reminders_self on reminders
  for all
  using (user_id = app_user_id())
  with check (user_id = app_user_id());

-- Commerce ------------------------------------------------------------------

alter table subscriptions enable row level security;
alter table subscriptions force row level security;
create policy subscriptions_household on subscriptions
  for all
  using (household_id in (select app_household_ids()))
  with check (household_id in (select app_household_ids()));

-- Analytics -----------------------------------------------------------------

-- `user_id` is nullable here because an event can be recorded before anyone
-- signs in. A null row is nobody's, so it is visible to nobody.
alter table content_events enable row level security;
alter table content_events force row level security;
create policy content_events_self on content_events
  for all
  using (user_id = app_user_id())
  with check (user_id = app_user_id());

-- Deliberately not protected: `stage_packs`, `content_sources`,
-- `link_catalogue` and `feature_flags` are the same for everyone. Putting a
-- policy on them would be a policy that always returns true, which is worse
-- than no policy because it looks like protection.

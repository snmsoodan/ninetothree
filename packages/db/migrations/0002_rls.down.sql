-- Policies are dropped with their table, but the functions are not, and a
-- re-run of the up migration would fail on `create policy` if the policies
-- survived. Dropping them explicitly makes the down idempotent in the same
-- way the up is.
drop policy if exists content_events_self on content_events;
drop policy if exists subscriptions_household on subscriptions;
drop policy if exists reminders_self on reminders;
drop policy if exists appointments_household on appointments;
drop policy if exists item_state_self on item_state;
drop policy if exists stage_progress_self on stage_progress;
drop policy if exists children_household on children;
drop policy if exists pregnancies_household on pregnancies;
drop policy if exists households_member on households;
drop policy if exists household_members_self on household_members;
drop policy if exists users_self on users;

alter table content_events disable row level security;
alter table subscriptions disable row level security;
alter table reminders disable row level security;
alter table appointments disable row level security;
alter table item_state disable row level security;
alter table stage_progress disable row level security;
alter table children disable row level security;
alter table pregnancies disable row level security;
alter table households disable row level security;
alter table household_members disable row level security;
alter table users disable row level security;

drop function if exists app_household_ids();
drop function if exists app_user_id();

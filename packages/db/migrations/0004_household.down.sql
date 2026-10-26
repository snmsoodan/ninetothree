drop policy if exists users_cohorted on users;
drop policy if exists households_insert on households;
drop policy if exists household_members_cohorted on household_members;

-- Back to the invoker version. The security definer form is only needed while
-- the co-member policy exists; leaving it behind would keep a function that
-- reads past row-level security for no reason.
create or replace function app_household_ids() returns setof uuid
  language sql stable
  as $$ select household_id from household_members where user_id = app_user_id() $$;

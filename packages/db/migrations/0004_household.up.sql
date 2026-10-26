-- Households, roles, and the one policy that had to change.
--
-- Until now `household_members` was readable only by the person whose row it
-- was. That is right for a single-parent account and wrong for a household:
-- a partner could not see that anyone else was in it, so `listMembers`
-- returned one row and the app had no way to say "you are two".
--
-- Widening that policy needs care. The obvious version —
--
--   using (household_id in (select app_household_ids()))
--
-- recurses, because `app_household_ids()` reads `household_members` and the
-- policy on `household_members` would then read `household_members`. Postgres
-- detects it and refuses the query outright. The fix is to make the helper
-- `security definer`, so its own read is not filtered by the policy that
-- calls it.
--
-- `set search_path` is not optional on a security definer function. Without
-- it, a caller can put a table named `household_members` earlier on the
-- search path and the function will read that instead — with the owner's
-- privileges. Pinning it to `public, pg_temp` closes that.
--
-- The function still fails closed: with `app.user_id` unset, `app_user_id()`
-- is NULL, `where user_id = NULL` matches nothing, and every policy that
-- depends on it returns no rows.

create or replace function app_household_ids() returns setof uuid
  language sql stable security definer
  set search_path = public, pg_temp
  as $$ select household_id from household_members where user_id = app_user_id() $$;

-- Seeing who else is in your household. Writes are still restricted to your
-- own row by `household_members_self`; permissive policies are OR'd, so this
-- adds a read and changes nothing else.
create policy household_members_cohorted on household_members
  for select
  using (household_id in (select app_household_ids()));

-- Creating a household is the one insert that cannot satisfy the membership
-- policy, because the membership does not exist yet — the household has to be
-- inserted first to have an id to point at. Allowing the insert is not a
-- privilege escalation: a household nobody is a member of is invisible to
-- everyone, and the membership row that follows is still checked against
-- `app_user_id()`.
create policy households_insert on households
  for insert
  with check (true);

-- A household is a trust boundary, so its members can see each other's name
-- and address. That is what makes "who is in this household" answerable, and
-- it is the same bargain every family-sharing product makes. Writes are still
-- restricted to your own row by `users_self`; permissive policies are OR'd.
create policy users_cohorted on users
  for select
  using (
    id in (
      select m.user_id
        from household_members m
       where m.household_id in (select app_household_ids())
    )
  );

-- Inviting someone into a household.
--
-- An invite is a single-use link. The table stores a hash of the token, never
-- the token itself, so a copy of the database is not a set of working invites.
-- The token is 32 random bytes, which is why a plain SHA-256 is enough here and
-- no secret is mixed in: there is nothing to guess, and nothing to brute-force
-- that a secret would make harder.
--
-- Accepting is the one operation that cannot be done under the caller's own
-- policies. The person accepting is not yet a member of the household, so
-- `household_invites_household` hides the row from them and
-- `household_members_self` would refuse the insert. Both are correct — an
-- invite is not readable by whoever holds the link, and membership is not
-- self-grantable. So accepting goes through a `security definer` function that
-- does the whole thing in one statement: check, consume, leave, join.
--
-- `set search_path` is not optional on a security definer function. Without it
-- a caller can shadow `household_invites` or `household_members` earlier on the
-- path and the function will read that instead, with the owner's privileges.

create table household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  role text not null,
  token_hash text not null unique,
  created_by uuid references users (id) on delete set null,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint household_invites_role_check
    check (role in ('parent', 'partner', 'grandparent', 'carer'))
);

create index household_invites_household_idx on household_invites (household_id);
create index household_invites_expires_idx on household_invites (expires_at);

alter table household_invites enable row level security;
alter table household_invites force row level security;

-- A member can see and revoke the invites their own household has issued.
-- Nobody can read an invite by its token through this policy, which is the
-- point: holding the link is not the same as being in the household.
create policy household_invites_household on household_invites
  for all
  using (household_id in (select app_household_ids()))
  with check (household_id in (select app_household_ids()));

-- What the join page shows before anyone has signed in: whose household this
-- is, and who asked. Returns no row for an expired, used or revoked invite, so
-- the page can say "this link has been used" without leaking whether the
-- household exists.
create or replace function preview_household_invite(p_token_hash text)
returns table (household_name text, inviter_name text, role text)
  language sql stable security definer
  set search_path = public, pg_temp
  as $$
    select h.name, coalesce(u.name, u.email), i.role
      from household_invites i
      join households h on h.id = i.household_id
      left join users u on u.id = i.created_by
     where i.token_hash = p_token_hash
       and i.used_at is null
       and i.revoked_at is null
       and i.expires_at > now()
  $$;

-- Accepting. One function, one transaction, so an invite cannot be consumed
-- without the membership being created, and two people racing on the same link
-- cannot both win: `for update` locks the row and the second caller finds
-- `used_at` set.
--
-- Joining someone's household means leaving your own. A person is in one
-- household at a time — `scopeFor` picks the oldest — so a second membership
-- would silently do nothing. The old household is deleted if it is left empty,
-- for the same reason `leaveHousehold` deletes it: a household with no members
-- is unreachable by every policy and every query.
create or replace function accept_household_invite(p_token_hash text, p_user_id uuid)
returns uuid
  language plpgsql security definer
  set search_path = public, pg_temp
  as $$
  declare
    v_invite household_invites;
    v_old uuid;
  begin
    select * into v_invite
      from household_invites
     where token_hash = p_token_hash
       and used_at is null
       and revoked_at is null
       and expires_at > now()
     for update;

    if not found then
      return null;
    end if;

    update household_invites set used_at = now() where id = v_invite.id;

    for v_old in
      select household_id from household_members
       where user_id = p_user_id and household_id <> v_invite.household_id
    loop
      delete from household_members
       where household_id = v_old and user_id = p_user_id;
      delete from households h
       where h.id = v_old
         and not exists (select 1 from household_members m where m.household_id = h.id);
    end loop;

    insert into household_members (household_id, user_id, role)
    values (v_invite.household_id, p_user_id, v_invite.role)
    on conflict (household_id, user_id) do update set role = excluded.role;

    return v_invite.household_id;
  end;
  $$;

-- Deleting an account, with a way back.
--
-- Deleting is a request, not an event. A person who asks to be deleted gets
-- thirty days in which signing in again cancels it, because the most common
-- reason to delete an account is a bad afternoon rather than a considered
-- decision. After thirty days a job removes the row, and every table that
-- references `users` cascades, so there is nothing left to find.
--
-- `users.deleted_at` already existed. This table is what makes the grace
-- period real: it records when the request was made, when the purge becomes
-- allowed, and whether the person changed their mind.

create table deletion_requests (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references users (id) on delete cascade,
  requested_at timestamptz not null default now(),
  purge_after timestamptz not null,
  cancelled_at timestamptz,
  constraint deletion_requests_grace check (purge_after > requested_at)
);

-- The purge job asks one question: which requests are due and still live.
create index deletion_requests_due_idx on deletion_requests (purge_after)
  where cancelled_at is null;

alter table deletion_requests enable row level security;
alter table deletion_requests force row level security;

-- A person can see and cancel their own request. Nobody can read anybody
-- else's, and the purge job runs as the owner rather than through a policy.
create policy deletion_requests_self on deletion_requests for all
  using (user_id = app_user_id ())
  with check (user_id = app_user_id ());

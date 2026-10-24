-- 0003_auth — the tables Auth.js needs, plus the one it does not have.
--
-- Auth.js owns `accounts`, `sessions` and `verification_tokens`; their shapes
-- are dictated by @auth/drizzle-adapter and are not ours to improve. `users`
-- already existed, so this migration adds the two columns the adapter reads
-- and leaves the rest alone.
--
-- `auth_attempts` is ours. Auth.js has no rate limiter, and a magic-link
-- endpoint without one is a way to send a stranger's inbox a thousand emails.

alter table users add column email_verified timestamptz;
alter table users add column image text;

-- OAuth accounts -------------------------------------------------------------

create table accounts (
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (provider, provider_account_id)
);

create index accounts_user_id_idx on accounts (user_id);

-- Sessions -------------------------------------------------------------------

-- A database session rather than a JWT, because a session that cannot be
-- revoked is a session that outlives the laptop it was created on.
create table sessions (
  session_token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires timestamptz not null
);

create index sessions_user_id_idx on sessions (user_id);

-- Magic links ----------------------------------------------------------------

-- The primary key is (identifier, token) rather than the token alone: the same
-- person asking twice gets two live links, and the second must not overwrite
-- the first. Consumption deletes the row, which is what makes a link single-use.
create table verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

create index verification_tokens_expires_idx on verification_tokens (expires);

-- Rate limiting --------------------------------------------------------------

-- One row per attempt, counted over a sliding window. A counter column would be
-- smaller, but it cannot answer "how many in the last fifteen minutes" without
-- a reset job, and a reset job is a thing that stops running.
create table auth_attempts (
  id bigserial primary key,
  key text not null,
  at timestamptz not null default now()
);

create index auth_attempts_key_at_idx on auth_attempts (key, at desc);

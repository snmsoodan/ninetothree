-- 0001_init — the reverse of 0001_init.up.sql.
--
-- The extensions are deliberately not dropped. citext and pg_trgm are shared
-- with anything else in the database, and dropping them would be a destructive
-- act disguised as a rollback. What this file guarantees is that no table of
-- ours survives it.

drop table if exists content_events;
drop table if exists feature_flags;
drop table if exists subscriptions;
drop table if exists reminders;
drop table if exists appointments;
drop table if exists item_state;
drop table if exists stage_progress;
drop table if exists link_catalogue;
drop table if exists content_sources;
drop table if exists stage_packs;
drop table if exists children;
drop table if exists pregnancies;
drop table if exists household_members;
drop table if exists households;
drop table if exists users;

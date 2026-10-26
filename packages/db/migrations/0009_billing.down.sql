alter table subscriptions drop constraint if exists subscriptions_household_key;

create index if not exists subscriptions_household_idx on subscriptions (household_id);

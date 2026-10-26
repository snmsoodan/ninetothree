-- One subscription per household.
--
-- The table was created with a plain index on household_id, which allowed a
-- second row. Nothing ever wrote one, but a webhook is the first thing that
-- writes here without a scope in hand, and Stripe retries deliveries: two
-- concurrent `checkout.session.completed` events would have produced two rows
-- and `getSubscription` would have picked one at random.
--
-- A household has one subscription. Cancelling and resubscribing updates the
-- row; Stripe keeps the history, and we do not need a second copy of it.

drop index if exists subscriptions_household_idx;

alter table subscriptions
  add constraint subscriptions_household_key unique (household_id);

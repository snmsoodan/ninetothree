/**
 * The price, in one place.
 *
 * There is one thing to buy and one price: five dollars, paid once, which
 * opens the whole guide for good. It is written here rather than in Stripe's
 * dashboard so that the button, the checkout and the terms page cannot drift
 * apart — a checkout that charges a different number than the button promised
 * is the one billing bug nobody forgives.
 *
 * The checkout sends `price_data`, not a price id, for the same reason: a
 * dashboard price can be edited by anybody with a login, and the copy in this
 * repository would go on saying five dollars.
 */
export const PRICE_CENTS = 500;

export const PRICE_LABEL = `$${PRICE_CENTS / 100}`;

/** What Stripe puts on the receipt, and what the parent sees in the checkout. */
export const PRODUCT_NAME = "Nine to Three — the whole guide";

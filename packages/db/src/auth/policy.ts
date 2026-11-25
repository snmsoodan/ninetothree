/**
 * The numbers that decide how hard it is to guess, spam or replay a sign-in.
 *
 * They live in one file so that a change is a change in one place, and so that
 * a test can assert the shipped value rather than a copy of it.
 */

/** A magic link is good for fifteen minutes. Long enough to find the email. */
export const TOKEN_TTL_MS = 15 * 60 * 1000;

/** Five requests per address per window. A person who mistypes twice still gets in. */
export const RATE_LIMIT_MAX = 5;

/** The window is the same fifteen minutes, so a lockout and a link expire together. */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Ten exchanges per caller per window.
 *
 * A person signs in a handful of times a month, and a shared office address may
 * be one key for several parents, so this is looser than the magic-link limit.
 * It is still a limit: a token exchange endpoint is a guessing surface, and an
 * unlimited one is a guessing surface with an audience.
 */
export const EXCHANGE_RATE_LIMIT_MAX = 10;

/** Thirty days, matching Auth.js's own default. */
export const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

import {
  checkRateLimit,
  recordAttempt,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from "@ninetothree/db/auth";

export interface GuardDeps {
  sql: Parameters<typeof checkRateLimit>[0];
  now?: Date;
}

export interface GuardResult {
  /** A response to return instead of letting the request through. */
  blocked: Response | null;
  /** The address the request was about, when one could be read. */
  email: string | null;
}

const SIGN_IN_PATH = /\/api\/auth\/signin\/(email|nodemailer)$/;

/**
 * Rate-limits the magic-link endpoint before Auth.js sees the request.
 *
 * Auth.js has no hook between "someone asked for a link" and "an email is
 * sent", so the only place to stand is in front of the handler. The key is the
 * address, because the harm being prevented is a stranger filling an inbox.
 * A per-IP limit belongs at the edge, where the real client address is known.
 */
export async function guardSignIn(request: Request, deps: GuardDeps): Promise<GuardResult> {
  if (request.method !== "POST" || !SIGN_IN_PATH.test(new URL(request.url).pathname)) {
    return { blocked: null, email: null };
  }

  const email = await readEmail(request);
  if (!email) return { blocked: null, email: null };

  const limit = await checkRateLimit(deps.sql, email, { now: deps.now });
  if (!limit.allowed) {
    const seconds = Math.ceil(limit.retryAfterMs / 1000);
    return {
      blocked: new Response(
        JSON.stringify({
          error: "too-many-requests",
          message: "That is a lot of links. Try again in a few minutes.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": String(seconds) },
        },
      ),
      email,
    };
  }

  await recordAttempt(deps.sql, email, deps.now);
  return { blocked: null, email };
}

/** Reads the address out of a form post or a JSON body without consuming it. */
async function readEmail(request: Request): Promise<string | null> {
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const body = (await request.clone().json()) as { email?: unknown };
      return typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
    }
    const form = await request.clone().formData();
    const value = form.get("email");
    return typeof value === "string" ? value.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS };

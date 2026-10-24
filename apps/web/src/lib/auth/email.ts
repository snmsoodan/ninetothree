export interface MagicLinkMessage {
  to: string;
  url: string;
  expires: Date;
}

export type MagicLinkSender = (message: MagicLinkMessage) => Promise<void>;

export interface SenderEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  NODE_ENV?: string;
  AUTH_TEST_MODE?: string;
}

const DEFAULT_FROM = "Nine to Three <hello@ninetothree.com>";

/**
 * Picks a way to send the link.
 *
 * With a Resend key it posts to Resend. Without one it writes the link to the
 * server log, which is what makes the flow usable on a laptop with no account
 * anywhere — and refuses to do that in production, because a magic link in a
 * log file is a magic link anyone with the log can use.
 */
export function createSender(env: SenderEnv, fetchImpl: typeof fetch = fetch): MagicLinkSender {
  const from = env.EMAIL_FROM ?? DEFAULT_FROM;

  if (env.RESEND_API_KEY) {
    return async ({ to, url }) => {
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          subject: "Your sign-in link",
          text: `Open this to sign in. It works once, for fifteen minutes.\n\n${url}\n`,
        }),
      });
      if (!response.ok) {
        throw new Error(`Resend refused the message: ${response.status}`);
      }
    };
  }

  // The end-to-end suite runs against a production build, so the test switch
  // has to outrank the production refusal. It is the same switch that opens
  // the dev link endpoint, and it is unset everywhere else.
  if (env.NODE_ENV === "production" && env.AUTH_TEST_MODE !== "1") {
    return async () => {
      throw new Error("No email provider is configured. Set RESEND_API_KEY.");
    };
  }

  return async ({ to, url }) => {
    process.stderr.write(`\n  sign-in link for ${to}\n  ${url}\n\n`);
  };
}

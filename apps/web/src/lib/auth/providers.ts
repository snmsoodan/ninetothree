import { TOKEN_TTL_MS } from "@ninetothree/db/auth";
import type { Provider } from "next-auth/providers";
import Apple from "next-auth/providers/apple";
import type { EmailConfig } from "next-auth/providers/email";
import Google from "next-auth/providers/google";

import type { MagicLinkSender } from "./email";

/**
 * A provider that has been built, so it has an id.
 *
 * `Provider` is a union that includes the unbuilt factory form, which has no
 * `id`. Everything this function returns is built, and saying so is what lets
 * a caller read `.id` without a cast.
 */
export type ConfiguredProvider = Provider & { id: string };

export const DEFAULT_FROM = "Nine to Three <hello@ninetothree.com>";

export interface ProviderEnv {
  [key: string]: string | undefined;
  EMAIL_FROM?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  AUTH_APPLE_ID?: string;
  AUTH_APPLE_SECRET?: string;
}

/**
 * The providers that are actually configured.
 *
 * Two ways in, and both are a real account at a company the parent already
 * has one with: Google and Apple. Each appears only when both halves of its
 * credential are set, so a laptop with no OAuth app shows an honest page rather
 * than a button that fails.
 *
 * The email provider is built only under `AUTH_TEST_MODE=1`. The end-to-end
 * suite needs a way in that does not involve driving Google's consent screen,
 * and the dev link that hands it a token lives in the same mode. In production
 * there is no magic-link form to find, because there is no provider behind it.
 */
export function buildProviders(
  sender: MagicLinkSender,
  env: ProviderEnv = process.env,
): ConfiguredProvider[] {
  const email: EmailConfig = {
    id: "email",
    type: "email",
    name: "Email",
    from: env.EMAIL_FROM ?? DEFAULT_FROM,
    // Auth.js reads this as seconds. Fifteen minutes, the same number the
    // policy file uses, so the link and the lockout expire together.
    maxAge: TOKEN_TTL_MS / 1000,
    sendVerificationRequest: async ({ identifier, url, expires }) => {
      await sender({ to: identifier, url, expires });
    },
  };

  const providers: ConfiguredProvider[] = [];

  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
        /* Both providers verify the address before they hand it over, so the
           same person arriving through Apple after using Google is the same
           person. Without this Auth.js refuses with `OAuthAccountNotLinked`
           and the parent is stuck explaining themselves to a database. */
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }
  if (env.AUTH_APPLE_ID && env.AUTH_APPLE_SECRET) {
    providers.push(
      Apple({
        clientId: env.AUTH_APPLE_ID,
        clientSecret: env.AUTH_APPLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }
  if (env.AUTH_TEST_MODE === "1") providers.push(email);

  return providers;
}

/** What the sign-in page is allowed to offer. */
export type SignInChoice = "google" | "apple" | "email";

export function signInChoices(env: ProviderEnv = process.env): SignInChoice[] {
  return buildProviders(() => Promise.resolve(), env).map(
    (provider) => provider.id as SignInChoice,
  );
}

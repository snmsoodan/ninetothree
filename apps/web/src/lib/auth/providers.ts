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
 * Google and Apple appear only when their credentials do, so a laptop with no
 * OAuth app still shows a working sign-in page rather than two buttons that
 * fail. The email provider is always there: it is the one that needs nothing.
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

  const providers: ConfiguredProvider[] = [email];

  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    providers.push(Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }));
  }
  if (env.AUTH_APPLE_ID && env.AUTH_APPLE_SECRET) {
    providers.push(Apple({ clientId: env.AUTH_APPLE_ID, clientSecret: env.AUTH_APPLE_SECRET }));
  }

  return providers;
}

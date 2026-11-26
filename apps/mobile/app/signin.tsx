/**
 * `/signin`, wired.
 *
 * The screen owns three things: the provider prompts, the exchange, and the
 * context that other tabs read their bearer token from. There is no error copy
 * for a refusal, and no blocking spinner over the guide — signing in is an
 * errand, not a gate.
 */
import { useCallback, useState } from "react";
import { useRouter } from "expo-router";

import { signIn, signOut, type Session } from "../src/auth";
import { AuthScreen, type AuthPhase } from "../src/auth-screen";
import { useAuthProviders } from "../src/auth-providers";
import { authPorts, useSession } from "../src/session-context";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://ninetothree.com";

export default function SigninScreen() {
  const { session, setSession } = useSession();
  const providers = useAuthProviders();
  const router = useRouter();
  const [phase, setPhase] = useState<AuthPhase>(session ? "signed-in" : "signed-out");

  const enter = useCallback(
    async (provider: "google" | "apple") => {
      setPhase("working");
      const result = await signIn(provider, authPorts(providers, BASE_URL));
      if (result.state === "signed-in") {
        setSession(result.session);
        setPhase("signed-in");
        return;
      }
      setPhase(result.state);
    },
    [providers, setSession],
  );

  const leave = useCallback(async () => {
    const token = session?.token ?? null;
    await signOut({ store: authPorts(providers, BASE_URL).store, fetch, baseUrl: BASE_URL }, token);
    setSession(null);
    setPhase("signed-out");
    router.back();
  }, [providers, router, session, setSession]);

  return (
    <AuthScreen
      session={session as Session | null}
      phase={phase}
      appleAvailable={providers.appleAvailable}
      onGoogle={() => void enter("google")}
      onApple={() => void enter("apple")}
      onSignOut={() => void leave()}
    />
  );
}

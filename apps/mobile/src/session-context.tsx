/**
 * One session for the shell.
 *
 * Read once at boot and held in a context, so a tab that needs the network gets
 * the same bearer token as the sign-in screen and neither has to ask the
 * keychain on every render. `null` is a perfectly good session: the guide works
 * signed out.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { restoreSession, type AuthPorts, type Session } from "./auth";
import { keychain } from "./secure-store";

interface SessionValue {
  session: Session | null;
  token: string | null;
  setSession: (session: Session | null) => void;
}

const SessionContext = createContext<SessionValue>({
  session: null,
  token: null,
  setSession: () => undefined,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let alive = true;
    void restoreSession(keychain).then((restored) => {
      if (alive) setSession(restored);
    });
    return () => {
      alive = false;
    };
  }, []);

  const remember = useCallback((next: Session | null) => setSession(next), []);
  const value = useMemo<SessionValue>(
    () => ({ session, token: session?.token ?? null, setSession: remember }),
    [session, remember],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}

/** The ports the sign-in screen needs, with the base URL the rest of the app already uses. */
export function authPorts(providers: AuthPorts["providers"], baseUrl: string): AuthPorts {
  return { store: keychain, fetch: (input, init) => fetch(input, init), baseUrl, providers };
}

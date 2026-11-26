/**
 * The phone's end of sign-in.
 *
 * The OS hands a provider's ID token back; this module posts it to the same
 * exchange route the browser's providers ultimately feed, keeps the returned
 * session in the platform's secure store, and hands the bearer token to the one
 * screen that needs the network. Nothing here invents an identity: a refused
 * token leaves the app signed out and says nothing about why, because the
 * provider's reason is not the app's to narrate.
 */
import { NativeSession, type NativeProvider } from "@ninetothree/contracts";

/** What is kept between launches. The token is a credential; it never leaves the secure store. */
export type Session = NativeSession;

/** The slice of `expo-secure-store` this module uses. A seam, so tests need no device. */
export interface SecureStorePort {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

/** A provider's prompt, as the screen sees it: a token, a cancellation, or a refusal. */
export interface ProviderPort {
  /** The ID token, or null when the person closed the prompt. */
  request(): Promise<string | null>;
}

export interface Providers {
  google(): Promise<string | null>;
  apple(): Promise<string | null>;
}

export interface AuthPorts {
  store: SecureStorePort;
  fetch: typeof fetch;
  baseUrl: string;
  providers: Providers;
  now?: () => Date;
}

/** One key. A second session on the same device is not a thing this app offers. */
export const SESSION_KEY = "ninetothree.session";

export type SignInResult =
  { state: "signed-in"; session: Session } | { state: "cancelled" } | { state: "refused" };

/** True when the row the server wrote is already over. An expired session is deleted, not shown. */
export function isExpired(session: Session, now: Date): boolean {
  return new Date(session.expiresAt).getTime() <= now.getTime();
}

/** Read the stored session, dropping one that has expired. A broken blob is signed out, not a crash. */
export async function restoreSession(
  store: SecureStorePort,
  now: Date = new Date(),
): Promise<Session | null> {
  const raw = await store.getItem(SESSION_KEY).catch(() => null);
  if (!raw) return null;
  let parsed: Session;
  try {
    parsed = NativeSession.parse(JSON.parse(raw));
  } catch {
    await store.deleteItem(SESSION_KEY).catch(() => undefined);
    return null;
  }
  if (isExpired(parsed, now)) {
    await store.deleteItem(SESSION_KEY).catch(() => undefined);
    return null;
  }
  return parsed;
}

/**
 * Trade an ID token for a session.
 *
 * A 429 is a refusal like any other: the person can try again in a minute, and
 * a screen that says "Google said no" would be guessing.
 */
export async function exchange(
  idToken: string,
  provider: NativeProvider,
  ports: Pick<AuthPorts, "fetch" | "baseUrl">,
): Promise<Session | null> {
  try {
    const response = await ports.fetch(`${ports.baseUrl}/api/auth/native/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, idToken }),
    });
    if (!response.ok) return null;
    const parsed = NativeSession.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Ask the provider, then the server, then the store. The first failure decides the outcome. */
export async function signIn(provider: NativeProvider, ports: AuthPorts): Promise<SignInResult> {
  const token = await ports.providers[provider]().catch(() => null);
  if (!token) return { state: "cancelled" };
  const session = await exchange(token, provider, ports);
  if (!session) return { state: "refused" };
  try {
    await ports.store.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // A device whose secure store refuses the write is still signed in for this
    // launch; the next launch will ask again. Losing the credential is worse
    // than repeating a prompt, so the failure is not swallowed into "refused".
  }
  return { state: "signed-in", session };
}

/**
 * Sign out everywhere.
 *
 * The local credential is deleted whatever the server says. A network that is
 * down must not leave a phone signed in because a request failed; the row
 * expires on its own, and the next successful sign-out on any device removes
 * it sooner.
 */
export async function signOut(
  ports: Pick<AuthPorts, "store" | "fetch" | "baseUrl">,
  token: string | null,
): Promise<void> {
  if (token) {
    try {
      await ports.fetch(`${ports.baseUrl}/api/auth/native/session`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
    } catch {
      // The local delete below is the part the person can see.
    }
  }
  await ports.store.deleteItem(SESSION_KEY).catch(() => undefined);
}

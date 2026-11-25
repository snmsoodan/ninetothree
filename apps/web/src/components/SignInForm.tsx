"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Card, CardBody, TextLink } from "@ninetothree/ui";

import type { SignInChoice } from "../lib/auth/providers";

const INPUT =
  "mt-2 w-full rounded-md border border-line-strong bg-paper-raised px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay";

const PROVIDER_BUTTON =
  "mt-3 flex w-full items-center justify-center gap-3 rounded-md border px-4 py-3 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay";

/** Google's four colours, as a letterform rather than a downloaded logo. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" width="18" height="18">
      <path
        fill="#4285F4"
        d="M17.6 9.2c0-.6-.05-1.2-.16-1.7H9v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.8v2.3A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.8a9 9 0 0 0 0 8l3.1-2.3Z" />
      <path
        fill="#EA4335"
        d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.5A9 9 0 0 0 .8 5l3.1 2.3C4.6 5.2 6.6 3.6 9 3.6Z"
      />
    </svg>
  );
}

/** An apple, drawn here rather than lifted from a brand sheet. */
function AppleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" width="18" height="18" fill="currentColor">
      <path d="M12.3 9.6c0-2 1.6-3 1.7-3-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.3.7-2.9.7-.6 0-1.5-.7-2.5-.7-1.3 0-2.5.7-3.1 1.9-1.3 2.3-.3 5.6.9 7.5.6.9 1.4 1.9 2.4 1.9 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-.9 2.3-1.9c.7-1.1 1-2.1 1-2.2 0 0-1.9-.7-1.9-2.6ZM10.4 3.6c.5-.7.9-1.6.8-2.5-.8 0-1.8.5-2.4 1.2-.5.6-.9 1.5-.8 2.4.9.1 1.9-.4 2.4-1.1Z" />
    </svg>
  );
}

export function SignInForm({
  providers,
  callbackUrl,
}: {
  providers: SignInChoice[];
  callbackUrl: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const offersEmail = providers.includes("email");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem(null);
    const result = await signIn("email", { email, callbackUrl, redirect: false });
    setBusy(false);
    if (result?.ok) {
      window.location.assign(`/signin/check-email?email=${encodeURIComponent(email)}`);
      return;
    }
    setProblem(
      result?.status === 429
        ? "That is a lot of links. Try again in a few minutes."
        : "We could not send that just now. Try again in a moment.",
    );
  }

  return (
    <Card tone="raised">
      <CardBody>
        <h1 className="font-display text-2xl text-ink">Sign in</h1>
        <p className="mt-2 text-base text-ink-muted">
          {providers.length > 0
            ? "Two ways in. Either one, and you are back where you were."
            : "Sign-in is not set up on this copy of the app."}
        </p>

        {providers.includes("google") ? (
          <button
            type="button"
            onClick={() => void signIn("google", { callbackUrl })}
            className={`${PROVIDER_BUTTON} border-line-strong bg-paper-raised text-ink hover:bg-paper-sunken`}
          >
            <GoogleMark />
            Continue with Google
          </button>
        ) : null}

        {providers.includes("apple") ? (
          <button
            type="button"
            onClick={() => void signIn("apple", { callbackUrl })}
            className={`${PROVIDER_BUTTON} border-ink bg-ink text-paper hover:opacity-90`}
          >
            <AppleMark />
            Continue with Apple
          </button>
        ) : null}

        {providers.length === 0 ? (
          <p className="mt-6 text-sm text-ink-muted">
            Set <code className="text-ink">AUTH_GOOGLE_ID</code> and{" "}
            <code className="text-ink">AUTH_GOOGLE_SECRET</code> — or the Apple pair — and reload.
            There is no other way in.
          </p>
        ) : null}

        {offersEmail ? (
          <form onSubmit={submit} className="mt-8 border-t border-line pt-6">
            <p className="text-sm font-medium text-ink-muted">Test mode: email link</p>
            <label htmlFor="email" className="mt-3 block text-sm font-medium text-ink-muted">
              Your email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT}
            />
            {problem ? (
              <p role="alert" className="mt-3 text-sm text-clay-strong">
                {problem}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full rounded-md border border-line-strong px-4 py-3 text-base text-ink hover:bg-paper-sunken disabled:opacity-60"
            >
              {busy ? "Sending" : "Send me a link"}
            </button>
            <p className="mt-3 text-sm text-ink-muted">
              Only here because <code className="text-ink">AUTH_TEST_MODE</code> is on. The link
              works once, for fifteen minutes.
            </p>
          </form>
        ) : null}

        <p className="mt-6 text-sm text-ink-muted">
          <TextLink href="/">Back to this week</TextLink>
        </p>
      </CardBody>
    </Card>
  );
}

"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, Card, CardBody, TextLink } from "@ninetothree/ui";

const INPUT =
  "mt-2 w-full rounded-md border border-line-strong bg-paper-raised px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay";

function SignInForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const callbackUrl = params.get("callbackUrl") ?? "/today";

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
          We will email you a link. No password to remember, and nothing to write down.
        </p>

        <form onSubmit={submit} className="mt-6">
          <label htmlFor="email" className="text-sm font-medium text-ink-muted">
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
          <Button type="submit" variant="primary" size="lg" block className="mt-4" disabled={busy}>
            {busy ? "Sending" : "Send me a link"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-muted">
          The link works once, for fifteen minutes. If it runs out, ask for another — nothing is
          lost.
        </p>
        <p className="mt-4 text-sm text-ink-muted">
          <TextLink href="/">Back to this week</TextLink>
        </p>
      </CardBody>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-md px-5 py-16">
      <Suspense fallback={<p className="text-base text-ink-muted">One moment.</p>}>
        <SignInForm />
      </Suspense>
    </main>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardBody, TextLink } from "@ninetothree/ui";

/**
 * What went wrong, in words a person can act on.
 *
 * No codes, no "Oops", no apology longer than the sentence that fixes it.
 */
const COPY: Record<string, { title: string; body: string }> = {
  Verification: {
    title: "That link has been used",
    body: "A link works once. Ask for a new one and it will arrive in a moment.",
  },
  EmailSignin: {
    title: "We could not send that",
    body: "Something went wrong on our side. Try again, and if it keeps happening, use a different address.",
  },
  OAuthSignin: {
    title: "Google or Apple did not answer",
    body: "The page that hands us your name did not open. Try the other button, or try again in a minute.",
  },
  OAuthCallback: {
    title: "That did not come back right",
    body: "We started a sign-in and could not finish it. Nothing has changed — try again.",
  },
  OAuthAccountNotLinked: {
    title: "That address signs in another way",
    body: "You have used this address with Google or Apple before. Use that button, or sign in with a different address.",
  },
  AccessDenied: {
    title: "That did not go through",
    body: "The sign-in was cancelled. Nothing has changed.",
  },
  Configuration: {
    title: "Sign-in is not set up",
    body: "This copy of the app has no Google or Apple credential. Whoever runs it can add one from the README.",
  },
};

const FALLBACK = {
  title: "That did not work",
  body: "Nothing has changed. Try again, and use the other button if the first one keeps failing.",
};

function Body() {
  const code = useSearchParams().get("error") ?? "";
  const copy = COPY[code] ?? FALLBACK;

  return (
    <Card tone="raised">
      <CardBody>
        <h1 className="font-display text-2xl text-ink">{copy.title}</h1>
        <p className="mt-2 text-base text-ink-muted">{copy.body}</p>
        <p className="mt-6 text-sm text-ink-muted">
          <TextLink href="/signin">Back to sign in</TextLink>
        </p>
      </CardBody>
    </Card>
  );
}

export default function SignInErrorPage() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-md px-5 py-16">
      <Suspense fallback={<p className="text-base text-ink-muted">One moment.</p>}>
        <Body />
      </Suspense>
    </main>
  );
}

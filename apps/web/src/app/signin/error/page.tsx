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
  OAuthAccountNotLinked: {
    title: "That address signs in another way",
    body: "You have used this address with Google or Apple before. Use that button, or sign in with a different address.",
  },
  AccessDenied: {
    title: "That did not go through",
    body: "The sign-in was cancelled. Nothing has changed.",
  },
};

const FALLBACK = {
  title: "That did not work",
  body: "Try again. If it keeps happening, ask for a new link.",
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
          <TextLink href="/signin">Ask for a new link</TextLink>
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

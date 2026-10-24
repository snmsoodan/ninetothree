"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardBody, TextLink } from "@ninetothree/ui";

function Body() {
  const email = useSearchParams().get("email");

  return (
    <Card tone="raised">
      <CardBody>
        <h1 className="font-display text-2xl text-ink">Check your email</h1>
        <p className="mt-2 text-base text-ink-muted">
          {email ? (
            <>
              We sent a link to <span className="text-ink">{email}</span>. Open it on this device
              and you are in.
            </>
          ) : (
            <>We sent you a link. Open it on this device and you are in.</>
          )}
        </p>
        <p className="mt-4 text-sm text-ink-muted">
          Nothing yet? It can take a minute. The link works once, for fifteen minutes.
        </p>
        <p className="mt-6 text-sm text-ink-muted">
          <TextLink href="/signin">Use a different address</TextLink>
        </p>
      </CardBody>
    </Card>
  );
}

export default function CheckEmailPage() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-md px-5 py-16">
      <Suspense fallback={<p className="text-base text-ink-muted">One moment.</p>}>
        <Body />
      </Suspense>
    </main>
  );
}

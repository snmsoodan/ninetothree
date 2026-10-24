"use client";

import { signOut, useSession } from "next-auth/react";
import { Button, TextLink } from "@ninetothree/ui";

/**
 * Who is signed in, and the way out.
 *
 * Signed out is not an error state: the app works without an account, and
 * everything a parent has written is on their own device. Signing in is what
 * makes it follow them to another one.
 */
export function AccountRow() {
  const { data, status } = useSession();

  if (status === "loading") {
    return <p className="text-base text-ink-muted">One moment.</p>;
  }

  if (!data?.user) {
    return (
      <p className="text-base text-ink-muted">
        You are not signed in. Everything you have written is on this device.{" "}
        <TextLink href="/signin">Sign in to keep it</TextLink>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-base text-ink">
        Signed in as <span className="font-medium">{data.user.email}</span>
      </p>
      <Button variant="secondary" size="sm" onClick={() => void signOut({ callbackUrl: "/" })}>
        Sign out
      </Button>
    </div>
  );
}

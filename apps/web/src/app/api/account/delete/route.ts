import { NextResponse } from "next/server";

import { cancelDeletion, deletionStatus, requestDeletion } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { createMailer } from "@/lib/auth/email";
import { ensureScope } from "@/lib/auth/household";
import { auth } from "@/lib/auth/session";

/**
 * Asking to be deleted, and changing your mind.
 *
 * Deleting is a request with thirty days on it. Signing in again cancels it,
 * which is why the confirmation email says so in the first line: the most
 * common reason to delete an account is a bad afternoon, and a person who
 * comes back a week later should not find their dates gone.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  return NextResponse.json({ deletion: (await deletionStatus(sql, scope)) ?? null });
}

export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const deletion = await requestDeletion(sql, scope);

  if (email) {
    const mailer = createMailer(process.env);
    const day = deletion.purgeAfter.slice(0, 10);
    try {
      await mailer({
        to: email,
        subject: "Your account is on its way out",
        text: [
          "We have marked your account for deletion.",
          "",
          `Nothing is removed until ${day}. Sign in again before then and it is cancelled —`,
          "no email needed, no form to fill in.",
          "",
          "After that date your account, your household, your pins and your appointments",
          "are removed. Anything you kept on your own device stays on your own device.",
        ].join("\n"),
      });
    } catch (error) {
      // The request is already recorded. A mail server having a bad minute is
      // not a reason to tell somebody their deletion failed when it did not.
      console.error("could not send the deletion confirmation", error);
    }
  }

  return NextResponse.json({ deletion });
}

export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const cancelled = await cancelDeletion(sql, scope);
  return NextResponse.json({ cancelled });
}

import { previewInvite } from "@ninetothree/db";
import { Card, CardBody, TextLink } from "@ninetothree/ui";

import { JoinButton } from "@/components/JoinButton";
import { getDb } from "@/lib/auth/db";
import { auth } from "@/lib/auth/session";

const ROLE_WORDS: Record<string, string> = {
  parent: "a parent",
  partner: "a partner",
  grandparent: "a grandparent",
  carer: "a carer",
};

/**
 * The page an invite link opens.
 *
 * A server component, because the answer is one read and there is nothing to
 * interact with until the button. It also means the page works with JavaScript
 * off, which matters for a link someone opens on a phone they are not signed in
 * on.
 */
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { sql } = await getDb();
  const preview = await previewInvite(sql, token);
  const session = await auth();

  if (!preview) {
    return (
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-md px-5 py-16">
        <Card tone="raised">
          <CardBody>
            <h1 className="font-display text-2xl text-ink">This link has been used</h1>
            <p className="mt-2 text-base text-ink-muted">
              Invite links work once, and they run out after a week. Ask the person who sent it for
              a new one — nothing is lost.
            </p>
            <p className="mt-6 text-sm text-ink-muted">
              <TextLink href="/">Back to this week</TextLink>
            </p>
          </CardBody>
        </Card>
      </main>
    );
  }

  const who = preview.inviterName ?? "Someone";
  const household = preview.householdName ?? "their household";
  const role = ROLE_WORDS[preview.role] ?? "a member";

  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-md px-5 py-16">
      <Card tone="raised">
        <CardBody>
          <h1 className="font-display text-2xl text-ink">Join {household}?</h1>
          <p className="mt-2 text-base text-ink-muted">
            {who} asked you to join as {role}. You will see the same dates, appointments and
            checklists. Your own notes and your own progress stay yours.
          </p>

          {session?.user ? (
            <JoinButton token={token} />
          ) : (
            <>
              <p className="mt-6 text-base text-ink-muted">
                Sign in first, and we will bring you straight back here.
              </p>
              <p className="mt-4">
                <TextLink href={`/signin?callbackUrl=${encodeURIComponent(`/join/${token}`)}`}>
                  Sign in to join
                </TextLink>
              </p>
            </>
          )}

          <p className="mt-6 text-sm text-ink-muted">
            If you are already in a household of your own, joining this one leaves it. If you were
            the only person there, it goes with you.
          </p>
        </CardBody>
      </Card>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PACKS } from "@ninetothree/content/registry";
import { AppShell } from "@/components/AppShell";
import { EmailPreview } from "@/components/EmailPreview";
import { buildWeeklyEmail, nextSendAt, weeklyEmailReason } from "@/lib/email";
import { useAppState, useHydrated } from "@/lib/store";

/**
 * What the weekly email would say.
 *
 * This page exists because the honest answer to "what do I get for $7.99" is
 * not a bullet list — it is the thing itself. It also makes the gate legible:
 * when nothing would be sent, the page says which of the six reasons stopped
 * it, in the same words the job log uses.
 */
export default function EmailPreviewPage() {
  const state = useAppState();
  const ready = useHydrated();
  const router = useRouter();
  const [now] = useState(() => new Date());

  useEffect(() => {
    if (ready && !state.onboarded) router.replace("/onboarding");
  }, [ready, state.onboarded, router]);

  const options = useMemo(
    () => ({ state, packs: PACKS, now, baseUrl: "https://ninetothree.com" }),
    [state, now],
  );
  const email = useMemo(() => buildWeeklyEmail(options), [options]);
  const reason = useMemo(() => weeklyEmailReason(options), [options]);

  if (!ready) {
    return (
      <AppShell stage="Email">
        <p className="text-base text-ink-muted">One moment.</p>
      </AppShell>
    );
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <AppShell stage="Email">
      <EmailPreview
        email={email}
        reason={reason}
        sendAt={nextSendAt(now, timeZone)}
        timeZone={timeZone}
      />
    </AppShell>
  );
}

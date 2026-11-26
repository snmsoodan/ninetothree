import type { Metadata } from "next";
import { TRIAGE, decodePath } from "@ninetothree/content";
import { triageView } from "@ninetothree/domain";
import { AppShell } from "@/components/AppShell";
import { TriageBroken, TriageOutcome, TriageQuestion } from "@/components/Triage";

export const metadata: Metadata = {
  title: "If something is wrong — Nine to Three",
  description: "A few questions, and one answer about who to call.",
};

/**
 * The triage page is URL-driven on purpose. Every answer is a link, so the
 * tree works with no JavaScript, the back button works, and a parent can send
 * the URL to a partner. It does not gate on onboarding: a parent in a panic
 * must never be sent to a sign-up form.
 *
 * Which answer to draw is decided by `triageView`, the same function the phone
 * calls, so the two cannot disagree about what a given set of answers means.
 */
export default async function TriagePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const view = triageView(TRIAGE, decodePath(p));

  return (
    <AppShell stage="Safety" safetyContent showFooter={false}>
      {view.kind === "outcome" ? (
        <TriageOutcome result={view.result} trail={view.trail} />
      ) : view.kind === "question" ? (
        <TriageQuestion node={view.node} trail={view.trail} />
      ) : (
        <TriageBroken />
      )}
    </AppShell>
  );
}

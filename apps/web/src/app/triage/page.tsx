import type { Metadata } from "next";
import { TRIAGE, nextNode, walkAnswers } from "@ninetothree/content";
import { AppShell } from "@/components/AppShell";
import { TriageOutcome, TriageQuestion, type TriageTrailStep } from "@/components/Triage";

export const metadata: Metadata = {
  title: "If something is wrong — Nine to Three",
  description: "A few questions, and one answer about who to call.",
};

/**
 * The triage page is URL-driven on purpose. Every answer is a link, so the
 * tree works with no JavaScript, the back button works, and a parent can send
 * the URL to a partner. It does not gate on onboarding: a parent in a panic
 * must never be sent to a sign-up form.
 */
export default async function TriagePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const answerIds = (p ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const outcome = walkAnswers(TRIAGE, answerIds);
  const question = outcome ? undefined : nextNode(TRIAGE, answerIds);

  // The trail is rebuilt from the answers, so a hand-edited URL cannot show a
  // breadcrumb for a path that was never walked.
  const trail: TriageTrailStep[] = [];
  let node = TRIAGE.nodes.find((candidate) => candidate.id === TRIAGE.root);
  for (const answerId of answerIds) {
    const answer = node?.answers.find((candidate) => candidate.id === answerId);
    if (!answer) break;
    trail.push({ answerId: answer.id, label: answer.label });
    node = TRIAGE.nodes.find((candidate) => candidate.id === answer.next);
  }

  return (
    <AppShell stage="Safety">
      {outcome ? (
        <TriageOutcome result={outcome.result} trail={trail} />
      ) : question ? (
        <TriageQuestion node={question} trail={trail} />
      ) : (
        <div className="measure">
          <h1 className="font-display text-3xl text-ink">That path is not one of ours.</h1>
          <p className="mt-2 text-base text-ink-muted">
            The link may have been cut short. Start again, or call 911 if this is an emergency.
          </p>
          <p className="mt-6">
            <a
              href="/triage"
              className="text-base text-ink underline decoration-line-strong decoration-1 underline-offset-[3px]"
            >
              Start again
            </a>
          </p>
        </div>
      )}
    </AppShell>
  );
}

import Link from "next/link";
import {
  ESCALATION_COPY,
  type Escalation,
  type TriageNode,
  type TriageResult,
} from "@ninetothree/content";
import { Card, CardBody } from "@ninetothree/ui";
import { ButtonLink } from "@/components/ButtonLink";
import { formatReviewDate } from "@/components/SourceBlock";

export interface TriageTrailStep {
  answerId: string;
  label: string;
}

/**
 * The answers given so far, each one a link back to that point. A parent who
 * mis-tapped two questions ago should not have to start over, and the back
 * button alone cannot express "go back to question two".
 */
export function TriageTrail({ steps }: { steps: TriageTrailStep[] }) {
  if (steps.length === 0) return null;

  return (
    <nav aria-label="Your answers" className="mt-4">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
        {steps.map((step, index) => (
          <li key={step.answerId} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">›</span> : null}
            <Link
              href={`/triage?p=${encodeURIComponent(
                steps
                  .slice(0, index + 1)
                  .map((each) => each.answerId)
                  .join(","),
              )}`}
              className="underline decoration-line-strong decoration-1 underline-offset-[3px] hover:decoration-ink"
            >
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface TriageQuestionProps {
  node: TriageNode;
  trail: TriageTrailStep[];
}

/**
 * One question, and its answers as links. Links rather than buttons because
 * this page has to work with no JavaScript at all: a parent in a panic is not
 * a good audience for a hydration error.
 */
export function TriageQuestion({ node, trail }: TriageQuestionProps) {
  const prefix = trail.map((step) => step.answerId);

  return (
    <div className="measure">
      <p className="text-sm text-ink-faint">Question {trail.length + 1}</p>
      <h1 className="mt-1 font-display text-3xl text-ink">{node.question}</h1>
      {node.detail ? <p className="mt-2 text-base text-ink-muted">{node.detail}</p> : null}

      <TriageTrail steps={trail} />

      <ul className="mt-6 space-y-2">
        {node.answers.map((answer) => (
          <li key={answer.id}>
            <ButtonLink
              href={`/triage?p=${encodeURIComponent([...prefix, answer.id].join(","))}`}
              variant="secondary"
              block
            >
              {answer.label}
            </ButtonLink>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-ink-faint">
        Nothing you answer here is stored. If it is an emergency, call 911 now.
      </p>
    </div>
  );
}

/**
 * What to do, and what to watch. There is no fourth outcome and no "you are
 * fine": the quietest answer still names a person to call if it changes.
 */
const INSTRUCTION: Record<Escalation, string> = {
  "call-911": "Call now. Do not drive yourself if you feel faint.",
  "call-ob-triage": "The number is on your discharge paperwork, or in your patient portal.",
  "call-pediatrician": "The number is on the card from your first visit, or in the portal.",
  "go-to-er": "Go now. Do not wait for a call back.",
  "call-poison-control": "Free, 24 hours, and they will tell you what to do.",
  "call-988": "Free, 24 hours. You can text instead of calling.",
  "call-psi": "Free, and they will find you someone local.",
  "call-dv-hotline": "Free, confidential, 24 hours.",
};

export interface TriageOutcomeProps {
  result: TriageResult;
  trail: TriageTrailStep[];
}

export function TriageOutcome({ result, trail }: TriageOutcomeProps) {
  const copy = ESCALATION_COPY[result.escalation];

  return (
    <div className="measure">
      <TriageTrail steps={trail} />

      <h1 className="mt-4 font-display text-3xl text-ink">{result.headline}</h1>
      <p className="mt-3 text-base text-ink">{result.body}</p>

      <Card tone="sunken" className="mt-6">
        <CardBody className="pt-5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-base font-medium text-ink">{copy.label}</span>
            {copy.phone ? (
              <a
                // Derived from the number rather than read from `href`, so a
                // number and its dial string cannot drift apart.
                href={`tel:${copy.phone.replace(/[^0-9+]/g, "")}`}
                className="text-base text-ink tabular underline underline-offset-2"
              >
                {copy.phone}
              </a>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-ink-muted">{INSTRUCTION[result.escalation]}</p>
        </CardBody>
      </Card>

      {result.watchFor && result.watchFor.length > 0 ? (
        <section aria-labelledby="watch-heading" className="mt-8">
          <h2 id="watch-heading" className="font-display text-xl text-ink">
            Call back if
          </h2>
          <ul className="mt-2 space-y-1">
            {result.watchFor.map((line) => (
              <li key={line} className="text-base text-ink-muted">
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="triage-sources-heading" className="mt-10 border-t border-line pt-6">
        <h2 id="triage-sources-heading" className="font-display text-xl text-ink">
          Where this comes from
        </h2>
        <ul className="mt-3 space-y-2">
          {result.sources.map((source) => (
            <li key={source.id} className="text-sm">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-line-strong decoration-1 underline-offset-[3px] hover:decoration-ink"
              >
                {source.title}
              </a>
              <span className="text-ink-muted"> — {source.publisher}</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-muted">
          Reviewed by {result.reviewedBy} on {formatReviewDate(result.reviewedAt)}.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/triage" variant="secondary">
          Start over
        </ButtonLink>
        <ButtonLink href="/safety" variant="quiet">
          Every warning sign
        </ButtonLink>
      </div>
    </div>
  );
}
